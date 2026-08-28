// 就诊摘要展示组件（患者端 + 家属端共用）
// 结构：诊断 / 医嘱 / 用药 / 复诊提醒 / 注意事项
// 详见 PRD.md 功能 C

import { StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import type { ConsultationSummary } from '@/features/consultation/types';

interface SummaryViewProps {
  summary: ConsultationSummary;
}

const severityColor = '#16a34a';

export function SummaryView({ summary }: SummaryViewProps) {
  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>诊断</Text>
        <Text style={styles.content}>{summary.diagnosis ?? '（暂无）'}</Text>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>医嘱整理</Text>
        <Text style={styles.content}>{summary.doctor_advice ?? '（暂无）'}</Text>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>用药提醒</Text>
        {summary.medications.length === 0 ? (
          <Text style={styles.empty}>暂无用药</Text>
        ) : (
          summary.medications.map((m, i) => (
            <View key={i} style={styles.listItem}>
              <Text style={styles.medName}>{m.name}</Text>
              <Text style={styles.medDetail}>
                {m.dosage ?? ''}  {m.frequency ?? ''}  {m.duration ?? ''}
              </Text>
            </View>
          ))
        )}
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>复诊提醒</Text>
        {summary.follow_ups.length === 0 ? (
          <Text style={styles.empty}>暂无复诊安排</Text>
        ) : (
          summary.follow_ups.map((f, i) => (
            <View key={i} style={styles.listItem}>
              <Text style={styles.followTitle}>{f.type ?? '提醒'} · {f.time ?? ''}</Text>
              <Text style={styles.medDetail}>{f.description ?? ''}</Text>
            </View>
          ))
        )}
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>注意事项</Text>
        {summary.warnings.length === 0 ? (
          <Text style={styles.empty}>暂无</Text>
        ) : (
          summary.warnings.map((w, i) => (
            <Text key={i} style={styles.warning}>• {w}</Text>
          ))
        )}
      </Card>

      <Text style={styles.disclaimer}>AI 整理仅供参考，请以医嘱原件为准</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 24,
  },
  card: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: severityColor,
    marginBottom: 8,
  },
  content: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 22,
  },
  empty: {
    fontSize: 13,
    color: '#94a3b8',
  },
  listItem: {
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
  medName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 2,
  },
  medDetail: {
    fontSize: 13,
    color: '#64748b',
  },
  followTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 2,
  },
  warning: {
    fontSize: 13,
    color: '#b45309',
    lineHeight: 20,
    marginBottom: 4,
  },
  disclaimer: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
});
