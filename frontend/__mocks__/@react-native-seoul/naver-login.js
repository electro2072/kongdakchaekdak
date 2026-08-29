// 테스트 환경에는 @react-native-seoul/naver-login의 네이티브 모듈이 없어서 수동으로 mock한다.
// 테스터 리포트 FINDING-20260829-14 (docs/test/reports/2026-08-29.md) 대응 — App.tsx가 모듈 로드
// 시점에 initializeNaverLogin()을 통해 NaverLogin.initialize()를 호출하고, LoginScreen이
// src/services/socialAuth/naverAuth.ts를 통해 기본 export(NaverLogin)의 initialize/login을
// 가져다 쓰기 때문에, jest 환경에서도 이 이름들이 존재해야 렌더가 실패하지 않는다.
module.exports = {
  initialize: jest.fn(),
  login: jest.fn(),
  logout: jest.fn(),
  deleteToken: jest.fn(),
};
