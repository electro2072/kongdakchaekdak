package com.bookflex.domain.share.dto;

/**
 * shareType=DASHBOARD인 ShareRecord가 공유 시점에 얼려서 저장하는 대시보드 통계 스냅샷.
 * {@code ShareRecord.dashboardSnapshot} 컬럼에 이 레코드를 그대로 JSON 직렬화해서 저장하고,
 * 조회 시 다시 이 타입으로 역직렬화한다 — DashboardResponse 전체가 아니라 공유 카드/공개
 * 웹페이지에 실제로 필요한 값만 뽑아서 저장한다(period/startDate/endDate/genreRatios/
 * monthlyTrend 등은 공유 스냅샷 용도로는 불필요).
 */
public record DashboardSnapshotResponse(
        String periodLabel,
        long completedBookCount,
        long totalPagesRead,
        String topGenre,
        String recommendedCaption
) {
}
