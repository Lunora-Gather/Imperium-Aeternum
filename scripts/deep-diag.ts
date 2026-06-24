import { createWorldState } from '../src/engine/init';
import { processTurn } from '../src/engine/turn';

const s = createWorldState(12345);
const nations = Object.values(s.nations);

// 找A级和汉，看初始状态
const aNations = nations.filter(n => n.tier === 'A');
const han = nations.find(n => n.name === '汉');

console.log('=== A级初始状态 ===');
for (const n of aNations) {
  const provs = Object.values(s.provinces).filter(p => p.ownerId === n.id);
  console.log(`${n.name}: 稳${n.government.stability} 法${n.government.legitimacy} 腐${n.government.corruption} 省${provs.length} 金${n.resources.gold} 粮${n.resources.food} 军${n.army.reduce((a,b)=>a+b.size,0)}`);
}

if (han) {
  const provs = Object.values(s.provinces).filter(p => p.ownerId === han.id);
  console.log(`\n=== 汉详情 ===`);
  console.log(`省份数: ${provs.length}`);
  console.log(`总人口: ${provs.reduce((s,p)=>s+p.population,0)}`);
  console.log(`军力: ${han.army.reduce((a,b)=>a+b.size,0)}`);
  console.log(`军费/回合: ${han.army.reduce((a,b)=>a+b.size,0) * 0.5}`);
  console.log(`税率: ${han.taxRate}`);
  console.log(`派系: ${han.factions.map(f=>`${f.id}=${f.satisfaction}`).join(' ')}`);
}

// 推进20回合，追踪汉稳定度
let st = s;
const pid = han ? han.id : '';
console.log('\n=== 汉稳定度追踪 ===');
for (let i = 0; i < 20; i++) {
  const before = st.nations[pid]?.government.stability ?? 0;
  st = processTurn(st).state;
  const after = st.nations[pid]?.government.stability ?? 0;
  if (i < 5 || i % 5 === 4) console.log(`回合${i+1}: ${before.toFixed(1)}→${after.toFixed(1)} delta=${(after-before).toFixed(2)} 法=${st.nations[pid].government.legitimacy.toFixed(1)} 腐=${st.nations[pid].government.corruption.toFixed(1)}`);
}

// D级最穷5国
const dNations = nations.filter(n => n.tier === 'D');
let st2 = createWorldState(12345);
for (let i = 0; i < 20; i++) st2 = processTurn(st2).state;
const dNow = Object.values(st2.nations).filter(n => n.tier === 'D').sort((a,b) => a.resources.gold - b.resources.gold);
console.log('\n=== D级最穷5国(20回合后) ===');
for (const n of dNow.slice(0,5)) {
  const provs = Object.values(st2.provinces).filter(p => p.ownerId === n.id);
  console.log(`${n.name}: 金${Math.round(n.resources.gold)} 粮${Math.round(n.resources.food)} 稳${Math.round(n.government.stability)} 省${provs.length} 人口${provs.reduce((s,p)=>s+p.population,0)} 军${n.army.reduce((a,b)=>a+b.size,0)}`);
}
