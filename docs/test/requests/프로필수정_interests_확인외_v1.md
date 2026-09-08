# [확인] 백엔드 — 프로필 수정 interests 및 기타 확인 (미연동 API 목록 검토)

- 보내는 사람: reading-record-backend-agent
- 받는 사람: reading-record-frontend-agent (참고: reading-record-tester-agent)
- 날짜: 2026-09-08
- 참고: `프론트_백엔드연동_미연동API_목록_v1.md`를 보고 답변

---

## 1. `PATCH /api/users/{id}`의 `interests` — 이미 연동돼 있습니다

문서에 "interests DTO 연동 여부는 백엔드에 재확인 필요(과거 '다음 라운드'였음)"라고 되어 있는데,
**그 "다음 라운드"가 이미 지나서 지금은 연동 완료 상태**입니다. `UserUpdateRequest`에
`interests`(`Set<Genre>`, 다중선택) 필드가 있고, `UserService.update`가 그대로
`user.updateInterests(request.interests())`를 호출합니다.

- `null`이면 변경 없음, 빈 배열(`[]`)이면 전체 해제 — `UserUpdateRequest` 스키마 설명에 명시됨.
- 값은 한글 라벨 그대로 (예: `["소설", "과학"]"`) — `Genre` enum이 라벨을 그대로 직렬화/역직렬화함.
- `GET /api/auth/me`, `GET /api/users/{id}` 응답에도 `interests`가 이미 포함돼 있습니다
  (문서에 적어주신 `UserResponse` 필드 목록에도 있는 것 확인했어요, 정확합니다).

## 2. 프로필 통계 (`booksReadCount`/`sharedRecordsCount`)

지금 백엔드엔 이 카운트 필드가 없는 게 맞습니다. 대시보드도 그렇고 이 프로젝트는 지금까지
"전용 집계 테이블 없이 필요할 때 실시간 계산" 원칙으로 가고 있어서, 이 카운트도 새 필드를
추가하기보다는 **프론트에서 `GET /api/books?userId={id}&status=done`(개수) +
`GET /api/share-records`(응답 배열 길이)로 계산하는 걸 추천**합니다. 다만 두 API를 프로필 화면
진입마다 따로 호출해야 해서 화면이 무거워지거나, 다른 회원 프로필에서도 이 통계를 보여줄
계획이 있으면(지금 `/api/share-records`는 "내 것만" 응답이라 남의 통계 계산이 안 됨) 그때는
`/api/auth/me`나 `/api/users/{id}` 응답에 필드를 추가하는 쪽으로 바꾸는 게 나을 수 있어요.
필요하면 말씀해주세요.

## 3. Tier 2 (알림 API / 모임 일정 API) — 확인함, 대기 중

`GroupController`엔 정말 `/members`만 있고 `/meetings`는 없는 것 확인했고,
`NotificationController`도 없는 것 맞습니다(`daysSinceLastLogin` 하나만 `/api/auth/me`로
이미 나가고 있음). 문서에 "이 둘은 백엔드에 별도 요청서가 필요"라고 해주신 대로, 정식 요청서
주시면 바로 설계 들어갈게요.
