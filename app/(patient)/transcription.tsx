// 诊中实时转写页
// 启动 ASR（mock 模式定时推送预置片段），文本同步展示给患者并推送给家属
// 转写完成后更新状态并跳转摘要页
// 详见 PRD.md 功能 B 与 ARCHITECTURE.md §3 app/(patient)/transcription.tsx

import { useEffect, useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useLiveASR } from '@/features/transcription/useLiveASR';
import { useConsultation } from '@/features/consultation/useConsultation';
import { TranscriptBubble } from '@/components/transcript/TranscriptBubble';
import { Button } from '@/components/ui/Button';

export default function TranscriptionScreen() {
  const { consultationId, updateStatus } = useConsultation();
  const [finished, setFinished] = useState(false);
  const listRef = useRef<FlatList>(null);

  const { transcripts, running, start, stop } = useLiveASR({
    consultationId,
    onDone: async () => {
      setFinished(true);
      await updateStatus('summarizing');
    },
  });

  // 进入页面自动开始转写
  useEffect(() => {
    if (consultationId) {
      updateStatus('transcribing').then(() => start());
    }
    return () => stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consultationId]);

  useEffect(() => {
    listRef.current?.scrollToEnd({ animated: true });
  }, [transcripts]);

  const handleGenerateSummary = () => {
    router.push('/(patient)/summary');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>诊中实时转写</Text>
        <Text style={styles.headerSub}>
          {running ? '正在识别...' : finished ? '转写完成' : '准备中'}
        </Text>
      </View>

      <FlatList
        ref={listRef}
        data={transcripts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TranscriptBubble content={item.content} speaker={item.speaker} />
        )}
        contentContainerStyle={styles.list}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={
          <Text style={styles.empty}>点击"开始转写"后，医患对话将实时显示在此处</Text>
        }
      />

      <View style={styles.footer}>
        {running ? (
          <Button onPress={stop} variant="secondary">停止转写</Button>
        ) : finished ? (
          <Button onPress={handleGenerateSummary}>生成就诊摘要</Button>
        ) : (
          <Button onPress={start}>开始转写</Button>
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
    color: '#16a34a',
    marginTop: 2,
  },
  list: {
    paddingVertical: 8,
    flexGrow: 1,
  },
  empty: {
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 13,
    paddingVertical: 40,
  },
  footer: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
});
