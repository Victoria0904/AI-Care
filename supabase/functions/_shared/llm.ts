// 智谱 GLM-4-Flash 调用封装（Edge Function 服务端，key 不暴露到客户端）
// 接口：POST https://open.bigmodel.cn/api/paas/v4/chat/completions
// 详见 ARCHITECTURE.md §2.5 与 §7.1

const ZHIPU_API_BASE = 'https://open.bigmodel.cn/api/paas/v4';
const LLM_MODEL = 'glm-4-flash';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatCompletionResponse {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { code?: string; message?: string };
}

function getKey(): string {
  const key = Deno.env.get('ZHIPU_API_KEY');
  if (!key) throw new Error('missing ZHIPU_API_KEY env var');
  return key;
}

function authHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getKey()}`,
  };
}

/** 调 GLM-4-Flash 拿文本回复 */
export async function chatComplete(
  messages: ChatMessage[],
  opts?: { temperature?: number; maxTokens?: number }
): Promise<string> {
  const res = await fetch(`${ZHIPU_API_BASE}/chat/completions`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      model: LLM_MODEL,
      messages,
      temperature: opts?.temperature ?? 0.7,
      max_tokens: opts?.maxTokens ?? 1024,
    }),
  });
  if (!res.ok) {
    throw new Error(`LLM ${res.status}: ${await res.text().catch(() => '')}`);
  }
  const data = (await res.json()) as ChatCompletionResponse;
  if (data.error) throw new Error(`LLM error: ${data.error.message ?? 'unknown'}`);
  return data.choices?.[0]?.message?.content?.trim() ?? '';
}

/** 调 GLM-4-Flash 并解析 JSON（response_format json_object + 失败容错） */
export async function chatJSON<T = unknown>(messages: ChatMessage[]): Promise<T> {
  const res = await fetch(`${ZHIPU_API_BASE}/chat/completions`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      model: LLM_MODEL,
      messages,
      temperature: 0.3,
      response_format: { type: 'json_object' },
    }),
  });
  if (!res.ok) {
    throw new Error(`LLM ${res.status}: ${await res.text().catch(() => '')}`);
  }
  const data = (await res.json()) as ChatCompletionResponse;
  if (data.error) throw new Error(`LLM error: ${data.error.message ?? 'unknown'}`);
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('LLM empty response');
  try {
    return JSON.parse(content) as T;
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]) as T;
    throw new Error(`LLM non-json: ${content.slice(0, 200)}`);
  }
}
