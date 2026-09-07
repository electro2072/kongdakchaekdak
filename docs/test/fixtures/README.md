# docs/test/fixtures/ — 테스트 데이터 시드

테스터가 만든 **재사용 가능한 테스트 데이터**. 개발/QA용이며 운영 DB에는 넣지 말 것.

| 파일 | 용도 |
|---|---|
| `dashboard-seed.sql` | 독서 대시보드(Recap) 월간/분기/연간 화면을 실데이터로 확인. 전용 유저 `id=9001` + 완독 22권 + 진행중 3권 |

---

## dashboard-seed.sql

### 무엇을 만드나
- 유저 `id=9001` (`nickname='리캡테스터'`, `social_provider='seed'`) — 실제 소셜 계정과 안 겹침
- **완독 25권**: 6개 장르 전부(소설 최다), 완독 기간 2~41일, 페이지 132~690, `end_date`가 최근 12개월에 분포
  - 그중 **엣지 케이스 3권** (백엔드 요청, `requests/대시보드_테스트데이터_확인_v1.md` §3):
    - 완독 기간 **동률 2권**(41일, 이달 완독) → '최장 완독' 하이라이트 tie-break 확인
    - **`total_pages` NULL 1권**(이달 완독) → `totalPagesRead` 합산 null-safe 확인
- **진행중 3권**
- 날짜가 전부 `CURRENT_DATE` 상대값이라 **언제 실행해도 "최근 12개월"** 데이터가 된다.
  맨 위 `DELETE` 3줄이 먼저 지우므로 **재실행 가능(idempotent)**.

### 실행

**로컬 (H2)**
```
cd backend && gradle bootRun --args="--spring.profiles.active=local"
```
→ http://localhost:8080/h2-console
(JDBC URL `jdbc:h2:mem:kongdakchaekdak;MODE=MySQL`, user `sa`, 비번 없음)
→ `dashboard-seed.sql` 내용을 붙여넣고 실행.

**Railway (MySQL)** — `railway` CLI로 DB 접속 후 파일 실행. 예:
```
railway connect   # 또는 railway run mysql < docs/test/fixtures/dashboard-seed.sql
```
> `INTERVAL '3' MONTH`(숫자에 따옴표) 구문은 H2 MySQL 모드 + MySQL 8 둘 다 호환.
> `INTERVAL 3 MONTH`(따옴표 없이)는 H2에서 syntax error가 나므로 쓰지 말 것.

### 조회

유저 9001 의 JWT가 필요하다. **JWT 시크릿 주의**:
- **로컬** `gradle bootRun` 은 `backend/.env` 의 `JWT_SECRET` 을 읽어 쓴다 (`application.yml` 기본값 아님).
  ```
  node docs/test/tools/mint-jwt.mjs 9001 "$(grep '^JWT_SECRET=' backend/.env | cut -d= -f2-)"
  ```
- **Railway** 는 Railway 환경변수 `JWT_SECRET`.
  ```
  node docs/test/tools/mint-jwt.mjs 9001 "<Railway JWT_SECRET>"
  ```

```
GET /api/dashboard                 # 이번 달
GET /api/dashboard?period=quarter  # 이번 분기
GET /api/dashboard?period=year     # 올해
GET /api/dashboard?period=month&date=2026-07   # 특정 달 고정
```

### 검증됨 (로컬 H2 bootRun + 실제 `GET /api/dashboard` 호출, 2026-09-08 실행)

| period | `completedBookCount` | `totalPagesRead` | 도넛(`genreRatios`) | `monthlyTrend` | 하이라이트 |
|---|---|---|---|---|---|
| month (2026-09) | 6 | 1552 | 소설3 / 에세이2 / 자기계발1 | …·2026-09:6 | 최장 41일 / 최단 2일 |
| quarter (3분기) | 10 | 2912 | 소설6 / 에세이2 / 인문1 / 자기계발1 | …·2026-09:6 | 최장 41일 / 최단 2일 |
| year (2026) | 23 | 6528 | **6개 장르 전부** (소설 47.8% … 과학 4.3%) | 07~12: 2·2·6·0·0·0 | 최장 41일 / 최단 2일 |

- **tie-break 실측** — 최장 완독 동률 2권(41일) 중 `longestReadBook` = `bookId 23`(먼저 INSERT된 A, id 작은 쪽). ✅
- **null 합산 실측** — `total_pages` NULL 책이 `totalPagesRead` 합산에서 0으로 처리됨(month 1552 = 기존932 +300 +320 +0). ✅

> 정확한 수치는 **실행한 날짜에 따라 달라진다** — 시드가 상대날짜라 매 실행마다 재계산됨.
> 제목-장르가 항상 실제와 맞지는 않음 (분포/집계 테스트용 더미 데이터).

### 프론트에서 보려면
프론트 앱은 아직 대시보드를 `useDashboard` mock으로만 그린다(백엔드 미연동). 이 시드는 **백엔드
`/api/dashboard` 응답**을 확인하는 용도. 프론트 화면으로 보려면 `useDashboard` 훅이 실제
`GET /api/dashboard`(유저 9001 토큰)를 호출하도록 임시로 바꿔야 한다.
