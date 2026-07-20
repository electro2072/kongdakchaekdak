# ✅ 독서 기록 공유 앱 — 배포까지 TODO 리스트

> 작성일: 2026-07-02 · 최종 업데이트: 2026-07-20
> 참고 문서: 기획서, 테이블정의서, 화면설계서, 개발현황, 백엔드구축계획

---

## 0. 오늘 확인할 것 (로컬에서 직접 확인 필요)

- [ ] `git pull` 로 Step 3 인증 커밋(`ec74095` 이후) 로컬에 받기
- [ ] `gradle test` 실행 — 특히 신규 `AuthControllerTest`(회원가입/로그인/내정보조회/중복이메일/잘못된 비밀번호) 통과하는지 확인
- [ ] 실제 MySQL(Docker Compose) 환경에서 `User` 테이블의 `(social_provider, social_id)` unique 제약이 잘 걸렸는지 확인 — `ddl-auto: update`는 이미 존재하는 테이블에 제약을 못 걸 수도 있어서, 안 걸려 있으면 테이블 재생성하거나 수동으로 `ALTER TABLE users ADD UNIQUE (social_provider, social_id);` 필요할 수 있음
- [ ] (선택) `gradle bootRun --args="--spring.profiles.active=local"` 로 띄운 뒤 Swagger(`/swagger-ui.html`)에서 `POST /api/auth/signup` → `POST /api/auth/login` → `GET /api/auth/me` (Authorize에 토큰 입력) 순서로 직접 호출해보기
- [ ] **(신규, `65d7480` 커밋)** `/api/users/**`, `/api/books/**` 를 이제 인증 없이 호출하면 401이 나는지 확인 (토큰 없이 `GET /api/users/1` 호출 → 401 예상), 그리고 Swagger Authorize에 토큰 넣은 뒤에는 정상 호출되는지 확인 — `gradle test`에서 `UserControllerTest`/`BookControllerTest`의 "토큰_없이_요청하면_401" 케이스로도 커버되지만, 실제 프론트/Postman에서 한 번 더 확인 권장
- [ ] **(신규)** `backend/.env.example`을 복사해서 `backend/.env` 만들고, 카카오/구글/네이버 키를 발급받는 대로 채워넣기 — 파일이 없어도 `gradle bootRun`은 정상 동작하지만(경고 로그만 뜸) 소셜 로그인은 안 됨
- [ ] **(신규)** 카카오/구글/네이버 소셜 로그인 코드(`gradle test`의 `SocialAuthControllerTest`, `GoogleOAuthClientTest`) 통과 확인 — 실제 앱 등록/`.env` 작성 전이라도 `@MockBean`으로 대체되어 있어서 지금 바로 `gradle test`만으로 검증 가능
- [ ] **(신규, 2026-07-20)** 리소스 소유자 검증(`UserControllerTest`/`BookControllerTest`의 신규 403 테스트 4개) 통과 확인 — 다른 사용자 토큰으로 남의 프로필/책 수정·삭제·등록을 시도하면 403(`FORBIDDEN`)이 나는지, 실제 흐름(본인 것 수정/삭제)은 여전히 정상 동작하는지 Swagger/Postman으로도 한 번 확인 권장

---

## 1. 계정 / 키 발급

- [ ] Apple 개발자 계정 등록 (연 $99)
- [ ] Google Play 콘솔 계정 등록 (1회 $25)
- [x] 알라딘 Open API 키 발급 (2026-07-18 완료)
- [x] 카카오 도서 검색 API 키 발급 (2026-07-18 완료)
- [ ] 카카오 소셜 로그인 앱 등록 (Client ID/Secret)
- [ ] 구글 소셜 로그인 OAuth 클라이언트 등록
- [ ] 네이버 소셜 로그인 앱 등록
- [ ] AWS 계정 생성 (S3, EC2, RDS) 또는 Firebase 프로젝트 생성

---

## 2. 법적 문서

- [ ] 개인정보처리방침 작성 (스토어 심사 필수)
- [ ] 이용약관 작성
- [ ] 위치정보 수집·이용 동의 문구 (BookPhoto 위치 태그 기능 관련)
- [ ] 사업자 등록 필요 여부 검토 (수익화 계획 시)

---

## 3. 디자인 에셋

- [ ] 앱 아이콘 제작
- [ ] 스플래시 화면 제작
- [ ] 실제 UI 디자인 (컬러/폰트/아이콘 확정 — 현재 와이어프레임은 low-fidelity)
- [ ] 앱스토어/플레이스토어용 스크린샷 제작
- [ ] 프로모션 이미지 제작

---

## 4. 프론트엔드 개발 (화면설계서 기준)

- [ ] Frame 01 로그인/온보딩 (소셜 로그인: 네이버/카카오/구글)
- [ ] Frame 01.1 회원가입 (닉네임 필수 입력 + 성별/관심분야 다중선택/독서모임 검색·연결 선택 입력)
- [ ] Frame 02 홈 (이번달 독서 일정, 캘린더 스트립, 오늘의 리딩 카드)
- [ ] Frame 03 독서 기록 작성 — 별점/리뷰/태그/공개범위+등록 UI (책 검색은 완료)
- [ ] Frame 04 독서 기록 상세보기
- [ ] Frame 05 마이페이지 (독서 대시보드/Recap) — 도넛 차트, 막대그래프, 카드 이미지 내보내기
- [ ] 공유 탭 (그룹 관리, 공유 범위 설정, 공유 이력)
- [ ] 외부 SNS 공유 연동 (인스타그램/스레드/틱톡)

---

## 5. 백엔드 개발 (백엔드구축계획 기준)

- [x] Step 1. 프로젝트 뼈대 (Spring Boot + Gradle + MySQL Docker + Health check API)
- [x] Step 2-a. User 기본 CRUD + Swagger 문서화 (2026-07-19 완료)
- [x] Step 2-b. Book 기본 CRUD (등록/조회/수정/완독 처리) — 2026-07-19 완료, 사용자 로컬 환경(Java 17 + Gradle 8.14)에서 `gradle bootRun` 정상 실행 확인
- [x] Step 3. 인증 (이메일/PW · User/Book API 인증 필수화 · 카카오/구글/네이버 OAuth2 코드 구현 · 리소스 소유자 검증 강화 — 모두 완료, 마지막 항목은 2026-07-20. 단 소셜 로그인은 실제 키/로컬 검증 전)
- [ ] Step 4. 이미지 업로드 (S3 presigned URL, BookPhoto API)
- [ ] Step 5. 소감/공유 기능 (BookNote, Group, ShareRecord API)
- [ ] Step 6. 배포 (AWS EC2 + RDS 또는 Railway)

---

## 6. 인프라 / 운영

- [ ] 도메인 구매 (API 서버용)
- [ ] HTTPS 인증서 설정
- [ ] 에러 모니터링 도구 연동 (예: Sentry)
- [ ] CI/CD 파이프라인 구축 (GitHub Actions, Fastlane 등)
- [ ] 환경변수(.env) 관리 체계 정리

---

## 7. 테스트 / 베타

- [ ] QA 체크리스트 작성 (기기별 테스트)
- [ ] iOS TestFlight 베타 배포
- [ ] Android 내부 테스트 트랙 베타 배포
- [ ] 두 도서 API(알라딘/카카오) 결과 병합·중복 제거 로직 검증

---

## 8. 스토어 심사 / 최종 배포

- [ ] App Store Connect 앱 정보 등록 및 심사 제출
- [ ] Google Play Console 앱 정보 등록 및 심사 제출
- [ ] 심사 반려 대응 (필요 시)
- [ ] 정식 출시 🎉

---

*우선순위: 알라딘/카카오 API 키 발급은 완료(2026-07-18). 이제 개인정보처리방침 초안 작성이 가장 급함. 이후 프론트/백엔드 병행 개발 진행.*
