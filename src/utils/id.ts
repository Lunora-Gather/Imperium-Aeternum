// Imperium Aeternum — 唯一 id 生成
// FROZEN v1（阶段 4）

let counter = 0;
export function genId(prefix = 'id'): string {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}_${counter.toString(36)}`;
}
