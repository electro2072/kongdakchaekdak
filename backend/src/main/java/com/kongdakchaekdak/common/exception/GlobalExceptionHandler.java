package com.kongdakchaekdak.common.exception;

import com.kongdakchaekdak.common.logging.RequestTraceFilter;
import com.kongdakchaekdak.common.logging.SecurityEventLogger;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.servlet.NoHandlerFoundException;

import java.util.List;

/**
 * 컨트롤러 전역에서 발생하는 예외를 일관된 응답 포맷으로 변환한다.
 *
 * <p><b>(2026-09-09 개편)</b> 예외의 상세 메시지({@code ex.getMessage()})는 더 이상 응답 바디에
 * 들어가지 않는다. 개발자 언어("shareType이 BOOK이면 bookId가 필수입니다")와 내부 PK("id=4217")가
 * 그대로 사용자 화면에 노출되던 문제를 구조적으로 차단하기 위함이다. 상세 메시지는 서버 로그까지만
 * 간다. 응답에는 {@link ErrorCode}만 실리고, 사용자 문구는 프론트가 코드를 키로 매핑한다.
 * (설계: ErrorCode.java Javadoc가 단일 출처)
 *
 * <p>로그인 실패(InvalidCredentialsException)와 접근 거부(ForbiddenException)는 이 클래스에서만
 * SecurityEventLogger를 호출한다 — 각 서비스가 예외를 던지는 지점마다 흩어져서 기록하면 같은
 * 이벤트가 중복 기록될 수 있어, 예외를 최종적으로 처리하는 이 한 곳으로 모았다. 이 규약 때문에
 * 핸들러를 하나로 합치지 않고 예외 타입별로 유지한다.
 */
@Slf4j
@RequiredArgsConstructor
@RestControllerAdvice
public class GlobalExceptionHandler {

    private final SecurityEventLogger securityEventLogger;

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(ResourceNotFoundException ex) {
        log.warn("리소스를 찾을 수 없음 [{}]: {}", ex.getErrorCode(), ex.getMessage());
        return respond(ex);
    }

    @ExceptionHandler(InvalidCredentialsException.class)
    public ResponseEntity<ErrorResponse> handleInvalidCredentials(InvalidCredentialsException ex) {
        // 이메일/PW 로그인이 삭제된 이후로는 이 예외가 소셜 로그인(카카오/구글/네이버/애플) 토큰 검증
        // 실패 시에만 발생한다 — 예외 자체는 어느 제공자였는지 담고 있지 않아 구분해서 기록하지 못한다.
        // (프론트는 자기가 어떤 버튼을 눌렀는지 알기 때문에 응답 코드를 제공자별로 나누지 않는다.)
        securityEventLogger.loginFailure("social", ex.getMessage());
        return respond(ex);
    }

    @ExceptionHandler(DuplicateResourceException.class)
    public ResponseEntity<ErrorResponse> handleDuplicate(DuplicateResourceException ex) {
        log.warn("중복 리소스 [{}]: {}", ex.getErrorCode(), ex.getMessage());
        return respond(ex);
    }

    @ExceptionHandler(ForbiddenException.class)
    public ResponseEntity<ErrorResponse> handleForbidden(ForbiddenException ex) {
        securityEventLogger.accessDenied(currentUserIdOrNull(), ex.getMessage());
        return respond(ex);
    }

    @ExceptionHandler(InvalidRequestException.class)
    public ResponseEntity<ErrorResponse> handleInvalidRequest(InvalidRequestException ex) {
        log.warn("잘못된 요청 [{}]: {}", ex.getErrorCode(), ex.getMessage());
        return respond(ex);
    }

    /**
     * (2026-08-31 추가, BUG-20260827-03 "조각2") 이미지 업로드 관련 AWS 설정 문제(자격증명 없음 등)로
     * presigned URL 발급 자체가 불가능한 경우. 클라이언트/서버 어느 쪽 잘못도 아니라 400/500이 아니라
     * 503(SERVICE_UNAVAILABLE)로 응답해 "이 기능이 아직 준비되지 않았다"는 의미를 명확히 전달한다.
     * 원인(자격증명 등)은 응답 바디에 노출하지 않고 서버 로그에만 스택트레이스와 함께 남긴다.
     *
     * <p>이 핸들러는 개편 이전부터 이미 "전용 코드 + 상세는 로그에만" 패턴을 지키고 있었다 —
     * 2026-09-09 개편은 그 패턴을 나머지 전체로 확장한 것이다.
     */
    @ExceptionHandler(ImageStorageUnavailableException.class)
    public ResponseEntity<ErrorResponse> handleImageStorageUnavailable(ImageStorageUnavailableException ex) {
        log.error("이미지 업로드 기능 사용 불가 (S3 설정 문제): {}", ex.getMessage(), ex);
        return respond(ex);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        List<ErrorResponse.FieldErrorDetail> fieldErrors = ex.getBindingResult().getFieldErrors().stream()
                .map(fe -> new ErrorResponse.FieldErrorDetail(fe.getField(), resolveMessage(fe)))
                .toList();

        log.warn("입력값 검증 실패: {}", fieldErrors);
        return ResponseEntity.status(ErrorCode.VALIDATION_FAILED.getStatus())
                .body(ErrorResponse.of(ErrorCode.VALIDATION_FAILED, fieldErrors));
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
        return ResponseEntity.status(ErrorCode.MALFORMED_REQUEST.getStatus())
                .body(ErrorResponse.of(ErrorCode.MALFORMED_REQUEST));
    }

    /**
     * (BUG-20260910-b02, 2026-09-10 추가) 아예 존재하지 않는 라우트로 온 요청 — 원래는
     * {@link #handleUnexpected} catch-all에 걸려 500으로 잘못 응답되고 있었다. 이 예외가 실제로
     * 발생하려면 {@code spring.mvc.throw-exception-if-no-handler-found: true} +
     * {@code spring.web.resources.add-mappings: false}가 필요하다(application.yml 참고) —
     * 기본값(false)이면 서블릿 컨테이너가 이 핸들러를 거치지 않고 자체 404를 내려버린다.
     */
    @ExceptionHandler(NoHandlerFoundException.class)
    public ResponseEntity<ErrorResponse> handleRouteNotFound(NoHandlerFoundException ex) {
        log.warn("존재하지 않는 라우트 요청: {} {}", ex.getHttpMethod(), ex.getRequestURL());
        return ResponseEntity.status(ErrorCode.ROUTE_NOT_FOUND.getStatus())
                .body(ErrorResponse.of(ErrorCode.ROUTE_NOT_FOUND));
    }

    /**
     * (BUG-20260910-b02, 2026-09-10 추가) 존재하는 라우트지만 지원하지 않는 HTTP 메서드로 온
     * 요청 — 마찬가지로 원래는 catch-all에 걸려 500으로 잘못 응답되고 있었다.
     */
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ErrorResponse> handleMethodNotSupported(HttpRequestMethodNotSupportedException ex) {
        log.warn("지원하지 않는 HTTP 메서드 요청: {} (지원: {})", ex.getMethod(), ex.getSupportedHttpMethods());
        return ResponseEntity.status(ErrorCode.METHOD_NOT_SUPPORTED.getStatus())
                .body(ErrorResponse.of(ErrorCode.METHOD_NOT_SUPPORTED));
    }

    /**
     * 위에서 명시적으로 처리하지 않은 나머지 모든 예외를 잡아 500으로 응답한다.
     *
     * <p>백엔드가 분류하지 못한 예외라 코드를 붙일 수 없다. 이때만 예외적으로 응답 {@code message}에
     * 값을 싣는데, 예외 문장이 아니라 {@link RequestTraceFilter}가 발급한 8자리 traceId다 —
     * 예외 문장은 내부 정보가 새지만 traceId는 안전하면서도 서버 로그에서 해당 요청 한 건을
     * 정확히 찾아준다. 프론트는 이 값을 "오류 번호"로 사용자에게 노출한다.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleUnexpected(Exception ex) {
        String traceId = MDC.get(RequestTraceFilter.TRACE_ID_MDC_KEY);
        log.error("예상하지 못한 서버 오류", ex);
        return ResponseEntity.status(ErrorCode.INTERNAL_SERVER_ERROR.getStatus())
                .body(ErrorResponse.ofUnexpected(traceId));
    }

    private ResponseEntity<ErrorResponse> respond(CodedException ex) {
        ErrorCode code = ex.getErrorCode();
        return ResponseEntity.status(code.getStatus()).body(ErrorResponse.of(code));
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
