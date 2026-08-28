package com.kongdakchaekdak.common.logging;

/**
 * 로그를 성격별로 구분하기 위한 타입.
 *
 * <p>MDC의 {@code logType} 키에 이 enum의 name()을 넣어 logback-spring.xml의 로그 패턴에 함께 찍히도록 한다.
 * 별도 파일로 분리하지 않고 하나의 stdout 스트림 + MDC 필드로 구분하는 이유:
 * 배포 대상인 Railway는 컨테이너 파일시스템이 휘발성(ephemeral)이라 파일로 로그를 나눠 쌓아봐야
 * 재배포/재시작 시 사라진다. 대신 표준출력(stdout)에 한 줄로 찍고, 로그 수집기(Railway 로그 뷰어 등)에서
 * logType/traceId 필드로 검색·필터링하는 방식이 12-factor app의 로깅 원칙에 맞는다.
 * 로컬 개발 중에만 logback-spring.xml의 {@code local} 프로필에서 파일 appender를 추가로 켠다.
 */
public enum LogType {

    /** 모든 HTTP 요청/응답 1건당 1줄. RequestTraceFilter가 기록한다. */
    ACCESS,

    /** 인증/인가 관련 이벤트(로그인 성공/실패, 토큰 무효, 인증 안 됨, 접근 거부 등). SecurityEventLogger가 기록한다. */
    SECURITY,

    /** "누가 무엇을 했는지"를 남기는 감사 로그(생성/삭제 등 상태 변경). AuditLogger가 기록한다. */
    AUDIT,

    /** 처리되지 않은 서버 오류, 예상 밖 예외. GlobalExceptionHandler가 기록한다. */
    ERROR,

    /** 위 네 가지로 분류되지 않는 일반 애플리케이션 로그(각 클래스의 @Slf4j log). */
    APPLICATION
}
