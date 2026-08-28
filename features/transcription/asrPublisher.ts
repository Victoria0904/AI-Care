// ASR 转写片段发布器
// 把每段转写文本写入 DB + 通过 Realtime 推送给家属端
// Mock 模式下写入 mockStore 并触发订阅回调
// 详见 PRD.md 功能 B 与 ARCHITECTURE.md §5

import { supabase } from '@/lib/supabase';
import { Constants } from '@/lib/constants';
import * as mock from '@/lib/mockStore';
import type { Speaker } from '@/types/database';

export async function publishTranscript(
  consultationId: string,
  content: string,
  opts?: { is_final?: boolean; speaker?: Speaker | null }
) {
  if (Constants.USE_MOCK) {
    return mock.addTranscript(consultationId, content, opts);
  }
  // 真实模式：写入 transcripts 表，Realtime 自动广播
  // sequence_no 由 DB trigger 自动递增（见 migration），此处传 0 占位
  const { data, error } = await supabase
    .from('transcripts')
    .insert({
      consultation_id: consultationId,
      sequence_no: 0,
      content,
      is_final: opts?.is_final ?? true,
      speaker: opts?.speaker ?? 'unknown',
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// 订阅实时转写流（家属端用）
export function subscribeTranscripts(
  consultationId: string,
  cb: (transcript: mock.MockTranscript) => void
): () => void {
  if (Constants.USE_MOCK) {
    return mock.subscribeTranscripts(consultationId, cb as (p: unknown) => void);
  }
  const channel = supabase
    .channel(`transcripts:${consultationId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'transcripts', filter: `consultation_id=eq.${consultationId}` },
      (payload) => cb(payload.new as mock.MockTranscript)
    )
    .subscribe();
  return () => supabase.removeChannel(channel);
}
