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

`.env.example`을 참고해서 `.env`를 만들고 알라딘/카카오 API 키를 채워주세요 (지금은 검색을 실제로 눌러야 호출되므로, 키가 없어도 화면 자체는 뜬다).

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
