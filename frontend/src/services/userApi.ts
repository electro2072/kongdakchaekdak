import type {GenderKey} from '../constants/profileOptions';
import {logger} from '../utils/logger';
import {apiFetch} from './apiClient';
import type {UserResponse, UserUpdateFields} from '../types/api/user';

export type {UserResponse, UserUpdateFields};

// 2026-09-09: UserResponse/UserUpdateFields 타입 정의는 src/types/api/user.ts로 옮겼다
// ("인터페이스 한 폴더에 모아놓기" 리팩터링). 이 파일은 그 타입을 가져다 API 호출·gender
// 매핑 로직만 담당한다 — 다른 파일들이 기존처럼 `from '../services/userApi'`로 타입을
// 계속 가져올 수 있도록 위에서 re-export도 해 둔다.
//
// 2026-09-09 업데이트: gender 값 형식이 테스터의 실기기 검증(docs/test/reports/2026-09-09b.md,
// BUG-20260909-21)으로 실측 확인됨 — 백엔드 `Gender` enum은 대문자 이름 그대로
// (`MALE`/`FEMALE`/`NONE`) 직렬화되는데, 프론트는 소문자 키('male'/'female'/'unspecified')를
// 쓰고 있어서 겹치는 값이 하나도 없었다. 그 결과 조회 시 gender가 항상 null로 유실되고,
// 저장 시에는 백엔드가 값을 enum으로 역직렬화하지 못해 무시되거나 400이 나는 상태였다.
// mapGenderResponseToKey/mapGenderKeyToRequest 두 방향 모두 이 매핑을 명시적으로 거치도록
// 고쳤다 — 화면(GenderKey)과 API(백엔드 enum 이름) 사이의 변환은 이 파일 안에서만 일어나고,
// 나머지 코드는 여전히 기존 GenderKey('female'/'male'/'unspecified')만 알면 된다.

export function getMe(): Promise<UserResponse> {
  return apiFetch<UserResponse>('/api/auth/me');
}

export function updateUser(id: number, fields: UserUpdateFields): Promise<UserResponse> {
  const body: Record<string, unknown> = {...fields};
  if ('gender' in fields) {
    body.gender = mapGenderKeyToRequest(fields.gender);
  }
  return apiFetch<UserResponse>(`/api/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

/** 프론트 GenderKey → 백엔드 `Gender` enum 이름. (2026-09-09, BUG-20260909-21) */
const GENDER_KEY_TO_BACKEND: Record<GenderKey, string> = {
  female: 'FEMALE',
  male: 'MALE',
  unspecified: 'NONE',
};

/** 백엔드 `Gender` enum 이름 → 프론트 GenderKey. GENDER_KEY_TO_BACKEND의 역방향. */
const BACKEND_GENDER_TO_KEY: Readonly<Record<string, GenderKey>> = {
  FEMALE: 'female',
  MALE: 'male',
  NONE: 'unspecified',
};

/** GenderKey를 PATCH 바디에 넣을 백엔드 enum 이름으로 변환한다. null/undefined는 그대로 통과. */
function mapGenderKeyToRequest(
  key: GenderKey | null | undefined,
): string | null | undefined {
  if (key === null || key === undefined) {
    return key;
  }
  return GENDER_KEY_TO_BACKEND[key];
}

/** 백엔드 gender 값(enum 이름)을 화면이 쓰는 GenderKey로 변환한다. 모르는 값은 null로 둔다. */
export function mapGenderResponseToKey(value: string | null): GenderKey | null {
  if (value && BACKEND_GENDER_TO_KEY[value]) {
    return BACKEND_GENDER_TO_KEY[value];
  }
  if (value) {
    logger.warn('userApi', `알 수 없는 gender 값 — 우선 null로 처리: ${value}`);
  }
  return null;
}
