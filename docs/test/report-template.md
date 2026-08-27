# 테스트 리포트 — YYYY-MM-DD

- 작성: reading-record-tester-agent
- 대상 커밋: `<origin/main HEAD 해시>` (`git log -1 --oneline`)
- 검증 범위: <예: 전체 회귀 / 공유 도메인만 / 프론트 화면만>

## 1. 화이트박스 — 테스트 스위트

| 스위트 | 명령 | 결과 | 비고 |
|---|---|---|---|
| 백엔드 | `gradle test` | ✅/❌ (통과 N / 실패 M) | |
| 프론트 typecheck | `npm run typecheck` | ✅/❌ | |
| 프론트 test | `npm test` | ✅/❌ (N suites / M tests) | |
| 프론트 lint | `npm run lint` | ✅/⚠️/❌ | 기존 노이즈 vs 신규 |

실패 상세: <파일:라인, 원인 분류(컴파일/어서션/컨텍스트 로딩)>

## 2. 블랙박스 — 백엔드 API

| # | 시나리오 | 기대 | 실제 | 판정 |
|---|---|---|---|---|
| BE-01 | ... | 200 + {...} | | ✅/❌ |

## 3. 블랙박스 — 프론트엔드

| # | 시나리오 | 기대 | 실제 | 판정 |
|---|---|---|---|---|
| FE-01 | ... | | | ✅/❌/🔵수동필요 |

## 4. 버그

### BUG-YYYYMMDD-01  <한 줄 제목>
- 심각도: blocker | major | minor
- 영역: backend | frontend
- 상태: open
- 재현 절차:
  1. ...
- 기대 결과: ...
- 실제 결과: ...
- 의심 지점: `<파일:라인>` 또는 `<커밋>` (근거와 함께, 단정 금지)
- 넘길 대상: reading-record-backend-agent | reading-record-frontend-agent

## 5. 이전 리포트 대비 상태 변화

| 버그 | 이전 | 이번 |
|---|---|---|
| BUG-... | open | closed / still open |

## 6. 다음 세션에서 이어서 볼 것

- ...

## 7. 커밋/푸시한 파일

- `docs/test/...`
