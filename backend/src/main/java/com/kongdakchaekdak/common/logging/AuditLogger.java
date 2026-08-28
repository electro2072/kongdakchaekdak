package com.kongdakchaekdak.common.logging;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;

/**
 * "누가 무엇을 했는지"를 남기는 감사 로그. 생성/수정/삭제 등 상태 변경 시 각 서비스가 저장 성공 직후에 호출한다.
 */
@Component
public class AuditLogger {

    private static final String LOG_TYPE_MDC_KEY = "logType";
    private static final Logger log = LoggerFactory.getLogger("com.kongdakchaekdak.log.AUDIT");

    /**
     * @param action       무슨 일이 있었는지를 나타내는 대문자 스네이크케이스 코드 (예: "BOOK_REGISTERED")
     * @param actorUserId  행위를 한 사용자 id (없으면 null)
     * @param detail       추가로 남길 상세 정보 (없으면 null/blank 가능, 생략됨)
     */
    public void event(String action, Long actorUserId, String detail) {
        MDC.put(LOG_TYPE_MDC_KEY, LogType.AUDIT.name());
        try {
            if (detail == null || detail.isBlank()) {
                log.info("action={} actorUserId={}", action, actorUserId);
            } else {
                log.info("action={} actorUserId={} {}", action, actorUserId, detail);
            }
        } finally {
            MDC.remove(LOG_TYPE_MDC_KEY);
        }
    }
}
