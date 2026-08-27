import { converter, formatHex, oklch } from 'culori';

const toOklch = converter('oklch');

// 1. 기준 쑥색 확인
const base = toOklch('#7D8F5D');
console.log('기준 쑥송편 색 OKLCH:', base);

// 2. 쑥색 계열 hue 확정 — 기존 그린(hue 140)보다 노란기 도는 재래식 초록.
//    기준색의 hue를 그대로 채도만 조정해 브랜드 톤에 맞춤.
const HUE = base.h;
console.log('사용할 hue:', HUE);

// 3. 라이트 10단계 램프 — 기존 primary 그린(v1.2)과 동일한 명도(L) 타겟을 재사용해
//    버튼/텍스트 등 기존 컴포넌트에서 명도 위계가 그대로 이어지도록 함.
//    기존 v1.2 L값 근사(50~900): 0.975,0.955,0.90,0.84,0.76,0.68,0.58,0.48,0.38,0.28
const lightTargets = [
  { step: 50,  l: 0.975, c: 0.020 },
  { step: 100, l: 0.955, c: 0.035 },
  { step: 200, l: 0.90,  c: 0.055 },
  { step: 300, l: 0.82,  c: 0.075 },
  { step: 400, l: 0.72,  c: 0.085 },
  { step: 500, l: 0.62,  c: 0.090 },
  { step: 600, l: 0.53,  c: 0.090 },
  { step: 700, l: 0.44,  c: 0.085 },
  { step: 800, l: 0.35,  c: 0.075 },
  { step: 900, l: 0.26,  c: 0.060 },
];

const darkTargets = [
  { step: 50,  l: 0.20, c: 0.035 },
  { step: 100, l: 0.24, c: 0.045 },
  { step: 200, l: 0.30, c: 0.060 },
  { step: 300, l: 0.55, c: 0.090 },
  { step: 400, l: 0.55, c: 0.090 },
  { step: 500, l: 0.60, c: 0.095 },
  { step: 600, l: 0.55, c: 0.095 },
  { step: 700, l: 0.68, c: 0.085 },
  { step: 800, l: 0.78, c: 0.075 },
  { step: 900, l: 0.88, c: 0.055 },
];

function ramp(targets) {
  const out = {};
  for (const t of targets) {
    const hex = formatHex({ mode: 'oklch', l: t.l, c: t.c, h: HUE });
    out[t.step] = hex;
  }
  return out;
}

const light = ramp(lightTargets);
const dark = ramp(darkTargets);

console.log('\n라이트 램프:');
for (const [k, v] of Object.entries(light)) console.log(`  --p${k}: ${v};`);
console.log('\n다크 램프:');
for (const [k, v] of Object.entries(dark)) console.log(`  --p${k}: ${v};`);

// 4. WCAG 대비 계산
function hexToRgb(h) {
  h = h.replace('#','');
  return [0,2,4].map(i => parseInt(h.slice(i,i+2),16));
}
function luminance([r,g,b]) {
  const f = c => { c/=255; return c<=0.03928 ? c/12.92 : ((c+0.055)/1.055)**2.4; };
  const [rl,gl,bl] = [r,g,b].map(f);
  return 0.2126*rl + 0.7152*gl + 0.0722*bl;
}
function contrast(h1, h2) {
  const l1 = luminance(hexToRgb(h1));
  const l2 = luminance(hexToRgb(h2));
  const [a,b] = [Math.max(l1,l2), Math.min(l1,l2)];
  return (a+0.05)/(b+0.05);
}

console.log('\n=== WCAG 대비 검증 (라이트) ===');
console.log('primary-700 vs 흰배경(#fff):', contrast(light[700], '#ffffff').toFixed(2), '(버튼 텍스트용, AA large 3:1 / normal 4.5:1)');
console.log('흰텍스트 vs primary-700(버튼배경):', contrast('#ffffff', light[700]).toFixed(2));
console.log('흰텍스트 vs primary-600(버튼배경):', contrast('#ffffff', light[600]).toFixed(2));
console.log('primary-800 vs 흰배경(강조텍스트):', contrast(light[800], '#ffffff').toFixed(2));

console.log('\n=== WCAG 대비 검증 (다크, surface #242721) ===');
console.log('다크텍스트(#0f1a00) vs primary-500(버튼배경):', contrast('#0f1a00', dark[500]).toFixed(2));
console.log('다크텍스트(#0f1a00) vs primary-600(버튼배경):', contrast('#0f1a00', dark[600]).toFixed(2));
console.log('primary-700(다크) vs surface(#242721):', contrast(dark[700], '#242721').toFixed(2), '(강조 텍스트용)');
