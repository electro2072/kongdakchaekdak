package com.kongdakchaekdak.common.exception;

/**
 * 단일 필드 검증(@Valid, {@link jakarta.validation.constraints})으로는 표현할 수 없는
 * 필드 간 교차 검증(cross-field validation) 실패 시 던지는 공통 예외 — 예: "share_type이
 * book이면 bookId가 필수", "scope가 group/custom이면 targets가 최소 1개 필요" 등.
 * {@link GlobalExceptionHandler}에서 400 응답(error: "INVALID_REQUEST")으로 변환된다.
 */
public class InvalidRequestException extends RuntimeException {
    public InvalidRequestException(String message) {
        super(message);
    }
}
