package com.kongdakchaekdak.common.exception;

/**
 * 인증은 되어 있지만(로그인 상태) 본인 소유가 아닌 리소스를 수정/삭제하려 할 때 던지는 예외.
 * {@link GlobalExceptionHandler}에서 403 응답으로 변환된다.
 */
public class ForbiddenException extends RuntimeException implements CodedException {

    private final ErrorCode errorCode;

    /**
     * @deprecated 세부 코드를 지정하는 {@link #ForbiddenException(ErrorCode, String)}를 쓸 것.
     *             이 생성자는 기존 호출부의 점진 이관을 위해 한시적으로 남겨둔 것이며,
     *             {@link ErrorCode#FORBIDDEN}으로 폴백한다.
     */
    @Deprecated
    public ForbiddenException(String message) {
        this(ErrorCode.FORBIDDEN, message);
    }

    /**
     * @param errorCode    응답의 {@code error} 필드로 나가는 코드
     * @param debugMessage <b>로그 전용</b> 상세 메시지. 내부 PK를 담아도 되지만 응답에는 나가지 않는다.
     */
    public ForbiddenException(ErrorCode errorCode, String debugMessage) {
        super(debugMessage);
        this.errorCode = errorCode;
    }

    @Override
    public ErrorCode getErrorCode() {
        return errorCode;
    }
}
