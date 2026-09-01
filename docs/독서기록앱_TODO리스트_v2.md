# ✅ 독서 기록 공유 앱 — 배포까지 TODO 리스트

> 작성일: 2026-07-02 · 최종 업데이트: 2026-08-29
> 참고 문서: 기획서, 테이블정의서, 화면설계서, 개발현황, 백엔드구축계획, **소셜로그인_설정현황.md**

---

## 0. 오늘 확인할 것 (로컬에서 직접 확인 필요)

- [ ] `git pull` 로 Step 3 인증 커밋(`ec74095` 이후) 로컬에 받기
- [ ] `gradle test` 실행 — 특히 신규 `AuthControllerTest`(회원가입/로그인/내정보조회/중복이메일/잘못된 비밀번호) 통과하는지 확인
- [ ] 실제 MySQL(Docker Compose) 환경에서 `User` 테이블의 `(social_provider, social_id)` unique 제약이 잘 걸렸는지 확인 — `ddl-auto: update`는 이미 존재하는 테이블에 제약을 못 걸 수도 있어서, 안 걸려 있으면 테이블 재생성하거나 수동으로 `ALTER TABLE users ADD UNIQUE (social_provider, social_id);` 필요할 수 있음
- [ ] (선택) `gradle bootRun --args="--spring.profiles.active=local"` 로 띄운 뒤 Swagger(`/swagger-ui.html`)에서 `POST /api/auth/signup` → `POST /api/auth/login` → `GET /api/auth/me` (Authorize에 토큰 입력) 순서로 직접 호출해보기
- [ ] **(신규, `65d7480` 커밋)** `/api/users/**`, `/api/books/**` 를 이제 인증 없이 호출하면 401이 나는지 확인 (토큰 없이 `GET /api/users/1` 호출 → 401 예상), 그리고 Swagger Authorize에 토큰 넣은 뒤에는 정상 호출되는지 확인 — `gradle test`에서 `UserControllerTest`/`BookControllerTest`의 "토큰_없이_요청하면_401" 케이스로도 커버되지만, 실제 프론트/Postman에서 한 번 더 확인 권장
- [x] **(신규)** `backend/.env.example`을 복사해서 `backend/.env` 만들고, 카카오/구글/네이버 키를 발급받는 대로 채워넣기 — **2026-08-29: `backend/.env` 생성 + 카카오/구글/네이버 키 반영 완료** (AWS 키는 아래 별도 항목, 미입력이라 아직 `gradle bootRun` 기동은 실패)
- [ ] **(신규)** 카카오/구글/네이버 소셜 로그인 코드(`gradle test`의 `SocialAuthControllerTest`, `GoogleOAuthClientTest`) 통과 확인 — 실제 앱 등록/`.env` 작성 전이라도 `@MockBean`으로 대체되어 있어서 지금 바로 `gradle test`만으로 검증 가능
- [ ] **(신규, 2026-07-20)** 리소스 소유자 검증(`UserControllerTest`/`BookControllerTest`의 신규 403 테스트 4개) 통과 확인 — 다른 사용자 토큰으로 남의 프로필/책 수정·삭제·등록을 시도하면 403(`FORBIDDEN`)이 나는지, 실제 흐름(본인 것 수정/삭제)은 여전히 정상 동작하는지 Swagger/Postman으로도 한 번 확인 권장
- [ ] **(신규, 2026-07-20)** AWS 계정 생성 + S3 버킷 생성 + IAM 사용자(해당 버킷 `s3:PutObject` 권한만) 액세스 키 발급 → `backend/.env`에 `AWS_S3_BUCKET`/`AWS_S3_REGION`/`AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` 채워넣기 (`.env.example` 참고)
- [ ] **(신규, 2026-07-20)** `gradle test`의 `BookPhotoControllerTest` 통과 확인, 위 AWS 키 작성 후 `gradle bootRun` → Swagger에서 `POST /api/books/{bookId}/photos/presigned-url` 호출 → 받은 `uploadUrl`로 실제 이미지 파일 PUT 업로드 → `POST /api/books/{bookId}/photos`로 레코드 등록까지 엔드투엔드로 한 번 확인 (지금까지는 로컬 서명 로직만 검증됐고 실제 S3 왕복은 검증 전)
- [ ] **(신규, 2026-07-20)** Step 5 `gradle test`의 `BookNoteControllerTest`/`GroupControllerTest`/`ShareRecordControllerTest` 통과 확인 — 그룹 소유자 탈퇴 불가, 멤버 중복 추가 409, ShareRecord 교차검증(shareType/scope별 400) 케이스 위주로 Swagger/Postman에서도 한 번씩 확인 권장
- [ ] **(신규, 2026-07-20)** `독서기록앱_테이블정의서.xlsx`에 이번 Step 5에서 추가한 `ShareRecord.user_id`(공유한 사용자) 컬럼 반영 — 원본 스프레드시트에는 아직 없음
- [ ] **(신규, 2026-07-20)** Step 5-1 `gradle test`의 `DashboardControllerTest` 통과 확인 — 월간/분기별/연간 집계, 완독 0권일 때 격려 문구, `date` 생략 시 이번 달 기본값, 토큰 없이 401 케이스 위주로 Swagger/Postman에서도 `GET /api/dashboard?period=month&date=2026-07` 등으로 한 번씩 확인 권장
- [ ] **(신규, 2026-07-20)** Step 5-2 `gradle test`의 `PublicShareControllerTest`/`ShareRecordControllerTest` 신규 케이스 통과 확인, `gradle bootRun` 후 공유 하나 만들어서 `/public/share/{token}`을 브라우저(시크릿 모드 등 비로그인 상태)로 직접 열어보고, 카카오톡 링크 공유 디버거(https://developers.kakao.com/tool/debugger/sharing)로 OG 태그 미리보기가 정상 노출되는지 확인
- [ ] **(신규, 2026-07-20)** `독서기록앱_테이블정의서.xlsx`에 Step 5-2에서 추가한 `ShareRecord.book_note_id`/`dashboard_snapshot` 컬럼, 신규 테이블 `ShareRecordPhoto` 반영 — 원본 스프레드시트에는 아직 없음
- [x] **(신규, 2026-07-21, 배포 전 블로킹)** `backend/` 디렉터리에서 `gradle wrapper --gradle-version 8.14.3` 실행 후 생성되는 `gradlew`/`gradlew.bat`/`gradle/wrapper/gradle-wrapper.properties`/`gradle/wrapper/gradle-wrapper.jar` 커밋 — **2026-08-29 완료 (`849a3e4`)**
- [x] **(신규, 2026-07-21)** Railway 가입 → 프로젝트 생성 → 저장소 연결(루트 디렉터리 `backend`) → MySQL 플러그인 → 환경변수 설정 → `/health` 확인 — **2026-08-29 완료**. 배포 URL `https://kongdakchaekdak-production.up.railway.app` (`/health` 200, auth API 정상). 프로젝트 `intuitive-clarity` / 서비스 `kongdakchaekdak`, `main` push 시 자동 배포. ⚠️ **Custom Start Command 필수** — Railpack 기본 커맨드가 Spring Boot 이중 jar(`*.jar` + `*-plain.jar`)를 못 골라 크래시함 → `java -jar $(ls build/libs/*.jar | grep -v plain)` 로 지정함. 환경변수: `DB_*` 5개(MySQL 참조) + `JWT_SECRET` + `PUBLIC_BASE_URL` + `KAKAO_CLIENT_ID` + `GOOGLE_CLIENT_ID` + `NAVER_CLIENT_ID` + `NAVER_CLIENT_SECRET`
- [ ] **(신규, 2026-07-21)** Railway 무료 체험 조건: $5 크레딧 30일(또는 소진 시 그 전) 유효. **크레딧 만료 전에 결제 여부 결정할 것** — 안 하면 MySQL 볼륨(데이터) 삭제됨
- [ ] **(신규, RENAME-02, 2026-08-31, backend-agent)** DB명 변경(`reading_record_app` → `kongdakchaekdak`) 마이그레이션 안내 — 아직 정식 배포 전이라 옮겨야 할 실 사용자 데이터가 없음. 그래서 "마이그레이션"이라기보다는 아래 정리만 하면 됨:
  1. **로컬**: `docker-compose down -v && docker-compose up -d`로 MySQL 볼륨 재생성. 예전 `reading_record_app` 이름으로 쌓인 로컬 데이터는 테스트용이라 백업 없이 버려도 됨 — `ddl-auto: update`가 첫 기동 시 새 DB(`kongdakchaekdak`)에 스키마를 자동으로 만들어줌.
  2. **Railway**: 앱 서비스 Variables의 `DB_NAME`이 이미 `kongdakchaekdak`을 가리키고 있으면(섹션 0의 Railway 배포 항목 참고) 별도 조치 없이 다음 배포에서 새 DB가 자동 생성됨. Railway 프로젝트에 예전 이름의 DB/서비스가 남아있다면 지금 앱이 안 쓰는 게 맞는지 확인 후 정리(삭제)해도 됨.
  3. ⚠️ **이 절차는 "아직 실 사용자 데이터가 없다"는 전제에서만 유효함** — 정식 출시 이후 실 데이터가 쌓인 뒤에 DB명을 또 바꿀 일이 생기면, 이 볼륨 재생성 방식이 아니라 `mysqldump`로 백업 후 새 DB로 복원하는 진짜 마이그레이션 절차를 새로 작성해야 함.

---

## 1. 계정 / 키 발급

- [ ] Apple 개발자 계정 등록 (연 $99)
- [ ] Google Play 콘솔 계정 등록 (1회 $25)
- [x] 알라딘 Open API 키 발급 (2026-07-18 완료)
- [x] 카카오 도서 검색 API 키 발급 (2026-07-18 완료)
- [x] 카카오 소셜 로그인 앱 등록 (2026-08-29 완료 — 앱 ID 1502106, 네이티브 앱 키 + Android/iOS 플랫폼, 로그인 활성화, 닉네임 선택동의. 해피패스 검증까지 완료. 상세: `소셜로그인_설정현황.md`)
- [x] 구글 소셜 로그인 OAuth 클라이언트 등록 (2026-08-29 완료 — GCP 프로젝트 kongdakchaekdak, 웹/Android/iOS 클라이언트 3개, 동의화면 프로덕션 게시. 브랜딩 인증만 실도메인 대기)
- [x] 네이버 소셜 로그인 앱 등록 (2026-08-29 완료 — 사용자 직접 등록, 앱 "콩닥책닥", Android/iOS 환경, 별명 제공. 개발중 상태 → 출시 전 검수 필요)
- [ ] AWS 계정 생성 (S3, EC2, RDS) 또는 Firebase 프로젝트 생성 — `.env`의 `AWS_*` 미입력 상태, 이것 때문에 `gradle bootRun` 기동 실패 중

---

## 2. 법적 문서

- [x] 개인정보처리방침 작성 (스토어 심사 필수) — 2026-08-29 `PRIVACY.md` 초안 작성·커밋, GitHub URL을 구글 OAuth 동의화면에 등록. 앱 수집 항목 확정되면 갱신 필요
- [ ] 이용약관 작성
- [ ] 위치정보 수집·이용 동의 문구 (BookPhoto 위치 태그 기능 관련) — `PRIVACY.md`에 위치 좌표 수집은 명시함. 앱 내 별도 동의 문구/화면은 아직
- [ ] 사업자 등록 필요 여부 검토 (수익화 계획 시)

---

## 3. 디자인 에셋

- [ ] 앱 아이콘 제작
- [ ] 스플래시 화면 제작
- [ ] 실제 UI 디자인 (컬러/폰트/아이콘 확정 — 현재 와이어프레임은 low-fidelity)
- [ ] 앱스토어/플레이스토어용 스크린샷 제작
- [ ] 프로모션 이미지 제작

---

## 4. 프론트엔드 개발 (화면설계서 wireframe v2-5 기준)

> **2026-07-22 정정**: 아래 프레임 번호/설명은 와이어프레임이 v2 → v2-5로 개편되면서 바뀐 실제 구조로
> 다시 정리한 것. 이전 버전에 있던 "Frame 03 = 독서 기록 작성(별점/리뷰/태그/공개범위)" 항목은
> v2-5에서 그 내용 자체가 없어졌고(사용자 확인 완료), 서재 탭 목록/상세로 대체됨.

- [x] Frame 01 로그인 / 온보딩 (소셜 로그인 버튼 UI — 실제 카카오/구글/네이버 SDK 연동은 별도)
- [x] **소셜 로그인 네이티브 SDK 연동** — 3사 콘솔 등록·`.env`·백엔드 배포·프론트 SDK 연동 완료. **Android 에뮬레이터 E2E — 카카오/구글/네이버 3사 전부 PASS (2026-09-01)** + 로그아웃 정상. 상세 결과·발견 이슈·미검증(iOS 등)은 `docs/소셜로그인_설정현황.md` 의 "E2E 테스트 결과" 절 참고. 후속: 카카오 콘솔 앱 이름 "콩닥책닥" 변경, iOS E2E(맥 필요)
- [x] Frame 01.1 회원가입 (닉네임 필수 입력 + 성별/관심분야 다중선택/독서모임 검색·추가)
- [x] Frame 02 일정 탭 (이번달 독서 일정, 캘린더 스트립, 오늘의 리딩 카드)
- [x] Frame 03 서재 탭 (목록) — 읽고있는책/읽은책 필터, 검색, 책 카드 목록
- [ ] Frame 03.1 서재 탭 (책 상세) — 장소사진 갤러리, 소감, 완독 처리 버튼, 공유하기 버튼
- [ ] Frame 04 공유 탭
- [ ] Frame 04.1 공유 탭 (그룹 관리 · 공유 이력)
- [ ] Frame 05 프로필 탭
- [ ] Frame 05.1 독서 대시보드 (Recap) — 도넛 차트, 막대그래프, 카드 이미지 내보내기
- [x] Frame 06 / 06.1 공유 웹페이지 — Thymeleaf 서버 렌더링으로 백엔드에서 구현 완료(개발현황 15-1번), 프론트(RN) 작업 대상 아님
- [ ] 외부 SNS 공유 연동 (인스타그램/스레드/틱톡)

---

## 5. 백엔드 개발 (백엔드구축계획 기준)

- [x] Step 1. 프로젝트 뼈대 (Spring Boot + Gradle + MySQL Docker + Health check API)
- [x] Step 2-a. User 기본 CRUD + Swagger 문서화 (2026-07-19 완료)
- [x] Step 2-b. Book 기본 CRUD (등록/조회/수정/완독 처리) — 2026-07-19 완료, 사용자 로컬 환경(Java 17 + Gradle 8.14)에서 `gradle bootRun` 정상 실행 확인
- [x] Step 3. 인증 (이메일/PW · User/Book API 인증 필수화 · 카카오/구글/네이버 OAuth2 코드 구현 · 리소스 소유자 검증 강화 — 모두 완료, 마지막 항목은 2026-07-20. 단 소셜 로그인은 실제 키/로컬 검증 전)
- [x] Step 4. 이미지 업로드 (S3 presigned URL, BookPhoto API — 2026-07-20 완료, 단 실제 AWS 키/로컬 검증 전)
- [x] Step 5. 소감/공유 기능 (BookNote, Group, ShareRecord API — 2026-07-20 완료, "기록 전용" 범위. 실제 열람 권한 제어·카드 이미지·공개 웹뷰는 Step 5-2로 분리)
- [x] Step 5-1. 독서 대시보드(Recap) 통계 (`GET /api/dashboard` — 2026-07-20 완료, 월간/분기별/연간 집계 + 장르 비율 + 6개월 추이 + 하이라이트 + 자동 캡션, 본인 통계만 조회)
- [x] Step 5-2. 공유 카드 이미지 + 공개 웹뷰 (2026-07-20 완료 — 카드 이미지 서버 생성은 보류(클라이언트 캡처 유지). `/public/share/{token}` 비로그인 공개 웹뷰(Thymeleaf, OG 태그 포함), ShareRecord에 소감(bookNoteId)/선택 사진(ShareRecordPhoto)/대시보드 스냅샷 데이터 모델 확장 완료)
- [x] Step 6. 배포 — **Railway 배포 완료(2026-08-29)**. `https://kongdakchaekdak-production.up.railway.app` 라이브(`/health` 200). 상세는 섹션 0 참고. 남은 것: 커스텀 도메인, 에러 모니터링, AWS 키(사진 업로드)

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

*우선순위: 소셜 로그인 3사 콘솔 등록 + 개인정보처리방침 + Railway 백엔드 배포 + 프론트 SDK 연동 완료(2026-08-29).
다음 급한 것 — (1) **실제 기기에서 카카오/구글/네이버 로그인 E2E 테스트**, (2) AWS 키(사진 업로드),
(3) 나머지 미완성 화면(03.1·04·04.1·05·05.1) → 릴리스 빌드 → 베타. 상세는 `docs/소셜로그인_설정현황.md`.*
