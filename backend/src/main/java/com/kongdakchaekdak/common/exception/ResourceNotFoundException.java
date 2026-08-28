package com.kongdakchaekdak.common.exception;

/**
 * 요청한 리소스(엔티티)를 찾을 수 없을 때 던지는 공통 예외.
 * {@link GlobalExceptionHandler}에서 404 응답으로 변환된다.
 */
public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }
}
