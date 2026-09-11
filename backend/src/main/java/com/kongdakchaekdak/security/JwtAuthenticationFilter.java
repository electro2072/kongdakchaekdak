package com.kongdakchaekdak.security;

import com.kongdakchaekdak.common.logging.RequestTraceFilter;
import com.kongdakchaekdak.common.logging.SecurityEventLogger;
import com.kongdakchaekdak.domain.user.UserRepository;
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
 *
 * <p><b>(G16 회원 탈퇴, 2026-09-11)</b> 서명·만료가 유효해도 subject 사용자가 DB에 없으면 인증하지 않는다.
 * 탈퇴하면 사용자 행이 삭제되므로 기존 토큰은 다음 요청부터 401({@code UNAUTHENTICATED})이 된다
 * (수용 기준 4). 이전에는 만료(기본 1시간)까지 인증이 통과돼, 예컨대 {@code GET /api/books}가 빈 목록
 * 200을 돌려줬다.
 *
 * <p>스키마 변경(토큰 버전 컬럼 등) 대신 이 방식을 택한 이유: 탈퇴는 사용자 행 자체를 지우므로 users
 * 테이블의 컬럼으로는 무효화 정보를 들고 있을 수 없다. 별도 폐기 목록 테이블은 탈퇴자 식별자를 다시
 * 보관하는 셈이라 "즉시 삭제" 공지와도 어긋난다. 비용은 인증된 요청당 PK 존재 조회 1회다.
 * 재가입하면 새 id가 발급되므로(IDENTITY) 옛 토큰이 새 계정으로 이어지지 않는다.
 */
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String HEADER = "Authorization";
    private static final String PREFIX = "Bearer ";

    private final JwtProvider jwtProvider;
    private final SecurityEventLogger securityEventLogger;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                     @NonNull HttpServletResponse response,
                                     @NonNull FilterChain filterChain) throws ServletException, IOException {
        String header = request.getHeader(HEADER);

        if (header != null && header.startsWith(PREFIX)) {
            String token = header.substring(PREFIX.length());
            jwtProvider.parseUserId(token).ifPresentOrElse(
                    userId -> {
                        if (!userRepository.existsById(userId)) {
                            securityEventLogger.invalidToken("사용자 없음(탈퇴 등) userId=" + userId);
                            return;
                        }
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
