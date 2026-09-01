package com.kongdakchaekdak.domain.dashboard;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/**
 * 기획서 3-6-1 "기간별 리캡" — 월간/분기별/연간 단위 전환.
 *
 * <p><b>(2026-08-31 수정, FINDING-20260827-04 잔여)</b> {@code ShareType}/{@code ShareScope}/
 * {@code SharePlatform}은 2026-08-28에 이미 JSON 계약을 소문자로 통일했는데 이 enum만 그 작업에서
 * 빠져 있었다. {@code ShareRecordCreateRequest.dashboardPeriod}가 이 타입을 그대로 Jackson으로
 * 역직렬화하기 때문에, 대시보드 공유(POST /api/share-records) 요청 바디에
 * {@code "dashboardPeriod":"month"}를 보내면 400(MALFORMED_REQUEST)이 나고 반드시
 * {@code "MONTH"}(대문자)를 보내야 했다 — 같은 요청의 shareType/scope/platform은 전부 소문자인데
 * 이 필드만 대문자라 계약이 갈라져 있었다. {@link com.kongdakchaekdak.domain.share.ShareType}과
 * 동일한 패턴(소문자 전용, exact match)으로 맞춘다 — 이제 대문자를 보내면 반대로 400이 된다.</p>
 *
 * <p>주의: {@code GET /api/dashboard?period=} 쿼리 파라미터는 이 어노테이션과 무관하다 —
 * {@code DashboardController}가 {@code period} 문자열을 직접 받아 {@code .toUpperCase()}로 변환한
 * 뒤 {@code DashboardPeriod.valueOf(...)}를 호출하는 별도 로직이라 원래부터 대소문자 관계없이
 * 동작했다(이번 변경으로 달라지는 것 없음).</p>
 */
public enum DashboardPeriod {
    MONTH,
    QUARTER,
    YEAR;

    @JsonValue
    public String toJson() {
        return name().toLowerCase();
    }

    @JsonCreator
    public static DashboardPeriod fromJson(String value) {
        for (DashboardPeriod period : values()) {
            if (period.name().toLowerCase().equals(value)) {
                return period;
            }
        }
        throw new IllegalArgumentException("알 수 없는 dashboardPeriod: " + value);
    }
}
