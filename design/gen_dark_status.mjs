import { clampChroma, formatHex } from '/home/claude/.npm-global/lib/node_modules/culori/bundled/culori.min.mjs';
import { contrast } from '/tmp/claude-0/bundled-skills/2.1.211/7ff41c68827c2e3dac44164aa4aa77cd/dataviz/scripts/validate_palette.js';
function toHex(L, C, H) { return formatHex(clampChroma({ mode: 'oklch', l: L, c: C, h: H }, 'oklch', 'rgb')); }
const surface = "#181a14";
const cands = {
  success: [0.68, 0.17, 128],  // reuse primary-ish hue, brightened for dark bg
  warning: [0.72, 0.15, 80],
  error:   [0.66, 0.18, 15],
  info:    [0.68, 0.14, 258],
};
for (const [name,[L,C,H]] of Object.entries(cands)) {
  const hex = toHex(L,C,H);
  console.log(name.padEnd(8), hex, 'contrast vs dark surface:', contrast(hex, surface).toFixed(2));
}
