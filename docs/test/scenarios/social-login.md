# 소셜 로그인 시나리오 (카카오 / 구글 / 네이버)

대상: `POST /api/auth/kakao`, `/api/auth/google`, `/api/auth/naver`, `GET /api/auth/me`.
패턴: 모바일 앱이 각 제공자 SDK로 이미 로그인해 받은 토큰을 백엔드에 넘기면, 백엔드가 그 토큰으로
제공자 API에 사용자 정보를 조회해 검증하고 find-or-create → 우리 앱 JWT 발급.
- 카카오/네이버: **access token** (`Authorization: Bearer` 로 사용자정보 API 호출)
- 구글: **ID token** (`tokeninfo?id_token=` + `aud` 클레임을 `GOOGLE_CLIENT_ID`와 비교)

첫 실행 결과: [reports/2026-08-28d.md](../reports/2026-08-28d.md) (카카오 해피패스까지 통과).

---

## 0. 준비

### 0-1. 서버 기동 — ⚠️ BUG-03 우회 필요
`gradle bootRun`은 현재 `.env`의 AWS 키가 비어 있으면 `S3Presigner` 빈 생성 NPE로 **기동 자체가
실패**한다(reports/2026-08-28c/d — BUG-20260827-03, 미해결). 소셜 로그인 테스트는 다음처럼 우회:

```
cd backend
gradle bootJar -x test
KAKAO_CLIENT_ID=<.env의 실제 값> \
AWS_ACCESS_KEY_ID=dummy AWS_SECRET_ACCESS_KEY=dummy AWS_S3_BUCKET=dummy AWS_S3_REGION=ap-northeast-2 \
java -jar build/libs/kongdakchaekdak-backend-0.0.1-SNAPSHOT.jar --spring.profiles.active=local
```
- `java -jar` 로 직접 띄우면 `build.gradle.kts`의 `.env` 로더(`bootRun` 전용 `doFirst`)를 안 타므로
  환경변수를 테스터가 직접 통제할 수 있다. `.env`의 실제 `KAKAO_CLIENT_ID`만 넘기고 AWS는 더미.
- BUG-03이 해소되면 그냥 `gradle bootRun --args="--spring.profiles.active=local"` 로 충분.
- `GET /health` → `{"status":"ok"}` 확인.

### 0-2. `.env` 상태 (2026-08-28 기준)
| 키 | 상태 |
|---|---|
| `KAKAO_CLIENT_ID` | ✅ 설정됨 (32자, 앱 "독서 기록 어플 개발" ID 1502106). `KAKAO_CLIENT_SECRET`은 `/v2/user/me`에 불필요라 비움 |
| `GOOGLE_CLIENT_ID` / `SECRET` | ❌ 비어 있음 → 구글 해피패스 테스트 불가 (에러 경로만) |
| `NAVER_CLIENT_ID` / `SECRET` | ❌ 비어 있음 → 네이버 해피패스 테스트 불가 (에러 경로만) |

### 0-3. 실제 카카오 access token 얻는 법 (해피패스용)
- 카카오 developers 콘솔 → 내 애플리케이션 → **도구 > REST API 테스트** → "사용자 토큰" 발급,
  또는 앱에서 카카오 SDK 로그인 후 access token 추출.
- access token 유효기간 ~6시간. 만료되면 재발급.
- ⚠️ 콘솔 도구로 발급하면 "닉네임" 선택동의 scope가 안 실릴 수 있음 → `properties.nickname == null`
  → 백엔드가 `RandomNicknameGenerator`로 폴백(정상 동작). 카카오 실제 닉네임을 보려면 동의 scope 포함 필요.

---

## 1. 카카오 — 에러 경로 (실값 KAKAO_CLIENT_ID로 기동)

| # | 요청 | 기대 |
|---|---|---|
| SL-K-01 | `POST /api/auth/kakao` body `{}` | 400 `VALIDATION_FAILED`, `fieldErrors[0].field = "accessToken"` |
| SL-K-02 | `{"accessToken": null}` | 400 동일 |
| SL-K-03 | `{"accessToken": ""}` | 400 동일 |
| SL-K-04 | `{"accessToken": "bogus-invalid-token"}` | **401 `INVALID_CREDENTIALS`** "카카오 인증에 실패했습니다. 액세스 토큰을 확인해주세요." — 500 아님. 응답에 100ms+ 소요(kapi.kakao.com 실제 왕복) |
| SL-K-05 | 만료된(과거 발급) 카카오 토큰 | 401 `INVALID_CREDENTIALS` |
| SL-K-06 | `/api/auth/kakao` 는 인증 없이 호출 가능해야 함 (PUBLIC_PATHS) | 위 케이스들이 401 엔트리포인트가 아니라 정상 처리됨 |

## 2. 카카오 — 해피패스 (유효 access token 필요)

| # | 단계 | 기대 |
|---|---|---|
| SL-K-10 | `POST /api/auth/kakao` `{"accessToken": "<유효 토큰>"}` | **200** + `{accessToken:"<우리 JWT>", tokenType:"Bearer", expiresIn:3600}`. JWT 페이로드 `sub`=숫자, `exp=iat+3600` |
| SL-K-11 | SL-K-10의 JWT로 `GET /api/auth/me` (`Authorization: Bearer`) | 200 + `UserResponse`: `socialProvider:"kakao"`, `gender:"NONE"`, `interests:[]`, `nickname`= 카카오 닉네임 또는 랜덤(`책벌레####`/`독서가####`/`페이지터너####` 등) |
| SL-K-12 | **같은 카카오 토큰**으로 `POST /api/auth/kakao` 재요청 | 200, **동일 유저**(같은 `sub`) — find-or-create가 새 유저를 만들지 않음 |
| SL-K-13 | (선택) 다른 카카오 계정 토큰으로 로그인 | 200, 새 `sub`(다른 유저 생성) |
| SL-K-14 | SL-K-10 직후 h2-console에서 `SELECT * FROM users` | `social_provider='kakao'`, `social_id`=카카오 회원번호, `password_hash` 없음 |

> H2 인메모리라 서버 재기동하면 유저가 사라진다 — SL-K-11~14는 한 번의 기동 세션 안에서 이어서 수행.

## 3. 구글 / 네이버 — 에러 경로 (키 미설정 상태)

| # | 요청 | 기대 |
|---|---|---|
| SL-G-01 | `POST /api/auth/google` `{}` | 400 `VALIDATION_FAILED` field=idToken |
| SL-G-02 | `{"idToken": "bogus"}` | 401 `INVALID_CREDENTIALS` "구글 인증에 실패했습니다. ID 토큰을 확인해주세요." — 500 아님 |
| SL-G-03 | (키 설정 후) 다른 앱용으로 발급된 유효 구글 ID token (`aud` 불일치) | 401 — `GoogleOAuthClient`의 `aud == GOOGLE_CLIENT_ID` 검증 실패 (이 검증은 `GoogleOAuthClientTest` 단위 테스트로도 커버됨) |
| SL-N-01 | `POST /api/auth/naver` `{}` | 400 field=accessToken |
| SL-N-02 | `{"accessToken": "bogus"}` | 401 `INVALID_CREDENTIALS` "네이버 인증에 실패했습니다..." — 500 아님 |

> 구글/네이버 해피패스는 `.env`에 각 키가 채워지고 실제 토큰이 있어야 가능 — 그때 SL-K-10~14와
> 같은 패턴으로 시나리오 확장.

## 4. 회귀 스모크 (빠른 확인)

기동 후: SL-K-01, SL-K-04, SL-G-02, SL-N-02 (에러 경로) + 유효 토큰 있으면 SL-K-10 → SL-K-11 → SL-K-12.

## 5. 공통 에러 응답 포맷 확인

모든 실패 응답이 `{ "timestamp", "status", "error": "<CODE>", "message", "fieldErrors": [...] }` 형태여야
한다. 소셜 로그인 실패의 `error` 코드는 `VALIDATION_FAILED`(400) / `INVALID_CREDENTIALS`(401).
