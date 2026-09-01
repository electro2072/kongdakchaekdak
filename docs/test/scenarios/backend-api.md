# 백엔드 API 블랙박스 시나리오

대상: `backend/` Spring Boot 앱, `local` 프로필(H2 인메모리)로 기동.
필드명·상태코드는 실행 시점의 DTO / Swagger(`/swagger-ui.html`)로 최종 확인한다.
이 문서는 "무엇을 확인해야 하는가"의 체크리스트다.

---

## 0. 준비

1. 서버 기동 (`backend/`에서):
   ```
   gradle bootRun --args="--spring.profiles.active=local"
   ```
   `GET http://localhost:8080/health` → `{"status":"ok",...}` 확인.
   ~~2026-08-27 `.env` 없이 기동 시 S3Presigner NPE~~ → BUG-20260827-03 **조각1(`6b710b1`)로 해소** —
   `.env` AWS 키 없이도 `gradle bootRun --args="--spring.profiles.active=local"` 정상 기동. 더미 env 불필요.
   `gradle bootRun`은 백그라운드 실행 — `&`/`timeout` 래핑 말고 실행 도구의 백그라운드 모드를 쓸 것.

2. **테스트용 JWT 발급.**
   - ⚠️ **시크릿**: 로컬 `gradle bootRun`은 `backend/.env`의 `JWT_SECRET`을 읽어 쓴다
     (`application.yml`의 기본값 `please-change-...` 아님). Railway는 Railway 환경변수 `JWT_SECRET`.
   - HS256, payload: `{ "sub": "<userId>", "iat": <epoch>, "exp": <epoch+3600> }`.
   - `sub`는 실제로 존재하는 User의 id여야 인증 이후 로직이 통과된다. **소셜 로그인 외에 User를
     만드는 API가 없으므로** DB에 직접 seed한다:
     - 대시보드용 완비 시드: `docs/test/fixtures/dashboard-seed.sql` (유저 9001 + 완독 22권).
     - 최소 수동: h2-console(`/h2-console`, url `jdbc:h2:mem:kongdakchaekdak;MODE=MySQL`, user `sa`, pw 없음)에서
       `users(id,nickname,social_provider,social_id,created_at,updated_at)` /
       `books(user_id,title,author,genre,total_pages,status,start_date,end_date,created_at,updated_at)`
       INSERT. `genre`=한글 라벨, `status`=소문자 `reading`/`done`.
   - 토큰 헬퍼: [../tools/mint-jwt.mjs](../tools/mint-jwt.mjs) —
     `node docs/test/tools/mint-jwt.mjs <userId> "$(grep '^JWT_SECRET=' backend/.env | cut -d= -f2-)"`.
   - curl로 한글 본문 보낼 때 인라인 `-d` 말고 UTF-8 파일 + `--data-binary @file`
     (Windows 셸 인라인 문자열이 CP949로 깨져 `MALFORMED_REQUEST` 오탐).

3. 공통 에러 응답 포맷 확인: 실패 응답은 `{ "error": "<CODE>", "message": "<...>" }` 형태여야 한다
   (`GlobalExceptionHandler`). 401도 같은 포맷(`JwtAuthenticationEntryPoint`).

---

## 1. 인증 / 접근 제어 (`/api/auth`, SecurityConfig)

> 소셜 로그인(카카오/구글/네이버) 자체의 상세 시나리오 — 에러 경로 + 유효 토큰 해피패스 +
> find-or-create + 토큰 발급 절차 — 는 **[social-login.md](social-login.md)** 참고.
> 아래는 접근 제어(공개/비공개 경로, JWT 검증) 위주.

| # | 시나리오 | 기대 |
|---|---|---|
| BE-AUTH-01 | 토큰 없이 `GET /api/auth/me` | 401, 공통 에러 포맷 |
| BE-AUTH-02 | 서명이 틀린 토큰으로 `GET /api/auth/me` | 401 |
| BE-AUTH-03 | 만료된 토큰(exp 과거)으로 `GET /api/auth/me` | 401 |
| BE-AUTH-04 | 유효 토큰으로 `GET /api/auth/me` | 200 + 본인 UserResponse |
| BE-AUTH-05 | 존재하지 않는 userId를 sub로 넣은 유효 토큰으로 `/api/auth/me` | 404 또는 401 (실제 동작 확인 대상) |
| BE-AUTH-06 | `POST /api/auth/kakao` 빈 body / accessToken 누락 | 400 |
| BE-AUTH-07 | `POST /api/auth/kakao` 가짜 accessToken | **401 `INVALID_CREDENTIALS`** (kapi.kakao.com 실제 왕복 후 실패 변환, 500 아님) — 2026-08-28 확인 |
| BE-AUTH-08 | 공개 경로(`/health`, `/swagger-ui.html`, `/v3/api-docs`, `/public/**`) 토큰 없이 접근 | 200 |
| BE-AUTH-09 | `GET /api/books` 토큰 없이 | 401 (공개 아님) |

> 카카오 정상 흐름은 유효 access token으로 2026-08-28 검증 완료([social-login.md](social-login.md),
> [reports/2026-08-28d.md](../reports/2026-08-28d.md)). 구글/네이버는 `.env` 키 미설정이라 에러 경로만.

## 2. User (`/api/users`)

| # | 시나리오 | 기대 |
|---|---|---|
| BE-USR-00 | `POST /api/users` 토큰 없이 | 401 (이 엔드포인트는 잠겨 있음, 실제 가입은 소셜 로그인) |
| BE-USR-01 | 유효 토큰으로 `GET /api/users/{본인id}` | 200 + UserResponse (nickname/gender/interests/bio/profileImage) |
| BE-USR-02 | `GET /api/users/{타인id}` | 200 (조회는 열려 있음 — 공유 앱 특성) |
| BE-USR-03 | `GET /api/users/{없는id}` | 404 |
| BE-USR-04 | `PATCH /api/users/{본인id}` nickname 변경 | 200, 변경 반영 |
| BE-USR-05 | `PATCH /api/users/{본인id}` nickname 31자 | 400 |
| BE-USR-06 | `PATCH /api/users/{본인id}` bio 101자 | 400 |
| BE-USR-07 | `PATCH /api/users/{본인id}` `interests: ["소설","과학"]` | 200, Set<Genre>로 저장 (한글 라벨 그대로) |
| BE-USR-08 | `PATCH /api/users/{본인id}` `interests: []` | 200, 관심분야 전체 해제 |
| BE-USR-09 | `PATCH /api/users/{본인id}` `interests: ["없는장르"]` | 400 (Genre 역직렬화 실패) |
| BE-USR-10 | `PATCH /api/users/{타인id}` | 403 FORBIDDEN |
| BE-USR-11 | `DELETE /api/users/{타인id}` | 403 |
| BE-USR-12 | `DELETE /api/users/{본인id}` | 200/204 |

## 3. Book (`/api/books`)

BookCreateRequest: `userId*`, `title*`, `author*`, `coverImage?`, `isbn?`, `genre?`(Genre 라벨), `totalPages?`, `startDate?`

| # | 시나리오 | 기대 |
|---|---|---|
| BE-BK-01 | `POST /api/books` (userId=본인, title/author 有) | 201/200 + BookResponse, status=READING |
| BE-BK-02 | `POST /api/books` title 누락 | 400 |
| BE-BK-03 | `POST /api/books` `genre: "소설"` | 성공, 응답 genre="소설" |
| BE-BK-04 | `POST /api/books` `genre: "판타지"`(6종 외) | 400 |
| BE-BK-05 | `POST /api/books` userId=타인 | 403 (남의 이름으로 등록 방지) |
| BE-BK-06 | `GET /api/books?userId={본인}` | 200 + 배열 |
| BE-BK-07 | `GET /api/books?userId={본인}&status=reading` (소문자) | 200, 대소문자 무관 필터 |
| BE-BK-08 | `GET /api/books?userId={본인}&status=done` | 200 |
| BE-BK-09 | `GET /api/books/{id}` | 200 |
| BE-BK-10 | `GET /api/books/{없는id}` | 404 |
| BE-BK-11 | `PUT /api/books/{본인책id}` 전체 수정 | 200 |
| BE-BK-12 | `PUT /api/books/{타인책id}` | 403 |
| BE-BK-13 | `PATCH /api/books/{본인책id}/complete` | 200, status=DONE, endDate 설정됨 |
| BE-BK-14 | `PATCH /api/books/{타인책id}/complete` | 403 |
| BE-BK-15 | `DELETE /api/books/{본인책id}` | 200/204 |
| BE-BK-16 | `DELETE /api/books/{타인책id}` | 403 |

## 4. BookNote (`/api/books/{bookId}/notes`)

BookNoteCreateRequest: `content*`

| # | 시나리오 | 기대 |
|---|---|---|
| BE-NOTE-01 | `POST .../notes` 본인 책, content 有 | 성공 |
| BE-NOTE-02 | `POST .../notes` content 빈 문자열 | 400 |
| BE-NOTE-03 | 한 책에 노트 2개 등록 | 둘 다 성공 (여러 개 허용) |
| BE-NOTE-04 | `GET .../notes` | 200 + 배열 |
| BE-NOTE-05 | `POST .../notes` 타인 책 | 403 |
| BE-NOTE-06 | `PATCH .../notes/{noteId}` 본인 | 200 |
| BE-NOTE-07 | `PATCH .../notes/{noteId}` 타인 책의 노트 | 403 |
| BE-NOTE-08 | `DELETE .../notes/{noteId}` 본인 | 200/204 |
| BE-NOTE-09 | `.../notes` bookId가 없는 책 | 404 |

## 5. BookPhoto (`/api/books/{bookId}/photos`)

2단계 업로드: presigned-url 발급 → (클라이언트가 S3 PUT) → 메타 등록

| # | 시나리오 | 기대 |
|---|---|---|
| BE-PH-01 | `POST .../photos/presigned-url` `{fileName, contentType:"image/jpeg"}` | 200 + `{uploadUrl, imageUrl}` (uploadUrl에 서명 쿼리 포함, key 형태 `book-photos/{bookId}/{uuid}.jpg`) |
| BE-PH-02 | presigned-url `contentType:"application/pdf"` | 400 (image/* 만 허용) |
| BE-PH-03 | presigned-url 타인 책 | 403 |
| BE-PH-04 | `POST .../photos` `{imageUrl, locationText?, latitude?, longitude?}` | 성공, DB 레코드 생성 |
| BE-PH-05 | `GET .../photos` | 200 + 배열 |
| BE-PH-06 | `GET .../photos` 없는 책 | 404 |
| BE-PH-07 | `POST .../photos` 타인 책 | 403 |
| BE-PH-08 | `DELETE .../photos/{photoId}` 타인 책 | 403 |
| BE-PH-09 | 토큰 없이 `POST .../photos/presigned-url` | 401 |

> `local` 프로필엔 실제 S3 자격증명이 없다. presigned URL "발급"은 로컬 서명 계산이라
> 자격증명 형식만 맞으면 되지만, 값이 비어 있으면 발급 시점에 실패할 수 있음 → 실제 응답 확인.
> 실제 S3 PUT 왕복은 `.env`에 진짜 키가 있어야 가능(별도 세션).

## 6. Group (`/api/groups`)

GroupCreateRequest: `name*` (max 50)

| # | 시나리오 | 기대 |
|---|---|---|
| BE-GRP-01 | `POST /api/groups` `{name}` | 성공, 생성자가 owner + 첫 멤버 자동 등록 |
| BE-GRP-02 | `POST /api/groups` name 51자 | 400 |
| BE-GRP-03 | `GET /api/groups` | 200 + 내가 속한 그룹 목록 |
| BE-GRP-04 | `GET /api/groups/{id}` | 200 |
| BE-GRP-05 | `PATCH /api/groups/{id}` name 변경 — owner | 200 |
| BE-GRP-06 | `PATCH /api/groups/{id}` — 비owner 멤버 | 403 |
| BE-GRP-07 | `GET /api/groups/{id}/members` | 200 + 멤버 배열 |
| BE-GRP-08 | `POST /api/groups/{id}/members` `{userId}` — owner | 성공 |
| BE-GRP-09 | `POST /api/groups/{id}/members` 이미 멤버인 userId | 409 |
| BE-GRP-10 | `POST /api/groups/{id}/members` — 비owner | 403 |
| BE-GRP-11 | `DELETE /api/groups/{id}/members/{본인}` (일반 멤버 탈퇴) | 성공 |
| BE-GRP-12 | `DELETE /api/groups/{id}/members/{owner본인}` (owner 자가 탈퇴) | 400/403 (owner는 탈퇴 불가, 그룹 삭제로 유도) |
| BE-GRP-13 | `DELETE /api/groups/{id}/members/{타인}` — owner가 제거 | 성공 |
| BE-GRP-14 | `DELETE /api/groups/{id}/members/{타인}` — 비owner | 403 |
| BE-GRP-15 | `DELETE /api/groups/{id}` — owner | 성공 |

## 7. ShareRecord (`/api/share-records`)

ShareRecordCreateRequest: `shareType*`(book/dashboard), `bookId?`, `scope*`(all/group/custom),
`platform*`(app/instagram/threads/tiktok), `cardImageUrl?`, `targets?[]`, `bookNoteId?`,
`photoIds?[]`, `dashboardPeriod?`, `dashboardDate?`

| # | 시나리오 | 기대 |
|---|---|---|
| BE-SH-01 | shareType=book, scope=all, bookId=본인책 | 성공, public_token(UUID) 발급됨 |
| BE-SH-02 | shareType=book, bookId 누락 | 400 INVALID_REQUEST |
| BE-SH-03 | shareType=book, bookId=타인책 | 403 |
| BE-SH-04 | scope=group, targets 비어있음 | 400 |
| BE-SH-05 | scope=group, targets에 targetType=user 포함 | 400 (group scope는 전부 group) |
| BE-SH-06 | scope=group, 내가 속하지 않은 group을 target으로 | 400/403 |
| BE-SH-07 | scope=custom, targets에 user+group 혼합 | 성공 |
| BE-SH-08 | shareType=book + bookNoteId (그 책 소속 노트) | 성공, 응답 note 요약 포함 |
| BE-SH-09 | shareType=book + bookNoteId (다른 책 노트) | 400 |
| BE-SH-10 | shareType=book + photoIds (그 책 사진 3장) | 성공, 순서대로 photos 반영 |
| BE-SH-11 | shareType=book + photoIds 11장 | 400 (최대 10장) |
| BE-SH-12 | shareType=book + dashboardPeriod 지정 | 400 (book엔 dashboard 필드 불가) |
| BE-SH-13 | shareType=dashboard + bookNoteId/photoIds 지정 | 400 |
| BE-SH-14 | shareType=dashboard, scope=all | 성공, dashboardSnapshot(JSON) 저장됨 (완독수/페이지수/최다장르/캡션/기간라벨) |
| BE-SH-15 | `GET /api/share-records` | 200, **본인이 만든 것만** |
| BE-SH-16 | `DELETE /api/share-records/{본인것}` | 성공 |
| BE-SH-17 | `DELETE /api/share-records/{타인것}` | 403/404 |
| BE-SH-18 | 토큰 없이 `POST /api/share-records` | 401 |

## 8. 공개 웹뷰 (`/public/share/{token}`)

| # | 시나리오 | 기대 |
|---|---|---|
| BE-PUB-01 | 유효 token, shareType=book — **토큰 없이(비로그인)** GET | 200 HTML, 표지/제목/저자/선택 소감/사진/기간(+일수) 노출 |
| BE-PUB-02 | scope=group인 공유의 token으로 비로그인 접근 | 200 (token만 알면 scope 무관 접근 — 의도된 정책) |
| BE-PUB-03 | shareType=dashboard token | 200, 스냅샷 값(완독수/페이지수/최다장르/캡션) 노출 |
| BE-PUB-04 | 존재하지 않는 token | 404, `share/not-found` 페이지 |
| BE-PUB-05 | 닉네임 없는 사용자의 공유 | "익명의 독서가" 폴백 표시 |
| BE-PUB-06 | OG 메타태그 | `og:title`/`og:description`/`og:url` 존재, `og:image`는 표지/사진 있으면 포함·없으면 생략 |

## 9. Dashboard (`/api/dashboard`)

| # | 시나리오 | 기대 |
|---|---|---|
| BE-DASH-01 | 완독 책 여러 권 있는 상태 `GET /api/dashboard` (기본 month) | 200 + `{completedBookCount, totalPagesRead, genreRatio[], monthlyTrend[], highlights, recommendedCaption}` |
| BE-DASH-02 | `?period=quarter` / `?period=year` | 200, 헤드라인 집계 범위가 분기/연으로 바뀜 |
| BE-DASH-03 | `?date=2026-06` | 200, 해당 월 기준 집계 |
| BE-DASH-04 | monthlyTrend | period와 무관하게 항상 6개 항목(마지막 달 기준 직전 6개월) |
| BE-DASH-05 | genre 없는 완독 책 포함 | "기타"로 집계됨 |
| BE-DASH-06 | 완독 0권 | recommendedCaption이 격려 문구 |
| BE-DASH-07 | 완독 일수 계산 | 시작~종료 양 끝 포함 (06.20~06.28 = 9일) |
| BE-DASH-08 | 토큰 없이 | 401 |
| BE-DASH-09 | 다른 회원 대시보드 조회 방법 | 없음 (본인 것만) — API 부재 확인 |

---

## 회귀 스모크 (빠른 확인용 최소 세트)

BE-AUTH-01, BE-AUTH-04, BE-BK-01, BE-BK-03, BE-BK-04, BE-BK-13, BE-USR-07, BE-USR-10,
BE-SH-01, BE-SH-14, BE-PUB-01, BE-PUB-04, BE-DASH-01
