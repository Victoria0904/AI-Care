// 诊前主诉对话页
// AI 多轮提问，5 轮内整理结构化主诉，完成后跳转实时转写页
// 详见 PRD.md 功能 A 与 ARCHITECTURE.md §3 app/(patient)/chat.tsx

import { useEffect, useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useChat } from '@/features/chat/useChat';
import { useConsultation } from '@/features/consultation/useConsultation';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { ChatInput } from '@/components/chat/ChatInput';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { Button } from '@/components/ui/Button';
import { MAX_CHAT_ROUNDS } from '@/lib/constants';
import type { ChiefComplaint } from '@/features/consultation/types';

export default function ChatScreen() {
  const { consultationId, startConsultation, updateStatus } = useConsultation();
  const [complaint, setComplaint] = useState<ChiefComplaint | null>(null);
  const listRef = useRef<FlatList>(null);

  // 进入页面时确保有一个 consultation
  useEffect(() => {
    if (!consultationId) {
      startConsultation().catch((e) => console.error(e));
    }
  }, [consultationId, startConsultation]);

  const { messages, round, aiThinking, summarizing, done, sendUserMessage, finishEarly } = useChat({
    consultationId,
    onComplete: async (c) => {
      setComplaint(c);
      // 保存结构化主诉并更新状态
      const text = `${c.chief_complaint}\n主要症状: ${c.main_symptoms.join('、')}\n持续时间: ${c.duration}\n严重程度: ${c.severity}`;
      await updateStatus('chief_complaint_done', text);
    },
  });

  const handleStartTranscription = () => {
    router.push('/(patient)/transcription');
  };

  // 自动滚动到底部
  useEffect(() => {
    listRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  if (summarizing) return <LoadingScreen message="AI 正在整理您的就诊主诉..." />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>诊前主诉</Text>
        <Text style={styles.headerSub}>第 {Math.min(round + 1, MAX_CHAT_ROUNDS)} / {MAX_CHAT_ROUNDS} 轮</Text>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MessageBubble message={item} />}
        contentContainerStyle={styles.list}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
      />

      {aiThinking && (
        <Text style={styles.thinking}>AI 正在思考...</Text>
      )}

      <View style={styles.footer}>
        {done ? (
          <View style={styles.doneBox}>
            <Text style={styles.doneText}>主诉已整理完成</Text>
            {complaint && (
              <View style={styles.complaintBox}>
                <Text style={styles.complaintTitle}>{complaint.chief_complaint}</Text>
                <Text style={styles.complaintRow}>主要症状：{complaint.main_symptoms.join('、')}</Text>
                <Text style={styles.complaintRow}>持续时间：{complaint.duration}</Text>
                <Text style={styles.complaintRow}>严重程度：{complaint.severity}</Text>
              </View>
            )}
            <Button onPress={handleStartTranscription}>进入诊室开始转写</Button>
          </View>
        ) : (
          <>
            {round >= 1 && (
              <Button onPress={finishEarly} variant="ghost" style={styles.finishEarly}>
                已说清楚了，提前结束
              </Button>
            )}
            <ChatInput onSend={sendUserMessage} disabled={aiThinking} />
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
  },
  headerSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  list: {
    padding: 12,
  },
  thinking: {
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 13,
    paddingVertical: 8,
  },
  footer: {
    backgroundColor: '#ffffff',
  },
  doneBox: {
    padding: 16,
  alignItems: 'stretch',
  },
  doneText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#16a34a',
    textAlign: 'center',
    marginBottom: 12,
  },
  complaintBox: {
    backgroundColor: '#f0fdf4',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  complaintTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
  },
  complaintRow: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
  },
  finishEarly: {
    marginBottom: 4,
  },
});
