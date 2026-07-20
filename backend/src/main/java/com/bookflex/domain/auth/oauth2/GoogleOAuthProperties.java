package com.bookflex.domain.auth.oauth2;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * app.oauth2.google.* 값을 바인딩한다. clientId는 구글 ID 토큰 검증 시 aud(발급 대상) 클레임과
 * 비교하는 데 실제로 사용된다 (GoogleOAuthClient 참고) — 다른 앱을 위해 발급된 토큰을 우리
 * 백엔드가 잘못 신뢰하지 않도록 하는 핵심 검증. clientSecret은 지금 구현에서는 쓰이지 않는다
 * (카카오와 마찬가지로, 서버가 직접 인가 코드를 교환하는 방식으로 바꾸면 필요해짐).
 */
@ConfigurationProperties(prefix = "app.oauth2.google")
public record GoogleOAuthProperties(String clientId, String clientSecret) {
}
