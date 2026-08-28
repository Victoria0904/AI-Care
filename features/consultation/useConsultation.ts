// 就诊状态 hook：管理当前 consultationId 和创建流程
// 详见 ARCHITECTURE.md §2.4 状态管理

import { useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useAuth } from '@/features/auth/useAuth';
import { createConsultation, updateConsultationStatus } from './consultationApi';

export function useConsultation() {
  const { session } = useAuth();
  const currentConsultationId = useAppStore((s) => s.currentConsultationId);
  const setCurrentConsultationId = useAppStore((s) => s.setCurrentConsultationId);

  // 开始一次新的就诊（进入主诉对话前调用）
  const startConsultation = useCallback(async () => {
    const patientId = session?.user?.id;
    if (!patientId) throw new Error('未登录');
    const c = await createConsultation(patientId);
    setCurrentConsultationId(c.id);
    return c;
  }, [session, setCurrentConsultationId]);

  const updateStatus = useCallback(
    async (status: Parameters<typeof updateConsultationStatus>[1], chiefComplaintText?: string) => {
      if (!currentConsultationId) throw new Error('无当前就诊');
      return updateConsultationStatus(currentConsultationId, status, chiefComplaintText);
    },
    [currentConsultationId]
  );

  return {
    consultationId: currentConsultationId,
    startConsultation,
    updateStatus,
  };
}
