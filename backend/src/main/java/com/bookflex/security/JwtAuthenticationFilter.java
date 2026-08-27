package com.bookflex.security;

import com.bookflex.common.logging.RequestTraceFilter;
import com.bookflex.common.logging.SecurityEventLogger;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Authorization: Bearer {token} 헤더를 읽어 유효하면 SecurityContext에 인증 정보(principal=userId)를 채운다.
 * 토큰이 없거나 유효하지 않아도 여기서 막지 않고 그대로 통과시키며,
 * 실제 접근 제어는 SecurityConfig의 authorizeHttpRequests에서 처리한다.
 *
 * <p>인증에 성공하면 userId를 request attribute({@link RequestTraceFilter#USER_ID_ATTRIBUTE})에도 남긴다 —
 * SecurityContext는 필터 체인을 벗어난 뒤(예: 예외 처리, 응답 후 액세스 로그 기록 시점)에는 이미 정리되어
 * 있을 수 있어, RequestTraceFilter와 GlobalExceptionHandler가 그 값을 대신 읽는다.
 */
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String HEADER = "Authorization";
    private static final String PREFIX = "Bearer ";

    private final JwtProvider jwtProvider;
    private final SecurityEventLogger securityEventLogger;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                     @NonNull HttpServletResponse response,
                                     @NonNull FilterChain filterChain) throws ServletException, IOException {
        String header = request.getHeader(HEADER);

        if (header != null && header.startsWith(PREFIX)) {
            String token = header.substring(PREFIX.length());
            jwtProvider.parseUserId(token).ifPresentOrElse(
                    userId -> {
                        var authentication = new UsernamePasswordAuthenticationToken(userId, null, List.of());
                        SecurityContextHolder.getContext().setAuthentication(authentication);
                        request.setAttribute(RequestTraceFilter.USER_ID_ATTRIBUTE, userId);
                    },
                    () -> securityEventLogger.invalidToken("파싱/서명 검증 실패")
            );
        }

        filterChain.doFilter(request, response);
    }
}
