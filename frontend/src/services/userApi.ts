import type {GenderKey} from '../constants/profileOptions';
import {logger} from '../utils/logger';
import {apiFetch} from './apiClient';

/**
 * GET /api/auth/me, GET /api/users/{id} 공용 응답 타입.
 * 백엔드 확정 답변(claude/독서기록앱_백엔드요청_프론트_프로필수정interests확인외_v1.md, 2026-09-08)
 * 기준. gender의 정확한 값 형식(enum 코드 vs 한글 라벨)은 재확인 필요
 * (claude/독서기록앱_프론트요청_백엔드_서재모임공유API계약확인_v1.md 5번 참고) — 확인 전까지는
 * 알려진 3개 키('male'/'female'/'unspecified') 외 값이 오면 null로 처리한다.
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

export function getMe(): Promise<UserResponse> {
  return apiFetch<UserResponse>('/api/auth/me');
}

export function updateUser(id: number, fields: UserUpdateFields): Promise<UserResponse> {
  return apiFetch<UserResponse>(`/api/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(fields),
  });
}

const KNOWN_GENDER_KEYS: readonly GenderKey[] = ['female', 'male', 'unspecified'];

/** 백엔드 gender 값 형식이 재확인되기 전까지는 알려진 3개 키만 신뢰하고, 그 외 값은 null로 둔다. */
export function mapGenderResponseToKey(value: string | null): GenderKey | null {
  if (value && (KNOWN_GENDER_KEYS as readonly string[]).includes(value)) {
    return value as GenderKey;
  }
  if (value) {
    logger.warn('userApi', `알 수 없는 gender 값 — 우선 null로 처리: ${value}`);
  }
  return null;
}
