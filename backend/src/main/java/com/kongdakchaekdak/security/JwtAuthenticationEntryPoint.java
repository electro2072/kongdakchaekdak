package com.kongdakchaekdak.security;

import com.kongdakchaekdak.common.exception.ErrorCode;
import com.kongdakchaekdak.common.exception.ErrorResponse;
import com.kongdakchaekdak.common.logging.SecurityEventLogger;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * 인증이 필요한 엔드포인트(/api/auth/me 등)에 토큰 없이/유효하지 않게 접근했을 때
 * Spring Security 기본 403 응답 대신, 나머지 API와 동일한 {@link ErrorResponse} 포맷으로 401을 내려준다.
 */
@Component
@RequiredArgsConstructor
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final ObjectMapper objectMapper;
    private final SecurityEventLogger securityEventLogger;

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
                          AuthenticationException authException) throws IOException {
        securityEventLogger.unauthenticatedAccess(request.getMethod(), request.getRequestURI());

        response.setStatus(HttpStatus.UNAUTHORIZED.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");

        // (2026-09-09) 기존에는 "Authorization: Bearer {token} 헤더를 확인해주세요" 라는 개발자 안내가
        // message로 내려갔고, 프론트가 그걸 그대로 화면에 띄우고 있었다. 이제 코드만 내려보낸다.
        ErrorResponse body = ErrorResponse.of(ErrorCode.UNAUTHENTICATED);
        response.getWriter().write(objectMapper.writeValueAsString(body));
    }
}
