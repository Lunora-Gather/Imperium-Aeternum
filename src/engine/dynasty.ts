// Imperium Aeternum — 王朝系统 v1（C 阶段）
// 统治者 aging/死亡/继承，每回合推进一次
import type { Nation, Ruler } from '../types/game';

const RULER_NAMES = ['奥古斯都', '图拉真', '哈德良', '安东尼', '马可', '卢修斯', '康茂德', '塞维鲁', '卡拉卡拉', '戴克里先', '君士坦丁', '尤利安', '瓦伦斯', '格拉提安', '霍诺留', '查士丁尼', '希拉克略', '利奥', '芝诺', '巴西尔'];
const HEIR_NAMES = ['小布鲁图', '小西庇阿', '小凯撒', '小庞培', '小奥古斯都', '小图拉真', '小哈德良', '小马可', '小塞维鲁', '小君士坦丁', '小查士丁尼', '小希拉克略', '小利奥', '小巴西尔', '阿尔卡迪乌斯', '提奥多西', '瓦伦提尼安', '阿卡迪乌斯', '马尔基安', '芝诺二世'];

function pickName(pool: string[], rng: () => number): string {
  return pool[Math.floor(rng() * pool.length)] ?? '无名';
}

// 生成继承人（统治者 25 岁后每回合有几率获得继承人）
export function tryBirthHeir(nation: Nation, rng: () => number): boolean {
  if (nation.ruler.heir) return false;
  if (nation.ruler.age < 25 || nation.ruler.age > 55) return false;
  // 60% 概率获得继承人（若统治者正当壮年）
  if (rng() > 0.6) return false;
  nation.ruler.heir = {
    name: pickName(HEIR_NAMES, rng),
    ability: 35 + Math.round(rng() * 30),
    age: 1 + Math.round(rng() * 8),
  };
  return true;
}

// 统治者每回合 aging + 继承人 aging
export function ageRulers(nation: Nation, rng: () => number): { died: boolean; newRulerName?: string; eventLog?: string } {
  const r = nation.ruler;
  r.age += 1;
  r.reignYears = (r.reignYears ?? 0) + 1;
  if (r.heir) r.heir.age += 1;

  // 尝试获得继承人
  tryBirthHeir(nation, rng);

  // 死亡判定：60 岁后逐年递增死亡概率
  const deathChance = r.age < 60 ? 0 : (r.age - 60) * 0.04 + 0.02;
  if (rng() < deathChance) {
    return handleSuccession(nation, rng);
  }
  return { died: false };
}

// 统治者死亡 → 继承处理
function handleSuccession(nation: Nation, rng: () => number): { died: true; newRulerName: string; eventLog: string } {
  const oldName = nation.ruler.name;
  const heir = nation.ruler.heir;

  if (heir && heir.age >= 15) {
    // 成年继承人即位
    nation.ruler = { name: heir.name, ability: heir.ability, age: heir.age, reignYears: 0 };
    nation.ruler.heir = undefined;
    return { died: true, newRulerName: heir.name, eventLog: `${oldName} 驾崩，太子 ${heir.name} 即位（治能 ${heir.ability}）` };
  }
  // 无继承人或未成年 → 新统治者随机生成（旁系/摄政）
  const newAge = 25 + Math.round(rng() * 30);
  const newAbility = 35 + Math.round(rng() * 30);
  const newName = pickName(RULER_NAMES, rng);
  nation.ruler = { name: newName, ability: newAbility, age: newAge, reignYears: 0 };
  nation.ruler.heir = undefined;
  // 未成年继承人继位时合法性降低
  if (heir && heir.age < 15) {
    nation.government.legitimacy = Math.max(0, nation.government.legitimacy - 15);
    return { died: true, newRulerName: newName, eventLog: `${oldName} 驾崩，太子年幼，${newName} 摄政即位（治能 ${newAbility}），法统动摇` };
  }
  nation.government.legitimacy = Math.max(0, nation.government.legitimacy - 10);
  return { died: true, newRulerName: newName, eventLog: `${oldName} 驾崩无嗣，${newName} 继位（治能 ${newAbility}）` };
}

// 在位年数影响合法性（长期在位 +2/年，超 30 年衰退）
export function reignLegitimacy(nation: Nation): number {
  const years = nation.ruler.reignYears ?? 0;
  if (years <= 20) return 2;
  if (years <= 30) return 0;
  return -1; // 暮年衰退
}

// ── C1 纯函数版本（不 mutate，返回 final/delta 供 processTurn 合并） ──

export interface AgeRulersPureResult {
  rulerFinal: Ruler;
  govLegitimacyDelta?: number; // 继承时合法性变化（负值）
  died: boolean;
  newRulerName?: string;
  eventLog?: string;
}

export function ageRulersPure(nation: Nation, rng: () => number): AgeRulersPureResult {
  const r = nation.ruler;
  const newAge = r.age + 1;
  const newReign = (r.reignYears ?? 0) + 1;
  let heirFinal = r.heir ? { ...r.heir, age: r.heir.age + 1 } : undefined;

  // 尝试获得继承人（mutate-free 判断）
  if (!heirFinal && newAge >= 25 && newAge <= 55 && rng() <= 0.6) {
    heirFinal = {
      name: pickName(HEIR_NAMES, rng),
      ability: 35 + Math.round(rng() * 30),
      age: 1 + Math.round(rng() * 8),
    };
  }

  // 死亡判定
  const deathChance = newAge < 60 ? 0 : (newAge - 60) * 0.04 + 0.02;
  if (rng() >= deathChance) {
    return { died: false, rulerFinal: { ...r, age: newAge, reignYears: newReign, heir: heirFinal } };
  }

  // 继承处理（mutate-free）
  const oldName = r.name;
  const heir = heirFinal;
  if (heir && heir.age >= 15) {
    return {
      died: true,
      newRulerName: heir.name,
      eventLog: `${oldName} 驾崩，太子 ${heir.name} 即位（治能 ${heir.ability}）`,
      rulerFinal: { name: heir.name, ability: heir.ability, age: heir.age, reignYears: 0 },
    };
  }
  // 无继承人或未成年 → 新统治者随机生成
  const successorAge = 25 + Math.round(rng() * 30);
  const successorAbility = 35 + Math.round(rng() * 30);
  const successorName = pickName(RULER_NAMES, rng);
  if (heir && heir.age < 15) {
    return {
      died: true,
      newRulerName: successorName,
      eventLog: `${oldName} 驾崩，太子年幼，${successorName} 摄政即位（治能 ${successorAbility}），法统动摇`,
      rulerFinal: { name: successorName, ability: successorAbility, age: successorAge, reignYears: 0 },
      govLegitimacyDelta: -15,
    };
  }
  return {
    died: true,
    newRulerName: successorName,
    eventLog: `${oldName} 驾崩无嗣，${successorName} 继位（治能 ${successorAbility}）`,
    rulerFinal: { name: successorName, ability: successorAbility, age: successorAge, reignYears: 0 },
    govLegitimacyDelta: -10,
  };
}
