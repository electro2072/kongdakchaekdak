/**
 * 디자인 시스템 v1.2 컬러 팔레트 (design/color_chips.html, design/hifi_mockup_v1.html과 동일한 값).
 * OKLCH hue 140°(연두) 기반 primary 램프 + neutral 램프 + 상태색 + 카테고리 포인트 멀티컬러.
 * 라이트/다크 모두 같은 hue를 유지하고 명도만 재조정한 것 — 자세한 도출 근거는 design/README.md 참고.
 */

export interface ThemeColors {
  /** Primary(연두) 램프 50~900 */
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
  /** 시맨틱 토큰 */
  surface: string;
  accentSolidBg: string;
  onAccentSolid: string;
  warnBg: string;
  warnText: string;
  hairline: string;
}

export const lightColors: ThemeColors = {
  p50: '#e8fee4',
  p100: '#d6fbcd',
  p200: '#aff3a0',
  p300: '#86e670',
  p400: '#5bd43d',
  p500: '#3fbd13',
  p600: '#34a00f',
  p700: '#288109',
  p800: '#1c6005',
  p900: '#104103',
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
  success: '#34a00f',
  warning: '#906600',
  error: '#b6143f',
  info: '#1d60bc',
  chart1: '#288109',
  chart2: '#dc747e',
  chart3: '#0ec7de',
  chart4: '#918be5',
  surface: '#ffffff',
  accentSolidBg: '#288109',
  onAccentSolid: '#ffffff',
  warnBg: '#fbf3e2',
  warnText: '#5c4300',
  hairline: 'rgba(17,18,15,0.08)',
};

export const darkColors: ThemeColors = {
  p50: '#1a2d15',
  p100: '#274520',
  p200: '#305528',
  p300: '#66bd52',
  p400: '#66bd52',
  p500: '#31980b',
  p600: '#2c880c',
  p700: '#66bd52',
  p800: '#85d873',
  p900: '#b2eca6',
  n50: '#1e211b',
  n100: '#1a1d17',
  n200: '#373934',
  n300: '#454741',
  n400: '#5f625b',
  n500: '#83857e',
  n600: '#aeb0a9',
  n700: '#d3d5ce',
  n800: '#eef0e9',
  n900: '#f5f6f1',
  success: '#79ab1a',
  warning: '#d59800',
  error: '#eb596e',
  info: '#5f99ed',
  chart1: '#31980b',
  chart2: '#c8787e',
  chart3: '#00a5b9',
  chart4: '#6b64ba',
  surface: '#242721',
  accentSolidBg: '#31980b',
  onAccentSolid: '#0f1a00',
  warnBg: '#332911',
  warnText: '#e3ae4c',
  hairline: 'rgba(255,255,255,0.09)',
};
