import { contrast } from '/tmp/claude-0/bundled-skills/2.1.211/7ff41c68827c2e3dac44164aa4aa77cd/dataviz/scripts/validate_palette.js';
const white = "#ffffff";
const status = {
  success: "#3E7500",
  warning: "#9C5D00",
  error:   "#D0242A",
  info:    "#1D5FD6",
};
for (const [name, hex] of Object.entries(status)) {
  const r = contrast(hex, white);
  console.log(`${name.padEnd(8)} ${hex}  대비=${r.toFixed(2)}:1  ${r>=4.5?"PASS":"FAIL"}`);
}
