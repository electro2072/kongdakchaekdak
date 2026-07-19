# 독서 기록 공유 앱 (reading-record-app)

대한민국 독서 자랑 어플 — 읽은 책을 기록하고 친구/그룹과 공유하는 앱입니다.

## 구조
- `backend/` — Spring Boot(Gradle) 백엔드. 현재 Step 1(프로젝트 뼈대 + Health check API)까지.
- `frontend/` — React Native(TypeScript) 프론트엔드. 현재 Frame 03 책 검색 컴포넌트까지.
- `docs/` — 기획서, 화면설계서(wireframe), 테이블정의서, 개발현황, 백엔드구축계획, TODO 리스트.

## 진행 상황
자세한 내용은 `docs/독서기록앱_개발현황.md`, `docs/독서기록앱_TODO리스트_v2.md` 참고.

## 백엔드 로컬 실행 (준비 중)
```bash
cd backend
# gradle wrapper가 아직 없어서 로컬에 Gradle 설치가 필요합니다 (추후 gradlew 커밋 예정)
docker compose up -d      # 로컬 MySQL 실행
gradle bootRun            # http://localhost:8080/health 로 확인
```

> 참고: 이 프로젝트는 Claude(Cowork)와 함께 만들어지고 있습니다.
