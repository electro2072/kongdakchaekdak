package com.kongdakchaekdak.domain.auth.oauth2;

import com.kongdakchaekdak.common.exception.InvalidCredentialsException;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.RSASSASigner;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.gen.RSAKeyGenerator;
import com.nimbusds.jose.jwk.source.ImmutableJWKSet;
import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.proc.JWSVerificationKeySelector;
import com.nimbusds.jose.proc.SecurityContext;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import com.nimbusds.jwt.proc.ConfigurableJWTProcessor;
import com.nimbusds.jwt.proc.DefaultJWTClaimsVerifier;
import com.nimbusds.jwt.proc.DefaultJWTProcessor;
import org.junit.jupiter.api.Test;

import java.util.Date;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * 실제 애플 서버(JWKS 엔드포인트)를 호출할 수 없으므로(그리고 단위 테스트에서 그래서도
 * 안 되므로), 테스트용 RSA 키쌍을 직접 생성해서 그 키로 서명한 가짜 identity token을 만들고,
 * {@link OAuth2Config#appleJwtProcessor}가 실제로 하는 것과 동일한 방식(iss/aud/exp 검증)으로
 * 구성하되 원격 JWKS 대신 그 키만 담은 정적 {@link ImmutableJWKSet}을 신뢰하도록 만든
 * jwtProcessor로 {@link AppleOAuthClient}를 검증한다.
 * (설계 문서 {@code claude/독서기록앱_백엔드_애플로그인_설계_v1.md} 6번 테스트 계획 참고.)
 */
class AppleOAuthClientTest {

    private static final String ISSUER = "https://appleid.apple.com";
    private static final String AUDIENCE = "com.kongdakchaekdak.app"; // 테스트용 iOS Bundle ID

    @Test
    void 정상_토큰이면_SocialUserInfo를_반환하고_nicknameHint는_항상_null이다() throws Exception {
        RSAKey rsaKey = generateRsaKey();
        AppleOAuthClient client = clientTrusting(rsaKey);

        String token = signedToken(rsaKey, claims("apple-sub-1", ISSUER, AUDIENCE, futureExpiry()));

        SocialUserInfo result = client.fetchUserInfo(token);

        // 애플 identity token엔 이름이 없으므로 구글과 달리 nicknameHint는 항상 null이어야
        // 한다 — 이 계약이 깨지면 AppleOAuthClient가 잘못된 값(예: sub 자체)을 흘려보낸다는
        // 뜻이라 신규 가입 시 임시 닉네임 대신 이상한 값이 노출될 수 있다.
        assertThat(result.providerUserId()).isEqualTo("apple-sub-1");
        assertThat(result.nicknameHint()).isNull();
    }

    @Test
    void aud가_다르면_InvalidCredentialsException() throws Exception {
        RSAKey rsaKey = generateRsaKey();
        AppleOAuthClient client = clientTrusting(rsaKey);

        // 다른 앱을 위해 발급된 토큰을 우리 백엔드가 잘못 신뢰하면 안 된다 — Bundle ID 불일치
        // 시나리오(설계 문서 5번 엣지케이스: 개발용/배포용 Bundle ID가 다른 경우)를 흉내낸다.
        String token = signedToken(rsaKey, claims("apple-sub-2", ISSUER, "다른-앱-번들아이디", futureExpiry()));

        assertThatThrownBy(() -> client.fetchUserInfo(token))
                .isInstanceOf(InvalidCredentialsException.class);
    }

    @Test
    void 만료된_토큰이면_InvalidCredentialsException() throws Exception {
        RSAKey rsaKey = generateRsaKey();
        AppleOAuthClient client = clientTrusting(rsaKey);

        String token = signedToken(rsaKey, claims("apple-sub-3", ISSUER, AUDIENCE, pastExpiry()));

        assertThatThrownBy(() -> client.fetchUserInfo(token))
                .isInstanceOf(InvalidCredentialsException.class);
    }

    @Test
    void 다른_키로_서명된_토큰이면_InvalidCredentialsException() throws Exception {
        // jwtProcessor는 rsaKey(공개키)만 신뢰하도록 구성했는데 토큰은 전혀 다른 키(otherKey)로
        // 서명했다 — 애플이 발급한 것처럼 위조된(서명이 애플 것이 아닌) 토큰을 흉내낸다.
        RSAKey rsaKey = generateRsaKey();
        RSAKey otherKey = generateRsaKey();
        AppleOAuthClient client = clientTrusting(rsaKey);

        String token = signedToken(otherKey, claims("apple-sub-4", ISSUER, AUDIENCE, futureExpiry()));

        assertThatThrownBy(() -> client.fetchUserInfo(token))
                .isInstanceOf(InvalidCredentialsException.class);
    }

    private AppleOAuthClient clientTrusting(RSAKey rsaKey) {
        ConfigurableJWTProcessor<SecurityContext> processor = new DefaultJWTProcessor<>();
        JWKSource<SecurityContext> jwkSource = new ImmutableJWKSet<>(new JWKSet(rsaKey.toPublicJWK()));
        processor.setJWSKeySelector(new JWSVerificationKeySelector<>(JWSAlgorithm.RS256, jwkSource));
        processor.setJWTClaimsSetVerifier(new DefaultJWTClaimsVerifier<>(
                new JWTClaimsSet.Builder().issuer(ISSUER).audience(AUDIENCE).build(),
                Set.of("sub", "exp")));
        return new AppleOAuthClient(processor);
    }

    private RSAKey generateRsaKey() throws Exception {
        return new RSAKeyGenerator(2048).keyID("test-key").generate();
    }

    private JWTClaimsSet claims(String subject, String issuer, String audience, Date expiry) {
        return new JWTClaimsSet.Builder()
                .subject(subject)
                .issuer(issuer)
                .audience(audience)
                .expirationTime(expiry)
                .build();
    }

    private String signedToken(RSAKey signingKey, JWTClaimsSet claims) throws Exception {
        SignedJWT signedJWT = new SignedJWT(
                new JWSHeader.Builder(JWSAlgorithm.RS256).keyID(signingKey.getKeyID()).build(),
                claims);
        signedJWT.sign(new RSASSASigner(signingKey));
        return signedJWT.serialize();
    }

    private Date futureExpiry() {
        return new Date(System.currentTimeMillis() + 60_000);
    }

    private Date pastExpiry() {
        return new Date(System.currentTimeMillis() - 60_000);
    }
}
