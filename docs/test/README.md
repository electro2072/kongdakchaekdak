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
| `reports/YYYY-MM-DD[b|c…].md` | 테스트 세션 실행 리포트 (세션마다 1개, 같은 날 2회차는 `b`·`c` 접미사). 스크린샷은 같은 이름의 하위 폴더에 |
| `report-template.md` | 리포트 작성 틀 |

## 원칙

- **버그는 고치지 않는다. 리포트만 한다.** 원인이 명백해도 수정은 담당 개발 에이전트 몫.
- **테스트 코드도 작성하지 않는다.** 필요한 자동화 테스트는 리포트에 제안으로만 남긴다.
- **`git add`/`commit`/`push` 를 실행하지 않는다 (사용자가 지시해도).** 변경 파일 목록 +
  `[test]` 접두사 커밋 메시지 제안까지만 남기고, 커밋은 사용자가 직접 한다.
- 세션 시작 시 `git fetch` 후 최신 커밋 확인 (매일 새벽 자동 개발 세션이 별도로 돎).

## 현재 아키텍처 메모 (시나리오 설계 전제, 2026-09-11 갱신)

- **인증**: 이메일/PW 로그인 없음. 카카오/구글/네이버 소셜 로그인만 있고 실제 제공자 토큰이
  필요함. 인증이 걸린 API의 블랙박스 검증은 **`local` 프로필 JWT 시크릿으로 테스트 토큰을 직접
  발급**해서 로컬 H2 서버에 호출한다 (`scenarios/backend-api.md`의 "0. 준비",
  `tools/mint-jwt.mjs` 참고). Railway 배포 서버는 `JWT_SECRET`을 테스터가 갖고 있지 않아
  토큰을 만들 수 없다 — Railway 대상 인증 API는 실기기(소셜 로그인, 사용자 동반)로만 검증한다.
- **프론트 ↔ 백엔드**: **연동돼 있다.** 소셜 로그인 · 서재(`GET`/`POST /api/books`) · 책 상세 ·
  대시보드(`GET /api/dashboard`) · 프로필 통계 등이 실서버(Railway)를 호출한다. `src/mocks/` 는
  아직 일부 화면(그룹·모임 상세 등)에만 남아 있다. **공식 연동 트래커는
  [`docs/연동매트릭스_v1.md`](../연동매트릭스_v1.md)** 이며, 그 문서의 ✅ 는 "실기기/에뮬레이터
  PASS" 를 뜻한다 — 실기기 검증이 이 프로젝트의 연동률 판정 기준이다. 별도로 알라딘/카카오
  **도서 검색 API** 직접 호출도 있다(책 등록 화면).
- **백엔드 실행**: gradle wrapper 있음 (`backend/gradlew`, Gradle 8.14.3, 커밋 `849a3e4`).
  `cd backend && ./gradlew bootRun --args="--spring.profiles.active=local"` → H2 인메모리,
  Docker 불필요. (이전 판의 "wrapper 없음 → 시스템 gradle" 은 사실이 아니다.)
- **에뮬레이터/실기기 절차**: 테스터 스킬 문서(`reading-record-tester-agent`)의 "C. 블랙박스 —
  실기기/에뮬레이터" 절 참고. 검증 전 전제조건 3종(APK 최신 · TZ=KST · 대상 DB) 확인 필수.
