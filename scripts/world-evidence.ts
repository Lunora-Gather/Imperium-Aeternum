// 硬证据脚本：输出 192 国世界的真实统计数据
import { createWorldState } from '../src/engine/init';
import { processTurn } from '../src/engine/turn';

const s = createWorldState(12345);
const nations = Object.values(s.nations);
const provinces = Object.values(s.provinces);

const tiers: Record<string,number> = {S:0,A:0,B:0,C:0,D:0};
const govs: Record<string,number> = {};
const cultures: Record<string,number> = {};
const religions: Record<string,number> = {};

for (const n of nations) {
  tiers[n.tier]++;
  govs[n.government.type] = (govs[n.government.type]||0)+1;
}
for (const p of provinces) {
  cultures[p.culture] = (cultures[p.culture]||0)+1;
  religions[p.religion] = (religions[p.religion]||0)+1;
}

console.log('╔══════════════════════════════════════════════╗');
console.log('║  Imperium Aeternum — 世界级硬证据统计         ║');
console.log('╚══════════════════════════════════════════════╝');
console.log('');
console.log(`国家总数: ${nations.length}`);
console.log(`省份总数: ${provinces.length}`);
console.log(`外交关系: ${s.relations.length} (稀疏, 远小于全连接 ${nations.length*(nations.length-1)/2})`);
console.log('');
console.log('── 体量分级 ──');
for (const [t,c] of Object.entries(tiers)) console.log(`  ${t} 级: ${c} 国`);
console.log('');
console.log('── 政体分布 ──');
for (const [g,c] of Object.entries(govs).sort((a,b)=>b[1]-a[1])) console.log(`  ${g}: ${c}`);
console.log('');
console.log('── 文化分布(省份数) ──');
for (const [c,n] of Object.entries(cultures).sort((a,b)=>b[1]-a[1])) console.log(`  ${c}: ${n} 省`);
console.log('');
console.log('── 宗教分布(省份数) ──');
for (const [r,n] of Object.entries(religions).sort((a,b)=>b[1]-a[1])) console.log(`  ${r}: ${n} 省`);
console.log('');
console.log(`总军事力量: ${nations.reduce((s,n)=>s+n.army.reduce((a,b)=>a+b.size,0),0)} 人`);
console.log(`总国库: ${Math.round(nations.reduce((s,n)=>s+n.resources.gold,0))} 金`);
console.log(`总人口: ${provinces.reduce((s,p)=>s+p.population,0)} 人`);
console.log('');

// 推进 10 回合
let st = s;
const t0 = performance.now();
for (let i=0;i<10;i++) st = processTurn(st).state;
const elapsed10 = Math.round(performance.now()-t0);

// 推进到 50 回合
for (let i=10;i<50;i++) st = processTurn(st).state;
const elapsed50 = Math.round(performance.now()-t0);

const playerId = Object.keys(st.nations).find(k=>st.nations[k].isPlayer)||'';
const player = st.nations[playerId];
console.log('── 回合推进性能 ──');
console.log(`  10 回合: ${elapsed10} ms`);
console.log(`  50 回合: ${elapsed50} ms`);
console.log('');
console.log('── 玩家国家 50 回合后状态 ──');
console.log(`  ID: ${playerId}`);
console.log(`  名: ${player.name}`);
console.log(`  级: ${player.tier}`);
console.log(`  金: ${Math.round(player.resources.gold)}`);
console.log(`  粮: ${Math.round(player.resources.food)}`);
console.log(`  稳定度: ${Math.round(player.government.stability)}`);
console.log(`  合法性: ${Math.round(player.government.legitimacy)}`);
console.log(`  腐败度: ${Math.round(player.government.corruption)}`);
console.log(`  厌战度: ${Math.round(player.warExhaustion)}`);
console.log(`  省份数: ${Object.values(st.provinces).filter(p=>p.ownerId===playerId).length}`);
console.log('');
console.log('── 全世界 50 回合后 NaN 扫描 ──');
let nanCount = 0;
for (const n of Object.values(st.nations)) {
  if (!Number.isFinite(n.resources.gold)) nanCount++;
  if (!Number.isFinite(n.government.stability)) nanCount++;
  if (!Number.isFinite(n.government.legitimacy)) nanCount++;
}
for (const p of Object.values(st.provinces)) {
  if (!Number.isFinite(p.population)) nanCount++;
  if (!Number.isFinite(p.unrest)) nanCount++;
}
console.log(`  NaN/Infinity 数: ${nanCount}`);
console.log('');
console.log(nanCount === 0 && nations.length >= 170 && provinces.length >= 540
  ? '✅ 世界级硬证据验证通过'
  : '❌ 验证失败');
