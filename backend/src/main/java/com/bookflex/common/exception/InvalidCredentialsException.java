package com.bookflex.common.exception;

/**
 * 이메일/PW 로그인 시 자격 증명이 올바르지 않을 때 던지는 예외.
 * {@link GlobalExceptionHandler}에서 401 응답으로 변환된다.
 */
public class InvalidCredentialsException extends RuntimeException {
    public InvalidCredentialsException(String message) {
        super(message);
    }
}
