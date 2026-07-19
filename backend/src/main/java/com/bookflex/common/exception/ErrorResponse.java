package com.bookflex.common.exception;

import java.time.Instant;
import java.util.List;
import java.util.Map;

/**
 * API 공통 에러 응답 포맷.
 */
public record ErrorResponse(
        Instant timestamp,
        int status,
        String error,
        String message,
        List<FieldErrorDetail> fieldErrors
) {
    public static ErrorResponse of(int status, String error, String message) {
        return new ErrorResponse(Instant.now(), status, error, message, List.of());
    }

    public static ErrorResponse of(int status, String error, String message, List<FieldErrorDetail> fieldErrors) {
        return new ErrorResponse(Instant.now(), status, error, message, fieldErrors);
    }

    public record FieldErrorDetail(String field, String reason) {
        public static FieldErrorDetail of(Map.Entry<String, String> entry) {
            return new FieldErrorDetail(entry.getKey(), entry.getValue());
        }
    }
}
