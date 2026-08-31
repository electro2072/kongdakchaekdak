/**
 * 디자인 시스템 v2 컬러 팔레트 — "책거리×송편" 리브랜딩 (design/color_chips.html, design/hifi_mockup_v1.html v1.5와 동일한 값).
 * OKLCH hue 124.6°(쑥송편) 기반 primary 램프 + neutral 램프 + 상태색 + 카테고리 포인트 멀티컬러(송편 5색 중 4색).
 * 2026-08-09 확정, 2026-08-27 프론트 반영. 이전 v1.2(hue 140° 연두 + 코랄/시안/라벤더)에서 전면 교체됨 —
 * 자세한 도출 근거는 claude/독서기록앱_디자인시스템_컬러팔레트_v1.md 참고.
 */

export interface ThemeColors {
  /** Primary(쑥송편 그린) 램프 50~900 */
  p50: string;
  p100: string;
  p200: string;
  p300: string;
  p400: string;
  p500: string;
  p600: string;
  p700: string;
  p800: string;
  p900: string;
  /** Neutral 램프 50~900 */
  n50: string;
  n100: string;
  n200: string;
  n300: string;
  n400: string;
  n500: string;
  n600: string;
  n700: string;
  n800: string;
  n900: string;
  /** 상태색 (항상 아이콘+라벨과 함께 사용) */
  success: string;
  warning: string;
  error: string;
  info: string;
  /** 카테고리 구분용 포인트 멀티컬러 (장르 태그/도넛차트 등, 라벨 병기 필수) */
  chart1: string;
  chart2: string;
  chart3: string;
  chart4: string;
  /**
   * 6개 장르 고정 매핑 확장(2026-08-28, claude/독서기록앱_프론트요청_디자인_6개장르고정색전환_v1.md).
   * 과학(chart5)·경제·경영(chart6) 전용 — dataviz 스킬 공식 검증기로 기존 4색과의 색약 안전성
   * (protan/deutan 시뮬레이션, OKLab ΔE)까지 확인된 값.
   */
  chart5: string;
  chart6: string;
  /** 시맨틱 토큰 */
  surface: string;
  /**
   * 앱 전체 배경(탭/스택 바탕) — surface(카드)와 구분되는 한 단계 더 낮은 위계.
   * 테스터 리포트 FINDING-20260828-06: 기존엔 이 토큰이 없어 RootNavigator가 n50을
   * 대신 썼는데, 다크모드에서 design의 `--d-surface-app`(#181a14)보다 밝게 나왔다.
   */
  appBackground: string;
  accentSolidBg: string;
  onAccentSolid: string;
  warnBg: string;
  warnText: string;
  hairline: string;
}

export const lightColors: ThemeColors = {
  p50: '#f4f9eb',
  p100: '#ebf5db',
  p200: '#d6e5bd',
  p300: '#b9cd98',
  p400: '#99ae73',
  p500: '#7a9052',
  p600: '#607537',
  p700: '#485a21',
  p800: '#32410f',
  p900: '#1e2903',
  n50: '#f6f7f3',
  n100: '#eeefea',
  n200: '#dadbd6',
  n300: '#bdbfb8',
  n400: '#8e9089',
  n500: '#6b6d66',
  n600: '#52534d',
  n700: '#3c3e39',
  n800: '#262723',
  n900: '#11120f',
  success: '#607537',
  warning: '#906600',
  error: '#b6143f',
  info: '#1d60bc',
  /** chart1 = p700 (브랜드 메인 강조색과 항상 동일하게 유지) */
  chart1: '#485a21',
  chart2: '#e8929b',
  chart3: '#efb94a',
  chart4: '#9b7ba8',
  /** 과학(청화블루) */
  chart5: '#0089ff',
  /** 경제·경영(먹빛 남색) */
  chart6: '#1c1a46',
  surface: '#ffffff',
  /** 라이트모드는 기존 RootNavigator가 쓰던 n50과 동일 — 변경 없음 */
  appBackground: '#f6f7f3',
  /** accentSolidBg = p700 */
  accentSolidBg: '#485a21',
  onAccentSolid: '#ffffff',
  warnBg: '#fbf3e2',
  warnText: '#5c4300',
  hairline: 'rgba(17,18,15,0.08)',
};

export const darkColors: ThemeColors = {
  p50: '#121906',
  p100: '#1b2309',
  p200: '#27330d',
  p300: '#667b3d',
  p400: '#667b3d',
  p500: '#748a48',
  p600: '#657b39',
  p700: '#8da267',
  p800: '#adc08b',
  p900: '#cfdeb7',
  // 테스터 리포트 FINDING-20260828-05: n50이 n100보다 밝아 다크 램프가 극단에서 뒤집혀
  // 있었다(n50이 가장 어두워야 함). design엔 다크 뉴트럴 램프 10단계 명세가 없어(주로
  // d-surface-*/d-text-* 토큰만 있음) 프론트가 자체 확장하며 순서를 놓친 것 — 두 값을
  // 맞바꿔서 n50→n900이 어두움→밝음 단조 증가하도록 정정.
  n50: '#1a1d17',
  n100: '#1e211b',
  n200: '#373934',
  n300: '#454741',
  n400: '#5f625b',
  n500: '#83857e',
  n600: '#aeb0a9',
  n700: '#d3d5ce',
  n800: '#eef0e9',
  n900: '#f5f6f1',
  success: '#748a48',
  warning: '#d59800',
  error: '#eb596e',
  info: '#5f99ed',
  /** 다크모드는 chart1 = accentSolidBg(p500) — 라이트와 동일하게 "브랜드 메인 강조색"을 따라감 */
  chart1: '#748a48',
  chart2: '#cd717c',
  chart3: '#ce9b2b',
  chart4: '#7d588c',
  chart5: '#009af3',
  chart6: '#98bed3',
  surface: '#242721',
  /**
   * design `--d-surface-app`(#181a14) — 카드(surface, #242721)보다 한 단계 더 어두운
   * 앱 바탕색. FINDING-20260828-06 반영.
   */
  appBackground: '#181a14',
  /** 다크모드 accentSolidBg는 p700이 아니라 p500 — v1.2 때부터 이어진 규칙, 값만 교체 */
  accentSolidBg: '#748a48',
  onAccentSolid: '#0f1a00',
  warnBg: '#332911',
  warnText: '#e3ae4c',
  hairline: 'rgba(255,255,255,0.09)',
};
