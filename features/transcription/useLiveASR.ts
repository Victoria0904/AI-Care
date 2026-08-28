// 实时 ASR hook：管理转写状态
// Mock 模式用 mockASR 定时推送，真实模式用 react-native-voice
// 详见 PRD.md 功能 B 与 ARCHITECTURE.md §2.5
//
// 注：react-native-voice 需 prebuild + 原生模块，MVP 用 mock 兜底

import { useCallback, useEffect, useState } from 'react';
import { Constants } from '@/lib/constants';
import { publishTranscript } from './asrPublisher';
import { startMockASR, type MockSegment } from './mockASR';

interface UseLiveASROptions {
  consultationId: string | null;
  onDone?: () => void;
}

export interface TranscriptItem {
  id: string;
  content: string;
  speaker: 'doctor' | 'patient' | 'family' | 'unknown';
}

export function useLiveASR({ consultationId, onDone }: UseLiveASROptions) {
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([]);
  const [running, setRunning] = useState(false);
  let stopFn: (() => void) | null = null;

  const start = useCallback(() => {
    if (!consultationId || running) return;
    setRunning(true);

    if (Constants.USE_MOCK) {
      stopFn = startMockASR(
        async (seg: MockSegment) => {
          // 发布到 DB/Realtime（mock 下触发家属端订阅）
          await publishTranscript(consultationId, seg.content, { speaker: seg.speaker });
          // 更新本地列表
          setTranscripts((prev) => [
            ...prev,
            { id: Math.random().toString(36).slice(2), content: seg.content, speaker: seg.speaker },
          ]);
        },
        () => {
          setRunning(false);
          onDone?.();
        }
      );
      return;
    }

    // 真实模式：react-native-voice
    // TODO: 赛后接入，MVP 用 mock
    // import Voice from 'react-native-voice';
    // Voice.onPartialResults = ... ; Voice.onResults = ...
    setRunning(false);
  }, [consultationId, running, onDone]);

  const stop = useCallback(() => {
    stopFn?.();
    stopFn = null;
    setRunning(false);
  }, []);

  // 卸载时清理
  useEffect(() => {
    return () => stopFn?.();
  }, []);

  return { transcripts, running, start, stop };
}
