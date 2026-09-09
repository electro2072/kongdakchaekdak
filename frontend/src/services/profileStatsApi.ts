import {logger} from '../utils/logger';
import {apiFetch} from './apiClient';
import type {ProfileStats} from '../types/api/profileStats';

export type {ProfileStats};

/**
 * 프로필 탭의 "읽은 책 / 공유한 기록" 카운트.
 *
 * 백엔드에 booksReadCount·sharedRecordsCount 전용 집계 필드가 없고, "전용 집계 테이블 없이
 * 실시간 계산" 원칙이라 FE가 목록을 받아 길이로 센다(연동매트릭스 §2.2 ②).
 *  - 읽은 책:    GET /api/books?userId={id}&status=done  ← userId 필수. 빼면 전체 사용자의
 *                책이 다 내려온다(BookController.search: userId가 null이면 findByStatus).
 *                status 값은 소문자 'done'(BookStatus 소문자 저장 규약).
 *  - 공유한 기록: GET /api/share-records                  ← 서버가 "내 것만" 내려준다.
 *
 * 응답 원소 타입을 여기서 정의하지 않고 unknown[]으로 둔 건 의도적이다. 지금 필요한 건 길이뿐이고,
 * Book/ShareRecord 응답 타입은 각각 서재(S3)·공유(S6) 슬라이스에서 제대로 정의될 예정이라
 * 미리 반쪽짜리 타입을 만들어두면 나중에 두 벌이 된다.
 *
 * 카운트는 화면의 보조 정보라 하나가 실패해도 프로필 전체를 실패로 만들지 않는다 —
 * 실패한 쪽만 0으로 두고 로그를 남긴다. 남의 프로필 통계가 필요해지는 시점에는
 * UserResponse에 필드를 추가하는 쪽으로 갈아타야 한다(현재 /api/share-records는 내 것만).
 *
 * 2026-09-09: ProfileStats 타입 정의는 src/types/api/profileStats.ts로 옮겼다("인터페이스
 * 한 폴더에 모아놓기" 리팩터링). 이 파일은 그 타입을 가져다 쓰기만 한다.
 */
export async function fetchProfileStats(userId: number): Promise<ProfileStats> {
  const [books, shares] = await Promise.allSettled([
    apiFetch<unknown[]>(`/api/books?userId=${userId}&status=done`),
    apiFetch<unknown[]>('/api/share-records'),
  ]);

  if (books.status === 'rejected') {
    logger.warn('profileStatsApi', '읽은 책 수 조회 실패', {
      error: books.reason,
    });
  }
  if (shares.status === 'rejected') {
    logger.warn('profileStatsApi', '공유한 기록 수 조회 실패', {
      error: shares.reason,
    });
  }

  return {
    booksReadCount: countOf(books),
    sharedRecordsCount: countOf(shares),
  };
}

function countOf(result: PromiseSettledResult<unknown[]>): number {
  if (result.status !== 'fulfilled' || !Array.isArray(result.value)) {
    return 0;
  }
  return result.value.length;
}
