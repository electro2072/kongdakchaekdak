package com.bookflex.common.logging;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;

/**
 * 인증/인가 관련 이벤트를 SECURITY 타입으로 기록한다.
 *
 * <p>로그인 실패·접근 거부는 각 서비스 메서드가 던지는 시점이 아니라 GlobalExceptionHandler
 * (InvalidCredentialsException/ForbiddenException 처리부)에서 한 곳으로 모아 호출한다 — 같은 이벤트가
 * 여러 지점에서 중복 기록되는 것을 막기 위해서다. 로그인 성공/신규 가입은 AuthService/SocialAuthService가
 * 직접 호출한다.
 */
@Component
public class SecurityEventLogger {

    private static final String LOG_TYPE_MDC_KEY = "logType";
    private static final Logger log = LoggerFactory.getLogger("com.bookflex.log.SECURITY");

    public void loginSuccess(String provider, Long userId) {
        log("로그인 성공 provider={} userId={}", provider, userId);
    }

    public void loginFailure(String provider, String reason) {
        log("로그인 실패 provider={} reason={}", provider, reason);
    }

    public void oauthProviderError(String provider, String reason) {
        log("소셜 로그인 공급자 오류 provider={} reason={}", provider, reason);
    }

    public void invalidToken(String reason) {
        log("유효하지 않은 토큰 reason={}", reason);
    }

    public void unauthenticatedAccess(String method, String uri) {
        log("인증 안 된 접근 {} {}", method, uri);
    }

    public void accessDenied(Long userId, String action) {
        log("접근 거부 userId={} action={}", userId, action);
    }

    private void log(String format, Object... args) {
        MDC.put(LOG_TYPE_MDC_KEY, LogType.SECURITY.name());
        try {
            log.warn(format, args);
        } finally {
            MDC.remove(LOG_TYPE_MDC_KEY);
        }
    }
}
