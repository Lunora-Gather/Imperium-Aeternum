const integer = (value, min, max, label) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) throw new Error(`${label}无效`);
  return parsed;
};

export function normalizeCloudSavePayload(raw, nowMs = Date.now()) {
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('云存档内容不是有效 JSON');
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('云存档内容不是有效 JSON');

  const saveVersion = integer(parsed.version, 1, Number.MAX_SAFE_INTEGER, '存档版本');
  const gameState = parsed.gameState;
  if (!gameState || typeof gameState !== 'object' || Array.isArray(gameState)) throw new Error('云存档缺少游戏状态');
  const turn = integer(gameState.turn, 0, Number.MAX_SAFE_INTEGER, '存档回合');

  const updatedMs = Date.parse(String(parsed.createdAt ?? ''));
  if (!Number.isFinite(updatedMs) || updatedMs > nowMs + 300_000) throw new Error('存档更新时间无效');
  const clientUpdatedAt = new Date(updatedMs).toISOString();

  const playerNationId = typeof gameState.playerNationId === 'string' ? gameState.playerNationId : '';
  const nations = gameState.nations && typeof gameState.nations === 'object' && !Array.isArray(gameState.nations)
    ? gameState.nations
    : {};
  const nation = playerNationId && nations[playerNationId] && typeof nations[playerNationId] === 'object'
    ? nations[playerNationId]
    : null;
  const nationName = String(nation?.name ?? '未知国家').trim().slice(0, 128) || '未知国家';

  return { saveVersion, turn, nationName, clientUpdatedAt };
}
