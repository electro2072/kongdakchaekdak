package com.kongdakchaekdak.domain.dashboard.dto;

/** 장르 비율 도넛 차트용 1개 항목. genre가 null/공백인 책은 "기타"로 묶인다 (DashboardService 참고). */
public record GenreRatioDto(
        String genre,
        long count,
        double percentage
) {
}
