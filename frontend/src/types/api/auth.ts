/**
 * 인증 — `src/services/authApi.ts`가 호출하는 `POST /api/auth/{provider}`의 요청/응답 타입.
 *
 * 2026-09-09: "인터페이스 한 폴더에 모아놓기" 리팩터링으로 authApi.ts에 있던 타입 정의를
 * 이 파일로 옮겼다. authApi.ts는 이제 이 파일에서 타입을 import해서 쓰기만 한다 —
 * 타입 정의는 여기 한 곳(src/types/api/)에만 있다.
 *
 * 2026-09-09 업데이트: `apple` 추가 — `claude/독서기록앱_프론트백엔드요청_Apple로그인추가_비회원모드폐기_v1.md`
 * 반영. iOS 전용(Android는 노출 안 함), 요청 바디는 구글과 동일하게 `{ idToken }`.
 */

export type SocialProvider = 'kakao' | 'google' | 'naver' | 'apple';

/**
 * claude/독서기록앱_백엔드요청_프론트_인증API변경_v1.md 2번 항목(백엔드 확정 스펙) 기준.
 * accessToken/tokenType은 실제 코드로 확정됐고, 세 번째 필드(만료시간)는 존재는 확인됐으나
 * 정확한 필드명이 미확정이라 expiresIn으로 추정만 해둔 상태 — 값이 와도 파싱 실패하지 않도록
 * optional로 둔다.
 *
 * isNewUser는 claude/독서기록앱_프론트요청_백엔드_인증API_신규회원판별_v1.md 요청에 대한 백엔드
 * 확정 답변 기준(2026-08-29) — 방금 소셜 로그인으로 신규 계정이 생성됐으면 true, 이미 있던 계정으로
 * 로그인한 거면 false. LoginScreen이 이 값으로 회원가입 화면 이동 여부를 분기한다.
 */
export interface TokenResponse {
  accessToken: string;
  tokenType: string;
  isNewUser: boolean;
  expiresIn?: number;
}
