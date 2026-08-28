// 摘要生成客户端
// 基于主诉 + 累积转写文本，调 AI 生成结构化就诊摘要
// Mock 模式用预置数据，真实模式调 GLM-4-Flash（赛后接 Edge Function）
// 详见 PRD.md 功能 C 与 ARCHITECTURE.md §2.5

import { Constants } from '@/lib/constants';
import type { ConsultationSummary, ChiefComplaint } from '@/features/consultation/types';

// Mock：根据主诉 + 转写文本生成预置摘要
function mockGenerate(complaint: ChiefComplaint | null, transcriptText: string): ConsultationSummary {
  return {
    diagnosis: '眩晕症（考虑血压偏高相关），颈椎待排查',
    doctor_advice:
      '建议低盐低脂饮食，规律作息，避免突然改变体位。监测血压早晚各一次并记录。一周后复诊，若头晕加重或出现肢体麻木立即就诊。',
    medications: [
      { name: '苯磺酸氨氯地平片', dosage: '5mg', frequency: '每日一次', duration: '长期，遵医嘱' },
      { name: '倍他司汀片', dosage: '1片', frequency: '每日三次', duration: '一周' },
    ],
    follow_ups: [
      { type: '复诊', time: '一周后', description: '神经内科复诊，带齐检查报告与血压记录' },
      { type: '检查', time: '本周内', description: '完成血常规、颈椎正侧位片' },
    ],
    warnings: [
      '避免驾驶或高空作业，防止头晕发作时发生意外',
      '降压药不可自行停药或加量',
      'AI 整理仅供参考，请以医嘱原件为准',
    ],
  };
}

/**
 * 生成就诊摘要
 * @param complaint 结构化主诉
 * @param transcriptText 累积转写文本
 */
export async function generateSummary(
  complaint: ChiefComplaint | null,
  transcriptText: string
): Promise<ConsultationSummary> {
  if (Constants.USE_MOCK) {
    // 模拟 AI 处理延时
    await new Promise((r) => setTimeout(r, 1200));
    return mockGenerate(complaint, transcriptText);
  }
  // TODO: 真实模式通过 Supabase Edge Function 调 GLM-4-Flash + JSON Schema 约束
  return mockGenerate(complaint, transcriptText);
}
