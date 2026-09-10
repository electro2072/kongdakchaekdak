import Config from 'react-native-config';
import {logger} from '../utils/logger';
import {t, StringKey} from '../strings';
import type {ApiFieldError} from '../types/api/error';

/**
 * 인증이 필요한 백엔드 API 전용 공용 클라이언트.
 * (claude/독서기록앱_프론트_전체API연동_설계_v1.md 1장 참고)
 *
 * authApi.ts(소셜 로그인 교환)는 인증 전에 호출하는 공개 엔드포인트라 이 파일을 쓰지 않고 그대로
 * fetch를 직접 쓴다 — 그 외 accessToken이 필요한 모든 서비스(userApi 등)는 이 apiFetch를 쓴다.
 */
const API_BASE_URL = Config.API_BASE_URL ?? 'http://10.0.2.2:8080';

/**
 * 서버 에러 응답의 `error` 코드(backend `common/exception/ErrorCode.java` 15종) → 사용자 문구
 * 매핑표. `INTERNAL_SERVER_ERROR`는 문구가 아니라 traceId 삽입이 필요해 여기 넣지 않고
 * apiFetch에서 별도로 처리한다. 코드가 늘면 이 표와 strings/ko.ts의 `apiError` 블록을 같이
 * 늘릴 것 — G21(2026-09-10 에러코드 체계 개편, `a32d5e3`·`bc66694`).
 */
const API_ERROR_MESSAGE_KEY: Record<string, StringKey> = {
  UNAUTHENTICATED: 'apiError.unauthenticated',
  SOCIAL_AUTH_FAILED: 'apiError.socialAuthFailed',
  NOT_OWNER: 'apiError.notOwner',
  NOT_GROUP_MEMBER: 'apiError.notGroupMember',
  GROUP_LEADER_ONLY: 'apiError.groupLeaderOnly',
  GROUP_LEADER_CANNOT_LEAVE: 'apiError.groupLeaderCannotLeave',
  NOT_FOUND: 'apiError.notFound',
  SHARE_TARGET_NOT_FOUND: 'apiError.shareTargetNotFound',
  ALREADY_GROUP_MEMBER: 'apiError.alreadyGroupMember',
  VALIDATION_FAILED: 'apiError.validationFailed',
  PHOTO_LIMIT_EXCEEDED: 'apiError.photoLimitExceeded',
  INVALID_SHARE_REQUEST: 'apiError.invalidShareRequest',
  MALFORMED_REQUEST: 'apiError.malformedRequest',
  IMAGE_STORAGE_UNAVAILABLE: 'apiError.imageStorageUnavailable',
  INVALID_DATE_RANGE: 'apiError.invalidDateRange'
};

export class ApiError extends Error {
  status: number;
  /** backend `ErrorCode.name()` 그대로(예: `"NOT_OWNER"`). 매핑표에 없는 코드거나 응답이
   * JSON이 아니었던 경우 등 코드 자체를 알 수 없을 때는 null. */
  code: string | null;
  /** `VALIDATION_FAILED`일 때만 채워진다. 그 외에는 항상 빈 배열. */
  fieldErrors: ApiFieldError[];

  constructor(
    status: number,
    message: string,
    code: string | null = null,
    fieldErrors: ApiFieldError[] = [],
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
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

    // G21(2026-09-10 에러코드 체계 개편) — 백엔드는 `message` 없이 `error`(코드)만 보낸다.
    // 사용자에게 보일 문구는 여기서 코드를 기준으로 자체 매핑한다. `INTERNAL_SERVER_ERROR`만
    // 예외적으로 `message`에 traceId가 실려 오므로 그 문구에 끼워 넣는다.
    let code: string | null = null;
    let fieldErrors: ApiFieldError[] = [];
    let message = t('apiError.unknown');
    try {
      const body = await response.json();
      if (body && typeof body.error === 'string') {
        const errorCode: string = body.error;
        code = errorCode;
        if (Array.isArray(body.fieldErrors)) {
          fieldErrors = body.fieldErrors;
        }
        if (errorCode === 'INTERNAL_SERVER_ERROR') {
          const traceId =
            typeof body.message === 'string' ? body.message : '';
          message = t('apiError.internalServerError', {traceId});
        } else {
          message = API_ERROR_MESSAGE_KEY[errorCode]
            ? t(API_ERROR_MESSAGE_KEY[errorCode])
            : t('apiError.unknown');
        }
      }
    } catch {
      // 응답 본문이 JSON이 아니면 기본 메시지(apiError.unknown)를 그대로 쓴다.
    }
    logger.error('apiClient', `요청 실패: ${path}`, {
      status: response.status,
      code,
      message,
    });
    throw new ApiError(response.status, message, code, fieldErrors);
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