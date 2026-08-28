// 就诊领域类型
// 对应 DB 表 consultations，详见 ARCHITECTURE.md §5 数据模型

import type { ConsultationStatus, Medication, FollowUp } from '@/types/database';

// 结构化主诉（AI 输出）
export interface ChiefComplaint {
  chief_complaint: string;   // 主诉一句话
  main_symptoms: string[];  // 主要症状
  duration: string;          // 持续时间
  severity: 'mild' | 'moderate' | 'severe'; // 严重程度
}

// 就诊摘要（AI 输出，对应 consultation_summaries 表）
export interface ConsultationSummary {
  diagnosis: string | null;
  doctor_advice: string | null;
  medications: Medication[];
  follow_ups: FollowUp[];
  warnings: string[];
}

export type { ConsultationStatus };
