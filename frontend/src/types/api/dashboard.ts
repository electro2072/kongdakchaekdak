/**
 * GET /api/dashboard 응답 타입.
 * 백엔드 확인 완료(claude/독서기록앱_프론트요청_대시보드API필드확인_v1.md 답변, 2026-08-27) 기준.
 *
 * 2026-09-09: "인터페이스 한 폴더에 모아놓기" 리팩터링으로 src/types/dashboard.ts에서 이 파일로
 * 그대로 옮겼다(내용 변경 없음, 위치만 다른 API 응답 타입들과 함께 src/types/api/로 이동).
 */

/** 쿼리 파라미터 `period` — 소문자 */
export type DashboardPeriod = 'month' | 'quarter' | 'year';

/** 응답 필드 `period` — 대문자 */
export type DashboardPeriodResponse = 'MONTH' | 'QUARTER' | 'YEAR';

export interface GenreRatioDto {
  genre: string;
  count: number;
  /** 0~100 */
  ratio: number;
}

/** yearMonth: "yyyy-MM", 항상 6개 고정(직전 6개월, 과거→최신) */
export interface MonthlyTrendDto {
  yearMonth: string;
  completedCount: number;
}

export interface BookHighlightDto {
  id: number;
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
