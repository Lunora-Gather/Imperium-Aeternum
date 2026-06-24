import { createWorldState } from '../src/engine/init';
import { processTurn } from '../src/engine/turn';

const s = createWorldState(12345);
const pid = Object.keys(s.nations).find(k => s.nations[k].isPlayer) || '';
const p0 = s.nations[pid];
console.log('初始状态:', { stability: p0.government.stability, legitimacy: p0.government.legitimacy, corruption: p0.government.corruption });

let st = s;
for (let i = 0; i < 10; i++) {
  const before = st.nations[pid].government.stability;
  st = processTurn(st).state;
  const after = st.nations[pid].government.stability;
  console.log(`回合${i+1}: 稳定度 ${before.toFixed(1)} → ${after.toFixed(1)} (delta=${(after-before).toFixed(2)}) 合法=${st.nations[pid].government.legitimacy.toFixed(1)} 粮=${Math.round(st.nations[pid].resources.food)}`);
}
