# APK 빌드 · 배포 절차 (Android)

- 작성: reading-record-tester-agent (2026-09-08 세션 d)
- 대상: `frontend/` React Native 0.74.0 · Gradle 8.6 · Node ≥18 · **JDK 17**
- 배포처: GitHub Releases (`electro2072/kongdakchaekdak`)
- 백엔드: `https://kongdakchaekdak-production.up.railway.app`

> 이 문서는 **사용자 로컬(Windows)에서 실행**하는 절차입니다.
> 테스터 에이전트가 붙는 컨테이너 환경에는 Android SDK가 없고
> `dl.google.com` / `maven.google.com` / `services.gradle.org`가 모두 차단(403)이라 빌드가 불가능합니다.

---

## 0. 최초 1회 — 환경 확인

```bash
node --version     # v18 이상
java -version      # 17 이어야 함 (RN 0.74 요구)
adb --version      # Android SDK Platform-Tools
echo %ANDROID_HOME%    # Windows — SDK 경로가 잡혀 있어야 함
```

**JDK가 17이 아니면 여기서 멈춥니다.** RN 0.74 + Gradle 8.6 조합은 JDK 21에서 깨집니다.

```powershell
# Windows에서 일시적으로 17로 전환
set JAVA_HOME=C:\Program Files\Java\jdk-17
```

Gradle은 따로 설치 안 해도 됩니다 — 리포에 wrapper(`gradlew`)가 들어 있어 8.6을 자동으로 받습니다.

---

## 1. 소스 최신화

```bash
cd D:\projects\reading-record-app
git checkout main
git pull
git rev-parse --short HEAD     # ← 이 값을 릴리스 노트에 적을 것
```

> **매일 새벽 6시(KST) 자동 예약 세션이 TODO를 구현·푸시합니다.** 빌드 직전에 반드시 `pull` 하세요.

---

## 2. `.env` 확인

`frontend/.env` (gitignore 대상 — 커밋되지 않음):

```env
API_BASE_URL=https://kongdakchaekdak-production.up.railway.app
```

체크 포인트:

- **끝에 슬래시(`/`) 금지.** `apiClient.ts:42`가 `${API_BASE_URL}${path}`로 단순 연결이라
  슬래시가 있으면 `//api/auth/me`가 나갑니다.
- 소셜 로그인 키(`KAKAO_NATIVE_APP_KEY`, `GOOGLE_WEB_CLIENT_ID`, `NAVER_*`)와
  도서 검색 키(`ALADIN_API_KEY`, `KAKAO_API_KEY`)가 채워져 있어야 합니다.
- ⚠️ **`react-native-config`는 빌드 타임에 값을 굽습니다.** `.env`를 고쳤으면 반드시 다시 빌드해야 반영됩니다.
  JS만 다시 번들해서는 안 바뀝니다.

---

## 3. 의존성 설치

```bash
cd frontend
npm ci
```

`npm install`이 아니라 `npm ci`를 쓰세요. `package-lock.json` 그대로 재현되고, 배포본이 락파일과 어긋나지 않습니다.

---

## 4. 빌드 전 자체 점검 (권장)

```bash
npm run typecheck     # 에러 0
npm test              # 전 스위트 통과
```

CI(`.github/workflows/frontend-test.yml`)가 push마다 이 둘을 돌립니다. 여기서 깨진 걸 배포하면 안 됩니다.
`npm run lint`는 CRLF/prettier 노이즈가 469건 남아 있어(OBS-01) 판정 기준으로 쓰지 마세요.

---

## 5. APK 빌드

### 5-A. 표준 빌드 (4개 ABI 포함 — 아무 기기나 설치 가능)

```bash
cd android
./gradlew assembleRelease
```
Windows PowerShell이면 `.\gradlew.bat assembleRelease`

- 산출물: `android/app/build/outputs/apk/release/app-release.apk`
- 실측: **약 4분, 58.9MB** (armeabi-v7a, arm64-v8a, x86, x86_64 전부 포함)
- 최초 1회는 `compileSdkVersion 33` 자동 다운로드로 더 걸립니다 (`react-native-encrypted-storage` 요구)

### 5-B. 슬림 빌드 (실기기 배포용 — 권장)

요즘 안드로이드 폰은 전부 arm64입니다. x86 계열은 에뮬레이터용이라 실기기 배포엔 필요 없습니다.

```bash
./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a
```

- **약 23MB** — 절반 이하로 줄어듭니다
- `android/gradle.properties:29`에 이 사용법이 주석으로 적혀 있습니다

> 🚨 **APK를 손으로 재패키징해서 슬림화하지 마세요.**
> 2026-09-08 리포트: 완성된 APK에서 네이티브 라이브러리를 빼고 재압축했더니 `resources.arsc`가
> DEFLATED로 들어가 **Android 11+에서 "앱이 설치되지 않았습니다"** 가 났습니다(삼성 태블릿 실측).
> 위 `-PreactNativeArchitectures` 옵션을 쓰면 Gradle이 처음부터 arm64만 넣어 빌드하므로
> 재서명·zipalign·압축방식 보존을 신경 쓸 필요가 아예 없습니다.

### 클린 빌드가 필요할 때

`.env`를 고쳤는데 반영이 안 되거나, 네이티브 모듈을 추가/변경했을 때:

```bash
./gradlew clean
cd .. && rm -rf node_modules && npm ci
cd android && ./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a
```

---

## 6. 설치 확인 (배포 전 필수)

```bash
adb install -r app/build/outputs/apk/release/app-release.apk
adb shell am start -n com.kongdakchaekdak/.MainActivity
```

배포 전에 최소한 이것만은 확인하세요:

1. 앱이 뜨고 로그인 화면이 보인다
2. `adb logcat -d | grep -iE "FATAL|Exception"` → 0건
3. 소셜 로그인 1개가 실제로 성공한다 (← Railway 연결까지 한 번에 확인됨)

3번이 실패하면 `.env`의 `API_BASE_URL`이 안 구워졌거나 Railway가 내려간 것입니다.
**로그인 안 되는 APK를 배포하면 안 됩니다.**

---

## 7. GitHub Releases 배포

```bash
gh release create apk-2026-09-09 \
  app/build/outputs/apk/release/app-release.apk \
  --title "apk-2026-09-09" \
  --notes "S0 라우터 등록(52e7501) + S1 세션 영속화(ae86667) + S2 프로필 실연동(b3fd618)
빌드 커밋: f47daf6
백엔드: Railway (https://kongdakchaekdak-production.up.railway.app)
ABI: arm64-v8a"
```

`gh` 최초 1회 로그인:
```bash
gh auth login          # GitHub.com → HTTPS → 브라우저 인증
```

### 태그 규칙

- 태그 하나 = 빌드 하나 = 커밋 하나. **날짜가 같아도 재빌드하면 새 태그**(`apk-2026-09-09b` 등)를 파세요.
- ⚠️ **기존 태그에 `--clobber`로 덮어쓰지 마세요.**
  `apk-2026-09-08`은 `9faed6c`를 가리키는데 다른 커밋으로 빌드한 APK를 덮으면
  태그와 실제 빌드 내용이 어긋나서 "이 APK가 어느 커밋이냐"를 추적할 수 없게 됩니다.
- 릴리스 노트에 **빌드 커밋 해시와 ABI**를 반드시 남기세요. 버그 리포트가 들어왔을 때
  어느 소스로 만든 APK인지 특정할 수 있는 유일한 근거입니다.

### 파일명이 매번 `app-release.apk`인 문제

업로드 전에 이름을 바꿔두면 다운로드받은 사람이 구분할 수 있습니다:

```bash
cp app/build/outputs/apk/release/app-release.apk kongdakchaekdak-f47daf6-arm64.apk
gh release create apk-2026-09-09 kongdakchaekdak-f47daf6-arm64.apk --title "..." --notes "..."
```

---

## 8. 배포 후

1. 릴리스 페이지에서 APK를 **직접 다운로드해서 설치**해보세요 (업로드 손상 확인)
2. 테스터에게 알릴 때 **커밋 해시와 포함된 슬라이스**를 같이 전달하세요
   — 어느 APK인지 모르면 검증 결과를 A표에 반영할 수 없습니다

---

## 부록 — 알려진 이슈

### 서명 키스토어 (출시 전 반드시 교체)

`android/app/build.gradle:98-101`
```gradle
release {
    // Caution! In production, you need to generate your own keystore file.
    signingConfig signingConfigs.debug      // ← debug 키스토어로 서명 중
}
```

내부 테스트 배포는 지금 이대로 됩니다. 다만 **Play 스토어 출시 전에는 반드시 릴리스 키스토어를 만들어야** 하고,
한 번 스토어에 올린 뒤에는 키를 바꿀 수 없으므로 **키스토어 파일과 비밀번호를 반드시 백업**해두세요.
(`.gitignore` 대상 — 커밋하면 안 됩니다)

### iOS

Mac이 없어 이 프로젝트는 iOS 빌드·검증이 계속 미실시 상태입니다.
필요해지면 `cd ios && pod install` 후 Xcode 빌드가 필요하며, `react-native-encrypted-storage`가
네이티브 모듈이라 `pod install`을 건너뛰면 링크되지 않습니다.

### 빌드가 실패할 때 자주 나오는 것

| 증상 | 원인 |
|---|---|
| `Unsupported class file major version` | JDK가 17이 아님 |
| `SDK location not found` | `ANDROID_HOME` 미설정 또는 `android/local.properties` 없음 |
| `.env` 값이 반영 안 됨 | 재빌드 안 함 — `./gradlew clean` 후 재빌드 |
| 설치 시 "앱이 설치되지 않았습니다" | APK 수동 재패키징(§5-B 경고) 또는 서명 불일치 → 기존 앱 삭제 후 재설치 |
| `INSTALL_FAILED_UPDATE_INCOMPATIBLE` | 이전 설치본과 서명이 다름 → `adb uninstall com.kongdakchaekdak` 후 재설치 |

## 버전 관리

`frontend/android/app/build.gradle` 83~84행.

- **Play 스토어에 업로드할 때마다 `versionCode`를 +1 한다.** 같은 숫자로는 업로드가 거부되고,
  한 번 쓴 숫자는 영구히 재사용할 수 없다.
- `versionName`은 사용자 표시용. 스토어 판단에는 관여하지 않는다.
- **내부 테스트용 `adb install`에는 올리지 않아도 된다.** 같은 versionCode여도 덮어써진다.
- 심사 리젝 후 재업로드도 새 versionCode가 필요하다. 리젝 한 번에 하나씩 소모된다고 보면 된다.