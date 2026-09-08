import type {Genre} from '../constants/profileOptions';
import {apiFetch} from './apiClient';
import {logger} from '../utils/logger';

/**
 * 서재(책·소감·장소사진) 백엔드 연동.
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

interface PresignedUrlResponse {
  uploadUrl: string;
  imageUrl: string;
  key: string;
  expiresInSeconds: number;
}

/** yyyy-MM-dd — 백엔드 LocalDate가 받는 형식. 로컬 타임존 기준으로 만든다(UTC 변환 금지). */
export function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function fetchBooks(userId: number): Promise<BookResponse[]> {
  return apiFetch<BookResponse[]>(`/api/books?userId=${userId}`);
}

export function createBook(payload: BookCreatePayload): Promise<BookResponse> {
  return apiFetch<BookResponse>('/api/books', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/** endDate를 생략하면 서버가 오늘 날짜로 완독 처리한다. */
export function completeBook(
  bookId: number,
  endDate?: string,
): Promise<BookResponse> {
  return apiFetch<BookResponse>(`/api/books/${bookId}/complete`, {
    method: 'PATCH',
    body: JSON.stringify(endDate ? {endDate} : {}),
  });
}

export function deleteBook(bookId: number): Promise<void> {
  return apiFetch<void>(`/api/books/${bookId}`, {method: 'DELETE'});
}

export function fetchNotes(bookId: number): Promise<BookNoteResponse[]> {
  return apiFetch<BookNoteResponse[]>(`/api/books/${bookId}/notes`);
}

export function createNote(
  bookId: number,
  content: string,
): Promise<BookNoteResponse> {
  return apiFetch<BookNoteResponse>(`/api/books/${bookId}/notes`, {
    method: 'POST',
    body: JSON.stringify({content}),
  });
}

export function updateNote(
  bookId: number,
  noteId: number,
  content: string,
): Promise<BookNoteResponse> {
  return apiFetch<BookNoteResponse>(`/api/books/${bookId}/notes/${noteId}`, {
    method: 'PATCH',
    body: JSON.stringify({content}),
  });
}

export function deleteNote(bookId: number, noteId: number): Promise<void> {
  return apiFetch<void>(`/api/books/${bookId}/notes/${noteId}`, {
    method: 'DELETE',
  });
}

export function fetchPhotos(bookId: number): Promise<BookPhotoResponse[]> {
  return apiFetch<BookPhotoResponse[]>(`/api/books/${bookId}/photos`);
}

export function deletePhoto(bookId: number, photoId: number): Promise<void> {
  return apiFetch<void>(`/api/books/${bookId}/photos/${photoId}`, {
    method: 'DELETE',
  });
}

function guessContentType(uri: string): string {
  const ext = uri.split('?')[0].split('.').pop()?.toLowerCase();
  if (ext === 'png') {
    return 'image/png';
  }
  if (ext === 'heic' || ext === 'heif') {
    return 'image/heic';
  }
  if (ext === 'webp') {
    return 'image/webp';
  }
  return 'image/jpeg';
}

/**
 * 장소사진 업로드 3단계: presigned URL 발급 → S3에 PUT → 메타데이터 등록.
 *
 * 2단계 PUT은 apiFetch를 쓰지 않는다 — 대상이 우리 서버가 아닌 S3라서 Authorization 헤더를
 * 붙이면 서명 검증이 깨진다. Content-Type은 1단계에서 서명에 포함된 값과 반드시 같아야 한다.
 */
export async function uploadPhoto(
  bookId: number,
  localUri: string,
  locationText?: string,
): Promise<BookPhotoResponse> {
  const contentType = guessContentType(localUri);
  const fileName = localUri.split('/').pop() ?? `photo-${Date.now()}.jpg`;

  const presigned = await apiFetch<PresignedUrlResponse>(
    `/api/books/${bookId}/photos/presigned-url`,
    {method: 'POST', body: JSON.stringify({fileName, contentType})},
  );

  const fileResponse = await fetch(localUri);
  const blob = await fileResponse.blob();

  const putResponse = await fetch(presigned.uploadUrl, {
    method: 'PUT',
    headers: {'Content-Type': contentType},
    body: blob,
  });
  if (!putResponse.ok) {
    logger.error('libraryApi', 'S3 업로드 실패', {status: putResponse.status});
    throw new Error('사진 업로드에 실패했어요. 잠시 후 다시 시도해주세요.');
  }

  return apiFetch<BookPhotoResponse>(`/api/books/${bookId}/photos`, {
    method: 'POST',
    body: JSON.stringify({
      imageUrl: presigned.imageUrl,
      locationText: locationText ?? null,
    }),
  });
}
