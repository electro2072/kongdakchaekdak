import type {DashboardPeriod, DashboardResponse} from '../types/dashboard';

// TODO: GET /api/dashboard 연동 전이라 백엔드 확인 답변(claude/독서기록앱_프론트요청_대시보드API필드확인_v1.md)의
// 예시 응답 형태를 기준으로 기간별 mock 3세트를 둔다. 실제 연동 시 hooks/useDashboard.ts의 fetchDashboard만
// 교체하면 되고, 이 파일이 정의하는 타입/데이터 형태 자체는 화면 코드가 그대로 재사용한다.
//
// month  — 일반적인 경우 (장르 2개, 하이라이트 있음)
// quarter — 장르 4개인 경우. 6개 장르 고정색 전환(2026-08-28) 이후로는 "기타" 슬라이스가 아니라
//           4개 모두 각자 고유색(소설=chart1, 인문=chart4, 과학=chart5, 자기계발=chart3)으로 표시된다.
// year   — 완독 0권(가입 직후 등) 특수 케이스 — genreRatios: [], highlights 전부 null,
//          monthlyTrend도 전부 0이라 막대그래프 "전부 p100" 케이스까지 같이 검증한다.

const MOCK_DASHBOARD_BY_PERIOD: Record<DashboardPeriod, DashboardResponse> = {
  month: {
    userId: 1,
    period: 'MONTH',
    periodLabel: '2026년 8월',
    startDate: '2026-08-01',
    endDate: '2026-08-31',
    completedBookCount: 3,
    totalPagesRead: 842,
    genreRatios: [
      {genre: '소설', count: 2, ratio: 66.7},
      {genre: '에세이', count: 1, ratio: 33.3},
    ],
    monthlyTrend: [
      {yearMonth: '2026-03', completedCount: 1},
      {yearMonth: '2026-04', completedCount: 2},
      {yearMonth: '2026-05', completedCount: 1},
      {yearMonth: '2026-06', completedCount: 3},
      {yearMonth: '2026-07', completedCount: 2},
      {yearMonth: '2026-08', completedCount: 3},
    ],
    highlights: {
      topGenre: '소설',
      longestReadBook: {id: 2, title: '채식주의자', days: 14},
      fastestReadBook: {id: 1, title: '아몬드', days: 3},
    },
    recommendedCaption: '이번 달도 꾸준히 읽고 있어요! 다음 책도 기대할게요 📖',
  },
  quarter: {
    userId: 1,
    period: 'QUARTER',
    periodLabel: '2026년 3분기',
    startDate: '2026-07-01',
    endDate: '2026-09-30',
    completedBookCount: 11,
    totalPagesRead: 3184,
    genreRatios: [
      {genre: '소설', count: 5, ratio: 45.5},
      {genre: '인문', count: 3, ratio: 27.3},
      {genre: '과학', count: 2, ratio: 18.2},
      {genre: '자기계발', count: 1, ratio: 9.1},
    ],
    monthlyTrend: [
      {yearMonth: '2026-03', completedCount: 1},
      {yearMonth: '2026-04', completedCount: 2},
      {yearMonth: '2026-05', completedCount: 1},
      {yearMonth: '2026-06', completedCount: 3},
      {yearMonth: '2026-07', completedCount: 4},
      {yearMonth: '2026-08', completedCount: 4},
    ],
    highlights: {
      topGenre: '소설',
      longestReadBook: {id: 5, title: '코스모스', days: 21},
      fastestReadBook: {id: 4, title: '데미안', days: 4},
    },
    recommendedCaption: '이번 분기에 4개 장르를 골고루 읽었어요, 다음엔 어떤 장르가 궁금하세요?',
  },
  year: {
    userId: 1,
    period: 'YEAR',
    periodLabel: '2026년',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    completedBookCount: 0,
    totalPagesRead: 0,
    genreRatios: [],
    monthlyTrend: [
      {yearMonth: '2026-03', completedCount: 0},
      {yearMonth: '2026-04', completedCount: 0},
      {yearMonth: '2026-05', completedCount: 0},
      {yearMonth: '2026-06', completedCount: 0},
      {yearMonth: '2026-07', completedCount: 0},
      {yearMonth: '2026-08', completedCount: 0},
    ],
    highlights: {
      topGenre: null,
      longestReadBook: null,
      fastestReadBook: null,
    },
    recommendedCaption: '아직 완독한 책이 없어요. 첫 완독을 기록해보세요!',
  },
};

export function getMockDashboard(period: DashboardPeriod): DashboardResponse {
  return MOCK_DASHBOARD_BY_PERIOD[period];
}
