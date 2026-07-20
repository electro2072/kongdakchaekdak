package com.bookflex.domain.auth.oauth2;

import com.bookflex.common.exception.InvalidCredentialsException;
import lombok.RequiredArgsConstructor;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

/**
 * 구글 ID 토큰 검증 (https://oauth2.googleapis.com/tokeninfo?id_token=...).
 * 모바일 앱이 구글 Sign-In SDK로 로그인해서 받은 ID 토큰(서명된 JWT)을 그대로 넘겨받는다.
 * 카카오/네이버는 access token을 쓰지만, 구글은 신원 정보가 담긴 ID 토큰을 쓰는 게 표준 방식이다.
 *
 * <p>주의: 구글 공식 문서는 이 tokeninfo 엔드포인트를 "개발/디버깅용"으로만 권장하고,
 * 프로덕션에서는 요청 제한(rate limit)이 있어 google-api-client 라이브러리로 로컬에서
 * 서명(JWK)을 직접 검증하라고 안내한다. 지금은 사용자 수가 적은 MVP 단계라 별도 의존성 추가 없이
 * 이 방식으로 우선 구현하고, 실 사용자가 늘면 google-api-client 기반으로 교체할 것
 * (TODO로 개발현황 문서에도 남겨둠).</p>
 *
 * <p>aud(발급 대상) 클레임을 우리 앱의 Client ID와 반드시 비교해야 한다 — 그렇지 않으면
 * 전혀 다른 앱을 위해 발급된 구글 ID 토큰으로도 우리 백엔드에 로그인할 수 있게 되는 취약점이 생긴다.</p>
 */
@Component
@RequiredArgsConstructor
public class GoogleOAuthClient {

    private static final String TOKEN_INFO_URL = "https://oauth2.googleapis.com/tokeninfo?id_token={idToken}";

    private final RestTemplate restTemplate;
    private final GoogleOAuthProperties googleOAuthProperties;

    public SocialUserInfo fetchUserInfo(String idToken) {
        Map<String, Object> body;
        try {
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    TOKEN_INFO_URL,
                    HttpMethod.GET,
                    new HttpEntity<>(null, null),
                    new ParameterizedTypeReference<Map<String, Object>>() {
                    },
                    idToken);
            body = response.getBody();
        } catch (RestClientException e) {
            throw new InvalidCredentialsException("구글 인증에 실패했습니다. ID 토큰을 확인해주세요.");
        }

        if (body == null || body.get("sub") == null) {
            throw new InvalidCredentialsException("구글 사용자 정보를 가져오지 못했습니다.");
        }

        String expectedClientId = googleOAuthProperties.clientId();
        String audience = String.valueOf(body.get("aud"));
        if (expectedClientId == null || expectedClientId.isBlank() || !expectedClientId.equals(audience)) {
            throw new InvalidCredentialsException("구글 ID 토큰의 발급 대상(aud)이 이 앱의 Client ID와 일치하지 않습니다.");
        }

        String googleId = String.valueOf(body.get("sub"));
        Object email = body.get("email");
        return new SocialUserInfo(googleId, email == null ? null : email.toString());
    }
}
