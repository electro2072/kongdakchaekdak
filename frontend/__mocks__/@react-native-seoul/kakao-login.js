// 테스트 환경에는 @react-native-seoul/kakao-login의 네이티브 모듈이 없어서 수동으로 mock한다.
// 테스터 리포트 FINDING-20260829-14 (docs/test/reports/2026-08-29.md) 대응 — LoginScreen이
// src/services/socialAuth/kakaoAuth.ts를 통해 named export `login`을 가져다 쓰기 때문에,
// jest 환경에서도 이 이름이 존재해야 렌더가 실패하지 않는다.
// 2026-09-11 G16: 회원 탈퇴 후 연결 끊기(kakaoAuth.ts `unlinkKakao`)가 named export `unlink`를 쓴다.
module.exports = {
  login: jest.fn(),
  logout: jest.fn(),
  unlink: jest.fn(),
  getProfile: jest.fn(),
};
