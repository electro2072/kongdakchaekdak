package com.kongdakchaekdak.common.exception;

/**
 * {@link ErrorCode}를 스스로 알고 있는 비즈니스 예외.
 *
 * <p>{@link GlobalExceptionHandler}가 예외 타입별로 코드를 하드코딩하지 않고 예외에게 물어보도록
 * 하기 위한 인터페이스다. 세부 코드가 추가되어도 핸들러는 손댈 필요가 없다.
 *
 * <p>예외의 {@code getMessage()}는 <b>로그 전용</b>이다 — 내부 PK 등 상세 정보를 담아도 되지만,
 * 응답 바디에는 들어가지 않는다.
 */
public interface CodedException {
    ErrorCode getErrorCode();
}
