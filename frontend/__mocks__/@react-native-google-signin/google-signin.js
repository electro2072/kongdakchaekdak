// 테스트 환경에는 @react-native-google-signin/google-signin의 네이티브 모듈이 없어서 수동으로
// mock한다. 테스터 리포트 FINDING-20260829-14 (docs/test/reports/2026-08-29.md) 대응 —
// App.tsx가 모듈 로드 시점에 GoogleSignin.configure()를 호출하고, LoginScreen이
// src/services/socialAuth/googleAuth.ts를 통해 GoogleSignin/isSuccessResponse/isErrorWithCode/
// statusCodes를 가져다 쓰기 때문에, jest 환경에서도 이 이름들이 전부 존재해야 렌더가 실패하지
// 않는다. react-native-config.js와 같은 패턴 — 실제 로그인 동작은 흉내 내지 않고, 렌더/모듈 로드가
// 깨지지 않을 정도의 최소 mock만 제공한다.
module.exports = {
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn().mockResolvedValue(true),
    signIn: jest.fn(),
    // 2026-09-11 G16: 회원 탈퇴 후 권한 회수(googleAuth.ts `revokeGoogleAccess`).
    revokeAccess: jest.fn(),
  },
  isSuccessResponse: jest.fn(() => true),
  isErrorWithCode: jest.fn(() => false),
  statusCodes: {
    SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
    IN_PROGRESS: 'IN_PROGRESS',
    PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
  },
};
