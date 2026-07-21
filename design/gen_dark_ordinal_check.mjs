import { contrast } from '/tmp/claude-0/bundled-skills/2.1.211/7ff41c68827c2e3dac44164aa4aa77cd/dataviz/scripts/validate_palette.js';
const surface = "#181a14";
console.log('d-p400 vs surface', contrast("#71a100", surface).toFixed(2));
console.log('d-p300 vs surface', contrast("#8bb54e", surface).toFixed(2));
console.log('dark-on-btn vs d-p500', contrast("#0f1a00", "#649000").toFixed(2));
console.log('white vs d-p500', contrast("#ffffff", "#649000").toFixed(2));
console.log('text-primary vs surface-card', contrast("#eaece5", "#242721").toFixed(2));
