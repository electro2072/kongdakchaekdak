/**
 * 프로필 탭의 "읽은 책 / 공유한 기록" 카운트 — `GET /api/books?userId&status=done` 배열 길이 +
 * `GET /api/share-records` 배열 길이로 FE가 계산한 결과 타입 (연동매트릭스 §2.2 ②).
 * 자세한 배경은 src/services/profileStatsApi.ts 참고.
 *
 * 2026-09-09: "인터페이스 한 폴더에 모아놓기" 리팩터링으로 profileStatsApi.ts에 있던 타입 정의를
 * 이 파일로 옮겼다.
 */
export interface ProfileStats {
  booksReadCount: number;
  sharedRecordsCount: number;
}
