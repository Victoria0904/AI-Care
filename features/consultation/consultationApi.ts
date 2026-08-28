// 就诊记录 CRUD 封装
// Mock 模式下用内存存储，否则调 Supabase
// 详见 ARCHITECTURE.md §5 数据模型

import { supabase } from '@/lib/supabase';
import { Constants } from '@/lib/constants';
import * as mock from '@/lib/mockStore';
import type { ConsultationStatus } from './types';
import type { ConsultationSummary } from './types';

export async function createConsultation(patientId: string) {
  if (Constants.USE_MOCK) {
    return mock.createConsultation(patientId);
  }
  const { data, error } = await supabase
    .from('consultations')
    .insert({ patient_id: patientId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getConsultation(id: string) {
  if (Constants.USE_MOCK) {
    return mock.getConsultation(id);
  }
  const { data, error } = await supabase
    .from('consultations')
    .select()
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function updateConsultationStatus(
  id: string,
  status: ConsultationStatus,
  chiefComplaintText?: string
) {
  if (Constants.USE_MOCK) {
    return mock.updateConsultation(id, {
      status,
      ...(chiefComplaintText !== undefined ? { chief_complaint_text: chiefComplaintText } : {}),
    });
  }
  const patch = {
    status,
    ...(chiefComplaintText !== undefined ? { chief_complaint_text: chiefComplaintText } : {}),
  };
  const { data, error } = await supabase.from('consultations').update(patch).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

// 保存 AI 摘要到 consultation_summaries 表
export async function saveSummary(consultationId: string, summary: ConsultationSummary) {
  if (Constants.USE_MOCK) {
    return mock.saveSummary(consultationId, summary);
  }
  const { data, error } = await supabase
    .from('consultation_summaries')
    .insert({ consultation_id: consultationId, ...summary })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getSummary(consultationId: string) {
  if (Constants.USE_MOCK) {
    return mock.getSummary(consultationId);
  }
  const { data, error } = await supabase
    .from('consultation_summaries')
    .select()
    .eq('consultation_id', consultationId)
    .single();
  if (error) throw error;
  return data;
}
