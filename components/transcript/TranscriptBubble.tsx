// 转写文本气泡组件
// 区分医生/患者/家属发言，左侧医生，右侧患者
import { StyleSheet, Text, View } from 'react-native';
import type { Speaker } from '@/types/database';

interface TranscriptBubbleProps {
  content: string;
  speaker: Speaker | null;
}

const speakerLabel: Record<string, string> = {
  doctor: '医生',
  patient: '我',
  family: '家属',
  unknown: '语音',
};

export function TranscriptBubble({ content, speaker }: TranscriptBubbleProps) {
  const isPatient = speaker === 'patient';
  const label = speaker ? speakerLabel[speaker] ?? '语音' : '语音';
  return (
    <View style={[styles.row, isPatient ? styles.rowRight : styles.rowLeft]}>
      <View style={[styles.bubble, isPatient ? styles.bubblePatient : styles.bubbleDoctor]}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.content}>{content}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginVertical: 4,
    paddingHorizontal: 12,
  },
  rowLeft: {
    justifyContent: 'flex-start',
  },
  rowRight: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '85%',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  bubbleDoctor: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  bubblePatient: {
    backgroundColor: '#dbeafe',
  },
  label: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 2,
    fontWeight: '500',
  },
  content: {
    fontSize: 15,
    color: '#0f172a',
    lineHeight: 22,
  },
});
