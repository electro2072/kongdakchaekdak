/**
 * 프론트엔드 공용 로거. 백엔드 로깅 인프라(ACCESS/SECURITY/AUDIT/ERROR/APPLICATION)만큼
 * 세분화하지 않고, 심각도(level) + 태그(화면/서비스명) 기준으로 단순하게 구성한다.
 * (claude/독서기록앱_프론트_토스트알림_프론트로거_설계_v1.md 3장 참고)
 *
 * 지금은 console.*로만 출력한다 — 나중에 원격 로그 수집(Sentry 등, TODO 리스트 6장)을 붙이게
 * 되면 이 파일 내부의 write()만 교체하면 되도록, 호출부가 쓰는 시그니처
 * (logger.info(tag, message, data))는 그대로 유지한다.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

declare const __DEV__: boolean | undefined;

function formatTime(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function write(level: LogLevel, tag: string, message: string, data?: unknown): void {
  // release 빌드(__DEV__ === false)에서는 debug 로그는 생략한다.
  if (level === 'debug' && typeof __DEV__ !== 'undefined' && __DEV__ === false) {
    return;
  }

  const prefix = `[${formatTime(new Date())}][${level.toUpperCase()}][${tag}]`;
  // eslint-disable-next-line no-console
  const consoleFn =
    level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;

  if (data !== undefined) {
    consoleFn(`${prefix} ${message}`, data);
  } else {
    consoleFn(`${prefix} ${message}`);
  }
}

/**
 * 사용 예:
 *   logger.info('authApi', '소셜 로그인 요청', {provider});
 *   logger.error('authApi', '소셜 로그인 실패', {provider, error});
 */
export const logger = {
  debug: (tag: string, message: string, data?: unknown) => write('debug', tag, message, data),
  info: (tag: string, message: string, data?: unknown) => write('info', tag, message, data),
  warn: (tag: string, message: string, data?: unknown) => write('warn', tag, message, data),
  error: (tag: string, message: string, data?: unknown) => write('error', tag, message, data),
};
