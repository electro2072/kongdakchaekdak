package com.kongdakchaekdak.security;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * application.yml의 app.jwt.* 값을 바인딩한다.
 * secret은 HS256 요구사항상 최소 32바이트(UTF-8 기준) 이상이어야 한다.
 */
@ConfigurationProperties(prefix = "app.jwt")
public record JwtProperties(String secret, long expirationSeconds) {
}
