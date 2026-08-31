import type {Genre} from '../constants/profileOptions';

export type BookStatus = 'reading' | 'done';

export interface LibraryPhoto {
  label: string;
}

export interface LibraryBook {
  id: string;
  title: string;
  author: string;
  status: BookStatus;
  dateRangeLabel: string;
  photos: LibraryPhoto[];
  noteText?: string;
  /**
   * 6개 장르 고정 매핑(claude/독서기록앱_프론트요청_디자인_6개장르고정색전환_v1.md)의 "서재 목록
   * 책 태그" 대상 — 백엔드 Book.genre 연동 전이라 mock에서 우선 채워둔다.
   */
  genre: Genre;
}

// TODO: GET /api/books, GET /api/books/{id}/photos, GET /api/books/{id}/notes 프론트 연동 전이라
// 화면설계서(Frame 03/03.1) 그대로의 mock 데이터를 서재 목록/상세 화면이 함께 참조한다.
export const MOCK_LIBRARY_BOOKS: LibraryBook[] = [
  {
    id: '1',
    title: '아몬드',
    author: '손원평',
    status: 'done',
    dateRangeLabel: '2026.06.20 ~ 2026.06.28 (9일)',
    photos: [{label: '홍대 카페'}, {label: '출근길'}, {label: '자기 전'}],
    noteText: '"인상 깊었던 부분은..."',
    genre: '소설',
  },
  {
    id: '2',
    title: '채식주의자',
    author: '한강',
    status: 'reading',
    dateRangeLabel: '2026.06.25 ~ 진행중',
    photos: [],
    genre: '소설',
  },
  {
    id: '3',
    title: '데미안',
    author: '헤르만 헤세',
    status: 'reading',
    dateRangeLabel: '2026.07.10 ~ 진행중',
    photos: [],
    genre: '소설',
  },
];
