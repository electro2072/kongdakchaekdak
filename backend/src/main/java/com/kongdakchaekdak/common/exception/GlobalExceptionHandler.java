package com.kongdakchaekdak.common.exception;

import com.kongdakchaekdak.common.logging.RequestTraceFilter;
import com.kongdakchaekdak.common.logging.SecurityEventLogger;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.List;

/**
 * 컨트롤러 전역에서 발생하는 예외를 일관된 응답 포맷으로 변환한다.
 *
 * <p>로그인 실패(InvalidCredentialsException)와 접근 거부(ForbiddenException)는 이 클래스에서만
 * SecurityEventLogger를 호출한다 — 각 서비스가 예외를 던지는 지점마다 흩어져서 기록하면 같은
 * 이벤트가 중복 기록될 수 있어, 예외를 최종적으로 처리하는 이 한 곳으로 모았다.
 */
@Slf4j
@RequiredArgsConstructor
@RestControllerAdvice
public class GlobalExceptionHandler {

    private final SecurityEventLogger securityEventLogger;

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(ResourceNotFoundException ex) {
        log.warn("리소스를 찾을 수 없음: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ErrorResponse.of(HttpStatus.NOT_FOUND.value(), "NOT_FOUND", ex.getMessage()));
    }

    @ExceptionHandler(InvalidCredentialsException.class)
    public ResponseEntity<ErrorResponse> handleInvalidCredentials(InvalidCredentialsException ex) {
        // 이메일/PW 로그인이 삭제된 이후로는 이 예외가 소셜 로그인(카카오/구글/네이버) 토큰 검증
        // 실패 시에만 발생한다 — 예외 자체는 어느 제공자였는지 담고 있지 않아 구분해서 기록하지 못한다.
        securityEventLogger.loginFailure("social", ex.getMessage());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ErrorResponse.of(HttpStatus.UNAUTHORIZED.value(), "INVALID_CREDENTIALS", ex.getMessage()));
    }

    @ExceptionHandler(DuplicateResourceException.class)
    public ResponseEntity<ErrorResponse> handleDuplicate(DuplicateResourceException ex) {
        log.warn("중복 리소스: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ErrorResponse.of(HttpStatus.CONFLICT.value(), "DUPLICATE_RESOURCE", ex.getMessage()));
    }

    @ExceptionHandler(ForbiddenException.class)
    public ResponseEntity<ErrorResponse> handleForbidden(ForbiddenException ex) {
        securityEventLogger.accessDenied(currentUserIdOrNull(), ex.getMessage());
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ErrorResponse.of(HttpStatus.FORBIDDEN.value(), "FORBIDDEN", ex.getMessage()));
    }

    @ExceptionHandler(InvalidRequestException.class)
    public ResponseEntity<ErrorResponse> handleInvalidRequest(InvalidRequestException ex) {
        log.warn("잘못된 요청: {}", ex.getMessage());
        return ResponseEntity.badRequest()
                .body(ErrorResponse.of(HttpStatus.BAD_REQUEST.value(), "INVALID_REQUEST", ex.getMessage()));
    }

    /**
     * (2026-08-31 추가, BUG-20260827-03 "조각2") 이미지 업로드 관련 AWS 설정 문제(자격증명 없음 등)로
     * presigned URL 발급 자체가 불가능한 경우. 클라이언트/서버 어느 쪽 잘못도 아니라 400/500이 아니라
     * 503(SERVICE_UNAVAILABLE)로 응답해 "이 기능이 아직 준비되지 않았다"는 의미를 명확히 전달한다.
     * 원인(자격증명 등)은 응답 바디에 노출하지 않고 서버 로그에만 스택트레이스와 함께 남긴다.
     */
    @ExceptionHandler(ImageStorageUnavailableException.class)
    public ResponseEntity<ErrorResponse> handleImageStorageUnavailable(ImageStorageUnavailableException ex) {
        log.error("이미지 업로드 기능 사용 불가 (S3 설정 문제): {}", ex.getMessage(), ex);
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(ErrorResponse.of(HttpStatus.SERVICE_UNAVAILABLE.value(), "IMAGE_STORAGE_UNAVAILABLE",
                        "이미지 업로드 기능을 지금 사용할 수 없습니다. 잠시 후 다시 시도해주세요."));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        List<ErrorResponse.FieldErrorDetail> fieldErrors = ex.getBindingResult().getFieldErrors().stream()
                .map(fe -> new ErrorResponse.FieldErrorDetail(fe.getField(), resolveMessage(fe)))
                .toList();

        log.warn("입력값 검증 실패: {}", fieldErrors);
        return ResponseEntity.badRequest()
                .body(ErrorResponse.of(HttpStatus.BAD_REQUEST.value(), "VALIDATION_FAILED",
                        "요청 값이 올바르지 않습니다.", fieldErrors));
    }

    /**
     * 요청 본문(JSON) 자체를 파싱/역직렬화할 수 없는 경우 — 문법이 깨졌거나, {@code Genre} 같은
     * enum 필드에 6개 고정 카테고리 밖의 값(예: {@code "판타지"})이 들어온 경우가 대표적이다.
     * {@code Genre.fromLabel(String)}이 던지는 {@link IllegalArgumentException}이 Jackson
     * 역직렬화 과정에서 이 예외로 감싸져 올라온다.
     *
     * <p><b>(2026-08-27 추가)</b> 이 핸들러가 없으면 이런 요청은 아래 catch-all
     * {@link #handleUnexpected}에 걸려 500으로 응답됐다 — 클라이언트 입력 오류인데 서버 오류로
     * 잘못 분류되는 문제였다(테스터 요청서 `테스트코드작성요청_v1.md`의 "enum 라벨 오류 → 400"
     * 계약과도 불일치). 이제 다른 검증 실패와 동일하게 400으로 응답한다.</p>
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleMalformedRequest(HttpMessageNotReadableException ex) {
        log.warn("요청 본문을 읽을 수 없음: {}", ex.getMessage());
        return ResponseEntity.badRequest()
                .body(ErrorResponse.of(HttpStatus.BAD_REQUEST.value(), "MALFORMED_REQUEST",
                        "요청 본문을 읽을 수 없습니다. 필드 값과 형식을 확인해주세요."));
    }

    /**
     * 위에서 명시적으로 처리하지 않은 나머지 모든 예외를 잡아 500으로 응답한다.
     *
     * <p><b>동작 변경 주의</b>: 이 핸들러가 추가되기 전에는 여기 걸리지 않은 예외가 Spring Boot 기본
     * 에러 처리(Whitelabel Error Page 등)로 넘어갔다. 이제는 이 클래스가 모든 예외를 가로채 동일한
     * {@link ErrorResponse} JSON 포맷으로 응답하고 스택트레이스를 ERROR 레벨로 남긴다 — API 클라이언트가
     * 받는 500 응답의 바디 형식이 달라질 수 있다.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleUnexpected(Exception ex) {
        log.error("예상하지 못한 서버 오류", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ErrorResponse.of(HttpStatus.INTERNAL_SERVER_ERROR.value(), "INTERNAL_SERVER_ERROR",
                        "서버 오류가 발생했습니다."));
    }

    private String resolveMessage(FieldError fieldError) {
        return fieldError.getDefaultMessage() == null ? "값이 올바르지 않습니다." : fieldError.getDefaultMessage();
    }

    // 인증된 사용자의 요청에서 발생한 ForbiddenException인 경우 userId를 로그에 함께 남기기 위한 헬퍼.
    // SecurityContext는 필터 체인을 벗어난 시점(예외 처리 중)에는 이미 정리되어 있을 수 있어,
    // JwtAuthenticationFilter가 인증 성공 시 심어둔 request attribute를 대신 읽는다.
    private Long currentUserIdOrNull() {
        var attributes = RequestContextHolder.getRequestAttributes();
        if (!(attributes instanceof ServletRequestAttributes servletAttributes)) {
            return null;
        }
        Object userId = servletAttributes.getRequest().getAttribute(RequestTraceFilter.USER_ID_ATTRIBUTE);
        return userId instanceof Long ? (Long) userId : null;
    }
}
