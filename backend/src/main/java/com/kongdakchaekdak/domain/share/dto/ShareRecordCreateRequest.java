package com.kongdakchaekdak.domain.share.dto;

import com.kongdakchaekdak.domain.dashboard.DashboardPeriod;
import com.kongdakchaekdak.domain.share.SharePlatform;
import com.kongdakchaekdak.domain.share.ShareScope;
import com.kongdakchaekdak.domain.share.ShareType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

import java.util.List;

/**
 * shareType=BOOK이면 bookId가 필수 (ShareRecordService에서 교차 검증). shareType=DASHBOARD면
 * bookId는 무시된다. scope=GROUP/CUSTOM이면 targets가 최소 1개 필요, scope=ALL이면 targets는
 * 무시된다. cardImageUrl은 선택 — 클라이언트가 Step4의 S3 presigned URL로 카드 이미지를 이미
 * 직접 업로드했다면 그 URL을 그대로 전달하면 된다 (서버가 카드 이미지를 생성해주지는 않음 —
 * Step 5-2 설계 확정: 카드 이미지 서버 렌더링은 이번에도 보류, 클라이언트 캡처 방식 유지).
 *
 * <p>Step 5-2에서 추가된 4개 필드 — 전부 shareType=BOOK일 때만 허용(DASHBOARD면 400):</p>
 * <ul>
 *   <li>{@code bookNoteId}: 카드/공개 웹페이지에 노출할 소감. 지정한 책 소속 BookNote여야 함</li>
 *   <li>{@code photoIds}: 카드/공개 웹페이지에 노출할 사진(순서대로, 최대 10장). 전부 지정한
 *       책 소속 BookPhoto여야 함</li>
 * </ul>
 * <p>반대로 아래 2개는 shareType=DASHBOARD일 때만 허용(BOOK이면 400) — 공유 시점의 대시보드
 * 통계 스냅샷을 만들 때 쓸 기간. 둘 다 생략하면 이번 달(MONTH, 오늘) 기준으로 스냅샷을 만든다.</p>
 * <ul>
 *   <li>{@code dashboardPeriod}: MONTH/QUARTER/YEAR (기본 MONTH)</li>
 *   <li>{@code dashboardDate}: yyyy-MM 형식 (기본 이번 달)</li>
 * </ul>
 */
public record ShareRecordCreateRequest(
        @NotNull ShareType shareType,
        Long bookId,
        @NotNull ShareScope scope,
        @NotNull SharePlatform platform,
        String cardImageUrl,
        @Valid List<ShareTargetRequest> targets,
        Long bookNoteId,
        List<Long> photoIds,
        DashboardPeriod dashboardPeriod,
        String dashboardDate
) {
}
