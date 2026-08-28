// mosi.cn 多说话人语音转写客户端
// 接口：POST /v1/audio/transcriptions (model=moss-transcribe-diarize, diarize=true)
// 文档：https://platform.mosi.cn/docs/reference/transcriptions
//
// 流程：上传音频到 /v1/files 获取 file_id → POST 转写接口（stream=true SSE 流式返回）
// 说话人分离：返回 S01/S02 → 映射为 doctor/patient
// 详见 PRD.md 功能 B 与 ARCHITECTURE.md §2.5

import EventSource from 'react-native-sse';
import { Constants } from '@/lib/constants';
import type { Speaker } from '@/types/database';

export interface AsrSegment {
  speaker: Speaker;
  text: string;
  start: number;
  end: number;
}

export interface AsrCallbacks {
  onSegment: (seg: AsrSegment) => void;
  onDone: (fullText: string) => void;
  onError: (err: Error) => void;
}

// 说话人映射：mosi.cn 返回 S01/S02，就诊场景 S01=医生 S02=患者
function mapSpeaker(raw: string): Speaker {
  const map: Record<string, Speaker> = { S01: 'doctor', S02: 'patient' };
  return map[raw] ?? 'unknown';
}

function authHeaders(): Record<string, string> {
  if (!Constants.MOSS_API_KEY) throw new Error('未配置 MOSS_API_KEY，请检查 .env');
  return { Authorization: `Bearer ${Constants.MOSS_API_KEY}` };
}

/**
 * 上传音频文件到 mosi.cn，获取 file_id
 * 接口：POST /v1/files (multipart/form-data)
 */
export async function uploadAudioFile(audioUri: string, fileName = 'recording.m4a'): Promise<string> {
  const formData = new FormData();
  formData.append('file', { uri: audioUri, type: 'audio/m4a', name: fileName } as unknown as Blob);

  const res = await fetch(`${Constants.MOSI_API_BASE}/v1/files`, {
    method: 'POST',
    headers: authHeaders(),
    body: formData,
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`上传音频失败 ${res.status}: ${detail}`);
  }
  const data = await res.json();
  // 兼容 file_id / id 两种返回字段
  return data.file_id ?? data.id;
}

/**
 * 流式转写（推荐）：上传 file_id 后用 SSE 逐段接收转写结果
 * 接口：POST /v1/audio/transcriptions (stream=true, SSE)
 * @returns 取消函数（停止 SSE 连接）
 */
export function transcribeStream(fileId: string, callbacks: AsrCallbacks): () => void {
  const body = JSON.stringify({
    model: Constants.ASR_MODEL,
    version: Constants.ASR_MODEL_VERSION,
    file_id: fileId,
    diarize: true,
    stream: true,
    response_format: 'json',
  });

  const es = new EventSource(`${Constants.MOSI_API_BASE}/v1/audio/transcriptions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body,
  });

  es.addEventListener('message', (event) => {
    if (!event.data) return;
    try {
      const payload = JSON.parse(event.data) as { type?: string; speaker?: string; text?: string };
      switch (payload.type) {
        case 'transcript.segment.done':
          // 分段完成：含 speaker + text，写入 DB + 推送家属
          callbacks.onSegment({
            speaker: mapSpeaker(payload.speaker ?? ''),
            text: payload.text ?? '',
            start: 0,
            end: 0,
          });
          break;
        case 'transcript.text.done':
          // 转写结束
          callbacks.onDone(payload.text ?? '');
          es.close();
          break;
        case 'task.created':
          // 任务创建确认，无需处理
          break;
        default:
          break;
      }
    } catch {
      // JSON 解析失败，忽略该帧
    }
  });

  es.addEventListener('error', (event) => {
    const err = event as { message?: string };
    callbacks.onError(new Error(err.message ?? 'ASR 流式连接错误'));
    es.close();
  });

  // 注：react-native-sse 的 EventSource 构造时已自动启动连接
  // （_pollAgain → 500ms 后 open()），此处不能再调 es.open()，否则会重复连接
  return () => es.close();
}

/**
 * 同步转写（降级方案）：上传 + 等待完整 diarized_json 结果
 * 适用于 SSE 不可用或短音频场景
 */
export async function transcribeSync(audioUri: string): Promise<AsrSegment[]> {
  const fileId = await uploadAudioFile(audioUri);
  const res = await fetch(`${Constants.MOSI_API_BASE}/v1/audio/transcriptions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify({
      model: Constants.ASR_MODEL,
      version: Constants.ASR_MODEL_VERSION,
      file_id: fileId,
      diarize: true,
      response_format: 'diarized_json',
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`转写失败 ${res.status}: ${detail}`);
  }
  const data = await res.json();
  const segments = (data.segments ?? []) as Array<{ speaker?: string; text?: string; start?: number; end?: number }>;
  return segments.map((s) => ({
    speaker: mapSpeaker(s.speaker ?? ''),
    text: s.text ?? '',
    start: s.start ?? 0,
    end: s.end ?? 0,
  }));
}
