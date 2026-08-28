// Mock 全局状态管理
// 当 USE_MOCK=true 时，模拟 DB 表 + Realtime 通道，无需真实 Supabase
// 详见 ARCHITECTURE.md §2.5 AI 服务 - 演示阶段用 mock JSON 兜底

import type {
  ConsultationStatus,
  ChatRole,
  Speaker,
  Medication,
  FollowUp,
} from '@/types/database';

// ===== 类型（与 DB 类型对齐）=====
export interface MockConsultation {
  id: string;
  patient_id: string;
  status: ConsultationStatus;
  chief_complaint_text: string | null;
  created_at: string;
  updated_at: string;
}

export interface MockChatMessage {
  id: string;
  consultation_id: string;
  role: ChatRole;
  content: string;
  created_at: string;
}

export interface MockTranscript {
  id: string;
  consultation_id: string;
  sequence_no: number;
  content: string;
  is_final: boolean;
  speaker: Speaker | null;
  created_at: string;
}

export interface MockSummary {
  id: string;
  consultation_id: string;
  diagnosis: string | null;
  doctor_advice: string | null;
  medications: Medication[];
  follow_ups: FollowUp[];
  warnings: string[];
  created_at: string;
}

// ===== 内存存储 =====
const consultations = new Map<string, MockConsultation>();
const chats = new Map<string, MockChatMessage[]>();
const transcripts = new Map<string, MockTranscript[]>();
const summaries = new Map<string, MockSummary>();

// ===== Realtime 订阅模拟 =====
type Listener = (payload: unknown) => void;
const transcriptListeners = new Map<string, Set<Listener>>(); // key = consultationId
const summaryListeners = new Map<string, Set<Listener>>();
const consultationListeners = new Set<Listener>(); // 全局就诊变更订阅

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
const now = () => new Date().toISOString();

function emitConsultationChange(c: MockConsultation) {
  consultationListeners.forEach((cb) => cb(c));
}

// 获取最新就诊记录（家属端用于发现患者正在进行的就诊）
export function getLatestConsultation(): MockConsultation | null {
  let latest: MockConsultation | null = null;
  for (const c of consultations.values()) {
    if (!latest || c.created_at > latest.created_at) latest = c;
  }
  return latest;
}

export function getAllConsultations(): MockConsultation[] {
  return Array.from(consultations.values()).sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function subscribeConsultationChanges(cb: Listener): () => void {
  consultationListeners.add(cb);
  return () => consultationListeners.delete(cb);
}

// ===== Consultation CRUD =====
export function createConsultation(patientId: string): MockConsultation {
  const c: MockConsultation = {
    id: uid(),
    patient_id: patientId,
    status: 'chief_complaint_pending',
    chief_complaint_text: null,
    created_at: now(),
    updated_at: now(),
  };
  consultations.set(c.id, c);
  chats.set(c.id, []);
  transcripts.set(c.id, []);
  emitConsultationChange(c);
  return c;
}

export function getConsultation(id: string): MockConsultation | null {
  return consultations.get(id) ?? null;
}

export function updateConsultation(
  id: string,
  patch: Partial<Pick<MockConsultation, 'status' | 'chief_complaint_text'>>
): MockConsultation | null {
  const c = consultations.get(id);
  if (!c) return null;
  Object.assign(c, patch, { updated_at: now() });
  emitConsultationChange(c);
  return c;
}

// ===== Chat =====
export function addChat(consultationId: string, role: ChatRole, content: string): MockChatMessage {
  const list = chats.get(consultationId) ?? [];
  const msg: MockChatMessage = {
    id: uid(),
    consultation_id: consultationId,
    role,
    content,
    created_at: now(),
  };
  list.push(msg);
  chats.set(consultationId, list);
  return msg;
}

export function getChats(consultationId: string): MockChatMessage[] {
  return chats.get(consultationId) ?? [];
}

// ===== Transcript =====
export function addTranscript(
  consultationId: string,
  content: string,
  opts?: { is_final?: boolean; speaker?: Speaker | null }
): MockTranscript {
  const list = transcripts.get(consultationId) ?? [];
  const t: MockTranscript = {
    id: uid(),
    consultation_id: consultationId,
    sequence_no: list.length,
    content,
    is_final: opts?.is_final ?? true,
    speaker: opts?.speaker ?? 'unknown',
    created_at: now(),
  };
  list.push(t);
  transcripts.set(consultationId, list);

  // 通知 Realtime 订阅者
  const listeners = transcriptListeners.get(consultationId);
  listeners?.forEach((cb) => cb(t));
  return t;
}

export function getTranscripts(consultationId: string): MockTranscript[] {
  return transcripts.get(consultationId) ?? [];
}

export function subscribeTranscripts(consultationId: string, cb: Listener): () => void {
  if (!transcriptListeners.has(consultationId)) {
    transcriptListeners.set(consultationId, new Set());
  }
  transcriptListeners.get(consultationId)!.add(cb);
  return () => transcriptListeners.get(consultationId)?.delete(cb);
}

// ===== Summary =====
export function saveSummary(consultationId: string, summary: Omit<MockSummary, 'id' | 'consultation_id' | 'created_at'>): MockSummary {
  const s: MockSummary = {
    id: uid(),
    consultation_id: consultationId,
    ...summary,
    created_at: now(),
  };
  summaries.set(consultationId, s);

  // 通知 Realtime 订阅者
  const listeners = summaryListeners.get(consultationId);
  listeners?.forEach((cb) => cb(s));
  return s;
}

export function getSummary(consultationId: string): MockSummary | null {
  return summaries.get(consultationId) ?? null;
}

export function subscribeSummary(consultationId: string, cb: Listener): () => void {
  if (!summaryListeners.has(consultationId)) {
    summaryListeners.set(consultationId, new Set());
  }
  summaryListeners.get(consultationId)!.add(cb);
  return () => summaryListeners.get(consultationId)?.delete(cb);
}

// ===== Mock 用户 ID（假会话）=====
export const MOCK_USER_ID = '00000000-0000-0000-0000-000000000001';
