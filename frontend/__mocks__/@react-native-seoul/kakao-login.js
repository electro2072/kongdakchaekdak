// 테스트 환경에는 @react-native-seoul/kakao-login의 네이티브 모듈이 없어서 수동으로 mock한다.
// 테스터 리포트 FINDING-20260829-14 (docs/test/reports/2026-08-29.md) 대응 — LoginScreen이
// src/services/socialAuth/kakaoAuth.ts를 통해 named export `login`을 가져다 쓰기 때문에,
// jest 환경에서도 이 이름이 존재해야 렌더가 실패하지 않는다.
module.exports = {
  login: jest.fn(),
  logout: jest.fn(),
  getProfile: jest.fn(),
};
