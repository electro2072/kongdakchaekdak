# 프론트엔드 시나리오

대상: `frontend/` React Native 0.74 앱.
현재 상태: 백엔드 미연동. 화면은 `src/mocks/` 데이터로 그리고, 실제 네트워크는
**알라딘/카카오 도서 검색 API**만 있다(키 없으면 빈 결과가 정상). 따라서 프론트 검증은
"화면 렌더 · 네비게이션 · 상태 전이 · 검색 로직"이 대상이다.

## 실행 방법

| 목적 | 명령 (`frontend/`에서) | 판정 |
|---|---|---|
| 타입 | `npm run typecheck` | 에러 0 |
| 단위/렌더 테스트 | `npm test` | 전체 통과 |
| 린트 | `npm run lint` | 신규 에러 없음 (CRLF/prettier 노이즈는 별도 이슈) |
| Metro 번들 | `npx react-native start` 후 다른 창에서 번들 요청, 또는 `npx react-native bundle --platform android --entry-file index.js --dev false --bundle-output /tmp/b.js` | 번들 성공(에러 0) |
| 에뮬레이터 실행 | `npm run android` | 🔵 사용자 로컬 환경 필요 — 수동 |

---

## 1. 네비게이션 그래프 (`src/navigation/`)

| # | 시나리오 | 기대 |
|---|---|---|
| FE-NAV-01 | 로그아웃 상태로 앱 시작 | `AuthStack`(Login) 표시 |
| FE-NAV-02 | 로그인 상태로 앱 시작 | `MainStack` → 하단 탭 4개(일정/서재/공유/프로필) |
| FE-NAV-03 | Login → "회원가입" | Signup 화면 push |
| FE-NAV-04 | 로그인 성공 (AuthContext.isLoggedIn=true) | AuthStack이 MainStack으로 교체됨 |
| FE-NAV-05 | 일정 탭 "새 책 등록하기" / 서재 빈 상태 CTA | `BookSearch` 모달 push (탭바 없음) |
| FE-NAV-06 | 서재 탭 책 카드 탭 | `BookDetail`(bookId) push, 탭바 없음 |
| FE-NAV-07 | BookDetail "이 책 공유하기" | `Share` 탭으로 bookId 들고 이동 |
| FE-NAV-08 | 프로필 탭 "리캡 보기" 카드 | `Dashboard` 전체화면 push |
| FE-NAV-09 | 프로필 탭 "프로필 편집" | `ProfileEdit` 전체화면 push |
| FE-NAV-10 | 각 전체화면에서 뒤로가기 | 직전 화면으로 복귀, 상태 유지 |
| FE-NAV-11 | 다크/라이트 테마 전환 | NavigationContainer theme 색상 반영 |

## 2. 화면별 렌더 & 상호작용

각 화면 공통: **크래시 없이 렌더** + 핵심 요소 존재 + 주 상호작용이 올바른 콜백/네비게이션 유발.

### FE-LOGIN — LoginScreen (Frame 01)
- 카카오/구글/네이버 로그인 버튼 3개 표시
- 각 버튼 탭 시 해당 소셜 로그인 플로우 트리거(현재는 목/스텁일 수 있음 — 실제 동작 확인)
- "회원가입" 링크 → Signup

### FE-SIGNUP — SignupScreen (Frame 01.1)
- 닉네임 입력(필수), 성별 선택, 관심분야 칩 6개(소설·에세이·자기계발·인문·과학·경제·경영) 다중선택, 독서모임 검색(선택)
- 닉네임 미입력 시 제출 불가 또는 안내
- 관심분야 칩 토글 동작(선택/해제, 다중)
- 제출 시 기대 동작 확인

### FE-SEARCH — BookSearchScreen (Frame 03)
- SearchBar + 검색 버튼
- 빈 상태 문구 표시
- 검색어 입력 후 검색 → 로딩 스켈레톤 → 결과 목록 또는 빈 결과
- (키 없음) 결과 0건이어도 에러 아님
- 네트워크 에러 시 `NetworkError` 컴포넌트 노출
- 결과 항목: 표지·제목·저자·출판사
- 항목 선택 시 기대 동작(등록 플로우로 진행)

### FE-DETAIL — BookDetailScreen (Frame 03.1)
- mock 책 1권의 표지/제목/저자/상태/별점/소감/사진 영역 렌더
- "이 책 공유하기" → Share

### FE-LIBRARY — LibraryScreen (서재 탭)
- mock 책 목록(읽는 중/완독 구분) 렌더
- 빈 상태 시 CTA
- 완독 기간 "9일" 형태 표기 확인

### FE-DASH — DashboardScreen (Frame 05.1)
- `useDashboard` 훅 + mock 데이터
- PeriodToggle(월간/분기/연간) 전환 시 수치·차트 갱신
- GenreDonutChart: 장르별 비율, 포인트 멀티컬러(그린+코랄·시안·라벤더)
- MonthlyTrendChart: 항상 6개월치 막대
- HighlightCard: 최다 장르 / 최장·최단 완독
- 완독 0건 mock일 때 격려 문구

### FE-PROFILE — ProfileScreen / ProfileEditScreen (Frame 05 / 05.2)
- Profile: 닉네임/한줄소개/관심분야/통계 카드(ProfileStatCard)
- ProfileEdit: 기존 값 프리필, 관심분야 다중선택 통째 교체, 저장/취소
- 닉네임 30자 초과 입력 방지 또는 안내
- 저장 시 ProfileContext 반영

### FE-SCHEDULE — ScheduleScreen (일정 탭 / Frame 02)
- 이번 달 독서 일정, 캘린더 스트립, 오늘의 리딩 카드 렌더
- "새 책 등록하기" → BookSearch

### FE-SHARE — ShareScreen (공유 탭)
- 그룹 목록(mock shareGroups), 공유 범위 설정 UI(iOS 리스트+체크마크 스타일)
- bookId 파라미터 들고 진입 시 해당 책 공유 컨텍스트 표시
- 공유 이력 목록

## 3. 순수 로직 (단위 테스트 대상)

| # | 대상 | 시나리오 |
|---|---|---|
| FE-SVC-01 | `services/aladin/aladinApi.ts` | 알라딘 원본 응답 → 공통 `Book` 매핑 (표지/저자/출판사/isbn 필드 정확성) |
| FE-SVC-02 | `services/kakao/kakaoApi.ts` | 카카오 원본 응답 → `Book` 매핑 |
| FE-SVC-03 | `services/bookService.ts` | providerId 미지정 시 알라딘 기본, 지정 시 해당 provider 호출 |
| FE-SVC-04 | `bookService` | provider fetch 실패 시 에러 전파 |
| FE-SVC-05 | `hooks/useBookSearch.ts` | books/isLoading/error 상태 전이 (검색 시작→성공, 검색 시작→실패) |
| FE-SVC-06 | `hooks/useDashboard.ts` | period 변경 시 파생 데이터 갱신 |
| FE-SVC-07 | `constants/profileOptions.ts` | 관심분야 6종 라벨이 백엔드 `Genre` 라벨과 정확히 일치 (소설/에세이/자기계발/인문/과학/경제·경영) |

> FE-SVC-07은 프론트-백엔드 계약 정합성 회귀 포인트다. 백엔드 `Genre` enum 라벨이 바뀌면 여기서 깨져야 한다.

## 4. 알려진 정적 이슈 (기능 아님, 추적만)

- `npm run lint` 440+ errors: 대부분 CRLF(`␍`) / prettier / 작은따옴표 스타일. Windows 체크아웃 ↔
  prettier LF 기대 불일치. `.gitattributes`(`* text=auto eol=lf`) + 일괄 정리로 해결 가능 —
  담당: reading-record-frontend-agent. 기능 결함 아님.
- `App.tsx`의 `enableScreens()`가 jest(jsdom)에서 `Screen native module hasn't been linked`
  console.error 출력 — 테스트는 통과. `__mocks__/react-native-screens.js` 추가로 침묵시킬 수 있음(제안).

---

## 회귀 스모크 (빠른 확인용)

FE-NAV-01, FE-NAV-02, FE-NAV-05, FE-NAV-06, FE-SEARCH(빈 상태+검색), FE-DASH(period 전환),
FE-PROFILE(편집 저장), FE-SVC-03, FE-SVC-07
