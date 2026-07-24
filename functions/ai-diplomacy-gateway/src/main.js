import { Client, TablesDB } from 'node-appwrite';
import { aiErrorStatus, createSummitMessages, normalizeSummitRequest, parseSummitBrief } from './policy.js';
import { releaseAIQuota, reserveAIQuota } from './quota.js';

function database(req) {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(req.headers['x-appwrite-key']);
  return new TablesDB(client);
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
    const db = database(req);
    const reservation = await reserveAIQuota(db, userId);
    try {
      const result = await inferBrief(data);
      return res.json({ ok: true, available: true, source: 'huggingface', brief: result.brief, model: result.model, quota: reservation.quota });
    } catch (cause) {
      await releaseAIQuota(db, reservation.plan).catch((releaseError) => error(`AI quota release failed: ${releaseError instanceof Error ? releaseError.message : String(releaseError)}`));
      throw cause;
    }
  } catch (cause) {
    error(cause instanceof Error ? cause.message : String(cause));
    const message = cause instanceof Error ? cause.message : 'AI 研判失败';
    const status = aiErrorStatus(message);
    return res.json({ ok: false, available: status !== 503, message }, status);
  }
};
