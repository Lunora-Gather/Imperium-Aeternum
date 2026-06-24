// 专门诊断汉（S 级稳定度异常低）的状态
import { createWorldState } from '../src/engine/init';
import { processTurn } from '../src/engine/turn';

const SEED = 12345;
let state = createWorldState(SEED, 'n_ea_han');
// 调试：打印所有含 han/秦/罗马 的 nation id
const allIds = Object.keys(state.nations);
console.log('total nations:', allIds.length);
console.log('ids containing han/qin/rome/persia:', allIds.filter((id) => id.toLowerCase().includes('han') || id.includes('qin') || id.includes('rome') || id.includes('persia')));
console.log('first 10 ids:', allIds.slice(0, 10));
console.log('nations with isPlayer:', Object.values(state.nations).filter((n) => n.isPlayer).map((n) => `${n.id}(${n.name})`));
const han = state.nations['n_ea_han'];
console.log('=== 汉初始状态 ===');
console.log('政体:', han.government.type, '性格:', han.character);
console.log('稳定:', han.government.stability, '法统:', han.government.legitimacy, '腐败:', han.government.corruption, '治能:', han.government.efficiency);
console.log('派系:', han.factions.map((f) => `${f.id}(权${f.power}满${f.satisfaction})`).join(' '));
const provs = Object.values(state.provinces).filter((p) => p.ownerId === 'n_ea_han');
console.log('省份数:', provs.length);
console.log('省份:', provs.slice(0, 5).map((p) => `${p.name}(忠${Math.round(p.loyalty)}不满${Math.round(p.unrest)}叛${Math.round(p.rebellionRisk)})`).join(' '));

for (let t = 0; t < 20; t++) {
  state = processTurn(state).state;
}
const han2 = state.nations['n_ea_han'];
console.log('\n=== 20回合后汉状态 ===');
console.log('稳定:', Math.round(han2.government.stability), '法统:', Math.round(han2.government.legitimacy), '腐败:', Math.round(han2.government.corruption));
console.log('派系:', han2.factions.map((f) => `${f.id}(权${f.power}满${Math.round(f.satisfaction)})`).join(' '));
const provs2 = Object.values(state.provinces).filter((p) => p.ownerId === 'n_ea_han');
console.log('省份数:', provs2.length);
console.log('省份 unrest avg:', Math.round(provs2.reduce((s, p) => s + p.unrest, 0) / provs2.length));
console.log('统治者:', han2.ruler.name, '年龄', han2.ruler.age, '治能', han2.ruler.ability, '在位', han2.ruler.reignYears);
