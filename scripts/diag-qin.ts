// 诊断秦稳定度异常
import { createWorldState } from '../src/engine/init';
import { processTurn } from '../src/engine/turn';
import { provincesOf } from '../src/engine/init';

const SEED = 12345;
let state = createWorldState(SEED, 'n_ea_qin');
const qin = state.nations['n_ea_qin'];
console.log('=== 秦初始 ===');
console.log('政体:', qin.government.type, '性格:', qin.character);
console.log('稳定:', qin.government.stability, '法统:', qin.government.legitimacy, '腐败:', qin.government.corruption, '治能:', qin.government.efficiency);
console.log('厌战:', qin.warExhaustion, '税率:', qin.taxRate);
console.log('派系:', qin.factions.map((f) => `${f.id}(权${f.power}满${f.satisfaction})`).join(' '));
const provs = provincesOf('n_ea_qin', state.provinces);
console.log('省份数:', provs.length, '总人口:', provs.reduce((s,p)=>s+p.population,0));
console.log('省份 unrest avg:', Math.round(provs.reduce((s,p)=>s+p.unrest,0)/provs.length));
console.log('可管省上限:', 50 + qin.tech.admin + Math.floor(qin.government.efficiency/25));

for (let t = 0; t < 20; t++) state = processTurn(state).state;
const qin2 = state.nations['n_ea_qin'];
console.log('\n=== 20回合后秦 ===');
console.log('稳定:', Math.round(qin2.government.stability), '法统:', Math.round(qin2.government.legitimacy), '腐败:', Math.round(qin2.government.corruption));
console.log('派系:', qin2.factions.map((f) => `${f.id}(权${f.power}满${Math.round(f.satisfaction)})`).join(' '));
const provs2 = provincesOf('n_ea_qin', state.provinces);
console.log('省份数:', provs2.length, 'unrest avg:', Math.round(provs2.reduce((s,p)=>s+p.unrest,0)/provs2.length));
console.log('厌战:', Math.round(qin2.warExhaustion));
