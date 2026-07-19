# 프론트엔드 (React Native + TypeScript)

## 현재 상태
Frame 03(독서 기록 작성)의 "책 검색/선택" 컴포넌트가 구현되어 있습니다.
자세한 아키텍처 설명은 `../docs/독서기록앱_개발현황.md` 참고.

## 로컬 실행 전 필요한 작업 (이 저장소는 로직 레이어만 포함되어 있음)
이 폴더는 `src/` 아래의 화면/컴포넌트/서비스 코드만 담고 있고, React Native의
네이티브 스캐폴드(ios/, android/ 폴더 등)는 아직 없습니다. 실제 기기/시뮬레이터에서
실행하려면 로컬 환경(Android Studio 또는 Xcode가 설치된 컴퓨터)에서:

```bash
npx react-native init ReadingRecordApp --template react-native-template-typescript
# 생성된 프로젝트의 App.tsx 등에서 이 저장소의 src/ 폴더를 참고/이식
```

또는 Expo를 쓰기로 결정했다면 `npx create-expo-app`으로 시작해도 됩니다 (아직 미확정).

## 환경변수
`.env.example`을 참고해서 `.env`를 만들고 알라딘/카카오 API 키를 채워주세요.
