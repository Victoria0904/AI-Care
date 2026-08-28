// 摘要生成客户端
// LLM_USE_REAL=true 时调智谱 GLM-4-Flash（lib/llmClient.ts，JSON 输出），否则用预置数据
// 详见 PRD.md 功能 C 与 ARCHITECTURE.md §2.5/§8

import { LLM_USE_REAL } from '@/lib/constants';
import { chatJSON, type ChatMessage as LLMMessage } from '@/lib/llmClient';
import type { ConsultationSummary, ChiefComplaint } from '@/features/consultation/types';

// Mock：预置摘要（LLM 不可用 / 失败兜底）
function mockGenerate(complaint: ChiefComplaint | null, _transcriptText: string): ConsultationSummary {
  // 仅用 complaint 做轻量个性化，主体用预置数据保证 demo 稳定
  void complaint;
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

// LLM system prompt：结构化就诊摘要 JSON 输出（对齐 ConsultationSummary）
const SUMMARIZE_SYSTEM = `你是就诊摘要整理助手。根据患者主诉与医患对话转写文本，生成结构化就诊摘要，严格输出 JSON：
{
  "diagnosis": "诊断结论（转写中未明确写"未明确"）",
  "doctor_advice": "医嘱整理：饮食/作息/监测/复诊等要点",
  "medications": [{"name":"药品名","dosage":"剂量","frequency":"频次","duration":"疗程"}],
  "follow_ups": [{"type":"复诊|检查|监测","time":"时间","description":"说明"}],
  "warnings": ["注意事项1","注意事项2"]
}
要求：从转写文本中提取真实医嘱，不要臆造药品；字段无信息时用空数组或"未明确"占位；只输出 JSON 对象，不要其他文字。`;

/**
 * 生成就诊摘要
 * LLM_USE_REAL 时调 GLM-4-Flash（response_format json_object），否则/失败时回 mock
 * @param complaint 结构化主诉
 * @param transcriptText 累积转写文本（医患对话）
 */
export async function generateSummary(
  complaint: ChiefComplaint | null,
  transcriptText: string
): Promise<ConsultationSummary> {
  if (!LLM_USE_REAL) {
    await new Promise((r) => setTimeout(r, 1200));
    return mockGenerate(complaint, transcriptText);
  }

  const complaintText = complaint
    ? `主诉：${complaint.chief_complaint}；主要症状：${complaint.main_symptoms.join('、')}；持续：${complaint.duration}；程度：${complaint.severity}`
    : '主诉：未提供';
  const userContent = `${complaintText}\n\n医患对话转写：\n${transcriptText}`;

  const messages: LLMMessage[] = [
    { role: 'system', content: SUMMARIZE_SYSTEM },
    { role: 'user', content: userContent },
  ];
  try {
    const result = await chatJSON<ConsultationSummary>(messages);
    return {
      diagnosis: result.diagnosis ?? '未明确',
      doctor_advice: result.doctor_advice ?? '',
      medications: Array.isArray(result.medications) ? result.medications : [],
      follow_ups: Array.isArray(result.follow_ups) ? result.follow_ups : [],
      warnings: Array.isArray(result.warnings) ? result.warnings : [],
    };
  } catch {
    // LLM 失败兜底 mock
    return mockGenerate(complaint, transcriptText);
  }
}
