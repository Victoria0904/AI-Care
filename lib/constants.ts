// 全局常量与运行时配置开关
// 详见 ARCHITECTURE.md §9.5 环境变量
//
// 模型可切换：仅改 LLM_MODEL（+ 需要时覆盖 ZHIPU_API_BASE/ZHIPU_API_KEY）即可切供应商
// 支持的 model 别名：glm-4-flash（默认，免费）/ glm-4-plus / glm-4-air / glm-4.7-flash

const ZHIPU_ALIASES: Record<string, string> = {
  'glm-4-flash': 'glm-4-flash',
  'glm-4-plus': 'glm-4-plus',
  'glm-4-air': 'glm-4-air',
  'glm-4.7-flash': 'glm-4.7-flash',
  // 兼容大小写
  'GLM-4-FLASH': 'glm-4-flash',
  'GLM-4-PLUS': 'glm-4-plus',
  'GLM-4-AIR': 'glm-4-air',
  'GLM-4.7-FLASH': 'glm-4.7-flash',
};

function resolveLlmModel(raw: string): { resolved: string; fallback: boolean } {
  if (!raw) return { resolved: 'glm-4-flash', fallback: true };
  const mapped = ZHIPU_ALIASES[raw];
  if (mapped) return { resolved: mapped, fallback: false };
  // 不在白名单时，按 ExperienceRecall 308081 建议：回退到默认 glm-4-flash 防止 404
  return { resolved: 'glm-4-flash', fallback: true };
}

// Expo 会在打包时把 EXPO_PUBLIC_ 前缀的变量内联回调到此处
const ZHIPU_BASE_DEFAULT = 'https://open.bigmodel.cn/api/paas/v4';
const LLM_MODEL_RAW = process.env.EXPO_PUBLIC_LLM_MODEL ?? process.env.EXPO_PUBLIC_GLM_MODEL ?? 'glm-4-flash';
const { resolved: LLM_MODEL_RESOLVED, fallback: _MODEL_FALLBACK } = resolveLlmModel(LLM_MODEL_RAW);

export const Constants = {
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',

  // Mock 开关：true 时 auth/DB 返回预置数据；ASR/LLM 由各自 *_USE_REAL 决定
  USE_MOCK: process.env.EXPO_PUBLIC_USE_MOCK === 'true',

  // mosi.cn 多说话人语音转写（ASR）
  // 注：key 暴露到客户端仅限 demo，赛后应通过 Supabase Edge Function 中转
  MOSS_API_KEY: process.env.EXPO_PUBLIC_MOSS_API_KEY ?? '',
  MOSI_API_BASE: 'https://api.mosi.cn',
  // 多说话人转写模型 + 版本（支持流式 SSE + 说话人分离）
  ASR_MODEL: 'moss-transcribe-diarize',
  ASR_MODEL_VERSION: 'v20260410-streamparam-20260703',

  // 智谱 GLM（LLM）
  // 注：key 暴露到客户端仅限 demo（与 ASR 同策略），赛后通过 Supabase Edge Function 中转
  ZHIPU_API_KEY: process.env.EXPO_PUBLIC_ZHIPU_API_KEY ?? '',
  // 允许 EXPO_PUBLIC_ZHIPU_API_BASE 覆盖（切换通义千问/其他 OpenAI 兼容端点时用）
  ZHIPU_API_BASE: process.env.EXPO_PUBLIC_ZHIPU_API_BASE ?? ZHIPU_BASE_DEFAULT,
  // 允许 EXPO_PUBLIC_LLM_MODEL / EXPO_PUBLIC_GLM_MODEL 覆盖
  LLM_MODEL: LLM_MODEL_RESOLVED,
  // 诊断信息（方便调试时快速知道是否走了别名回退）
  LLM_MODEL_RAW: LLM_MODEL_RAW,
} as const;

// ASR 是否走真实 mosi.cn 接口（MOSS_API_KEY 已配置且非占位符）
// USE_MOCK=true 时 auth/DB 仍走 mock，仅 ASR 由 key 决定
export const ASR_USE_REAL =
  !!Constants.MOSS_API_KEY &&
  Constants.MOSS_API_KEY !== '请填入你的MOSS_API_KEY' &&
  Constants.MOSS_API_KEY !== 'your-moss-api-key';

// LLM 是否走真实智谱 GLM 接口（ZHIPU_API_KEY 已配置且非占位符）
// USE_MOCK=true 时 auth/DB 仍走 mock，仅 LLM 由 key 决定（与 ASR 同策略）
export const LLM_USE_REAL =
  !!Constants.ZHIPU_API_KEY &&
  Constants.ZHIPU_API_KEY !== '请填入你的ZHIPU_API_KEY' &&
  Constants.ZHIPU_API_KEY !== 'your-zhipu-api-key';

// 业务常量
export const MAX_CHAT_ROUNDS = 5; // 诊前主诉对话最大轮数
export const TRANSCRIPT_SEGMENT_INTERVAL_MS = 1500; // Mock ASR 推送间隔
