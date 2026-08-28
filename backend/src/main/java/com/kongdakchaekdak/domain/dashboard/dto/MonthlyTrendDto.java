package com.kongdakchaekdak.domain.dashboard.dto;

/** 월별 완독 추이 막대그래프용 1개월치 데이터. yearMonth는 "yyyy-MM" 형식. */
public record MonthlyTrendDto(
        String yearMonth,
        long completedCount
) {
}
