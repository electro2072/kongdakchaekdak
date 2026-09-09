package com.kongdakchaekdak.domain.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

/**
 * 애플 소셜 로그인 요청 — 모바일 앱이 Apple 네이티브 SDK(Sign in with Apple)로 이미
 * 발급받은 identity token(서명된 JWT)을 담는다. {@link GoogleIdTokenRequest}와 완전히
 * 동일한 모양이다(필드명 하나, idToken).
 */
@Schema(description = "소셜 로그인 요청 (애플 — identity token)")
public record AppleIdTokenRequest(
        @NotBlank(message = "idToken은 필수입니다.")
        String idToken
) {
}
