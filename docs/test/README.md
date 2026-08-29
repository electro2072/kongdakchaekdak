# docs/test/ — 테스트/QA 산출물

이 폴더는 **테스터 에이전트**(`reading-record-tester-agent` 스킬)의 유일한 쓰기 영역입니다.
백엔드/프론트엔드 소스와 테스트 코드는 각 담당 개발 에이전트가 소유하며, 테스터는 그것들을
**읽고 실행**만 하고 결과를 여기에 문서로 남깁니다.

## 구조

| 경로 | 내용 |
|---|---|
| `scenarios/backend-api.md` | 백엔드 REST API 블랙박스 테스트 시나리오 (도메인별 케이스) |
| `scenarios/social-login.md` | 카카오/구글/네이버 소셜 로그인 시나리오 (백엔드 API 블랙박스) |
| `scenarios/social-login-onboarding-e2e.md` | 소셜 로그인 온보딩 실기기(에뮬레이터) 시나리오 — 사람이 직접 실행 |
| `scenarios/frontend.md` | 프론트엔드 화면·네비게이션·상태 시나리오 |
| `scenarios/design-conformance.md` | 프론트 구현 ↔ `design/` 토큰·화면 대조 |
| `requests/테스트코드작성요청_vN.md` | 개발 에이전트에게 보내는 테스트 코드 형식 요청서 |
| `reports/YYYY-MM-DD.md` | 테스트 세션 실행 리포트 (세션마다 1개) |
| `report-template.md` | 리포트 작성 틀 |

## 원칙

- **버그는 고치지 않는다. 리포트만 한다.** 원인이 명백해도 수정은 담당 개발 에이전트 몫.
- **테스트 코드도 작성하지 않는다.** 필요한 자동화 테스트는 리포트에 제안으로만 남긴다.
- 커밋 메시지는 `[test]` 접두사. push 전 사용자 승인.
- 세션 시작 시 `git fetch` 후 최신 커밋 확인 (매일 새벽 자동 개발 세션이 별도로 돎).

## 현재 아키텍처 메모 (시나리오 설계 전제, 2026-08-27 기준)

- **인증**: 이메일/PW 로그인 없음. 카카오/구글/네이버 소셜 로그인만 있고 실제 제공자 토큰이
  필요함. 인증이 걸린 API의 블랙박스 검증은 `local` 프로필 JWT 시크릿으로 **테스트 토큰을 직접
  발급**해서 수행한다 (`scenarios/backend-api.md`의 "0. 준비" 참고).
- **프론트 ↔ 백엔드**: 아직 연동되지 않음. 프론트는 `src/mocks/` 데이터로 화면을 그리고,
  실제 네트워크 호출은 알라딘/카카오 **도서 검색 API**만 있다. 따라서 현재 "풀 E2E"는 불가능하고,
  백엔드 API 검증과 프론트 화면 검증은 분리해서 진행한다.
- **백엔드 실행**: gradle wrapper 없음 → 시스템 `gradle`(8.x) 사용.
  `gradle bootRun --args="--spring.profiles.active=local"` → H2 인메모리, Docker 불필요.
