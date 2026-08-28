import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Constants } from './constants';
import type { Database } from '@/types/database';

// 客户端单例：使用 anon key + AsyncStorage 持久化会话
// 详见 ARCHITECTURE.md §2.3 后端选型与 §5.2 RLS 策略
export const supabase = createClient<Database>(
  Constants.SUPABASE_URL,
  Constants.SUPABASE_ANON_KEY,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
