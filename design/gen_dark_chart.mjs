import { clampChroma, formatHex } from '/home/claude/.npm-global/lib/node_modules/culori/bundled/culori.min.mjs';
function toHex(L, C, H) { return formatHex(clampChroma({ mode: 'oklch', l: L, c: C, h: H }, 'oklch', 'rgb')); }
const HUE = 128;
const steps = { a:[0.68,0.19], b:[0.605,0.19], c:[0.53,0.185], d:[0.455,0.165] };
for (const [k,[L,C]] of Object.entries(steps)) console.log(k, toHex(L,C,HUE));
