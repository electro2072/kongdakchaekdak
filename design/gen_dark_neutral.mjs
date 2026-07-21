import { clampChroma, formatHex } from '/home/claude/.npm-global/lib/node_modules/culori/bundled/culori.min.mjs';
import { contrast } from '/tmp/claude-0/bundled-skills/2.1.211/7ff41c68827c2e3dac44164aa4aa77cd/dataviz/scripts/validate_palette.js';
function toHex(L, C, H) { return formatHex(clampChroma({ mode: 'oklch', l: L, c: C, h: H }, 'oklch', 'rgb')); }
const HUE = 120;
const DARK_SURFACE = "#181a14";
const steps = {
  "text-primary":   [0.94, 0.010],
  "text-secondary": [0.78, 0.010],
  "text-muted":     [0.60, 0.009],
  "border":         [0.34, 0.008],
  "surface-2":      [0.19, 0.007],  // 카드 표면
  "surface-1":      [0.11, 0.006],  // 앱 배경
};
for (const [name,[L,C]] of Object.entries(steps)) {
  const hex = toHex(L,C,HUE);
  console.log(name.padEnd(16), hex, 'vs', DARK_SURFACE, '=', contrast(hex, DARK_SURFACE).toFixed(2));
}
