package com.kongdakchaekdak.common.exception;

/**
 * 단일 필드 검증(@Valid, {@link jakarta.validation.constraints})으로는 표현할 수 없는
 * 필드 간 교차 검증(cross-field validation) 실패 시 던지는 공통 예외 — 예: "share_type이
 * book이면 bookId가 필수", "scope가 group/custom이면 targets가 최소 1개 필요" 등.
 * {@link GlobalExceptionHandler}에서 400 응답(error: "INVALID_REQUEST")으로 변환된다.
 */
public class InvalidRequestException extends RuntimeException implements CodedException {

    private final ErrorCode errorCode;

    /**
     * @deprecated 세부 코드를 지정하는 {@link #InvalidRequestException(ErrorCode, String)}를 쓸 것.
     *             이 생성자는 기존 호출부의 점진 이관을 위해 한시적으로 남겨둔 것이며,
     *             {@link ErrorCode#INVALID_REQUEST}으로 폴백한다.
     */
    @Deprecated
    public InvalidRequestException(String message) {
        this(ErrorCode.INVALID_REQUEST, message);
    }

    /**
     * @param errorCode    응답의 {@code error} 필드로 나가는 코드
     * @param debugMessage <b>로그 전용</b> 상세 메시지. 내부 PK를 담아도 되지만 응답에는 나가지 않는다.
     */
    public InvalidRequestException(ErrorCode errorCode, String debugMessage) {
        super(debugMessage);
        this.errorCode = errorCode;
    }

    @Override
    public ErrorCode getErrorCode() {
        return errorCode;
    }
}
