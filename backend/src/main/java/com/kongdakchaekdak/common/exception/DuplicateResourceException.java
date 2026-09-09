package com.kongdakchaekdak.common.exception;

/**
 * 이미 존재하는 리소스를 다시 생성하려 할 때(예: 이미 가입된 이메일) 던지는 공통 예외.
 * {@link GlobalExceptionHandler}에서 409 응답으로 변환된다.
 */
public class DuplicateResourceException extends RuntimeException implements CodedException {

    private final ErrorCode errorCode;

    /**
     * @param errorCode    응답의 {@code error} 필드로 나가는 코드
     * @param debugMessage <b>로그 전용</b> 상세 메시지. 내부 PK를 담아도 되지만 응답에는 나가지 않는다.
     */
    public DuplicateResourceException(ErrorCode errorCode, String debugMessage) {
        super(debugMessage);
        this.errorCode = errorCode;
    }

    @Override
    public ErrorCode getErrorCode() {
        return errorCode;
    }
}
