// Mock ASR：模拟诊中实时语音转文字
// 用预置文本片段定时推送，模拟医患对话逐句出现
// 详见 PRD.md 功能 B 与 ARCHITECTURE.md §2.5

import type { Speaker } from '@/types/database';
import { TRANSCRIPT_SEGMENT_INTERVAL_MS } from '@/lib/constants';

export interface MockSegment {
  content: string;
  speaker: Speaker;
}

// 预置诊中对话脚本（医生 + 患者交替）
export const MOCK_TRANSCRIPT_SCRIPT: MockSegment[] = [
  { content: '您好，请坐。今天哪里不舒服？', speaker: 'doctor' },
  { content: '医生，我最近一周总感觉头晕，早上起来特别明显。', speaker: 'patient' },
  { content: '头晕是旋转性的还是昏沉感？有没有伴随耳鸣？', speaker: 'doctor' },
  { content: '是昏昏沉沉的那种，没有耳鸣，但有时候有点恶心。', speaker: 'patient' },
  { content: '血压量过吗？最近睡眠怎么样？', speaker: 'doctor' },
  { content: '家里量过一次偏高，145/90。睡眠不太好，经常半夜醒。', speaker: 'patient' },
  { content: '我先给您开个检查单，查一下血常规和颈椎片。给您开两个药。', speaker: 'doctor' },
  { content: '好的，谢谢医生。', speaker: 'patient' },
  { content: '一个是降压药苯磺酸氨氯地平，每天早上吃一片 5mg。', speaker: 'doctor' },
  { content: '另一个是改善头晕的倍他司汀，每次一片，一天三次，饭后吃。', speaker: 'doctor' },
  { content: '注意监测血压，低盐饮食，一周后复诊。如果头晕加重随时来。', speaker: 'doctor' },
  { content: '好的，我记住了，谢谢医生。', speaker: 'patient' },
];

/**
 * 启动 mock ASR 定时推送
 * @param onSegment 每个片段到达时回调
 * @param onDone 脚本播完时回调
 * @returns 停止函数
 */
export function startMockASR(
  onSegment: (seg: MockSegment) => void,
  onDone: () => void
): () => void {
  let i = 0;
  const timer = setInterval(() => {
    if (i >= MOCK_TRANSCRIPT_SCRIPT.length) {
      clearInterval(timer);
      onDone();
      return;
    }
    onSegment(MOCK_TRANSCRIPT_SCRIPT[i]);
    i++;
  }, TRANSCRIPT_SEGMENT_INTERVAL_MS);

  return () => clearInterval(timer);
}
