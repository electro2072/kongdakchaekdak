/**
 * 공통 에러 응답(wire-format) 타입 — backend `common/exception/ErrorResponse`(record) 그대로.
 *
 * G21(2026-09-10 에러코드 체계 개편, `a32d5e3`·`bc66694`) 반영. 개편 후 계약:
 *  - `message`는 원칙적으로 `null`이다. 사용자에게 보일 문구는 프론트가 `error`(아래) 코드를
 *    키로 자체 매핑한다 — `services/apiClient.ts`의 매핑 테이블 참고.
 *  - 예외는 `INTERNAL_SERVER_ERROR` 하나뿐이며, 이때만 `message`에 traceId 문자열이 실린다.
 *  - null 필드는 서버에서 직렬화 자체가 생략되므로(`@JsonInclude(NON_NULL)`), 일반적인 에러
 *    응답은 `{status, error, fieldErrors}` 3개 필드만 온다.
 */
export interface ApiFieldError {
  field: string;
  reason: string;
}

export interface ApiErrorResponse {
  status: number;
  /** backend `ErrorCode.name()` 그대로(예: `"NOT_OWNER"`). 알려지지 않은 값이 올 수도 있어 문자열로만 다룬다. */
  error: string;
  /** 원칙적으로 null. `INTERNAL_SERVER_ERROR`일 때만 traceId 문자열이 담긴다. */
  message: string | null;
  /** `VALIDATION_FAILED`일 때만 채워진다. 그 외 코드에서는 항상 빈 배열. */
  fieldErrors: ApiFieldError[];
}
