const culori = require('culori');
const { oklch, rgb, formatHex, clampChroma } = culori;

// 연두색(yellow-green) 메인 테마 - 목표 hue
const GREEN_HUE = 128; // OKLCH hue, 연두/라임 느낌 (초록보다 노란기가 도는 쪽)

// step: [lightness, chroma] — 50(가장 밝음) -> 900(가장 어두움)
const STEPS = {
  50:  [0.975, 0.035],
  100: [0.95,  0.06],
  200: [0.90,  0.11],
  300: [0.84,  0.15],
  400: [0.77,  0.18],
  500: [0.70,  0.19],  // 메인 브랜드 컬러
  600: [0.62,  0.185],
  700: [0.53,  0.17],
  800: [0.43,  0.15],
  900: [0.33,  0.12],
};

function toHex(L, C, H) {
  const color = { mode: 'oklch', l: L, c: C, h: H };
  const clamped = clampChroma(color, 'oklch', 'rgb');
  return formatHex(clamped);
}

console.log('# Primary (연두) ramp');
const primary = {};
for (const [step, [L, C]] of Object.entries(STEPS)) {
  const hex = toHex(L, C, GREEN_HUE);
  primary[step] = hex;
  console.log(step, hex, 'L=' + L, 'C=' + C, 'H=' + GREEN_HUE);
}

// 중성 그레이 스케일 (약간 초록 기운이 도는 warm neutral로, hue를 primary와 살짝 맞춤)
const NEUTRAL_HUE = 120;
const NEUTRAL_STEPS = {
  50:  [0.975, 0.006],
  100: [0.95,  0.007],
  200: [0.89,  0.008],
  300: [0.80,  0.009],
  400: [0.65,  0.010],
  500: [0.53,  0.010],
  600: [0.44,  0.010],
  700: [0.36,  0.009],
  800: [0.27,  0.008],
  900: [0.18,  0.006],
};
console.log('\n# Neutral ramp');
const neutral = {};
for (const [step, [L, C]] of Object.entries(NEUTRAL_STEPS)) {
  const hex = toHex(L, C, NEUTRAL_HUE);
  neutral[step] = hex;
  console.log(step, hex);
}

// 차트/데이터 시각화용 서브셋 (ordinal 검증 통과 목표: 밝은 쪽도 배경 대비 2:1 이상,
// 인접 단계 간 명도차 0.06 이상)
const CHART_STEPS = {
  300: [0.75, 0.18],
  400: [0.67, 0.195],
  500: [0.59, 0.195],
  600: [0.51, 0.18],
  700: [0.43, 0.16],
  800: [0.35, 0.14],
};
console.log('\n# Chart(ordinal) subset');
const chart = {};
for (const [step, [L, C]] of Object.entries(CHART_STEPS)) {
  const hex = toHex(L, C, GREEN_HUE);
  chart[step] = hex;
  console.log(step, hex);
}

console.log('\nJSON:');
console.log(JSON.stringify({ primary, neutral, chart }, null, 2));
