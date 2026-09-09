import Config from 'react-native-config';
import {logger} from '../utils/logger';
import {t} from '../strings';

/**
 * 인증이 필요한 백엔드 API 전용 공용 클라이언트.
 * (claude/독서기록앱_프론트_전체API연동_설계_v1.md 1장 참고)
 *
 * authApi.ts(소셜 로그인 교환)는 인증 전에 호출하는 공개 엔드포인트라 이 파일을 쓰지 않고 그대로
 * fetch를 직접 쓴다 — 그 외 accessToken이 필요한 모든 서비스(userApi 등)는 이 apiFetch를 쓴다.
 */
const API_BASE_URL = Config.API_BASE_URL ?? 'http://10.0.2.2:8080';

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

let currentAccessToken: string | null = null;
let unauthorizedHandler: (() => void) | null = null;

/** AuthContext가 accessToken이 바뀔 때마다 호출해 이 모듈의 토큰을 동기화한다. */
export function setApiAccessToken(token: string | null): void {
  currentAccessToken = token;
}

/**
 * AuthContext가 마운트 시 등록 — 401 응답을 받으면 이 핸들러(보통 logout)를 호출해
 * 재로그인을 유도한다. 백엔드에 리프레시 토큰이 없어(회신 확인 완료) 만료/무효화된
 * accessToken은 실제로 API를 호출해봐야만 알 수 있다.
 */
export function registerUnauthorizedHandler(
  handler: (() => void) | null,
): void {
  unauthorizedHandler = handler;
}

/** 인증이 필요한 API 공용 호출 함수. accessToken이 있으면 Authorization 헤더를 자동으로 붙인다. */
export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> | undefined),
  };
  if (currentAccessToken) {
    headers.Authorization = `Bearer ${currentAccessToken}`;
  }

  logger.debug('apiClient', `요청: ${init.method ?? 'GET'} ${path}`);

  let response: Response;
  try {
    response = await fetch(url, {...init, headers});
  } catch (error) {
    logger.error('apiClient', `네트워크 오류: ${path}`, {error});
    throw new ApiError(0, t('failure.network'));
  }

  if (!response.ok) {
    if (response.status === 401) {
      logger.warn('apiClient', `401 응답 — 로그아웃 처리: ${path}`);
      unauthorizedHandler?.();
    }
    let message = `요청 실패 (${response.status})`;
    try {
      const body = await response.json();
      if (body && typeof body.message === 'string') {
        message = body.message;
      }
    } catch {
      // 응답 본문이 JSON이 아니면 기본 메시지를 그대로 쓴다.
    }
    logger.error('apiClient', `요청 실패: ${path}`, {
      status: response.status,
      message,
    });
    throw new ApiError(response.status, message);
  }

  if (response.status === 204) {
    return null as T;
  }

  const text = await response.text();
  if (!text) {
    return null as T;
  }
  return JSON.parse(text) as T;
}
