import * as fs from 'fs';
import * as path from 'path';
import {describe, expect, it} from '@jest/globals';
import {API_ERROR_MESSAGE_KEY} from '../src/services/apiClient';

/**
 * G21 에러코드 매핑 누락 방지 계약 테스트.
 *
 * backend `common/exception/ErrorCode.java`가 실제 소스 오브 트루스다 — "백엔드는 코드만,
 * 문구는 프론트가 매핑한다"가 설계 원칙(G21, ErrorCode.java Javadoc가 단일 출처)이라,
 * 백엔드가 코드를 추가/삭제해도 프론트 `apiClient.ts`의 `API_ERROR_MESSAGE_KEY` 매핑표가
 * 조용히 뒤쳐질 수 있다 — 실제로 `INVALID_DATE_RANGE`(OBS-26, 2026-09-10)가 이 방식으로
 * 한동안 누락될 뻔했다. 이 테스트가 그 드리프트를 CI에서 강제로 잡아낸다.
 *
 * 모노레포 구조(backend/, frontend/가 저장소 루트 아래 나란히 있음)라 상대경로로 백엔드
 * 소스를 직접 읽을 수 있다 — 별도 계약 문서나 코드 생성 없이 소스 자체를 진실로 삼는다.
 *
 * `INTERNAL_SERVER_ERROR`는 매핑표에 없는 게 정상이다 — `apiClient.ts`의 `apiFetch`가
 * traceId 삽입을 위해 이 코드만 별도 분기 처리하기 때문에, 검사 대상에서 명시적으로 제외한다.
 */

const ERROR_CODE_JAVA_PATH = path.join(
  __dirname,
  '..',
  '..',
  'backend',
  'src',
  'main',
  'java',
  'com',
  'kongdakchaekdak',
  'common',
  'exception',
  'ErrorCode.java',
);

/** apiClient.ts에서 별도 분기 처리돼 매핑표에 없어도 되는 코드. */
const EXCLUDED_FROM_MAPPING = new Set(['INTERNAL_SERVER_ERROR']);

/**
 * ErrorCode.java를 읽는다. 경로가 바뀌었거나 파일이 사라졌는데 이 실패를 삼켜버리면
 * 아래 검사들이 "비교 대상 0개라서 그냥 통과"하는 식으로 조용히 무의미해진다 — 그래서
 * try/catch로 감싸지 않고 그대로 던져서 테스트를 확실히 실패시킨다. 다만 어디를 봐야
 * 하는지 바로 알 수 있도록 메시지에 시도한 경로를 남긴다.
 */
function readErrorCodeJava(): string {
  try {
    return fs.readFileSync(ERROR_CODE_JAVA_PATH, 'utf-8');
  } catch (error) {
    throw new Error(
      `backend ErrorCode.java를 읽지 못했습니다: ${ERROR_CODE_JAVA_PATH}\n` +
        '모노레포 디렉터리 구조가 바뀌었을 수 있습니다 — 이 테스트 파일의 ' +
        'ERROR_CODE_JAVA_PATH를 갱신해주세요.\n' +
        `원본 에러: ${(error as Error).message}`,
    );
  }
}

/**
 * enum 상수 선언부(`public enum ErrorCode { ... } private final HttpStatus status;` 이전까지)
 * 안에서 `NAME(HttpStatus.XXX)` 형태의 상수만 추출한다. 이 파일의 생성자(`ErrorCode(HttpStatus
 * status)`)는 `HttpStatus` 뒤에 점(.)이 아니라 공백+변수명이 오므로 이 패턴에 걸리지 않는다.
 */
function extractErrorCodeNames(source: string): string[] {
  const enumStart = source.indexOf('public enum ErrorCode {');
  const enumEnd = source.indexOf('private final HttpStatus status;');
  if (enumStart === -1 || enumEnd === -1 || enumEnd <= enumStart) {
    throw new Error(
      'ErrorCode.java에서 enum 상수 선언부 경계를 찾지 못했습니다 — 파일 구조가 바뀐 것으로 ' +
        '보입니다. 이 테스트 파일의 extractErrorCodeNames() 파싱 로직을 갱신해주세요.',
    );
  }
  const body = source.slice(enumStart, enumEnd);
  const matches = body.matchAll(/\b([A-Z][A-Z0-9_]*)\(HttpStatus\./g);
  return Array.from(matches, m => m[1]);
}

describe('G21 에러코드 매핑 계약 — ErrorCode.java(backend) ↔ API_ERROR_MESSAGE_KEY(apiClient.ts)', () => {
  it('ErrorCode.java에서 enum 상수를 실제로 파싱해낸다 (0개면 아래 누락 검사가 무의미해지므로 별도 확인)', () => {
    const codes = extractErrorCodeNames(readErrorCodeJava());
    expect(codes.length).toBeGreaterThan(0);
  });

  it('backend의 모든 ErrorCode가 API_ERROR_MESSAGE_KEY에 매핑돼 있다 (INTERNAL_SERVER_ERROR 제외)', () => {
    const backendCodes = extractErrorCodeNames(readErrorCodeJava());
    const mappedCodes = new Set(Object.keys(API_ERROR_MESSAGE_KEY));

    const missing = backendCodes.filter(
      code => !EXCLUDED_FROM_MAPPING.has(code) && !mappedCodes.has(code),
    );

    expect(missing).toEqual([]);
  });
});
