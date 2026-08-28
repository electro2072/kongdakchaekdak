package com.kongdakchaekdak.common.exception;

/**
 * 인증은 되어 있지만(로그인 상태) 본인 소유가 아닌 리소스를 수정/삭제하려 할 때 던지는 예외.
 * {@link GlobalExceptionHandler}에서 403 응답으로 변환된다.
 */
public class ForbiddenException extends RuntimeException {
    public ForbiddenException(String message) {
        super(message);
    }
}
