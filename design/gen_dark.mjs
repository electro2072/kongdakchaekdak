import { clampChroma, formatHex } from '/home/claude/.npm-global/lib/node_modules/culori/bundled/culori.min.mjs';
import { contrast } from '/tmp/claude-0/bundled-skills/2.1.211/7ff41c68827c2e3dac44164aa4aa77cd/dataviz/scripts/validate_palette.js';

function toHex(L, C, H) {
  return formatHex(clampChroma({ mode: 'oklch', l: L, c: C, h: H }, 'oklch', 'rgb'));
}

const HUE = 128;
const DARK_SURFACE = "#181a14";   // 앱 배경 (약간 그린 기운의 다크 뉴트럴)
const CARD_SURFACE = "#242721";   // 카드/표면

// 다크모드 primary 스케일 — 라이트모드와 같은 hue, 밴드만 dark(0.48~0.67)에 맞춤 + 그 밖은 실사용 목적별로
const steps = {
  100: [0.90, 0.06],   // 아주 옅은 배경 틴트 (다크 배경 위 카드 하이라이트)
  200: [0.80, 0.10],
  300: [0.72, 0.14],   // 아이콘, 큰 그래픽
  400: [0.65, 0.17],   // 텍스트/링크용 밝은 그린 (다크 배경 대비 핵심)
  500: [0.60, 0.185],  // 메인 액션 배경 (다크 텍스트와 조합)
  600: [0.55, 0.19],
  700: [0.50, 0.18],
};

console.log('# Dark-mode primary (hue', HUE, ')');
const dark = {};
for (const [step, [L, C]] of Object.entries(steps)) {
  const hex = toHex(L, C, HUE);
  dark[step] = hex;
  console.log(step, hex, 'vs surface', DARK_SURFACE, '=', contrast(hex, DARK_SURFACE).toFixed(2));
}

console.log('\n# 후보 사용 조합 대비 체크');
const darkText = "#0f1a00"; // 버튼 위에 올릴 진한 텍스트
const pairs = [
  ["다크 배경 위 primary-400 텍스트/링크", dark[400], DARK_SURFACE],
  ["다크 배경 위 primary-300 아이콘", dark[300], DARK_SURFACE],
  ["primary-500 버튼 + 진한 텍스트(#0f1a00)", darkText, dark[500]],
  ["primary-600 버튼 + 진한 텍스트(#0f1a00)", darkText, dark[600]],
  ["primary-500 버튼 + 흰 텍스트", "#ffffff", dark[500]],
  ["카드 표면 위 neutral 텍스트(예상 #eef0e8)", "#eef0e8", CARD_SURFACE],
];
for (const [label, fg, bg] of pairs) {
  console.log(label.padEnd(45), fg, '/', bg, '→', contrast(fg, bg).toFixed(2));
}
console.log('\nJSON:', JSON.stringify({ dark, DARK_SURFACE, CARD_SURFACE }, null, 2));
