import type {ShareHistoryItem} from '../types/share';

// TODO: GET /api/share-records 프론트 연동 전이라 화면설계서(Frame 04.1) 그대로의 mock 데이터를 사용한다.
export const MOCK_SHARE_HISTORY: ShareHistoryItem[] = [
  {
    id: '1',
    icon: 'book',
    title: '아몬드',
    targetLabel: '독서모임(8명)',
    dateLabel: '07/09',
  },
  {
    id: '2',
    icon: 'dashboard',
    title: '3분기 리캡',
    targetLabel: '전체공개',
    dateLabel: '07/05',
  },
  {
    id: '3',
    icon: 'book',
    title: '채식주의자',
    targetLabel: '인스타그램',
    dateLabel: '07/01',
  },
];
