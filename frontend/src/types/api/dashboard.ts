/**
 * GET /api/dashboard 응답 타입.
 * 백엔드 확인 완료(claude/독서기록앱_프론트요청_대시보드API필드확인_v1.md 답변, 2026-08-27) 기준.
 *
 * 2026-09-09: "인터페이스 한 폴더에 모아놓기" 리팩터링으로 src/types/dashboard.ts에서 이 파일로
 * 그대로 옮겼다(내용 변경 없음, 위치만 다른 API 응답 타입들과 함께 src/types/api/로 이동).
 *
 * 2026-09-11 (BUG-20260910-b01): 백엔드 record와 필드명이 어긋나 있던 것을 원본 기준으로 정정했다.
 * 계약의 단일 출처는 backend `domain/dashboard/dto/*.java`·`DashboardPeriod.java`다(D15).
 * 드리프트는 `__tests__/dashboardDtoContract.test.ts`가 잡는다 — 필드를 바꾸면 그 테스트부터 본다.
 */

/** 쿼리 파라미터 `period`. 백엔드가 `toUpperCase()` 후 `valueOf`하므로 대소문자 무관. */
export type DashboardPeriod = 'month' | 'quarter' | 'year';

/**
 * 응답 필드 `period` — **소문자.** `DashboardPeriod.java`의 `@JsonValue`가 `name().toLowerCase()`로
 * 직렬화한다(BE `DashboardControllerTest`가 `$.period == "month"`로 고정). 이전 판은 대문자로 적혀 있었다.
 */
export type DashboardPeriodResponse = 'month' | 'quarter' | 'year';

export interface GenreRatioDto {
  genre: string;
  count: number;
  /** 0~100, 소수 첫째 자리 반올림 (BE `roundToOneDecimal`) */
  percentage: number;
}

/** yearMonth: "yyyy-MM", 항상 6개 고정(직전 6개월, 과거→최신) */
export interface MonthlyTrendDto {
  yearMonth: string;
  completedCount: number;
}

export interface BookHighlightDto {
  bookId: number;
  title: string;
  days: number;
}

export interface DashboardHighlights {
  topGenre: string | null;
  longestReadBook: BookHighlightDto | null;
  fastestReadBook: BookHighlightDto | null;
}

export interface DashboardResponse {
  userId: number;
  period: DashboardPeriodResponse;
  periodLabel: string;
  /** yyyy-MM-dd */
  startDate: string;
  /** yyyy-MM-dd */
  endDate: string;
  completedBookCount: number;
  totalPagesRead: number;
  /** count 내림차순 정렬(동률은 장르명 오름차순) */
  genreRatios: GenreRatioDto[];
  monthlyTrend: MonthlyTrendDto[];
  highlights: DashboardHighlights;
  recommendedCaption: string;
}
