// Edge Function 服务端 Supabase client（service role key 绕过 RLS）
// 详见 ARCHITECTURE.md §5.2 RLS 策略
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  { auth: { persistSession: false } }
);
