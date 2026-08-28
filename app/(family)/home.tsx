// 家属端主页
// 订阅当前患者就诊的实时事件流（转写文本），收到摘要后可跳转详情页
// 详见 PRD.md 功能 B/C 与 ARCHITECTURE.md §3 app/(family)/home.tsx

import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Constants } from '@/lib/constants';
import * as mock from '@/lib/mockStore';
import { subscribeTranscripts } from '@/features/transcription/asrPublisher';
import { useSummarySubscription } from '@/features/summary/useSummary';
import { subscribeConsultationChanges, getLatestConsultation } from '@/lib/mockStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAppStore } from '@/store/useAppStore';
import type { MockTranscript } from '@/lib/mockStore';

export default function FamilyHomeScreen() {
  const reset = useAppStore((s) => s.reset);
  const [consultationId, setConsultationId] = useState<string | null>(null);
  const [consultationStatus, setConsultationStatus] = useState<string>('');
  const [transcripts, setTranscripts] = useState<MockTranscript[]>([]);
  const [summaryReady, setSummaryReady] = useState(false);

  // 发现患者最新就诊 + 订阅状态变化
  useEffect(() => {
    if (Constants.USE_MOCK) {
      const latest = getLatestConsultation();
      if (latest) {
        setConsultationId(latest.id);
        setConsultationStatus(latest.status);
        setTranscripts(mock.getTranscripts(latest.id));
      }
      const unsub = subscribeConsultationChanges(() => {
        const latest2 = getLatestConsultation();
        if (latest2) {
          setConsultationId(latest2.id);
          setConsultationStatus(latest2.status);
          setTranscripts(mock.getTranscripts(latest2.id));
          if (latest2.status === 'completed') {
            setSummaryReady(true);
          }
        }
      });
      return unsub;
    }
    // 真实模式：查询最新就诊（service role 绕过 RLS，见 ARCHITECTURE.md §5.2）
    // TODO: 赛后实现
    return;
  }, []);

  // 订阅实时转写流
  useEffect(() => {
    if (!consultationId) return;
    if (Constants.USE_MOCK) {
      const unsub = subscribeTranscripts(consultationId, (t) => {
        setTranscripts((prev) => [...prev, t as MockTranscript]);
      });
      return unsub;
    }
    return;
  }, [consultationId]);

  // 订阅摘要推送
  const { summary, received } = useSummarySubscription(consultationId);

  useEffect(() => {
    if (received) setSummaryReady(true);
  }, [received]);

  const handleViewSummary = () => {
    if (consultationId) router.push(`/summary/${consultationId}`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>家属端</Text>
      <Text style={styles.subtitle}>实时关注家人就诊</Text>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>就诊状态</Text>
        <Text style={styles.cardDesc}>
          {consultationId
            ? `当前状态：${statusLabel(consultationStatus)}`
            : '等待患者开始就诊...'}
        </Text>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>实时转写</Text>
        {transcripts.length === 0 ? (
          <Text style={styles.cardDesc}>
            患者进入诊室开始转写后，医患对话将实时显示在此处
          </Text>
        ) : (
          <View style={styles.transcriptBox}>
            {transcripts.slice(-6).map((t) => (
              <Text key={t.id} style={styles.transcriptLine}>
                <Text style={styles.speakerTag}>[{speakerLabel(t.speaker)}]</Text>
                {t.content}
              </Text>
            ))}
          </View>
        )}
      </Card>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>就诊摘要</Text>
        {summaryReady ? (
          <>
            <Text style={styles.cardDesc}>AI 已生成就诊摘要，点击查看详情</Text>
            <Button onPress={handleViewSummary} style={styles.summaryBtn}>查看摘要</Button>
          </>
        ) : (
          <Text style={styles.cardDesc}>就诊完成后，AI 将自动整理摘要并推送至此</Text>
        )}
      </Card>

      <Button onPress={reset} variant="ghost" style={styles.switchRole}>切换身份</Button>
    </View>
  );
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    chief_complaint_pending: '准备就诊主诉中',
    chief_complaint_done: '主诉已完成',
    transcribing: '诊中实时转写中',
    summarizing: 'AI 摘要生成中',
    completed: '就诊完成',
  };
  return map[status] ?? status;
}

function speakerLabel(s: string | null): string {
  const map: Record<string, string> = { doctor: '医生', patient: '患者', family: '家属', unknown: '语音' };
  return s ? (map[s] ?? '语音') : '语音';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 16,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 12,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 16,
  },
  card: {
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 6,
  },
  cardDesc: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 8,
  },
  transcriptBox: {
    marginTop: 4,
  },
  transcriptLine: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 22,
    paddingVertical: 2,
  },
  speakerTag: {
    fontWeight: '600',
    color: '#2563eb',
    marginRight: 4,
  },
  summaryBtn: {
    marginTop: 4,
  },
  switchRole: {
    marginTop: 16,
  },
});
