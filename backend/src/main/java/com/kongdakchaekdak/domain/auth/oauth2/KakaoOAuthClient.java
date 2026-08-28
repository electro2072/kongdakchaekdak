package com.kongdakchaekdak.domain.auth.oauth2;

import com.kongdakchaekdak.common.exception.InvalidCredentialsException;
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
 * 카카오 로그인 사용자 정보 조회 (https://kapi.kakao.com/v2/user/me).
 * 모바일 앱이 카카오 SDK로 이미 로그인해서 받은 access token을 그대로 넘겨받아,
 * 이 토큰으로 카카오 쪽에 "누구세요?"만 물어보는 방식 — 앱 키/Client Secret은 이 호출 자체에는
 * 필요 없다 (카카오 공식 문서 기준 사용자 정보 조회는 Authorization: Bearer {token} 헤더만 요구).
 */
@Component
@RequiredArgsConstructor
public class KakaoOAuthClient {

    private static final String USER_INFO_URL = "https://kapi.kakao.com/v2/user/me";

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
            throw new InvalidCredentialsException("카카오 인증에 실패했습니다. 액세스 토큰을 확인해주세요.");
        }

        if (body == null || body.get("id") == null) {
            throw new InvalidCredentialsException("카카오 사용자 정보를 가져오지 못했습니다.");
        }

        String kakaoId = String.valueOf(body.get("id"));
        return new SocialUserInfo(kakaoId, extractNickname(body));
    }

    private String extractNickname(Map<String, Object> body) {
        Object properties = body.get("properties");
        if (properties instanceof Map<?, ?> propertiesMap) {
            Object nickname = propertiesMap.get("nickname");
            if (nickname != null) {
                return nickname.toString();
            }
        }
        return null;
    }
}
