import { Client, TablesDB } from 'node-appwrite';
import { createSummitMessages, normalizeSummitRequest, parseSummitBrief } from './policy.js';

const DATABASE_ID = 'imperium_game';
const USAGE_TABLE = 'ai_usage';

function hash(value) {
  let result = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) result = Math.imul(result ^ value.charCodeAt(index), 0x01000193);
  return (result >>> 0).toString(16).padStart(8, '0');
}

function database(req) {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(req.headers['x-appwrite-key']);
  return new TablesDB(client);
}

async function consumeDailyQuota(db, userId) {
  const day = new Date().toISOString().slice(0, 10);
  const userKey = hash(userId);
  const rowId = `ai_${userKey}_${day.replaceAll('-', '')}`;
  const limit = Math.max(1, Math.min(20, Number(process.env.AI_DAILY_LIMIT) || 5));
  try {
    const current = await db.getRow({ databaseId: DATABASE_ID, tableId: USAGE_TABLE, rowId });
    if (current.count >= limit) throw new Error(`今日 AI 研判次数已用完（${limit} 次）`);
    await db.updateRow({ databaseId: DATABASE_ID, tableId: USAGE_TABLE, rowId, data: { count: current.count + 1, updatedAt: new Date().toISOString() } });
    return { used: current.count + 1, limit };
  } catch (error) {
    if (error?.code !== 404) throw error;
    await db.createRow({ databaseId: DATABASE_ID, tableId: USAGE_TABLE, rowId, data: { userKey, day, count: 1, updatedAt: new Date().toISOString() } });
    return { used: 1, limit };
  }
}

async function inferBrief(data) {
  const token = process.env.HF_TOKEN;
  if (!token) throw new Error('Hugging Face 推理尚未配置');
  const model = process.env.HF_MODEL || 'Qwen/Qwen2.5-7B-Instruct';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 18_000);
  try {
    const response = await fetch('https://router.huggingface.co/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages: createSummitMessages(data), temperature: 0.35, max_tokens: 420 }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Hugging Face 推理暂不可用（${response.status}）`);
    const payload = await response.json();
    const content = payload?.choices?.[0]?.message?.content;
    return { brief: parseSummitBrief(content), model };
  } finally {
    clearTimeout(timeout);
  }
}

export default async ({ req, res, error }) => {
  try {
    if (req.method !== 'POST') return res.json({ ok: false, message: '仅支持 POST 请求' }, 405);
    const userId = req.headers['x-appwrite-user-id'];
    if (!userId) return res.json({ ok: false, message: '登录后才能使用 AI 书记官' }, 401);
    const data = normalizeSummitRequest(req.bodyJson ?? {});
    if (!process.env.HF_TOKEN) return res.json({ ok: false, available: false, message: 'AI 推理尚未启用，请使用规则简报' }, 503);
    const quota = await consumeDailyQuota(database(req), userId);
    const result = await inferBrief(data);
    return res.json({ ok: true, available: true, source: 'huggingface', brief: result.brief, model: result.model, quota });
  } catch (cause) {
    error(cause instanceof Error ? cause.message : String(cause));
    const message = cause instanceof Error ? cause.message : 'AI 研判失败';
    const status = /次数已用完/.test(message) ? 429 : /无效|格式/.test(message) ? 400 : 503;
    return res.json({ ok: false, available: status !== 503, message }, status);
  }
};
