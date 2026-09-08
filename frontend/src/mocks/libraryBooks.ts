import type {Genre} from '../constants/profileOptions';

export type BookStatus = 'reading' | 'done';

/**
 * 장소 사진 — 책 상세(Frame 03.1)에서 독서 중 찍은 사진 1장.
 * `id`/`uri`는 2026-09-08 백엔드 회신(BookPhoto presigned URL 흐름) 반영 —
 * 실제 연동 전에는 `uri`에 로컬 이미지 피커가 돌려준 파일 URI가 그대로 들어간다.
 */
export interface LibraryPhoto {
  id: string;
  uri: string;
  /** 촬영 장소 텍스트 라벨 — 선택 입력 (백엔드 BookPhoto.locationText, nullable) */
  label?: string;
}

/**
 * 소감 — 책 하나에 여러 번 작성 가능 (2026-09-07 백엔드 회신, BookNote는 목록 구조가
 * 의도된 설계). `createdAt`은 ISO 문자열로 저장하고 화면에는 포맷해서 표시한다.
 */
export interface LibraryNote {
  id: string;
  content: string;
  createdAt: string;
}

export interface LibraryBook {
  id: string;
  title: string;
  author: string;
  status: BookStatus;
  dateRangeLabel: string;
  /**
   * 책 표지 URL — 알라딘/카카오 검색 결과의 coverImageUrl을 등록 시 그대로 저장.
   * 2026-09-08 수정: 이전엔 이 필드 자체가 없어서 등록 후 표지가 사라지고 항상
   * placeholder만 보였음 (백엔드 확인 결과 요청/응답 필드명 모두 `coverImage`).
   */
  coverImage?: string;
  photos: LibraryPhoto[];
  notes: LibraryNote[];
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
    photos: [
      {id: 'p1', uri: '', label: '홍대 카페'},
      {id: 'p2', uri: '', label: '출근길'},
      {id: 'p3', uri: '', label: '자기 전'},
    ],
    notes: [
      {
        id: 'n1',
        content: '"인상 깊었던 부분은..."',
        createdAt: '2026-06-28T12:00:00.000Z',
      },
    ],
    genre: '소설',
  },
  {
    id: '2',
    title: '채식주의자',
    author: '한강',
    status: 'reading',
    dateRangeLabel: '2026.06.25 ~ 진행중',
    photos: [],
    notes: [],
    genre: '소설',
  },
  {
    id: '3',
    title: '데미안',
    author: '헤르만 헤세',
    status: 'reading',
    dateRangeLabel: '2026.07.10 ~ 진행중',
    photos: [],
    notes: [],
    genre: '소설',
  },
];
