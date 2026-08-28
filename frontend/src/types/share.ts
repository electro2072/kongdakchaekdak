export type ShareScope = 'all' | 'group' | 'custom';
export type SharePlatform = 'app' | 'instagram' | 'threads' | 'tiktok';

export interface ShareGroupOption {
  id: string;
  name: string;
  memberCount: number;
}

/**
 * 공유 이력 한 건 (Frame 04.1 "공유 이력" 목록).
 * icon: 무엇을 공유했는지 — 책 기록(book) 또는 독서 대시보드 리캡(dashboard).
 * targetLabel: 어디로 공유했는지 텍스트 그대로 (그룹명+인원수, "전체공개", SNS 플랫폼명 등) —
 * 화면설계서 v2-5 Frame 04.1 목업 텍스트("독서모임(8명)", "전체공개", "인스타그램")를 그대로 따른다.
 */
export interface ShareHistoryItem {
  id: string;
  icon: 'book' | 'dashboard';
  title: string;
  targetLabel: string;
  dateLabel: string;
}
