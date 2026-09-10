package com.kongdakchaekdak.common.exception;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;
import java.util.List;
import java.util.Map;

/**
 * API 공통 에러 응답 포맷.
 *
 * <p><b>{@code message}는 원칙적으로 {@code null}이다.</b> 사용자에게 보일 문구는 프론트가
 * {@code error} 코드를 키로 자체 매핑한다 (설계: ErrorCode.java Javadoc가 단일 출처).
 * 예외는 백엔드가 분류하지 못한 에러({@link ErrorCode#INTERNAL_SERVER_ERROR}) 하나뿐이며,
 * 이때도 예외 문장이 아니라 traceId가 실린다 — 예외 문장에는 내부 PK가 섞여 있어 노출하면 안 된다.
 *
 * <p>{@code null}인 필드는 {@link JsonInclude}에 의해 직렬화에서 제외되므로, 일반적인 에러 응답은
 * {@code {"timestamp", "status", "error", "fieldErrors"}} 4개 필드만 갖는다.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ErrorResponse(
        Instant timestamp,
        int status,
        String error,
        String message,
        List<FieldErrorDetail> fieldErrors
) {
    /** 표준 형태 — 코드만 내려보내고 문구는 비운다. */
    public static ErrorResponse of(ErrorCode errorCode) {
        return new ErrorResponse(Instant.now(), errorCode.getStatusValue(), errorCode.name(), null, List.of());
    }

    /** 필드 검증 실패용 — {@code fieldErrors}에 필드별 사유를 담는다. */
    public static ErrorResponse of(ErrorCode errorCode, List<FieldErrorDetail> fieldErrors) {
        return new ErrorResponse(Instant.now(), errorCode.getStatusValue(), errorCode.name(), null, fieldErrors);
    }

    /**
     * 분류하지 못한 예외 전용 — {@code message}에 traceId를 싣는다.
     * 사용자에게는 이 값이 "오류 번호"로 노출되고, 서버 로그에서 해당 요청 한 건을 특정하는 데 쓰인다.
     */
    public static ErrorResponse ofUnexpected(String traceId) {
        return new ErrorResponse(Instant.now(), ErrorCode.INTERNAL_SERVER_ERROR.getStatusValue(),
                ErrorCode.INTERNAL_SERVER_ERROR.name(), traceId, List.of());
    }

    public record FieldErrorDetail(String field, String reason) {
        public static FieldErrorDetail of(Map.Entry<String, String> entry) {
            return new FieldErrorDetail(entry.getKey(), entry.getValue());
        }
    }
}
