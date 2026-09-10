/**
 * 백엔드 API 요청/응답(wire-format) 타입 모음 — 2026-09-09, "인터페이스 한 폴더에 모아놓기"
 * 리팩터링.
 *
 * 이 폴더(src/types/api/)에는 서버와 주고받는 바디/응답 인터페이스만 둔다.
 * 화면이 실제로 쓰는 도메인 모델(Book, LibraryBook, ProfileSummary 등)은 그대로
 * src/types/*.ts · src/mocks/*.ts에 남아 있고, 서버 응답을 그 모델로 변환하는 매핑 함수도
 * 각 Context/서비스 파일에 그대로 남아 있다 — 여기 옮긴 건 "서버가 실제로 뭘 주고받는지"를
 * 나타내는 타입 정의뿐이다.
 *
 * 각 서비스 파일(authApi.ts, userApi.ts, libraryApi.ts, profileStatsApi.ts)은 이제 타입을
 * 직접 정의하지 않고 여기서 import해서 쓴다. 화면/Context 쪽 타입 전용 import도 서비스 파일이
 * 아니라 이 폴더(또는 이 배럴)에서 바로 가져오도록 정리했다.
 *
 * 외부 API(카카오/알라딘) 타입은 우리 백엔드 계약이 아니라서 의도적으로 여기 포함하지 않았다
 * (src/services/kakao/kakaoApi.types.ts, src/services/aladin/aladinApi.types.ts에 그대로 둠).
 * Group/ShareRecord 관련 타입은 백엔드 DTO가 아직 없어 여기에도 없다(둘 다 mock 상태).
 */
 
export * from './auth';
export * from './user';
export * from './library';
export * from './dashboard';
export * from './profileStats';
export * from './error';