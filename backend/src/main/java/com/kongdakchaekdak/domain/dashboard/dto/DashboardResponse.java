package com.kongdakchaekdak.domain.dashboard.dto;

import com.kongdakchaekdak.domain.dashboard.DashboardPeriod;

import java.time.LocalDate;
import java.util.List;

/**
 * @param periodLabel 화면 표시용 절대 기간 문구 (예: "2026년 7월" / "2026년 3분기" / "2026년")
 * @param startDate   집계에 사용된 기간의 시작일(포함)
 * @param endDate     집계에 사용된 기간의 종료일(포함)
 * @param completedBookCount 기간 내 완독한 책 수
 * @param totalPagesRead     기간 내 완독한 책들의 totalPages 합(null인 책은 0으로 취급)
 * @param genreRatios        장르 비율 도넛 차트 데이터 (기간 내 완독 책 기준)
 * @param monthlyTrend        월별 완독 추이 막대그래프 데이터 — 선택 기간의 마지막 달을 기준으로
 *                            직전 6개월치 고정 (기간 종류와 무관하게 항상 "월별" 단위)
 * @param highlights          하이라이트 카드용 구조화 데이터
 * @param recommendedCaption  SNS 공유용 추천 문구 (기획서 3-6-1 "공유 문구 자동 생성")
 */
public record DashboardResponse(
        Long userId,
        DashboardPeriod period,
        String periodLabel,
        LocalDate startDate,
        LocalDate endDate,
        long completedBookCount,
        long totalPagesRead,
        List<GenreRatioDto> genreRatios,
        List<MonthlyTrendDto> monthlyTrend,
        DashboardHighlights highlights,
        String recommendedCaption
) {
}
