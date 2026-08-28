// 家属端就诊摘要详情页
// 通过 Realtime 订阅收到 AI 生成的摘要，展示给家属
// 详见 PRD.md 功能 C 与 ARCHITECTURE.md §3 app/(family)/summary/[id].tsx

import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSummarySubscription } from '@/features/summary/useSummary';
import { SummaryView } from '@/components/summary/SummaryView';
import { LoadingScreen } from '@/components/common/LoadingScreen';

export default function FamilySummaryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const consultationId = Array.isArray(id) ? id[0] : id;
  const { summary, received } = useSummarySubscription(consultationId);

  if (!received) {
    return <LoadingScreen message="正在等待 AI 生成就诊摘要..." />;
  }

  if (!summary) {
    return (
      <View style={styles.emptyBox}>
        <Text style={styles.emptyText}>摘要暂未生成，请稍候</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>家人就诊摘要</Text>
      <Text style={styles.subtitle}>AI 已根据就诊内容整理如下，请注意提醒家人按时复诊用药</Text>
      <SummaryView summary={summary} />
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
    lineHeight: 20,
  },
  emptyBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
  },
});
