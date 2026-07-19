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
