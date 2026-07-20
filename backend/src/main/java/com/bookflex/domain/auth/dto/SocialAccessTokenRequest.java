package com.bookflex.domain.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

/**
 * 카카오/네이버 소셜 로그인 요청 — 모바일 앱이 각 SDK로 이미 발급받은 access token을 담는다.
 */
@Schema(description = "소셜 로그인 요청 (카카오/네이버 — access token)")
public record SocialAccessTokenRequest(
        @NotBlank(message = "accessToken은 필수입니다.")
        String accessToken
) {
}
