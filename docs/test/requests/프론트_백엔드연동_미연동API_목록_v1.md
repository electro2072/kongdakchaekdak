# [요청] 프론트엔드 — 백엔드 미연동 화면/API 목록 + 우선순위

- 보내는 사람: reading-record-tester-agent
- 받는 사람: reading-record-frontend-agent
- 날짜: 2026-09-08
- 배경: 실기기(삼성 태블릿)에서 카카오/구글/네이버 로그인은 **정상 동작 확인**.
  그러나 로그인 후 **모든 화면이 mock 데이터**라, 어느 계정으로 들어가도 닉네임이
  `책읽는 콩이`, 서재·통계·리캡이 전부 같은 데이터로 보임. 사용자가 이 부분 연동을 요청.

---

## 0. 현재 상태 요약

| 구분 | 상태 |
|---|---|
| 소셜 로그인 (`LoginScreen` → `services/authApi.ts` → `POST /api/auth/{provider}`) | ✅ 실제 연동. 앱 JWT(`TokenResponse.accessToken`) 발급받아 `AuthContext`에 저장 |
| **그 외 전부** (프로필/서재/대시보드/모임/공유/알림) | ❌ `src/mocks/*` + `*Context` 로컬 state. 백엔드 호출 없음 |

`.env` 의 `API_BASE_URL = https://kongdakchaekdak-production.up.railway.app` — 로그인은 이 실서버로 감.

---

## 1. 공통 선행 작업 (이거 먼저)

### 1-1. 인증 헤더 붙는 공용 API 클라이언트
- 지금 `authApi.ts` 만 `fetch` 를 쓰고, 인증이 필요한 API는 전부 mock이라 **`Authorization` 헤더를 붙이는 코드가 아직 없음**.
- 백엔드의 books/dashboard/groups/share-records/auth-me 는 전부 `@AuthenticationPrincipal` → **`Authorization: Bearer {accessToken}` 필수**.
- `AuthContext.accessToken` 을 읽어 헤더를 자동으로 붙이는 공용 `apiFetch(path, init)` 래퍼 하나 만들고 나머지를 여기에 태우는 걸 권장.
- 401 응답 시 로그아웃 처리(재로그인 유도)도 이 래퍼에서.

### 1-2. 세션 영속화 (`AuthContext`)
- `AuthContext` 가 `isLoggedIn` / `accessToken` 을 `useState` 로만 관리 → **앱 재시작 = 로그아웃**.
  (`AuthContext.tsx` 주석에도 "AsyncStorage 등 미도입" 명시)
- `accessToken` 을 `AsyncStorage`(또는 `EncryptedStorage`)에 저장 → 앱 시작 시 복원.
- `TokenResponse.expiresIn` 으로 만료 판단. 리프레시 토큰은 백엔드에 **없음** → 만료 시 재로그인.

---

## 2. Tier 1 — 백엔드 준비됨, 바로 연동 가능

> 백엔드 컨트롤러 확인 완료 (2026-09-08). 아래는 전부 배포된 Railway 서버에 존재.

| 화면 / 교체 지점 | 붙일 API | 확인 사항 |
|---|---|---|
| **프로필** — `navigation/ProfileContext.tsx` 초기값 `MOCK_PROFILE` | `GET /api/auth/me` → `UserResponse` | ⚠️ `mocks/profile.ts` 주석이 "프로필 API 아직 없음"이라 돼 있는데 **이제 있음**. `UserResponse` = `{id, nickname, profileImage, bio, gender, socialProvider, interests, createdAt, updatedAt, lastLoginAt, daysSinceLastLogin}` |
| 프로필 수정 — `ProfileContext.updateProfile` | `PATCH /api/users/{id}` | `id` 는 `/api/auth/me` 응답의 `id`. `interests` DTO 연동 여부는 백엔드에 재확인 필요(과거 "다음 라운드"였음) |
| 프로필 통계 (`ProfileScreen` "12 / 27") | — | `/api/auth/me` 에 `booksReadCount`/`sharedRecordsCount` **없음**. `GET /api/books`(status=done 개수) + `GET /api/share-records`(길이)로 계산하거나 백엔드에 카운트 필드 추가 요청 |
| **서재 목록** — `navigation/LibraryContext.tsx` 초기값 `MOCK_LIBRARY_BOOKS` | `GET /api/books` → `List<BookResponse>` | `@AuthenticationPrincipal` 로 내 책만 옴. 쿼리 파라미터(상태 필터 등)는 `BookController.search` 시그니처 확인 |
| 책 등록 — `LibraryContext.addBook` / `BookRegisterConfirmScreen` | `POST /api/books` → 201 `BookResponse` | `BookCreateRequest` 필드 확인 |
| 책 수정 | `PUT /api/books/{id}` | |
| **책 완독 토글** — `screens/BookDetailScreen.tsx` (지금 로컬 state) | `PATCH /api/books/{id}/complete` | `BookCompleteRequest`(옵션) — 완독일 등 |
| 책 삭제 | `DELETE /api/books/{id}` → 204 | |
| 책 노트/사진 | `GET /api/books/{bookId}/notes`, `GET /api/books/{bookId}/photos` | |
| **대시보드/리캡** — `hooks/useDashboard.ts` 의 `fetchDashboard()` 내부 (지금 `getMockDashboard()`) | `GET /api/dashboard?period={month\|quarter\|year}&date={yyyy-MM}` → `DashboardResponse` | ✅ **테스터가 실측 검증 완료** (`docs/test/requests/대시보드_테스트데이터_전달_v1.md`). 응답 타입 이미 `types/dashboard.ts` 에 있음. **훅 쓰는 화면 코드는 안 바꿔도 됨** (훅 주석에도 명시). `period` enum: MONTH/QUARTER/YEAR (week 없음) |
| **모임 그룹** — `mocks/shareGroups.ts` (`ShareScreen`) | `GET /api/groups` → `List<GroupResponse>` | 단건 `GET /api/groups/{id}`, 생성 `POST /api/groups` 도 있음 |
| **그룹 멤버** — `screens/GroupManagementScreen.tsx` mock | `GET /api/groups/{id}/members` → `List<GroupMemberResponse>` | 추가 `POST /api/groups/{id}/members` |
| **공유 기록** — `mocks/shareHistory.ts` | `GET /api/share-records` → `List<ShareRecordResponse>` (내 것만) | 생성 `POST /api/share-records` |

---

## 3. Tier 2 — 백엔드에 API 없음 → 연동 불가 (백엔드 요청 필요)

| 화면 | 필요한 API | 현황 |
|---|---|---|
| **알림** — `screens/NotificationScreen.tsx` (`mocks/notifications.ts`) | `GET /api/notifications` | **NotificationController 없음.** 단, "한 달 이상 미접속" 배너 한 종류는 `GET /api/auth/me` 의 `daysSinceLastLogin` 으로 지금도 가능 (`null`이면 배너 안 띄우는 게 백엔드와의 계약) |
| **모임 일정 상세** — `screens/ScheduleDetailScreen.tsx` (`mocks/meetingDetail.ts`) | `GET /api/groups/{id}/meetings` (+ 단건) | **엔드포인트 없음** — `GroupController` 에 `/members` 만 있고 `/meetings` 없음 |

→ 이 둘은 백엔드에 별도 요청서가 필요. 프론트는 mock 유지하되 "백엔드 대기" 주석으로.

---

## 4. 권장 순서

1. **1-1 공용 API 클라이언트** + **1-2 세션 영속화** (선행 필수)
2. **프로필** (`GET /api/auth/me`) — 닉네임 `책읽는 콩이` 문제 바로 해결, 범위 작음
3. **서재** (`GET/POST /api/books`, 완독 토글) — 앱의 핵심
4. **대시보드** (`GET /api/dashboard`) — 훅 내부 한 줄, 백엔드 검증 끝
5. 모임/공유 (`/api/groups`, `/api/share-records`)
6. 알림·일정상세 — 백엔드 API 나온 뒤

---

## 5. 참고 — mock 파일 ↔ 화면 매핑 (연동 시 제거 대상)

| mock 파일 | 소비처 |
|---|---|
| `src/mocks/profile.ts` (`MOCK_PROFILE`) | `navigation/ProfileContext.tsx` |
| `src/mocks/libraryBooks.ts` (`MOCK_LIBRARY_BOOKS`) | `navigation/LibraryContext.tsx` |
| `src/mocks/dashboard.ts` (`getMockDashboard`) | `hooks/useDashboard.ts` |
| `src/mocks/shareGroups.ts` | `screens/ShareScreen.tsx` |
| `src/mocks/shareHistory.ts` | `screens/ShareScreen.tsx` |
| `src/mocks/notifications.ts` | `screens/NotificationScreen.tsx` |
| `src/mocks/meetingDetail.ts` | `screens/ScheduleDetailScreen.tsx` |

각 파일·Context에 이미 `TODO: 실제 연동 시 …` 주석으로 교체 지점이 적혀 있음 (단, `profile.ts` 의 "API 없음" 주석은 최신 아님 — `/api/auth/me` 있음).

---

## 6. 테스터 검증 환경 메모
- 실기기: 삼성 태블릿(arm64), APK `apk-2026-09-08` 릴리스.
- 로그인 3종 정상, 로그인 후 화면 렌더 정상(2026-09-01 E2E 13화면) — **데이터만 mock**.
- 연동 후 재테스트 요청 시 테스터가 실기기/에뮬레이터로 재확인.
