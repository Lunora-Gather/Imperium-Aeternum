const DEFAULT_MAX_RESPONSE_BYTES = 64 * 1024;

export async function readBoundedJsonResponse(response, maxBytes = DEFAULT_MAX_RESPONSE_BYTES) {
  const declaredLength = Number(response.headers.get('content-length'));
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) throw new Error('AI 返回内容过大');
  if (!response.body) throw new Error('AI 返回格式无效');

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let received = 0;
  let raw = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > maxBytes) {
      await reader.cancel().catch(() => undefined);
      throw new Error('AI 返回内容过大');
    }
    raw += decoder.decode(value, { stream: true });
  }
  raw += decoder.decode();
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error('AI 返回格式无效');
  }
}
