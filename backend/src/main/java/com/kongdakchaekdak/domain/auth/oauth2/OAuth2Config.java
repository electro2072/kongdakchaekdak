package com.kongdakchaekdak.domain.auth.oauth2;

import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.jwk.source.RemoteJWKSet;
import com.nimbusds.jose.proc.JWSVerificationKeySelector;
import com.nimbusds.jose.proc.SecurityContext;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.proc.ConfigurableJWTProcessor;
import com.nimbusds.jwt.proc.DefaultJWTClaimsVerifier;
import com.nimbusds.jwt.proc.DefaultJWTProcessor;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

import java.net.MalformedURLException;
import java.net.URL;
import java.time.Duration;
import java.util.Set;

@Configuration
@EnableConfigurationProperties({
        KakaoOAuthProperties.class, GoogleOAuthProperties.class, NaverOAuthProperties.class,
        AppleOAuthProperties.class
})
public class OAuth2Config {

    private static final Duration TIMEOUT = Duration.ofSeconds(5);

    // 애플 identity token 검증용 상수. 다른 3사와 달리 애플은 서명된 JWT를 애플 공개키(JWKS)로
    // 직접 검증해야 한다 — AppleOAuthClient/appleJwtProcessor 참고, 설계 문서 2번 참고.
    private static final String APPLE_ISSUER = "https://appleid.apple.com";
    private static final String APPLE_JWKS_URL = "https://appleid.apple.com/auth/keys";

    // 카카오/구글/네이버 사용자 정보 API 호출 전용. spring-boot-starter-web에 이미 포함된
    // RestTemplateBuilder만 사용해서 별도 HTTP 클라이언트 의존성을 추가하지 않는다.
    // 타임아웃을 반드시 지정해서, 세 제공자 중 하나가 응답이 느려지거나 멈춰도 요청 스레드가
    // 무한정 붙잡혀 있지 않게 한다.
    @Bean
    public RestTemplate oauth2RestTemplate(RestTemplateBuilder builder) {
        return builder
                .setConnectTimeout(TIMEOUT)
                .setReadTimeout(TIMEOUT)
                .build();
    }

    // 애플 identity token의 서명(RS256)과 iss/aud/exp 클레임을 검증하는 Nimbus 프로세서.
    // RemoteJWKSet이 JWKS 응답을 자동 캐싱해서, 캐시에 없는 kid(=애플이 키를 교체했을 때)를
    // 만났을 때만 https://appleid.apple.com/auth/keys 를 다시 호출한다 — 매 로그인 요청마다
    // 애플 서버를 부르지 않는다. AppleOAuthClient는 이 빈이 검증까지 끝낸 클레임에서
    // sub(사용자 식별자)만 꺼내 쓴다.
    @Bean
    public ConfigurableJWTProcessor<SecurityContext> appleJwtProcessor(
            AppleOAuthProperties appleOAuthProperties) throws MalformedURLException {
        ConfigurableJWTProcessor<SecurityContext> processor = new DefaultJWTProcessor<>();
        JWKSource<SecurityContext> jwkSource = new RemoteJWKSet<>(new URL(APPLE_JWKS_URL));
        processor.setJWSKeySelector(new JWSVerificationKeySelector<>(JWSAlgorithm.RS256, jwkSource));
        processor.setJWTClaimsSetVerifier(new DefaultJWTClaimsVerifier<>(
                new JWTClaimsSet.Builder()
                        .issuer(APPLE_ISSUER)
                        .audience(appleOAuthProperties.clientId())
                        .build(),
                Set.of("sub", "exp")));
        return processor;
    }
}
