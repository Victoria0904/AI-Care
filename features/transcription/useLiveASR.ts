// 实时 ASR hook：管理转写状态
// Mock 模式用 mockASR 定时推送预置片段
// 真实模式（ASR_USE_REAL）用 expo-av 录音 → 上传 mosi.cn → SSE 流式接收多说话人转写
// 详见 PRD.md 功能 B 与 ARCHITECTURE.md §2.5

import { useCallback, useEffect, useState } from 'react';
import { ASR_USE_REAL } from '@/lib/constants';
import { publishTranscript } from './asrPublisher';
import { startMockASR, type MockSegment } from './mockASR';
import { useRecorder } from './useRecorder';
import { uploadAudioFile, transcribeStream } from './asrClient';
import type { Speaker } from '@/types/database';

interface UseLiveASROptions {
  consultationId: string | null;
  onDone?: () => void;
}

export interface TranscriptItem {
  id: string;
  content: string;
  speaker: 'doctor' | 'patient' | 'family' | 'unknown';
}

// 转写阶段（真实模式 UI 区分录音中/转写中）
export type AsrPhase = 'idle' | 'recording' | 'transcribing' | 'done';

export function useLiveASR({ consultationId, onDone }: UseLiveASROptions) {
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([]);
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState<AsrPhase>('idle');
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const recorder = useRecorder();
  let stopFn: (() => void) | null = null;

  // 发布转写片段到 DB/Realtime + 更新本地列表
  const handleSegment = useCallback(
    async (content: string, speaker: Speaker) => {
      if (!consultationId) return;
      await publishTranscript(consultationId, content, { speaker });
      setTranscripts((prev) => [
        ...prev,
        { id: Math.random().toString(36).slice(2), content, speaker },
      ]);
    },
    [consultationId]
  );

  // ===== Mock 模式 =====
  const startMock = useCallback(() => {
    if (!consultationId || running) return;
    setRunning(true);
    setPhase('transcribing');
    stopFn = startMockASR(
      async (seg: MockSegment) => {
        await handleSegment(seg.content, seg.speaker);
      },
      () => {
        setRunning(false);
        setPhase('done');
        onDone?.();
      }
    );
  }, [consultationId, running, handleSegment, onDone]);

  const stopMock = useCallback(() => {
    stopFn?.();
    stopFn = null;
    setRunning(false);
    setPhase('done');
  }, []);

  // ===== 真实模式 =====
  const startReal = useCallback(async () => {
    if (!consultationId || running) return;
    setError(null);
    setPhase('recording');
    setRunning(true);
    await recorder.startRecording();
  }, [consultationId, running, recorder]);

  const stopReal = useCallback(async () => {
    // 停止录音，获取音频 URI
    const uri = await recorder.stopRecording();
    setPhase('transcribing');
    setUploading(true);
    if (!uri) {
      setError('录音失败，未获取到音频文件');
      setRunning(false);
      setPhase('idle');
      setUploading(false);
      return;
    }
    try {
      // 1. 上传音频文件获取 file_id
      const fileId = await uploadAudioFile(uri);
      // 2. SSE 流式接收转写结果
      setUploading(false);
      stopFn = transcribeStream(fileId, {
        onSegment: async (seg) => {
          await handleSegment(seg.text, seg.speaker);
        },
        onDone: () => {
          setRunning(false);
          setPhase('done');
          onDone?.();
        },
        onError: (err) => {
          setError(err.message);
          setRunning(false);
          setPhase('idle');
        },
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : '音频上传/转写失败';
      setError(msg);
      setRunning(false);
      setPhase('idle');
      setUploading(false);
    }
  }, [recorder, consultationId, handleSegment, onDone]);

  // ===== 统一接口（mock/real 自动切换）=====
  const start = useCallback(() => {
    if (ASR_USE_REAL) return startReal();
    return startMock();
  }, [startReal, startMock]);

  const stop = useCallback(() => {
    if (ASR_USE_REAL) return stopReal();
    return stopMock();
  }, [stopReal, stopMock]);

  // 卸载时清理
  useEffect(() => {
    return () => stopFn?.();
  }, []);

  return {
    transcripts,
    running,
    phase,
    error,
    uploading,
    useReal: ASR_USE_REAL,
    start,
    stop,
  };
}
