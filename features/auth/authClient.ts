// 认证客户端封装
// Mock 模式下返回假会话，否则调真实 Supabase Auth
// 详见 ARCHITECTURE.md §2.3 后端选型

import { supabase } from '@/lib/supabase';
import { Constants } from '@/lib/constants';
import { MOCK_USER_ID } from '@/lib/mockStore';

// ===== Mock 会话管理 =====
interface MockSession {
  access_token: string;
  user: { id: string; email: string };
}
let mockSession: MockSession | null = null;
const mockAuthListeners = new Set<(session: MockSession | null) => void>();

function emitMockAuthChange(session: MockSession | null) {
  mockSession = session;
  mockAuthListeners.forEach((cb) => cb(session));
}

export function getMockSession(): MockSession | null {
  return mockSession;
}

export function subscribeMockAuth(cb: (session: MockSession | null) => void): () => void {
  mockAuthListeners.add(cb);
  return () => mockAuthListeners.delete(cb);
}

// ===== 邮箱密码登录（演示用，赛后接微信 / Apple Sign In）=====
export async function signInWithEmail(email: string, _password: string) {
  if (Constants.USE_MOCK) {
    const session: MockSession = {
      access_token: 'mock-token',
      user: { id: MOCK_USER_ID, email },
    };
    emitMockAuthChange(session);
    return session;
  }
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: _password });
  if (error) throw error;
  return data;
}

export async function signUpWithEmail(email: string, password: string) {
  if (Constants.USE_MOCK) {
    return signInWithEmail(email, password);
  }
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  if (Constants.USE_MOCK) {
    emitMockAuthChange(null);
    return;
  }
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
