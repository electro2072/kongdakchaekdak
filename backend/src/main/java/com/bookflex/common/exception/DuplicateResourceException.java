package com.bookflex.common.exception;

/**
 * 이미 존재하는 리소스를 다시 생성하려 할 때(예: 이미 가입된 이메일) 던지는 공통 예외.
 * {@link GlobalExceptionHandler}에서 409 응답으로 변환된다.
 */
public class DuplicateResourceException extends RuntimeException {
    public DuplicateResourceException(String message) {
        super(message);
    }
}
