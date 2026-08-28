// 全局常量与运行时配置开关
// 详见 ARCHITECTURE.md §9.5 环境变量

// Expo 会在打包时把 EXPO_PUBLIC_ 前缀的变量内联回调到此处
export const Constants = {
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',

  // Mock 开关：true 时所有外部 API（LLM/ASR）返回预置 JSON
  USE_MOCK: process.env.EXPO_PUBLIC_USE_MOCK === 'true',
} as const;

// 业务常量
export const MAX_CHAT_ROUNDS = 5; // 诊前主诉对话最大轮数
export const TRANSCRIPT_SEGMENT_INTERVAL_MS = 1500; // Mock ASR 推送间隔
