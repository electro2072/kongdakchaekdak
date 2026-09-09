package com.kongdakchaekdak.common.exception;

/**
 * 요청한 리소스(엔티티)를 찾을 수 없을 때 던지는 공통 예외.
 * {@link GlobalExceptionHandler}에서 404 응답으로 변환된다.
 */
public class ResourceNotFoundException extends RuntimeException implements CodedException {

    private final ErrorCode errorCode;

    /**
     * @param errorCode    응답의 {@code error} 필드로 나가는 코드
     * @param debugMessage <b>로그 전용</b> 상세 메시지. 내부 PK를 담아도 되지만 응답에는 나가지 않는다.
     */
    public ResourceNotFoundException(ErrorCode errorCode, String debugMessage) {
        super(debugMessage);
        this.errorCode = errorCode;
    }

    @Override
    public ErrorCode getErrorCode() {
        return errorCode;
    }
}
