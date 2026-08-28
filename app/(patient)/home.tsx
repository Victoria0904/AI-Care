import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAppStore } from '@/store/useAppStore';

export default function PatientHomeScreen() {
  const reset = useAppStore((s) => s.reset);

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>您好，欢迎使用家庭AI陪诊师</Text>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>开始就诊准备</Text>
        <Text style={styles.cardDesc}>AI 多轮提问帮您说清症状，5 轮内整理结构化主诉</Text>
        <Button onPress={() => router.push('/(patient)/chat')}>开始准备</Button>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>历史就诊</Text>
        <Text style={styles.cardDesc}>暂无历史记录（MVP 阶段未实现）</Text>
      </Card>

      <Button onPress={reset} variant="ghost" style={styles.switchRole}>切换身份</Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 24,
  },
  greeting: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0f172a',
    marginTop: 16,
    marginBottom: 24,
  },
  card: {
    marginBottom: 16,
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
    marginBottom: 16,
    lineHeight: 20,
  },
  switchRole: {
    marginTop: 24,
  },
});
