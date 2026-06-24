import { createWorldState } from '../src/engine/init';
import { processTurn } from '../src/engine/turn';

const s = createWorldState(12345);
const pid = Object.keys(s.nations).find(k => s.nations[k].isPlayer) || '';

let st = s;
for (let i = 0; i < 20; i++) st = processTurn(st).state;

// 全世界统计
const nations = Object.values(st.nations);
const provinces = Object.values(st.provinces);

// 1. 各 tier 国家的平均状态
const tierStats: Record<string, {count:number, avgGold:number, avgStab:number, avgFood:number, avgLegit:number}> = {};
for (const n of nations) {
  if (!tierStats[n.tier]) tierStats[n.tier] = {count:0, avgGold:0, avgStab:0, avgFood:0, avgLegit:0};
  const t = tierStats[n.tier];
  t.count++;
  t.avgGold += n.resources.gold;
  t.avgStab += n.government.stability;
  t.avgFood += n.resources.food;
  t.avgLegit += n.government.legitimacy;
}
for (const t of Object.values(tierStats)) {
  t.avgGold /= t.count; t.avgStab /= t.count; t.avgFood /= t.count; t.avgLegit /= t.count;
}

// 2. 战争数
const warCount = st.wars.length;

// 3. 事件触发数
const eventCount = st.triggeredEvents.length;

// 4. 负粮国数
const negFoodCount = nations.filter(n => n.resources.food < 0).length;

// 5. 零稳定国数
const zeroStabCount = nations.filter(n => n.government.stability === 0).length;

// 6. 被击败国数
const defeatedCount = nations.filter(n => n.defeated).length;

console.log('=== 20 回合后世界审查 ===');
console.log(`战争数: ${warCount}`);
console.log(`事件触发: ${eventCount}`);
console.log(`负粮国: ${negFoodCount}`);
console.log(`零稳定国: ${zeroStabCount}`);
console.log(`被击败国: ${defeatedCount}`);
console.log('');
console.log('── 各 tier 平均状态 ──');
for (const [tier, t] of Object.entries(tierStats)) {
  console.log(`  ${tier}: ${t.count}国 | 金${Math.round(t.avgGold)} 稳${t.avgStab.toFixed(1)} 粮${Math.round(t.avgFood)} 法${t.avgLegit.toFixed(1)}`);
}
console.log('');
// 7. 外交关系分布
const treatyCounts: Record<string,number> = {};
for (const r of st.relations) treatyCounts[r.treaty] = (treatyCounts[r.treaty]||0)+1;
console.log('── 外交条约分布 ──');
for (const [t,c] of Object.entries(treatyCounts)) console.log(`  ${t}: ${c}`);

// 8. 最富和最穷
const sorted = [...nations].sort((a,b) => b.resources.gold - a.resources.gold);
console.log('');
console.log('── 最富5国 ──');
for (const n of sorted.slice(0,5)) console.log(`  ${n.name}(${n.tier}): 金${Math.round(n.resources.gold)} 稳${Math.round(n.government.stability)}`);
console.log('── 最穷5国 ──');
for (const n of sorted.slice(-5)) console.log(`  ${n.name}(${n.tier}): 金${Math.round(n.resources.gold)} 稳${Math.round(n.government.stability)}`);

// 9. 问题国家
console.log('');
const problems = nations.filter(n => n.government.stability < 10 || n.resources.gold < -100);
console.log(`问题国家(稳<10或金<-100): ${problems.length}`);
for (const n of problems.slice(0,5)) console.log(`  ${n.name}(${n.tier}): 金${Math.round(n.resources.gold)} 稳${Math.round(n.government.stability)} 粮${Math.round(n.resources.food)}`);
