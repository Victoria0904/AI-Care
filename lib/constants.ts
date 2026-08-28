// 全局常量与运行时配置开关
// 详见 ARCHITECTURE.md §9.5 环境变量

// Expo 会在打包时把 EXPO_PUBLIC_ 前缀的变量内联回调到此处
export const Constants = {
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',

  // Mock 开关：true 时 auth/DB/LLM 返回预置数据
  USE_MOCK: process.env.EXPO_PUBLIC_USE_MOCK === 'true',

  // mosi.cn 多说话人语音转写（ASR）
  // 注：key 暴露到客户端仅限 demo，赛后应通过 Supabase Edge Function 中转
  MOSS_API_KEY: process.env.EXPO_PUBLIC_MOSS_API_KEY ?? '',
  MOSI_API_BASE: 'https://api.mosi.cn',
  // 多说话人转写模型 + 版本（支持流式 SSE + 说话人分离）
  ASR_MODEL: 'moss-transcribe-diarize',
  ASR_MODEL_VERSION: 'v20260410-streamparam-20260703',
} as const;

// ASR 是否走真实 mosi.cn 接口（MOSS_API_KEY 已配置且非占位符）
// USE_MOCK=true 时 auth/DB/LLM 仍走 mock，仅 ASR 由 key 决定
export const ASR_USE_REAL =
  !!Constants.MOSS_API_KEY &&
  Constants.MOSS_API_KEY !== '请填入你的MOSS_API_KEY' &&
  Constants.MOSS_API_KEY !== 'your-moss-api-key';

// 业务常量
export const MAX_CHAT_ROUNDS = 5; // 诊前主诉对话最大轮数
export const TRANSCRIPT_SEGMENT_INTERVAL_MS = 1500; // Mock ASR 推送间隔
