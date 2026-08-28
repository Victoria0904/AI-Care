// 监听登录态，Mock 模式下用 mock 会话，否则同步 Supabase session
// 详见 ARCHITECTURE.md §2.3 后端选型

import { useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Constants } from '@/lib/constants';
import { getMockSession, subscribeMockAuth } from './authClient';

// Mock 模式下用一个兼容 Session 形状的对象，便于上层统一处理
function mockSessionToSession(): Session | null {
  const ms = getMockSession();
  if (!ms) return null;
  return {
    access_token: ms.access_token,
    refresh_token: '',
    expires_in: 86400,
    expires_at: Math.floor(Date.now() / 1000) + 86400,
    token_type: 'bearer',
    user: {
      id: ms.user.id,
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      email: ms.user.email,
    },
  } as unknown as Session;
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (Constants.USE_MOCK) {
      setSession(mockSessionToSession());
      setLoading(false);
      const unsub = subscribeMockAuth(() => setSession(mockSessionToSession()));
      return unsub;
    }

    // 真实 Supabase 模式
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  return { session, loading, isAuthenticated: !!session };
}
