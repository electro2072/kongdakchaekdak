-- ============================================================================
-- 대시보드(독서 대시보드 / Recap) 테스트 데이터 시드   (reading-record-tester-agent)
-- ----------------------------------------------------------------------------
-- 목적: GET /api/dashboard 의 월간 / 분기 / 연간 리캡을 실데이터로 확인.
--   대시보드는 status='done' + end_date가 조회 기간 안인 Book을 실시간 집계
--   (DashboardService): completedBookCount / totalPagesRead / 장르비율 도넛 /
--   최다 장르 · 최장 · 최단 완독 하이라이트 / 직전 6개월 완독 추이.
--
-- 데이터: 전용 유저 id=9001 (social_provider='seed') + 완독 25권 + 진행중 3권.
--   (완독 22권 + 백엔드 요청 엣지 케이스 3권 = 동률 완독 2권 + total_pages NULL 1권)
--   - 날짜는 전부 CURRENT_DATE 상대값 -> 언제 실행해도 "최근 12개월"이 됨.
--     맨 위 DELETE 3줄이 먼저 지우므로 재실행 가능 (idempotent).
--   - 장르 6종 전부 포함, '소설' 최다.
--   - 완독 기간 2일 ~ 41일 -> 최장/최단 하이라이트 확인 가능. 최장은 동률 2권(41일)이라 tie-break 확인 가능.
--   - 페이지수 132 ~ 690, 그리고 total_pages NULL 1권 (합산 null-safe 확인용).
--   ※ 제목-장르가 항상 실제와 맞지는 않음 (분포/집계 테스트용 더미).
--
-- 날짜 구문: INTERVAL '3' MONTH  (숫자에 반드시 따옴표) — H2(MySQL 모드) + MySQL 8 둘 다 호환.
--   INTERVAL 3 MONTH (따옴표 없이)는 H2에서 syntax error.
--
-- 실행:
--   [로컬 H2]  gradle bootRun --args="--spring.profiles.active=local" 후
--             http://localhost:8080/h2-console
--             (JDBC URL: jdbc:h2:mem:kongdakchaekdak;MODE=MySQL / user: sa / 비번 없음)
--             에 이 파일 내용 붙여넣고 실행.
--   [Railway MySQL]  railway 연결(mysql CLI 등)에서 그대로 실행.
--
-- 조회 (유저 9001 의 JWT 필요):
--   ★ JWT 시크릿 주의:
--     - 로컬 gradle bootRun 은 backend/.env 의 JWT_SECRET 을 읽어 씀
--       (application.yml 의 기본값이 아님).  node docs/test/tools/mint-jwt.mjs 9001 "<backend/.env의 JWT_SECRET>"
--     - Railway 는 Railway 환경변수 JWT_SECRET.  node docs/test/tools/mint-jwt.mjs 9001 "<Railway JWT_SECRET>"
--   GET /api/dashboard                 (이번 달)
--   GET /api/dashboard?period=quarter  (이번 분기)
--   GET /api/dashboard?period=year     (올해)
--   GET /api/dashboard?period=month&date=2026-07   (특정 달 고정 조회)
--
-- 검증됨 (로컬 H2 bootRun + 실제 GET /api/dashboard 호출, 2026-09-08 실행):
--   month(2026-09)   completedBookCount 6 / totalPagesRead 1552 / 도넛 소설3·에세이2·자기계발1 / trend …09:6
--   quarter(3분기)   completedBookCount 10 / totalPagesRead 2912 / 도넛 소설6·에세이2·인문1·자기계발1
--   year(2026)       completedBookCount 23 / totalPagesRead 6528 / 6개 장르 전부 / trend 07~12: 2·2·6·0·0·0
--   하이라이트   최장 = '오래 물고 있던 책 A'(41일) ← 동률 2권 중 id 작은 쪽이 이김(tie-break OK) / 최단 '마인드셋'(2일)
--   엣지 케이스   total_pages NULL 책이 totalPagesRead 합산에서 0으로 처리됨(null-safe OK)
--   ※ 정확한 수치는 실행일에 따라 달라짐 (상대날짜라 매번 재계산).
-- ============================================================================

DELETE FROM books WHERE user_id = 9001;
DELETE FROM user_interests WHERE user_id = 9001;
DELETE FROM users WHERE id = 9001;

INSERT INTO users (id, nickname, social_provider, social_id, bio, created_at, updated_at)
VALUES (9001, '리캡테스터', 'seed', 'dashboard-recap-tester', '리캡 화면 확인용 시드 계정', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 완독 22권
INSERT INTO books (user_id, title, author, genre, total_pages, status, start_date, end_date, created_at, updated_at) VALUES
  (9001, '여름의 문장들', '김연수', '소설', 204, 'done', CURRENT_DATE - INTERVAL '8' DAY, CURRENT_DATE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (9001, '아무튼, 계속', '김하나', '에세이', 560, 'done', CURRENT_DATE - INTERVAL '11' DAY, CURRENT_DATE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (9001, '마인드셋', '캐럴 드웩', '자기계발', 168, 'done', CURRENT_DATE - INTERVAL '1' DAY, CURRENT_DATE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (9001, '당신 인생의 이야기', '테드 창', '소설', 168, 'done', CURRENT_DATE - INTERVAL '1' MONTH - INTERVAL '17' DAY, CURRENT_DATE - INTERVAL '1' MONTH, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (9001, '연년세월', '박완서', '소설', 500, 'done', CURRENT_DATE - INTERVAL '1' MONTH - INTERVAL '8' DAY, CURRENT_DATE - INTERVAL '1' MONTH, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (9001, '다정한 것이 살아남는다', '브라이언 헤어', '인문', 452, 'done', CURRENT_DATE - INTERVAL '2' MONTH - INTERVAL '1' DAY, CURRENT_DATE - INTERVAL '2' MONTH, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (9001, '파친코', '이민진', '소설', 240, 'done', CURRENT_DATE - INTERVAL '2' MONTH - INTERVAL '1' DAY, CURRENT_DATE - INTERVAL '2' MONTH, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (9001, '우리는 매일매일', '황선우', '에세이', 168, 'done', CURRENT_DATE - INTERVAL '3' MONTH - INTERVAL '1' DAY, CURRENT_DATE - INTERVAL '3' MONTH, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (9001, '천 개의 파랑', '천선란', '소설', 356, 'done', CURRENT_DATE - INTERVAL '3' MONTH - INTERVAL '29' DAY, CURRENT_DATE - INTERVAL '3' MONTH, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (9001, '엔트로피', '제러미 리프킨', '과학', 168, 'done', CURRENT_DATE - INTERVAL '3' MONTH - INTERVAL '11' DAY, CURRENT_DATE - INTERVAL '3' MONTH, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (9001, '어떤 하루', '김민철', '에세이', 168, 'done', CURRENT_DATE - INTERVAL '4' MONTH - INTERVAL '4' DAY, CURRENT_DATE - INTERVAL '4' MONTH, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (9001, '보건교사 안은영', '정세랑', '소설', 356, 'done', CURRENT_DATE - INTERVAL '4' MONTH - INTERVAL '17' DAY, CURRENT_DATE - INTERVAL '4' MONTH, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (9001, '부의 추월차선', '엠제이 드마코', '경제·경영', 500, 'done', CURRENT_DATE - INTERVAL '5' MONTH - INTERVAL '1' DAY, CURRENT_DATE - INTERVAL '5' MONTH, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (9001, '페인트', '이희영', '소설', 240, 'done', CURRENT_DATE - INTERVAL '5' MONTH - INTERVAL '2' DAY, CURRENT_DATE - INTERVAL '5' MONTH, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (9001, '무례한 사람에게 웃으며 대처하는 법', '정문정', '에세이', 560, 'done', CURRENT_DATE - INTERVAL '6' MONTH - INTERVAL '25' DAY, CURRENT_DATE - INTERVAL '6' MONTH, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (9001, '밝은 밤', '최은영', '소설', 132, 'done', CURRENT_DATE - INTERVAL '6' MONTH - INTERVAL '21' DAY, CURRENT_DATE - INTERVAL '6' MONTH, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (9001, '호모 데우스', '유발 하라리', '인문', 500, 'done', CURRENT_DATE - INTERVAL '6' MONTH - INTERVAL '21' DAY, CURRENT_DATE - INTERVAL '6' MONTH, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (9001, '아주 작은 습관의 힘', '제임스 클리어', '자기계발', 132, 'done', CURRENT_DATE - INTERVAL '7' MONTH - INTERVAL '11' DAY, CURRENT_DATE - INTERVAL '7' MONTH, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (9001, '달빛 조각사', '남희성', '소설', 132, 'done', CURRENT_DATE - INTERVAL '7' MONTH - INTERVAL '4' DAY, CURRENT_DATE - INTERVAL '7' MONTH, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (9001, '반짝이는 것들', '김혜진', '에세이', 204, 'done', CURRENT_DATE - INTERVAL '8' MONTH - INTERVAL '17' DAY, CURRENT_DATE - INTERVAL '8' MONTH, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (9001, '시선', '은유', '소설', 356, 'done', CURRENT_DATE - INTERVAL '10' MONTH - INTERVAL '6' DAY, CURRENT_DATE - INTERVAL '10' MONTH, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (9001, '고양이는 잘 있어요', '최유안', '에세이', 452, 'done', CURRENT_DATE - INTERVAL '11' MONTH - INTERVAL '3' DAY, CURRENT_DATE - INTERVAL '11' MONTH, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- ── 엣지 케이스 3권 (백엔드 요청: 회신 docs/test/requests/대시보드_테스트데이터_확인_v1.md §3) ──
--   · 완독 기간 동률 2권 → '최장 완독' 하이라이트 tie-break 확인 (둘 다 41일).
--     먼저 INSERT 되는 A가 id가 작음 → id 작은 쪽이 이기는지 API 응답으로 실측.
--   · total_pages NULL 1권 → totalPagesRead 합산이 null-safe 한지(0으로 처리) 실측.
--   3권 모두 end_date = 오늘 → month / quarter / year 조회에 전부 걸림.
INSERT INTO books (user_id, title, author, genre, total_pages, status, start_date, end_date, created_at, updated_at) VALUES
  (9001, '오래 물고 있던 책 A (동률·먼저)', '동률갑', '소설', 300, 'done', CURRENT_DATE - INTERVAL '40' DAY, CURRENT_DATE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (9001, '오래 물고 있던 책 B (동률·나중)', '동률을', '소설', 320, 'done', CURRENT_DATE - INTERVAL '40' DAY, CURRENT_DATE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (9001, '페이지수 미상 에세이 (total_pages NULL)', '무명', '에세이', NULL, 'done', CURRENT_DATE - INTERVAL '3' DAY, CURRENT_DATE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 진행중 3권
INSERT INTO books (user_id, title, author, genre, total_pages, status, start_date, end_date, created_at, updated_at) VALUES
  (9001, '채식주의자', '한강', '소설', 188, 'reading', CURRENT_DATE - INTERVAL '3' DAY, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (9001, '데미안', '헤르만 헤세', '인문', 240, 'reading', CURRENT_DATE - INTERVAL '11' DAY, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (9001, '돈의 심리학', '모건 하우절', '경제·경영', 380, 'reading', CURRENT_DATE - INTERVAL '19' DAY, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

SELECT COUNT(*) AS total, SUM(CASE WHEN status='done' THEN 1 ELSE 0 END) AS done_cnt FROM books WHERE user_id = 9001;
