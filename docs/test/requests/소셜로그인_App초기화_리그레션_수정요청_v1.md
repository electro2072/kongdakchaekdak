# [수정 요청] 프론트엔드 — 소셜 로그인 SDK 초기화 리그레션 (구글·네이버 로그인 깨짐)

- 보내는 사람: reading-record-tester-agent
- 받는 사람: reading-record-frontend-agent
- 날짜: 2026-09-01
- 심각도: **blocker** (실기기에서 구글·네이버 로그인 완전히 안 됨)
- 근거: 실기기 테스트 — 카카오 OK / 구글 "계정 선택창 없이 즉시 로그인 실패" / 네이버 "SDK 재설치가 필요합니다" 토스트 + 무한 로딩

---

## 1. 원인 (확정)

`frontend/App.tsx` 의 **소셜 로그인 SDK 초기화 코드가 삭제된 채로 워킹트리에 남아 있음.**
(커밋된 `5e25dbb` 의 `App.tsx` 에는 있으나, 그 뒤 `LibraryProvider`/Frame 08.2 작업 중 실수로
같이 제거된 것으로 보임 — `git diff frontend/App.tsx` 로 확인 가능.)

증상이 3사 동작과 정확히 일치:

| 제공자 | 실기기 결과 | 이유 |
|---|---|---|
| 카카오 | ✅ 정상 | JS 초기화 불필요 — 네이티브 앱 키를 `strings.xml`/`Info.plist`에서 자동으로 읽음 |
| 구글 | ❌ 계정 선택창 없이 즉시 "로그인 실패" | `GoogleSignin.configure()` 미호출 → `webClientId` 없이 `signIn()` → `DEVELOPER_ERROR` (code 10) |
| 네이버 | ❌ "SDK 재설치가 필요합니다" + 무한 로딩(콜백 미호출) | `NaverLogin.initialize()` 미호출 → 초기화 안 된 상태로 `login()` 호출 |

> 에뮬레이터 E2E에서 "3사 PASS"였던 건 이 삭제 **이전** 빌드 기준.
> Google/네이버 콘솔 설정, APK 서명(SHA-1), R8(release는 `enableProguardInReleaseBuilds=false`),
> `.env` 값(APK 안에 `GOOGLE_WEB_CLIENT_ID`/`NAVER_CONSUMER_KEY` 존재 확인함) — **전부 정상**.
> 오직 이 초기화 누락 하나가 원인.

---

## 2. 수정할 파일 — `frontend/App.tsx` (1개)

**지금 (워킹트리, 깨진 상태):**
```tsx
import React from 'react';
import {StatusBar} from 'react-native';
import {enableScreens} from 'react-native-screens';
import {AuthProvider} from './src/navigation/AuthContext';
import {ProfileProvider} from './src/navigation/ProfileContext';
import {LibraryProvider} from './src/navigation/LibraryContext';
import {RootNavigator} from './src/navigation/RootNavigator';
import {useTheme} from './src/theme';

enableScreens();

function App(): React.JSX.Element {
```

**수정 후 (초기화 3덩어리 복구 + `LibraryProvider`는 그대로 유지):**
```tsx
import React from 'react';
import {StatusBar} from 'react-native';
import {enableScreens} from 'react-native-screens';
import Config from 'react-native-config';                                    // ← 복구
import {GoogleSignin} from '@react-native-google-signin/google-signin';       // ← 복구
import {AuthProvider} from './src/navigation/AuthContext';
import {ProfileProvider} from './src/navigation/ProfileContext';
import {LibraryProvider} from './src/navigation/LibraryContext';
import {RootNavigator} from './src/navigation/RootNavigator';
import {initializeNaverLogin} from './src/services/socialAuth/naverAuth';     // ← 복구
import {useTheme} from './src/theme';

enableScreens();

// 소셜 로그인 SDK 초기화 — 앱 시작 시 한 번만. 카카오는 네이티브 앱 키를               // ← 복구 (블록 전체)
// strings.xml/Info.plist에서 자동으로 읽어서 별도 JS 초기화가 필요 없음.
GoogleSignin.configure({
  webClientId: Config.GOOGLE_WEB_CLIENT_ID,
  iosClientId: Config.GOOGLE_IOS_CLIENT_ID,
});
initializeNaverLogin();

function App(): React.JSX.Element {
```

> `git show 5e25dbb:frontend/App.tsx` 가 정확한 원본. 거기서 초기화 부분만 가져오고,
> 현재 워킹트리의 `<LibraryProvider>` 래핑은 그대로 두면 됨 (충돌 아님, 서로 다른 라인).

---

## 3. (권장, 별건) 네이버 무한 로딩 방어

원인 수정과 별개로, 네이버는 **실패해도 로딩바가 무한히 도는** 버그가 있음
(`NaverLogin.login()` 이 SDK 문제 시 콜백을 안 부르고 promise가 영영 안 끝남).
`frontend/src/services/socialAuth/naverAuth.ts` 의 `signInWithNaver()` 에 타임아웃 가드 추가 권장:

```ts
const result = await Promise.race([
  NaverLogin.login(),
  new Promise<never>((_, rej) =>
    setTimeout(() => rej(new Error('네이버 로그인 응답이 없습니다 (시간 초과)')), 30000),
  ),
]);
```
그러면 최소한 30초 뒤 "로그인 실패" 얼럿이 떠서 사용자가 로딩바에 갇히지 않음.
(`@react-native-seoul/naver-login` 5.0.1 은 로그인 방식(앱/웹) 강제 옵션이 없어서 근본 대응은
라이브러리 버전업/patch-package 필요 — 그건 별도 논의.)

---

## 4. 검증 방법

1. `frontend/App.tsx` 수정 후 커밋.
2. `cd frontend && npm run typecheck` (에러 0), `npm test` (통과).
3. `cd frontend/android && ./gradlew assembleRelease` — 빌드된 `app-release.apk` 의 JS 번들에
   `GoogleSignin.configure` 호출과 `initializeNaverLogin()` **호출**이 들어갔는지 확인
   (초기화 누락 상태에선 `initializeNaverLogin` 정의만 있고 호출은 없었음).
4. 실기기: 구글 → 계정 선택창 뜨는지 / 네이버 → 웹 또는 앱 로그인으로 넘어가는지.
5. 커밋되면 테스터가 APK 재빌드해서 사용자에게 전달, 실기기 E2E 재수행.

---

## 5. 관련 (이번 실기기 세션에서 나온 다른 이슈 — 이 문서 범위 밖, 별도 추적)
- 서재 검색창 placeholder 한글 깨짐 (`docs/test/reports/2026-09-01.md` BUG-20260901-17)
- 책검색 "검색" 버튼 파란색 (OBS-20260901-18)
- `소셜로그인_설정현황.md` "E2E 발견 이슈" 5건 (신규 유저에 mock 데이터, 16KB 페이지 등)
