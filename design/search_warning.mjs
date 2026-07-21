import { clampChroma, formatHex } from '/home/claude/.npm-global/lib/node_modules/culori/bundled/culori.min.mjs';

// validate_palette.js internal cvd functions aren't exported individually beyond `validate`,
// so shell out to the CLI validator for each candidate pair instead.
function toHex(L, C, H) {
  return formatHex(clampChroma({ mode: 'oklch', l: L, c: C, h: H }, 'oklch', 'rgb'));
}
const brand = "#699700"; // primary-600, reused as "success"
for (let H = 40; H <= 110; H += 10) {
  for (let L of [0.5, 0.55, 0.6]) {
    const hex = toHex(L, 0.15, H);
    console.log(H, L, hex);
  }
}
