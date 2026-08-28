// 智谱 GLM-4-Flash 直连客户端（demo 妥协：key 暴露到客户端，赛后迁 Edge Function）
// 接口：POST {ZHIPU_API_BASE}/chat/completions
// 文档：https://open.bigmodel.cn/dev/api/normal-model/glm-4
// 详见 ARCHITECTURE.md §2.5 与 §8

import { Constants } from './constants';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatCompletionResponse {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { code?: string; message?: string };
}

function authHeaders(): Record<string, string> {
  if (!Constants.ZHIPU_API_KEY) throw new Error('未配置 ZHIPU_API_KEY，请检查 .env');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${Constants.ZHIPU_API_KEY}`,
  };
}

/**
 * 调用 GLM-4-Flash 拿文本回复
 * @param messages 对话历史（含 system prompt）
 * @param opts.temperature/maxTokens
 */
export async function chatComplete(
  messages: ChatMessage[],
  opts?: { temperature?: number; maxTokens?: number }
): Promise<string> {
  const res = await fetch(`${Constants.ZHIPU_API_BASE}/chat/completions`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      model: Constants.LLM_MODEL,
      messages,
      temperature: opts?.temperature ?? 0.7,
      max_tokens: opts?.maxTokens ?? 1024,
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`LLM 调用失败 ${res.status}: ${detail}`);
  }
  const data = (await res.json()) as ChatCompletionResponse;
  if (data.error) throw new Error(`LLM 错误: ${data.error.message ?? 'unknown'}`);
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('LLM 返回为空');
  return content.trim();
}

/**
 * 调用 GLM-4-Flash 并解析 JSON 输出（response_format 强制 JSON + 失败容错提取）
 * @param messages 对话历史（system prompt 应明确要求输出 JSON 结构）
 */
export async function chatJSON<T = unknown>(messages: ChatMessage[]): Promise<T> {
  const res = await fetch(`${Constants.ZHIPU_API_BASE}/chat/completions`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      model: Constants.LLM_MODEL,
      messages,
      temperature: 0.3,
      // glm-4 系列支持 json_object 模式，强制输出合法 JSON
      response_format: { type: 'json_object' },
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`LLM 调用失败 ${res.status}: ${detail}`);
  }
  const data = (await res.json()) as ChatCompletionResponse;
  if (data.error) throw new Error(`LLM 错误: ${data.error.message ?? 'unknown'}`);
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('LLM 返回为空');
  try {
    return JSON.parse(content) as T;
  } catch {
    // 容错：提取首个 JSON 对象（response_format 不被支持时的兜底）
    const match = content.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]) as T;
    throw new Error(`LLM 返回非 JSON: ${content.slice(0, 200)}`);
  }
}
