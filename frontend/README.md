# 프론트엔드 (React Native 0.74 + TypeScript)

## 현재 상태
Frame 03(독서 기록 작성)의 "책 검색/선택" 화면(`src/screens/BookSearchScreen.tsx`)이 `App.tsx`에 연결되어 있어서, 앱을 실행하면 바로 이 화면이 뜬다.
아키텍처 설명은 `../docs/독서기록앱_개발현황.md` 참고.

## 로컬 실행 준비물
- Node.js 18+
- Android: Android Studio (SDK, 에뮬레이터 포함)
- iOS(맥에서만): Xcode

## 처음 받았을 때 (한 번만)
```bash
cd frontend
npm install

# iOS를 맥에서 빌드할 경우에만 추가로:
cd ios && bundle install && bundle exec pod install && cd ..
```

## API 키 설정 (알라딘/카카오)

`react-native-config`로 `.env`를 읽어온다. `frontend/.env.example`을 복사해서 `frontend/.env`를 만들고 발급받은 키를 채워넣으면 된다:

```
ALADIN_API_KEY=발급받은_알라딘_TTB키
KAKAO_API_KEY=발급받은_카카오_REST_API키
```

- 알라딘 TTB 키: https://blog.aladin.co.kr/openapi/ (Open API 신청 → TTBKey 발급)
- 카카오 REST API 키: https://developers.kakao.com → 애플리케이션 추가 → 앱 키의 "REST API 키" (도서 검색은 기본 제공되는 API라 별도 상품 활성화 없이 이 키만으로 바로 호출 가능)

`.env`는 절대 git에 커밋하지 않는다 (`.gitignore`에 이미 포함됨). **`.env`를 새로 만들거나 값을 바꾸면 앱을 다시 빌드해야 반영된다** (Metro만 재시작해서는 안 됨 — `npm run android`로 다시 빌드).

키가 없어도 화면 자체는 뜨지만, 검색 버튼을 누르면 "API 키가 설정되지 않았습니다" 에러가 난다.

## 실행
Android Studio에서 에뮬레이터(AVD)를 하나 만들어 켜둔 다음, 터미널 두 개로:

```bash
# 터미널 1: 메트로 번들러
npm start

# 터미널 2: 안드로이드 앱 빌드 + 설치 + 실행
npm run android
```

첫 빌드는 Gradle이 안드로이드 의존성을 받느라 시간이 좀 걸릴 수 있다.

## 타입 체크 / 테스트
```bash
npm run typecheck
npm test
```



## TODO

# 프론트엔드 설계 문서 — Frame 08.2 책 등록 확인 + Frame 05.2 프로필 편집 화면 연결

> 작성: 프론트엔드 에이전트 · 2026-08-31 · 상태: **설계만, 코드는 아직 기기에 반영 안 됨**(사용자 요청으로 코드보다 설계 문서를 먼저 작성)
> 범위: `frontend/src` — 아래 3개 작업을 순서대로 진행 예정

## 0. 작업 순서 요약

| 순서 | 작업 | 상태 |
|---|---|---|
| 1 | 책 검색→등록 플로우 연결 확인 | ✅ 조사 결과 이미 연결돼 있음(1장) — 추가 코드 불필요 |
| 2 | Frame 08.2 책 등록 확인 화면 신규 제작 | 설계 완료(2장), 코드 착수 전 |
| 3 | Frame 05.2 프로필 편집 화면 연결 | 개요만(3장), 상세 설계는 2번 완료 후 |

## 1. [조사 완료] 책 검색→등록 플로우는 이미 연결돼 있음

TODO 리스트(`독서기록앱_TODO리스트_v2.md`, 2026-07-21 작성)와 프론트엔드 아키텍처 문서(9장)에 "BookSearchScreen이 내비게이터에 연결되지 않은 고아 상태"라고 남아있었지만, 실제 기기 코드를 확인한 결과 이미 연결이 끝나 있었다(작성일 이후 어느 시점에 반영된 것으로 보이고, 두 문서 모두 stale — 4장 참고).

- `navigation/types.ts`: `MainStackParamList`에 `BookSearch: undefined` 이미 존재
- `navigation/MainStack.tsx`: `<Stack.Screen name="BookSearch" component={BookSearchScreen} options={{title:'책 검색', presentation:'modal'}} />` 이미 등록됨
- `ScheduleScreen.tsx`(일정 탭 "새 책 등록하기") / `LibraryScreen.tsx`(서재 빈 상태 CTA "책 등록하기") 둘 다 `onPress={() => navigation.navigate('BookSearch')}` 이미 연결됨

**진짜 남은 문제** — `BookSearchScreen.tsx`의 `handleSelectBook`(27~39행): 검색 결과를 탭하면 `onSelectBook` prop이 없을 때(현재 실제 경로) `Alert.alert("책을 선택했어요", ...)` 후 `navigation.goBack()`으로 끝난다. 실제로 서재에 저장하는 코드는 어디에도 없다(`bookService.ts`에 `search()`만 있고 `createBook`류 함수 없음, `POST /api/books` 미구현 — 코드 전체 grep으로 확인). 이 Alert 경로를 Frame 08.2로 대체하는 것이 2번 작업이다.

## 2. Frame 08.2 책 등록 확인 화면 — 설계

### 2-1. 근거

- `독서기록앱_프론트요청_디자인_관심분야장르포인트컬러매핑_v1.md`: "장르(단일선택, Frame 08.2)는 관심분야와 정확히 같은 6개 카테고리를 공유" — 이미 확정됨. 테스터 리포트 FINDING-20260828-08로 별도 관리 중.
- 관심분야·장르 색 매핑은 6개 장르 고정색 전환 작업(2026-08-31, 오늘)으로 `constants/genreColors.ts`에 이미 구현 완료 — `GENRE_CHIP_COLORS`를 그대로 재사용.
- 와이어프레임(v2-5) Frame 03.1(서재 상세)의 "읽은 기간(start_date~end_date 자동계산)" 규칙 — 등록 시점의 시작일도 같은 방식(자동, 오늘 날짜)으로 처리.

### 2-2. 화면 흐름

```
BookSearchScreen(검색 결과 탭)
  → navigation.navigate('BookRegisterConfirm', {book})   // book: 검색 API가 반환한 Book(제목/저자/출판사/표지/providerId)
  → BookRegisterConfirmScreen
      - 장르 단일선택(필수) 후 "서재에 등록하기"
      - 확정 시: LibraryContext.addBook(...) 로 서재에 추가
      - navigation.popToTop() 후 navigation.navigate('BookDetail', {bookId: book.id})
        → 뒤로가기 시 검색화면이 아니라 Tabs(서재 탭)로 돌아가도록
```

### 2-3. 화면 구성 (UI)

- 헤더: 표지(있으면 `Image`, 없으면 기존 화면들과 동일한 `p50` 배경 + `BookOpen` 아이콘 placeholder) + 제목/저자/출판사
- 장르 선택: `constants/profileOptions.ts`의 `INTEREST_OPTIONS` 6개를 단일선택 칩으로(회원가입 화면 관심분야 칩과 UI는 비슷하지만 다중선택이 아니라 단일선택), 선택된 칩은 `GENRE_CHIP_COLORS[genre]`로 색칠 + 체크 아이콘
- 하단: "취소"(뒤로가기) / "서재에 등록하기"(장르 미선택 시 비활성화) 버튼 2개

### 2-4. 데이터 모델 — `LibraryContext` 신설 필요

지금 `LibraryScreen.tsx`와 `BookDetailScreen.tsx`가 각각 `mocks/libraryBooks.ts`의 `MOCK_LIBRARY_BOOKS` 배열을 직접 import해서 쓰고 있다(둘 다 정적 상수) — 새로 등록한 책이 반영될 상태 저장소가 없다. `AuthContext`/`ProfileContext`와 동일한 패턴으로 `LibraryContext`를 신설:

```ts
interface LibraryContextValue {
  books: LibraryBook[];
  addBook: (book: LibraryBook) => void;
}
```

- 초기값: `MOCK_LIBRARY_BOOKS`
- `addBook`: `setBooks(prev => [book, ...prev])`
- `App.tsx`에 `ProfileProvider` 옆에 나란히 마운트
- `LibraryScreen.tsx` / `BookDetailScreen.tsx`는 `MOCK_LIBRARY_BOOKS` 직접 import 대신 `useLibrary()`로 교체
- `MainStack.tsx`의 `BookDetail` 헤더 타이틀도 지금은 `MOCK_LIBRARY_BOOKS.find(...)`로 정적 조회 중이라 새로 등록한 책 제목이 안 나옴 — `headerTitle`을 별도 컴포넌트로 분리해 `useLibrary()` 쓰도록 교체 필요
- 앱 재시작하면 초기화(영속화 없음) — 다른 mock state들과 동일한 한계, `POST /api/books` 연동 전까지는 감수

### 2-5. 새로 등록되는 `LibraryBook` 필드 채우는 규칙

| 필드 | 값 |
|---|---|
| `id` | 검색 결과 `Book.id`(ISBN) 그대로 |
| `title`/`author` | 검색 결과 그대로 |
| `status` | 항상 `'reading'`(완독 처리는 책 상세 화면에서 별도) |
| `dateRangeLabel` | `${오늘 날짜 YYYY.MM.DD} ~ 진행중` (Date 객체로 즉시 계산) |
| `photos` | `[]` (사진은 책 상세 화면에서 추가하는 별도 플로우) |
| `genre` | 이 화면에서 선택한 값 |

`noteText`는 선택 필드라 비워둠.

### 2-6. 라우트/내비게이션 등록

```ts
// navigation/types.ts, MainStackParamList에 추가
BookRegisterConfirm: {book: Book};
```
```tsx
// navigation/MainStack.tsx에 추가
<Stack.Screen
  name="BookRegisterConfirm"
  component={BookRegisterConfirmScreen}
  options={{title: '책 등록 확인', presentation: 'modal'}}
/>
```

### 2-7. 파일 변경 목록 (예정)

- 신규: `src/navigation/LibraryContext.tsx`
- 신규: `src/screens/BookRegisterConfirmScreen.tsx`
- 수정: `App.tsx`(LibraryProvider 마운트)
- 수정: `src/navigation/types.ts`(BookRegisterConfirm 라우트)
- 수정: `src/navigation/MainStack.tsx`(라우트 등록 + BookDetail 헤더 타이틀 분리)
- 수정: `src/screens/LibraryScreen.tsx`, `src/screens/BookDetailScreen.tsx`(MOCK_LIBRARY_BOOKS 직접 참조 → useLibrary())
- 수정: `src/screens/BookSearchScreen.tsx`(Alert 경로 → `navigation.navigate('BookRegisterConfirm', {book})`)

### 2-8. 이번 범위에서 제외

- 실제 `POST /api/books` 연동 — mock 우선, TODO 주석으로 표시
- 책 표지 실제 이미지 표시는 검색 결과에 `coverImageUrl`이 있는 경우만(알라딘/카카오 API가 안 주면 placeholder)
- 등록 확인 화면에서 사진/소감 동시 입력 — 와이어프레임상 이 화면 책임이 아니라 책 상세 화면(Frame 03.1)에서 별도로 추가하는 플로우이므로 제외

## 3. Frame 05.2 프로필 편집 화면 연결 — 개요 (상세 설계는 2번 완료 후)

- `ProfileEditScreen.tsx` 자체는 이미 구현·오늘 버그수정까지 끝난 상태 — **화면은 있는데 못 들어감**
- `navigation/types.ts`에 `ProfileEdit: undefined`도 이미 있고 `MainStack.tsx`에도 이미 등록돼 있음(확인 완료, `독서기록앱_프론트_프로필대시보드_설계_v1.md` 5-1절 각주 "프로필 편집 버튼 onPress 미연결"과 일치)
- 남은 건 `ProfileScreen.tsx`의 "프로필 편집" 버튼에 `onPress={() => navigation.navigate('ProfileEdit')}` 한 줄 연결 — Frame 08.2 작업 완료 후 `ProfileScreen.tsx` 정확한 현재 코드 확인하고 바로 진행 예정

## 4. 참고 — stale 정보 발견, 별도 정리 필요

- `claude/독서기록앱_TODO리스트_v2.md` 4장: "BookSearchScreen... 고아 상태"는 더 이상 사실이 아님
- `claude/독서기록앱_프론트엔드_아키텍처문서_v1.md` 9장: 같은 내용 stale

이 두 문서는 Frame 08.2 구현 완료 시점에 한 번에 정리 예정(개별 요청 없이도 진행).
