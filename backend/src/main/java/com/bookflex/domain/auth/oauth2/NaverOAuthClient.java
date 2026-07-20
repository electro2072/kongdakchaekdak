package com.bookflex.domain.auth.oauth2;

import com.bookflex.common.exception.InvalidCredentialsException;
import lombok.RequiredArgsConstructor;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

/**
 * 네이버 로그인 사용자 정보 조회 (https://openapi.naver.com/v1/nid/me).
 * 카카오와 동일하게, 모바일 앱이 네이버 SDK로 이미 받은 access token을 그대로 넘겨받아
 * 사용자 정보만 조회한다 — 이 호출 자체에는 Client Secret이 필요 없다.
 * 응답 형태가 카카오와 달리 {"resultcode", "message", "response": {...}} 로 한 겹 감싸져 있다.
 */
@Component
@RequiredArgsConstructor
public class NaverOAuthClient {

    private static final String USER_INFO_URL = "https://openapi.naver.com/v1/nid/me";

    private final RestTemplate restTemplate;

    public SocialUserInfo fetchUserInfo(String accessToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);

        Map<String, Object> body;
        try {
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    USER_INFO_URL,
                    HttpMethod.GET,
                    new HttpEntity<>(headers),
                    new ParameterizedTypeReference<Map<String, Object>>() {
                    });
            body = response.getBody();
        } catch (RestClientException e) {
            throw new InvalidCredentialsException("네이버 인증에 실패했습니다. 액세스 토큰을 확인해주세요.");
        }

        Object innerResponse = body == null ? null : body.get("response");
        if (!(innerResponse instanceof Map<?, ?> profile) || profile.get("id") == null) {
            throw new InvalidCredentialsException("네이버 사용자 정보를 가져오지 못했습니다.");
        }

        String naverId = String.valueOf(profile.get("id"));
        Object nickname = profile.get("nickname");
        return new SocialUserInfo(naverId, nickname == null ? null : nickname.toString());
    }
}
