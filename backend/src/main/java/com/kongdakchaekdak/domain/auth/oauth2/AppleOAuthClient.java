package com.kongdakchaekdak.domain.auth.oauth2;

import com.kongdakchaekdak.common.exception.ErrorCode;
import com.kongdakchaekdak.common.exception.InvalidCredentialsException;
import com.nimbusds.jose.proc.SecurityContext;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.proc.ConfigurableJWTProcessor;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * 애플 identity token 검증. 카카오/구글/네이버처럼 access token으로 제공자의 "내 정보" API를
 * 부르는 방식이 아니라, 모바일 앱이 Apple 네이티브 SDK(Sign in with Apple)로 이미 받아온
 * identity token(RS256으로 서명된 JWT)의 서명·클레임을 백엔드가 직접 검증해야 한다 — 검증
 * 자체(서명/iss/aud/exp)는 {@link OAuth2Config#appleJwtProcessor}에 이미 설정돼 있고,
 * 여기서는 검증을 통과한 클레임에서 사용자 식별자(sub)만 꺼내는 역할만 한다.
 *
 * <p>구글({@link GoogleOAuthClient})과 달리 nicknameHint를 항상 null로 반환한다 — 애플
 * identity token엔 이름이 아예 없고(실명은 최초 로그인 시 클라이언트에 별도로만 내려오는
 * 값이라 서버는 받을 수 없음), 이메일을 nicknameHint로 대신 흘려보내는 구글의 기존 문제
 * (개발현황 문서에 이미 기록된 백로그, 이 클래스 범위 밖)를 반복하지 않기 위한 의도적인
 * 설계다. 신규 가입자는 어차피 회원가입 화면(SignupScreen)에서 닉네임을 직접 입력하므로,
 * 여기서 null을 넘겨 {@code RandomNicknameGenerator}가 채우는 값은 그 화면이 뜨기 전까지만
 * 존재하는 임시값일 뿐이다 (claude/독서기록앱_백엔드_애플로그인_설계_v1.md 5번 참고).</p>
 */
@Component
@RequiredArgsConstructor
public class AppleOAuthClient {

    private final ConfigurableJWTProcessor<SecurityContext> appleJwtProcessor;

    public SocialUserInfo fetchUserInfo(String identityToken) {
        JWTClaimsSet claims;
        try {
            claims = appleJwtProcessor.process(identityToken, null);
        } catch (Exception e) {
            // BadJOSEException(서명 위조/클레임 불일치), ParseException(JWT 형식이 아님),
            // JOSEException(JWKS 조회 실패 등)을 한꺼번에 처리한다 — 어느 경우든 클라이언트
            // 입장에서는 "인증 실패"로 취급하면 충분하고, 원인별로 다른 응답을 줄 이유가 없다.
            throw new InvalidCredentialsException(ErrorCode.SOCIAL_AUTH_FAILED, "애플 인증에 실패했습니다. identity token을 확인해주세요.");
        }

        String appleUserId = claims.getSubject();
        if (appleUserId == null || appleUserId.isBlank()) {
            throw new InvalidCredentialsException(ErrorCode.SOCIAL_AUTH_FAILED, "애플 사용자 정보를 가져오지 못했습니다.");
        }

        return new SocialUserInfo(appleUserId, null);
    }
}
