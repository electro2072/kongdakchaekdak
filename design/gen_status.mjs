import { clampChroma, formatHex } from '/home/claude/.npm-global/lib/node_modules/culori/bundled/culori.min.mjs';
import { contrast } from '/tmp/claude-0/bundled-skills/2.1.211/7ff41c68827c2e3dac44164aa4aa77cd/dataviz/scripts/validate_palette.js';

function toHex(L, C, H) {
  return formatHex(clampChroma({ mode: 'oklch', l: L, c: C, h: H }, 'oklch', 'rgb'));
}

const candidates = {
  success: { L: 0.5, C: 0.16, H: 142 },
  warning: { L: 0.54, C: 0.15, H: 80 },
  error:   { L: 0.5,  C: 0.19, H: 15 },
  info:    { L: 0.5,  C: 0.16, H: 258 },
};

const white = "#ffffff";
const hexes = {};
for (const [name, {L,C,H}] of Object.entries(candidates)) {
  const hex = toHex(L,C,H);
  hexes[name] = hex;
  console.log(name, hex, 'contrast on white:', contrast(hex, white).toFixed(2));
}
console.log(Object.values(hexes).join(','));
