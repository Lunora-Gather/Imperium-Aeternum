import { createWorldState } from '../src/engine/init';
import { provincesOf } from '../src/engine/init';
import { factionWeightedSat, stabilityDelta } from '../src/engine/formulas';

const s = createWorldState(12345);
const pid = Object.keys(s.nations).find(k => s.nations[k].isPlayer) || '';
const n = s.nations[pid];
const provs = provincesOf(pid, s.provinces);
const fw = factionWeightedSat(n.factions);
const avgUnrest = provs.reduce((s, p) => s + p.unrest, 0) / provs.length;
const rebCount = provs.filter(p => p.rebellionRisk >= 100).length;

console.log('=== 稳定度诊断 ===');
console.log('合法性:', n.government.legitimacy);
console.log('派系加权满意度:', fw);
console.log('平均不满:', avgUnrest);
console.log('叛乱省数:', rebCount);
console.log('省份数:', provs.length);
console.log('厌战:', n.warExhaustion);

const d = stabilityDelta(n.government.legitimacy, fw.weighted, fw.totalPower, avgUnrest, n.warExhaustion, rebCount);
console.log('stabilityDelta 结果:', d);
console.log('各派系:', n.factions.map(f => `${f.id}: power=${f.power} sat=${f.satisfaction}`));
