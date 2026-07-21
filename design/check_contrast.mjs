import { contrast } from '/tmp/claude-0/bundled-skills/2.1.211/7ff41c68827c2e3dac44164aa4aa77cd/dataviz/scripts/validate_palette.js';

const primary = {50:"#f0fce3",100:"#e3f7cc",200:"#c9ec9d",300:"#aedd6d",400:"#93c936",500:"#7db200",600:"#699700",700:"#547a00",800:"#3d5a00",900:"#283d00"};
const neutral = {50:"#f6f7f3",100:"#eeefea",200:"#dadbd6",300:"#bdbfb8",400:"#8e9089",500:"#6b6d66",600:"#52534d",700:"#3c3e39",800:"#262723",900:"#11120f"};
const white = "#ffffff";

const pairs = [
  ["흰색 텍스트 on primary-500(버튼bg)", white, primary[500]],
  ["흰색 텍스트 on primary-600(버튼bg)", white, primary[600]],
  ["흰색 텍스트 on primary-700(버튼bg)", white, primary[700]],
  ["primary-700 텍스트 on 흰 배경", primary[700], white],
  ["primary-800 텍스트 on 흰 배경", primary[800], white],
  ["primary-900 텍스트 on 흰 배경", primary[900], white],
  ["neutral-900 텍스트 on 흰 배경 (본문)", neutral[900], white],
  ["neutral-700 텍스트 on 흰 배경 (보조)", neutral[700], white],
  ["neutral-500 텍스트 on 흰 배경 (placeholder)", neutral[500], white],
  ["primary-900 텍스트 on primary-50(연한 배경 카드)", primary[900], primary[50]],
  ["neutral-900 텍스트 on primary-50", neutral[900], primary[50]],
];

for (const [label, fg, bg] of pairs) {
  const r = contrast(fg, bg);
  const pass4_5 = r >= 4.5 ? "PASS(본문4.5:1)" : (r>=3 ? "WARN(큰글자용 3:1만)" : "FAIL");
  console.log(`${label.padEnd(38)} ${fg} / ${bg}  →  ${r.toFixed(2)}:1  ${pass4_5}`);
}
