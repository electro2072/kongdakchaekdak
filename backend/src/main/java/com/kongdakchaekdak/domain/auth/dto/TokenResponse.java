package com.kongdakchaekdak.domain.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "인증 토큰 응답")
public record TokenResponse(String accessToken, String tokenType, long expiresIn, boolean isNewUser) {
    public static TokenResponse of(String accessToken, long expiresIn, boolean isNewUser) {
        return new TokenResponse(accessToken, "Bearer", expiresIn, isNewUser);
    }
}
