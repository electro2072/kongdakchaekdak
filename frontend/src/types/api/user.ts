import type {GenderKey} from '../../constants/profileOptions';

/**
 * GET /api/auth/me, GET /api/users/{id} 공용 응답 타입.
 * 백엔드 확정 답변(claude/독서기록앱_백엔드요청_프론트_프로필수정interests확인외_v1.md, 2026-09-08)
 * 기준.
 *
 * 2026-09-09: "인터페이스 한 폴더에 모아놓기" 리팩터링으로 userApi.ts에 있던 타입 정의를
 * 이 파일로 옮겼다. gender 값 형식 관련 배경(BUG-20260909-21, 대문자 enum 이름 이슈)과
 * 양방향 매핑 로직(GENDER_KEY_TO_BACKEND/BACKEND_GENDER_TO_KEY)은 여전히 userApi.ts에
 * 그대로 있다 — 그건 API 클라이언트의 동작(로직)이지 타입 정의가 아니라서 이 파일로
 * 옮기지 않았다.
 */
export interface UserResponse {
  id: number;
  nickname: string;
  profileImage: string | null;
  bio: string | null;
  gender: string | null;
  socialProvider: string;
  interests: string[];
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
  daysSinceLastLogin: number | null;
}

export interface UserUpdateFields {
  nickname?: string;
  bio?: string;
  gender?: GenderKey | null;
  interests?: string[];
}
