// 主诉对话 AI 客户端
// LLM_USE_REAL=true 时调智谱 GLM-4-Flash（lib/llmClient.ts），否则用预置脚本
// 详见 PRD.md 功能 A：诊前整理主诉 + ARCHITECTURE.md §2.5/§8

import { LLM_USE_REAL, MAX_CHAT_ROUNDS } from '@/lib/constants';
import { chatComplete, chatJSON, LlmError, type ChatMessage as LLMMessage } from '@/lib/llmClient';
import type { ChiefComplaint } from '@/features/consultation/types';

// ===== Mock 对话脚本 =====
// AI 按轮次提问，5 轮内归纳结构化主诉
// 第 0 轮固定用开场白，防 LLM 抖动翻车（见 §8）
const MOCK_AI_PROMPTS = [
  '您好，我是 AI 陪诊助手。请问今天主要哪里不舒服？',
  '了解。这个症状持续多长时间了？是偶尔还是持续？',
  '疼痛或不适程度如何？能打个分吗（1-10 分，10 分最严重）？',
  '除了主要症状，还有其他伴随情况吗？比如发热、恶心、头晕等。',
  '好的，我已帮您整理出结构化主诉，请确认后即可开始就诊。',
];

// Mock：根据用户回答生成结构化主诉（LLM 不可用 / 失败兜底）
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

// LLM system prompt：主诉问诊引导
const SYSTEM_PROMPT = `你是医院 AI 陪诊助手，协助患者在就诊前整理主诉。请用简短、口语化的中文，根据患者已回答的内容，生成下一句关键提问（围绕未问到的维度：症状部位/持续时间/严重程度/伴随症状/既往史等）。仅输出提问本身，不要前缀如"问："，不要解释、不要诊断、不要给医疗建议。`;

// LLM system prompt：结构化主诉 JSON 输出
const SUMMARIZE_SYSTEM = `你是医疗主诉整理助手。根据患者多轮回答，提炼结构化主诉，严格输出 JSON：
{
  "chief_complaint": "一句话主诉（症状+时间）",
  "main_symptoms": ["主要症状1", "伴随症状2"],
  "duration": "持续时间描述",
  "severity": "mild | moderate | severe"
}
severity 判定：自述轻微或 1-4 分 = mild；一般或 5-6 分 = moderate；剧烈或 7-10 分 = severe。只输出 JSON 对象，不要其他文字。`;

function buildContext(round: number, history: string[]): string {
  const ctx = history.map((a, i) => `第${i + 1}轮患者回答: ${a}`).join('\n');
  return `${ctx}\n\n请基于以上患者回答，生成第 ${round + 1} 轮的下一句关键提问。`;
}

/**
 * 获取 AI 第 n 轮的提问（0-indexed）
 * - 第 0 轮固定硬编码开场白（防 LLM 抖动）
 * - LLM_USE_REAL 时调 GLM-4-Flash，否则/失败时回 mock 脚本
 */
export async function getAiPrompt(round: number, history: string[]): Promise<string> {
  // 第 0 轮硬编码开场白（见 §8）
  if (round === 0) return MOCK_AI_PROMPTS[0];

  if (!LLM_USE_REAL) {
    await new Promise((r) => setTimeout(r, 400));
    return MOCK_AI_PROMPTS[round] ?? MOCK_AI_PROMPTS[MOCK_AI_PROMPTS.length - 1];
  }

  const messages: LLMMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: buildContext(round, history) },
  ];
  try {
    const next = await chatComplete(messages, { temperature: 0.7, maxTokens: 120 });
    return next || (MOCK_AI_PROMPTS[round] ?? MOCK_AI_PROMPTS[MOCK_AI_PROMPTS.length - 1]);
  } catch (e) {
    // LLM 失败：控制台打印结构化错误码（便于现场定位 key/模型/限流），兜底脚本继续
    if (e instanceof LlmError) console.warn('[chatClient:getAiPrompt] LLM 降级到 mock:', e.code, e.message);
    return MOCK_AI_PROMPTS[round] ?? MOCK_AI_PROMPTS[MOCK_AI_PROMPTS.length - 1];
  }
}

/**
 * 生成结构化主诉
 * LLM_USE_REAL 时调 GLM-4-Flash（response_format json_object），否则/失败时回 mock
 * @param userAnswers 用户多轮回答
 */
export async function summarizeChiefComplaint(userAnswers: string[]): Promise<ChiefComplaint> {
  if (!LLM_USE_REAL) {
    await new Promise((r) => setTimeout(r, 600));
    return mockSummarize(userAnswers);
  }

  const messages: LLMMessage[] = [
    { role: 'system', content: SUMMARIZE_SYSTEM },
    { role: 'user', content: userAnswers.map((a, i) => `第${i + 1}轮: ${a}`).join('\n') },
  ];
  try {
    const result = await chatJSON<ChiefComplaint>(messages);
    return {
      chief_complaint: result.chief_complaint ?? '未描述',
      main_symptoms: Array.isArray(result.main_symptoms) ? result.main_symptoms : [],
      duration: result.duration ?? '未明确',
      severity:
        result.severity === 'mild' || result.severity === 'moderate' || result.severity === 'severe'
          ? result.severity
          : 'moderate',
    };
  } catch (e) {
    if (e instanceof LlmError) console.warn('[chatClient:summarize] LLM 降级到 mock:', e.code, e.message);
    return mockSummarize(userAnswers);
  }
}

export { MAX_CHAT_ROUNDS };
