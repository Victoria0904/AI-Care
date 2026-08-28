// 摘要 hook：生成摘要 + 持久化 + 订阅家属端推送
// 详见 PRD.md 功能 C 与 ARCHITECTURE.md §5

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Constants } from '@/lib/constants';
import * as mock from '@/lib/mockStore';
import { generateSummary } from './summarizeClient';
import { saveSummary, getSummary } from '@/features/consultation/consultationApi';
import type { ConsultationSummary, ChiefComplaint } from '@/features/consultation/types';

interface UseSummaryOptions {
  consultationId: string | null;
}

// 生成并保存摘要（患者端用）
export function useGenerateSummary({ consultationId }: UseSummaryOptions) {
  const [summary, setSummary] = useState<ConsultationSummary | null>(null);
  const [generating, setGenerating] = useState(false);

  const generate = useCallback(
    async (complaint: ChiefComplaint | null, transcriptText: string) => {
      if (!consultationId) return;
      setGenerating(true);
      try {
        const s = await generateSummary(complaint, transcriptText);
        await saveSummary(consultationId, s);
        setSummary(s);
      } finally {
        setGenerating(false);
      }
    },
    [consultationId]
  );

  // 进入摘要页时加载已保存的摘要
  useEffect(() => {
    if (!consultationId) return;
    (async () => {
      const existing = await getSummary(consultationId);
      if (existing) setSummary(existing as ConsultationSummary);
    })();
  }, [consultationId]);

  return { summary, generating, generate };
}

// 订阅摘要推送（家属端用，Realtime broadcast）
export function useSummarySubscription(consultationId: string | null) {
  const [summary, setSummary] = useState<ConsultationSummary | null>(null);
  const [received, setReceived] = useState(false);

  useEffect(() => {
    if (!consultationId) return;

    if (Constants.USE_MOCK) {
      // mock 模式：先查已有，再订阅后续推送
      const existing = mock.getSummary(consultationId);
      if (existing) {
        setSummary(existing as ConsultationSummary);
        setReceived(true);
      }
      const unsub = mock.subscribeSummary(consultationId, (payload) => {
        setSummary(payload as ConsultationSummary);
        setReceived(true);
      });
      return unsub;
    }

    // 真实模式：查已有 + 订阅 Realtime
    getSummary(consultationId).then((s) => {
      if (s) {
        setSummary(s as ConsultationSummary);
        setReceived(true);
      }
    });
    const channel = supabase
      .channel(`summary:${consultationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'consultation_summaries', filter: `consultation_id=eq.${consultationId}` },
        (payload) => {
          setSummary((payload.new as { new?: ConsultationSummary }).new ?? (payload.new as unknown as ConsultationSummary));
          setReceived(true);
        }
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [consultationId]);

  return { summary, received };
}
