package com.kongdakchaekdak.common.time;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneId;

/**
 * 서비스 타임존(KST) 고정 "오늘"/"이번 달" 계산 유틸.
 *
 * <p><b>(OBS-26, 2026-09-10)</b> 서비스 타임존은 KST 고정인데, 배포 환경(Railway 컨테이너)의
 * JVM 기본 타임존은 UTC로 뜬다. {@code LocalDate.now()}/{@code YearMonth.now()}처럼 JVM 기본
 * 타임존에 의존해 값을 생략 시 기본값으로 채우던 지점들은, KST 00:00~08:59 사이(=UTC 기준
 * 전날 15:00~23:59)에 들어온 요청에서 실제 KST 날짜보다 하루 이른 값을 반환했다.
 * 완독 처리 시 endDate를 생략하면 시작일보다 이른 날짜가 잡히는 문제(테스터 관측:
 * "2026.09.09 ~ 2026.09.08 (0일)")로 나타났고, 같은 패턴이 책 등록 시 startDate 생략과
 * 대시보드 "이번 달" 기본값 계산에도 있어(월/분기 집계가 findByUserIdAndStatusAndEndDateBetween로
 * endDate 구간 조회를 하므로 경계에서 권수가 틀어짐) 함께 정리한다. 날짜/월을 생략 시 기본값을
 * 채우는 모든 지점은 앞으로 이 유틸을 통해서만 "오늘"을 구한다.
 */
public final class KstClock {

    public static final ZoneId ZONE = ZoneId.of("Asia/Seoul");

    private KstClock() {
    }

    public static LocalDate today() {
        return LocalDate.now(ZONE);
    }

    public static YearMonth thisMonth() {
        return YearMonth.now(ZONE);
    }
}
