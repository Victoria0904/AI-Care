// 诊中实时转写页
// Mock 模式：自动启动 mock ASR，预置医患对话逐段推送
// 真实模式：开始录音 → 停止录音 → 上传 mosi.cn → SSE 流式多说话人转写
// 转写完成后更新状态并跳转摘要页
// 详见 PRD.md 功能 B 与 ARCHITECTURE.md §3 app/(patient)/transcription.tsx

import { useEffect, useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ASR_USE_REAL } from '@/lib/constants';
import { useLiveASR } from '@/features/transcription/useLiveASR';
import { useConsultation } from '@/features/consultation/useConsultation';
import { TranscriptBubble } from '@/components/transcript/TranscriptBubble';
import { Button } from '@/components/ui/Button';
import { LoadingScreen } from '@/components/common/LoadingScreen';

export default function TranscriptionScreen() {
  const { consultationId, updateStatus } = useConsultation();
  const listRef = useRef<FlatList>(null);

  const { transcripts, running, phase, error, uploading, start, stop } = useLiveASR({
    consultationId,
    onDone: async () => {
      await updateStatus('summarizing');
    },
  });

  // Mock 模式进入页面自动开始；真实模式需用户手动点"开始录音"
  useEffect(() => {
    if (consultationId && !ASR_USE_REAL) {
      updateStatus('transcribing').then(() => start());
    } else if (consultationId && ASR_USE_REAL) {
      updateStatus('transcribing');
    }
    return () => { stop(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consultationId]);

  useEffect(() => {
    listRef.current?.scrollToEnd({ animated: true });
  }, [transcripts]);

  const handleGenerateSummary = () => {
    router.push('/(patient)/summary');
  };

  // 上传中全屏 loading
  if (uploading) {
    return <LoadingScreen message="音频上传中，请稍候..." />;
  }

  const statusText = () => {
    if (error) return error;
    if (phase === 'recording') return '正在录音...说完后点"停止并转写"';
    if (phase === 'transcribing') return ASR_USE_REAL ? 'AI 转写中，文本逐段出现...' : '正在识别...';
    if (phase === 'done') return '转写完成';
    return ASR_USE_REAL ? '点击"开始录音"' : '准备中';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>诊中实时转写</Text>
        <Text style={[styles.headerSub, error ? styles.errorText : null]}>
          {statusText()}
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
          <Text style={styles.empty}>
            {ASR_USE_REAL
              ? '点击"开始录音"，说完后点"停止并转写"，AI 将自动区分医患对话'
              : '点击"开始转写"后，医患对话将实时显示在此处'}
          </Text>
        }
      />

      <View style={styles.footer}>
        {phase === 'done' ? (
          <Button onPress={handleGenerateSummary}>生成就诊摘要</Button>
        ) : running && phase === 'recording' ? (
          <Button onPress={stop} variant="secondary">停止录音并转写</Button>
        ) : running && phase === 'transcribing' ? (
          <Button onPress={stop} variant="secondary" disabled={!ASR_USE_REAL}>
            {ASR_USE_REAL ? '等待转写完成...' : '停止转写'}
          </Button>
        ) : (
          <Button onPress={start}>{ASR_USE_REAL ? '开始录音' : '开始转写'}</Button>
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
  errorText: {
    color: '#dc2626',
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
    paddingHorizontal: 24,
    lineHeight: 20,
  },
  footer: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
});
