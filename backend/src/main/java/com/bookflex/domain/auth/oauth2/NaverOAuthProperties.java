package com.bookflex.domain.auth.oauth2;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * app.oauth2.naver.* 값을 바인딩한다. clientSecret은 지금 구현에서는 쓰이지 않는다
 * (카카오와 동일한 이유 — KakaoOAuthProperties 참고).
 */
@ConfigurationProperties(prefix = "app.oauth2.naver")
public record NaverOAuthProperties(String clientId, String clientSecret) {
}
