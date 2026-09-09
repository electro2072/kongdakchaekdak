package com.kongdakchaekdak.domain.auth.oauth2;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * app.oauth2.apple.* 값을 바인딩한다. clientId는 필드명은 다른 제공자와 통일했지만
 * 실제로는 iOS 앱의 Bundle ID다 — 네이티브 Sign in with Apple 흐름에서 identity token의
 * aud 클레임은 (Service ID가 아니라) 발급 대상 앱의 Bundle ID이기 때문이다
 * (AppleOAuthClient, OAuth2Config#appleJwtProcessor 참고).
 *
 * <p>다른 제공자와 달리 clientSecret 필드가 없다 — 우리는 모바일 앱이 이미 받아온
 * identity token 검증만 하고 애플 서버와 직접 통신(client_secret을 ES256 JWT로 서명해서
 * 만드는 서버-투-서버 호출)하지 않으므로 이 프로젝트 범위에서 아예 필요하지 않다
 * (claude/독서기록앱_백엔드_애플로그인_설계_v1.md 1번 참고).</p>
 */
@ConfigurationProperties(prefix = "app.oauth2.apple")
public record AppleOAuthProperties(String clientId) {
}
