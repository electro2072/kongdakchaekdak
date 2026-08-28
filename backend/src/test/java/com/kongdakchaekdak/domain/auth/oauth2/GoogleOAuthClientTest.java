package com.kongdakchaekdak.domain.auth.oauth2;

import com.kongdakchaekdak.common.exception.InvalidCredentialsException;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentMatchers;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * GoogleOAuthClient의 핵심 보안 로직 — aud(발급 대상) 클레임이 우리 앱의 Client ID와
 * 일치하는지 검증하는 부분 — 에 대한 순수 단위 테스트. 실제 구글 서버를 호출하지 않고
 * RestTemplate 자체를 Mockito로 대체해서, "구글이 이런 tokeninfo 응답을 줬다"는 상황만 가정한다.
 */
class GoogleOAuthClientTest {

    @Test
    void aud가_클라이언트ID와_일치하면_사용자정보를_반환한다() {
        RestTemplate restTemplate = mock(RestTemplate.class);
        Map<String, Object> tokenInfo = Map.of(
                "sub", "google-user-123",
                "aud", "our-app-client-id",
                "email", "user@example.com"
        );
        when(restTemplate.exchange(
                anyString(), eq(HttpMethod.GET), any(HttpEntity.class),
                ArgumentMatchers.<org.springframework.core.ParameterizedTypeReference<Map<String, Object>>>any(),
                eq("valid-id-token")))
                .thenReturn(ResponseEntity.ok(tokenInfo));

        GoogleOAuthClient client = new GoogleOAuthClient(restTemplate,
                new GoogleOAuthProperties("our-app-client-id", "secret"));

        SocialUserInfo info = client.fetchUserInfo("valid-id-token");

        assertEquals("google-user-123", info.providerUserId());
        assertEquals("user@example.com", info.nicknameHint());
    }

    @Test
    void aud가_클라이언트ID와_다르면_인증실패로_처리한다() {
        RestTemplate restTemplate = mock(RestTemplate.class);
        Map<String, Object> tokenInfo = Map.of(
                "sub", "google-user-123",
                "aud", "some-other-app-client-id"
        );
        when(restTemplate.exchange(
                anyString(), eq(HttpMethod.GET), any(HttpEntity.class),
                ArgumentMatchers.<org.springframework.core.ParameterizedTypeReference<Map<String, Object>>>any(),
                eq("token-for-another-app")))
                .thenReturn(ResponseEntity.ok(tokenInfo));

        GoogleOAuthClient client = new GoogleOAuthClient(restTemplate,
                new GoogleOAuthProperties("our-app-client-id", "secret"));

        assertThrows(InvalidCredentialsException.class, () -> client.fetchUserInfo("token-for-another-app"));
    }

    @Test
    void 우리_앱_client_id가_비어있으면_어떤_토큰도_거부한다() {
        RestTemplate restTemplate = mock(RestTemplate.class);
        Map<String, Object> tokenInfo = Map.of("sub", "google-user-123", "aud", "");
        when(restTemplate.exchange(
                anyString(), eq(HttpMethod.GET), any(HttpEntity.class),
                ArgumentMatchers.<org.springframework.core.ParameterizedTypeReference<Map<String, Object>>>any(),
                eq("some-token")))
                .thenReturn(ResponseEntity.ok(tokenInfo));

        // GOOGLE_CLIENT_ID가 아직 설정되지 않은 상태(빈 문자열)를 흉내낸다.
        GoogleOAuthClient client = new GoogleOAuthClient(restTemplate, new GoogleOAuthProperties("", ""));

        assertThrows(InvalidCredentialsException.class, () -> client.fetchUserInfo("some-token"));
    }
}
