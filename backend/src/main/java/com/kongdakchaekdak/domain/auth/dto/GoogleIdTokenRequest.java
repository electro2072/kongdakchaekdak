package com.kongdakchaekdak.domain.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

/**
 * 구글 소셜 로그인 요청 — 모바일 앱이 구글 Sign-In SDK로 이미 발급받은 ID token(서명된 JWT)을 담는다.
 */
@Schema(description = "소셜 로그인 요청 (구글 — ID token)")
public record GoogleIdTokenRequest(
        @NotBlank(message = "idToken은 필수입니다.")
        String idToken
) {
}
