package com.bookflex.domain.auth.oauth2;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * app.oauth2.kakao.* 값을 바인딩한다. clientSecret은 지금 구현(모바일 앱이 카카오 SDK로
 * 이미 받은 access token을 백엔드로 넘기고, 백엔드는 그 토큰으로 카카오 사용자 정보 API만
 * 호출하는 방식)에서는 실제로 쓰이지 않는다 — 나중에 서버가 인가 코드를 직접 토큰으로
 * 교환하는 방식으로 바꾸면 필요해져서 미리 자리만 만들어 둔다.
 */
@ConfigurationProperties(prefix = "app.oauth2.kakao")
public record KakaoOAuthProperties(String clientId, String clientSecret) {
}
