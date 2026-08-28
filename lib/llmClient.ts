// 智谱 GLM-4-Flash 直连客户端（demo 妥协：key 暴露到客户端，赛后迁 Edge Function）
// 接口：POST {ZHIPU_API_BASE}/chat/completions（OpenAI 兼容）
// 官方文档：https://docs.bigmodel.cn/cn/guide/models/text/glm-4
// 模型白名单/错误码：ExperienceRecall 308081（404 模型不可用必须熔断+降级，不能盲目重试）
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

export type LlmErrorCode =
  | 'NO_KEY' // 未配置 key
  | 'AUTH' // 401 鉴权失败
  | 'MODEL_NOT_FOUND' // 404 模型不存在/无权限
  | 'RATE_LIMIT' // 429 限流（免费 RPM=10）
  | 'SAFETY' // 1301 合规拦截
  | 'OVERLOAD' // 1302 模型过载
  | 'EMPTY' // 返回空内容
  | 'BAD_JSON' // JSON 模式输出非合法 JSON
  | 'NETWORK'; // 其他网络/服务错误

export class LlmError extends Error {
  constructor(
    public readonly code: LlmErrorCode,
    message: string,
    public readonly httpStatus?: number,
    public readonly raw?: unknown
  ) {
    super(message);
    this.name = 'LlmError';
  }
}

// —— 极简熔断：连续 MODEL_NOT_FOUND/AUTH 连续失败 N 次后 60s 内快速失败，防止真 Demo 链路拖死
const FUSE = {
  failures: 0,
  openUntil: 0,
  maxFailures: 3,
  cooldownMs: 60_000,
};

function tripped(): LlmError | null {
  if (FUSE.failures >= FUSE.maxFailures && Date.now() < FUSE.openUntil) {
    return new LlmError(
      'MODEL_NOT_FOUND',
      `LLM 熔断器已打开（连续 ${FUSE.failures} 次失败），${Math.ceil((FUSE.openUntil - Date.now()) / 1000)}s 后恢复，请检查 API Key / 模型名是否可用`,
      429
    );
  }
  return null;
}
function markFailure() {
  FUSE.failures += 1;
  if (FUSE.failures >= FUSE.maxFailures) FUSE.openUntil = Date.now() + FUSE.cooldownMs;
}
function markSuccess() {
  FUSE.failures = 0;
  FUSE.openUntil = 0;
}

function classifyError(httpStatus: number, detail: string, error?: { code?: string; message?: string }): LlmError {
  const code = error?.code ? String(error.code) : '';
  const message = error?.message ?? detail;
  if (httpStatus === 401) return new LlmError('AUTH', `鉴权失败（${code || '401'}）：${message}`, httpStatus);
  if (httpStatus === 404 || /InvalidEndpointOrModel|NotFound|model/i.test(detail))
    return new LlmError('MODEL_NOT_FOUND', `模型不可用（${code || '404'}）：${message} — 当前 model=${Constants.LLM_MODEL}，请确认 key 开通该模型权限或使用 glm-4-flash`, httpStatus);
  if (httpStatus === 429 || /rate limit|too many requests|quota/i.test(detail))
    return new LlmError('RATE_LIMIT', `触发限流（${code || '429'}）：${message}。glm-4-flash 免费 RPM=10，请降低调用频率或升档`, httpStatus);
  if (code === '1301') return new LlmError('SAFETY', `内容合规拦截：${message}`, httpStatus, detail);
  if (code === '1302') return new LlmError('OVERLOAD', `模型过载：${message}`, httpStatus, detail);
  return new LlmError('NETWORK', `LLM 服务错误 ${httpStatus} ${code}：${message}`, httpStatus, detail);
}

function authHeaders(): Record<string, string> {
  if (!Constants.ZHIPU_API_KEY || /^your-|请填入/.test(Constants.ZHIPU_API_KEY))
    throw new LlmError('NO_KEY', '未配置 ZHIPU_API_KEY，请检查 .env 里的 EXPO_PUBLIC_ZHIPU_API_KEY');
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Authorization: `Bearer ${Constants.ZHIPU_API_KEY}`,
  };
}

/**
 * 通用 POST 调 chat/completions，统一错误分类 + 熔断
 */
async function postCompletions(body: Record<string, unknown>): Promise<ChatCompletionResponse> {
  const fuse = tripped();
  if (fuse) throw fuse;

  let res: Response;
  try {
    res = await fetch(`${Constants.ZHIPU_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(body),
    });
  } catch (e) {
    markFailure();
    throw new LlmError(
      'NETWORK',
      `LLM 请求失败：${e instanceof Error ? e.message : String(e)}（base=${Constants.ZHIPU_API_BASE}）`
    );
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    let parsedErr: { code?: string; message?: string } | undefined;
    try {
      parsedErr = JSON.parse(detail)?.error;
    } catch { /* ignore */ }
    const err = classifyError(res.status, detail, parsedErr);
    // 致命类错误走熔断：AUTH/MODEL_NOT_FOUND
    if (err.code === 'AUTH' || err.code === 'MODEL_NOT_FOUND') markFailure();
    throw err;
  }

  let data: ChatCompletionResponse;
  try {
    data = (await res.json()) as ChatCompletionResponse;
  } catch {
    throw new LlmError('NETWORK', 'LLM 返回非 JSON 响应');
  }
  if (data.error) {
    const err = classifyError(res.status, '', data.error);
    if (err.code === 'AUTH' || err.code === 'MODEL_NOT_FOUND') markFailure();
    throw err;
  }
  markSuccess();
  return data;
}

/**
 * 调用 GLM 拿纯文本回复（主诉对话下一轮提问）
 * 默认 glm-4-flash，免费、低延迟；404/鉴权失败连续触发会熔断，自动走 mock 兜底（由上层 catch 决定）
 */
export async function chatComplete(
  messages: ChatMessage[],
  opts?: { temperature?: number; maxTokens?: number }
): Promise<string> {
  const data = await postCompletions({
    model: Constants.LLM_MODEL,
    messages,
    temperature: opts?.temperature ?? 0.7,
    max_tokens: opts?.maxTokens ?? 1024,
  });
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new LlmError('EMPTY', 'LLM 返回为空');
  return content.trim();
}

/**
 * 调用 GLM 并解析 JSON 输出（主诉结构化、就诊摘要结构化）
 * - 首选 response_format=json_object
 * - 失败兜底：正则提取首个 JSON 对象
 * - 仍失败 → 抛出 BAD_JSON，上层走 mock 兜底
 */
export async function chatJSON<T = unknown>(messages: ChatMessage[]): Promise<T> {
  const data = await postCompletions({
    model: Constants.LLM_MODEL,
    messages,
    temperature: 0.3,
    // glm-4 系列支持 json_object 模式，强制输出合法 JSON
    response_format: { type: 'json_object' },
  });
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new LlmError('EMPTY', 'LLM 返回为空');
  try {
    return JSON.parse(content) as T;
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]) as T;
      } catch {
        /* fallthrough */
      }
    }
    throw new LlmError('BAD_JSON', `LLM 返回非合法 JSON: ${content.slice(0, 200)}`);
  }
}
