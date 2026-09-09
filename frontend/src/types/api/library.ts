import type {Genre} from '../../constants/profileOptions';

/**
 * 서재(책·소감·장소사진) 백엔드 연동 요청/응답 타입.
 *
 * 엔드포인트는 backend BookController / BookNoteController / BookPhotoController 기준:
 *  - GET/POST/PUT/DELETE /api/books, PATCH /api/books/{id}/complete
 *  - GET/POST/PATCH/DELETE /api/books/{bookId}/notes(/{noteId})
 *  - POST /api/books/{bookId}/photos/presigned-url, GET/POST/DELETE /api/books/{bookId}/photos(/{photoId})
 *
 * 주의할 계약 두 가지:
 *  1. POST /api/books는 바디에 userId를 요구하고(@NotNull), 서버가 토큰의 사용자와 다르면 403을 준다.
 *     다른 컨트롤러들은 @AuthenticationPrincipal만 쓰는데 여기만 바디로도 받는다 — 백엔드에
 *     통일을 요청할 만한 지점이다.
 *  2. Genre는 @JsonValue로 한글 라벨("소설", "경제·경영")을 그대로 주고받는다. 프론트 Genre 타입과
 *     문자열이 동일해서 변환이 필요 없다. 반면 BookStatus는 대문자 enum("READING"/"DONE")으로
 *     내려오고, GET 쿼리 파라미터는 소문자를 받는다.
 *
 * 2026-09-09: "인터페이스 한 폴더에 모아놓기" 리팩터링으로 libraryApi.ts에 있던 타입 정의를
 * 이 파일로 옮겼다. PresignedUrlResponse는 원래 libraryApi.ts 안에서만 쓰는 비공개 타입이라
 * export 안 돼 있었는데, 여기로 옮기면서 export했다(다른 파일에서 아직 쓰진 않지만, 한 폴더에
 * 모으는 김에 나머지 응답 타입들과 같이 공개해 둔다).
 */

export type BookStatusResponse = 'READING' | 'DONE';

export interface BookResponse {
  id: number;
  userId: number;
  title: string;
  author: string;
  coverImage: string | null;
  isbn: string | null;
  genre: Genre | null;
  totalPages: number | null;
  status: BookStatusResponse;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BookCreatePayload {
  userId: number;
  title: string;
  author: string;
  coverImage?: string;
  isbn?: string;
  genre?: Genre;
  totalPages?: number;
  /** yyyy-MM-dd. 생략하면 서버가 null로 저장한다. */
  startDate?: string;
}

export interface BookNoteResponse {
  id: number;
  bookId: number;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface BookPhotoResponse {
  id: number;
  bookId: number;
  imageUrl: string;
  locationText: string | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
}

export interface PresignedUrlResponse {
  uploadUrl: string;
  imageUrl: string;
  key: string;
  expiresInSeconds: number;
}
