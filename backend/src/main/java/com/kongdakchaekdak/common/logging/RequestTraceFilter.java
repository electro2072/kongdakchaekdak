package com.kongdakchaekdak.common.logging;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

/**
 * 요청 1건마다 traceId를 발급해 MDC에 심고, 요청이 끝나면 ACCESS 타입 로그 1줄을 남긴다.
 *
 * <p>Spring Security 필터체인보다 먼저 실행되어야 traceId가 인증/인가 단계의 로그(SecurityEventLogger 등)에도
 * 함께 찍히므로 {@code @Order(Ordered.HIGHEST_PRECEDENCE)}로 가장 먼저 등록한다.
 *
 * <p>인증된 userId는 SecurityContext에 있지만, 응답이 나간 뒤(특히 예외 발생 시) 이 필터로 돌아왔을 때는
 * 이미 정리되어 있을 수 있다. 그래서 JwtAuthenticationFilter가 인증에 성공하면 요청에
 * {@link #USER_ID_ATTRIBUTE} 속성을 별도로 남기고, 이 필터와 GlobalExceptionHandler는 SecurityContext 대신
 * 그 request attribute를 읽는다.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class RequestTraceFilter extends OncePerRequestFilter {

    /** 인증 성공 시 JwtAuthenticationFilter가 채워 넣는 request attribute 키. */
    public static final String USER_ID_ATTRIBUTE = "kongdakchaekdak.currentUserId";

    /** MDC 및 로그 패턴에서 쓰는 traceId 키. GlobalExceptionHandler가 500 응답에 실을 때 참조한다. */
    public static final String TRACE_ID_MDC_KEY = "traceId";
    private static final String LOG_TYPE_MDC_KEY = "logType";
    private static final String TRACE_ID_RESPONSE_HEADER = "X-Trace-Id";

    private static final Logger accessLog = LoggerFactory.getLogger("com.kongdakchaekdak.log.ACCESS");

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                     @NonNull HttpServletResponse response,
                                     @NonNull FilterChain filterChain) throws ServletException, IOException {
        String traceId = UUID.randomUUID().toString().substring(0, 8);
        MDC.put(TRACE_ID_MDC_KEY, traceId);
        response.setHeader(TRACE_ID_RESPONSE_HEADER, traceId);

        long startedAt = System.currentTimeMillis();
        try {
            filterChain.doFilter(request, response);
        } finally {
            long durationMs = System.currentTimeMillis() - startedAt;
            logAccess(request, response, durationMs);
            MDC.clear();
        }
    }

    private void logAccess(HttpServletRequest request, HttpServletResponse response, long durationMs) {
        Object userId = request.getAttribute(USER_ID_ATTRIBUTE);
        String query = request.getQueryString();
        String uri = query == null ? request.getRequestURI() : request.getRequestURI() + "?" + query;

        MDC.put(LOG_TYPE_MDC_KEY, LogType.ACCESS.name());
        try {
            accessLog.info("{} {} -> {} ({} ms) userId={}",
                    request.getMethod(), uri, response.getStatus(), durationMs,
                    userId == null ? "-" : userId);
        } finally {
            MDC.remove(LOG_TYPE_MDC_KEY);
        }
    }
}
