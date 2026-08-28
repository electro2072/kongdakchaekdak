// 테스터 리포트 OBS-02 (docs/test/reports/2026-08-27.md):
// App.tsx가 부르는 enableScreens()는 네이티브 UIManager에 'RNSScreen' 뷰 매니저가 등록돼
// 있는지 확인하고, 없으면(jest/jsdom 환경엔 당연히 없음) console.error를 찍는다
// (node_modules/react-native-screens/lib/commonjs/core.js의 enableScreens 구현 참고).
// 테스트 통과 여부에는 영향 없는 순수 로그 노이즈라 enableScreens만 no-op으로 바꾸고,
// 나머지(Screen/ScreenContainer/native-stack 등 실제 렌더에 쓰이는 것들)는 실제 구현을
// 그대로 둔다 — 전체를 갈아치우는 목(mock)은 컴포넌트 동작을 바꿀 위험이 있어 만들지 않는다.
const actual = jest.requireActual('react-native-screens');

module.exports = {
  ...actual,
  enableScreens: () => {},
};
