// 患者端就诊摘要页
// 基于主诉 + 转写文本，AI 生成结构化摘要并展示
// 详见 PRD.md 功能 C 与 ARCHITECTURE.md §3 app/(patient)/summary.tsx

import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Constants } from '@/lib/constants';
import * as mock from '@/lib/mockStore';
import { useConsultation } from '@/features/consultation/useConsultation';
import { useGenerateSummary } from '@/features/summary/useSummary';
import { SummaryView } from '@/components/summary/SummaryView';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { Button } from '@/components/ui/Button';
import type { ChiefComplaint } from '@/features/consultation/types';

export default function SummaryScreen() {
  const { consultationId, updateStatus } = useConsultation();
  const { summary, generating, generate } = useGenerateSummary({ consultationId });
  const [generated, setGenerated] = useState(false);

  // 进入页面：若无已保存摘要则生成
  useEffect(() => {
    if (!consultationId || generated) return;
    if (summary) {
      setGenerated(true);
      return;
    }
    (async () => {
      // 获取主诉文本
      let chiefComplaint: ChiefComplaint | null = null;
      let transcriptText = '';

      if (Constants.USE_MOCK) {
        const c = mock.getConsultation(consultationId);
        // mock 下主诉文本已结构化存储，这里简化为 null（mock 摘要不依赖输入）
        chiefComplaint = null;
        transcriptText = c?.chief_complaint_text ?? '';
        transcriptText += '\n' + mock.getTranscripts(consultationId).map((t) => t.content).join('\n');
      } else {
        const { data: c } = await supabase.from('consultations').select('chief_complaint_text').eq('id', consultationId).single();
        transcriptText = c?.chief_complaint_text ?? '';
        const { data: ts } = await supabase.from('transcripts').select('content').eq('consultation_id', consultationId);
        transcriptText += '\n' + (ts ?? []).map((t) => t.content).join('\n');
      }

      await generate(chiefComplaint, transcriptText);
      await updateStatus('completed');
      setGenerated(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consultationId]);

  if (generating || (!summary && !generated)) {
    return <LoadingScreen message="AI 正在生成就诊摘要..." />;
  }

  if (!summary) {
    return (
      <View style={styles.errorBox}>
        <Text style={styles.errorText}>摘要生成失败，请重试</Text>
        <Button onPress={() => setGenerated(false)}>重试</Button>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>就诊摘要</Text>
      <Text style={styles.subtitle}>以下内容由 AI 根据您的就诊对话整理</Text>
      <SummaryView summary={summary} />
      <Button onPress={() => router.replace('/(patient)/home')} style={styles.doneBtn}>
        完成，返回首页
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 16,
  },
  doneBtn: {
    marginTop: 16,
  },
  errorBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 15,
    color: '#dc2626',
    marginBottom: 16,
  },
});
