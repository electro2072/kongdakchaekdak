package com.kongdakchaekdak.domain.dashboard;

import com.kongdakchaekdak.common.time.KstClock;
import com.kongdakchaekdak.domain.dashboard.dto.DashboardResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.YearMonth;

/**
 * 독서 대시보드(Recap) 통계 API (Step 5-1). 마이페이지 개인 기능이라 항상 본인(JWT 주체) 통계만
 * 조회한다 — 다른 회원의 대시보드를 보는 API는 없음. 자체 테이블 없이 Book 데이터를 그때그때
 * 실시간 집계한다 (백엔드구축계획 문서 6장 판단 그대로).
 */
@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@Tag(name = "Dashboard", description = "독서 대시보드(Recap) 통계 API")
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping
    @Operation(summary = "기간별(월간/분기별/연간) 독서 대시보드 통계 조회 (본인 것만)")
    public DashboardResponse getDashboard(
            @RequestParam(required = false, defaultValue = "month") String period,
            // "yyyy-MM" 형식, 생략 시 이번 달 기준. 예: date=2026-07 & period=quarter → 2026년 3분기.
            @RequestParam(required = false) String date,
            @AuthenticationPrincipal Long currentUserId
    ) {
        DashboardPeriod dashboardPeriod = DashboardPeriod.valueOf(period.toUpperCase());
        // (OBS-26, 2026-09-10) date 생략 시 "이번 달"은 서버 JVM 기본 타임존이 아니라 서비스
        // 타임존(KST) 기준으로 고정한다 — Book.startDate/endDate 기본값과 동일한 버그 패턴이었다.
        // 집계가 endDate 구간 조회(findByUserIdAndStatusAndEndDateBetween)라 월 경계에서 어긋나면
        // "이번 달 완독 권수"가 실제와 달라진다.
        YearMonth referenceMonth = date == null ? KstClock.thisMonth() : YearMonth.parse(date);
        return dashboardService.getDashboard(currentUserId, dashboardPeriod, referenceMonth);
    }
}
