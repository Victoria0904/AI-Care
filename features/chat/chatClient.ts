// 主诉对话 AI 客户端
// Mock 模式下用预置脚本，否则调 GLM-4-Flash（赛后接 Edge Function）
// 详见 PRD.md 功能 A：诊前整理主诉

import { Constants } from '@/lib/constants';
import { MAX_CHAT_ROUNDS } from '@/lib/constants';
import type { ChiefComplaint } from '@/features/consultation/types';

// ===== Mock 对话脚本 =====
// AI 按轮次提问，5 轮内归纳结构化主诉
const MOCK_AI_PROMPTS = [
  '您好，我是 AI 陪诊助手。请问今天主要哪里不舒服？',
  '了解。这个症状持续多长时间了？是偶尔还是持续？',
  '疼痛或不适程度如何？能打个分吗（1-10 分，10 分最严重）？',
  '除了主要症状，还有其他伴随情况吗？比如发热、恶心、头晕等。',
  '好的，我已帮您整理出结构化主诉，请确认后即可开始就诊。',
];

// Mock：根据用户回答生成结构化主诉
function mockSummarize(userAnswers: string[]): ChiefComplaint {
  const symptom = userAnswers[0] || '未描述';
  const duration = userAnswers[1] || '未明确';
  const severityText = userAnswers[2] || '';
  let severity: ChiefComplaint['severity'] = 'moderate';
  if (/轻|1|2|3|4/.test(severityText)) severity = 'mild';
  else if (/重|7|8|9|10/.test(severityText)) severity = 'severe';

  const accompanying = userAnswers[3] || '无';

  return {
    chief_complaint: `${symptom} ${duration}`,
    main_symptoms: [symptom, ...(accompanying && accompanying !== '无' ? [accompanying] : [])],
    duration,
    severity,
  };
}

/**
 * 获取 AI 第 n 轮的提问（0-indexed）
 * Mock 模式返回脚本，真实模式调 LLM
 */
export async function getAiPrompt(round: number, history: string[]): Promise<string> {
  if (Constants.USE_MOCK) {
    // 简单延时模拟网络
    await new Promise((r) => setTimeout(r, 400));
    return MOCK_AI_PROMPTS[round] ?? MOCK_AI_PROMPTS[MOCK_AI_PROMPTS.length - 1];
  }
  // 真实模式：调 GLM-4-Flash
  // TODO: 赛后通过 Supabase Edge Function 调 LLM
  return MOCK_AI_PROMPTS[round] ?? MOCK_AI_PROMPTS[MOCK_AI_PROMPTS.length - 1];
}

/**
 * 生成结构化主诉
 * @param userAnswers 用户 5 轮回答
 */
export async function summarizeChiefComplaint(userAnswers: string[]): Promise<ChiefComplaint> {
  if (Constants.USE_MOCK) {
    await new Promise((r) => setTimeout(r, 600));
    return mockSummarize(userAnswers);
  }
  // TODO: 真实模式调 LLM + JSON Schema 约束输出
  return mockSummarize(userAnswers);
}

export { MAX_CHAT_ROUNDS };
