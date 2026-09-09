// @invertase/react-native-apple-authentication은 네이티브 모듈이라 jest 환경에서 링크되지
// 않는다. 게다가 실제 배포본(lib/index.js)이 ESM(import) 문법으로 되어 있어서 jest.config.js의
// transformIgnorePatterns 화이트리스트에 추가해 변환시키는 방법 대신, 다른 소셜 로그인 SDK들
// (google-signin.js, kakao-login.js, naver-login.js)과 동일하게 __mocks__/에 수동 mock을 둬서
// 실제 모듈 파일 자체를 아예 로드하지 않게 한다.
//
// isSupported를 false로 둬서 LoginScreen의 `showAppleButton = Platform.OS === 'ios' &&
// isAppleSignInSupported` 조건이 테스트 환경에서는 항상 false가 되도록 한다 — 애플 버튼이
// 렌더를 시도하지 않으므로 AppleButton 자체를 정교하게 흉내 낼 필요가 없다(google-signin.js와
// 같은 "렌더/모듈 로드가 깨지지 않을 정도의 최소 mock" 원칙).
function AppleButtonMock() {
  return null;
}
AppleButtonMock.Style = {WHITE: 'WHITE', BLACK: 'BLACK'};
AppleButtonMock.Type = {SIGN_IN: 'SIGN_IN'};

module.exports = {
  __esModule: true,
  default: {
    isSupported: false,
    performRequest: jest.fn(),
    Operation: {LOGIN: 'LOGIN'},
    Scope: {FULL_NAME: 'FULL_NAME', EMAIL: 'EMAIL'},
    Error: {CANCELED: 1001},
  },
  AppleButton: AppleButtonMock,
};
