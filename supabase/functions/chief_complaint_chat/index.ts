// Edge Function: chief_complaint_chat
// 多轮主诉对话：读历史 → 调 GLM-4-Flash → 写 DB → 返回下一句提问
// 入参：{ consultation_id, message, history? }
// 详见 ARCHITECTURE.md §6.1 与 §7.1
import { handleCors, json, errorResponse } from '../_shared/cors.ts';
import { chatComplete, type ChatMessage } from '../_shared/llm.ts';
import { supabase } from '../_shared/supabase.ts';

const MAX_ROUNDS = 5;

const SYSTEM_PROMPT = `你是医院 AI 陪诊助手，协助患者在就诊前整理主诉。请用简短、口语化的中文，根据患者已回答的内容，生成下一句关键提问（围绕未问到的维度：症状部位/持续时间/严重程度/伴随症状/既往史等）。仅输出提问本身，不要前缀如"问："，不要解释、不要诊断、不要给医疗建议。`;

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const { consultation_id, message, history } = (await req.json()) as {
      consultation_id: string;
      message: string;
      history?: ChatMessage[];
    };

    if (!consultation_id || !message) {
      return errorResponse('missing consultation_id or message', 400);
    }

    // 构造多轮对话上下文
    const messages: ChatMessage[] = [{ role: 'system', content: SYSTEM_PROMPT }];
    if (history && history.length > 0) {
      messages.push(...history);
    } else {
      // 从 DB 读取历史对话（无 history 时兜底）
      const { data: chats } = await supabase
        .from('chief_complaint_chats')
        .select('role, content')
        .eq('consultation_id', consultation_id)
        .order('created_at', { ascending: true });
      for (const c of chats ?? []) {
        if (c.role === 'user' || c.role === 'assistant') {
          messages.push({ role: c.role, content: c.content });
        }
      }
    }
    messages.push({ role: 'user', content: message });

    const reply = await chatComplete(messages, { temperature: 0.7, maxTokens: 120 });

    // 写入 DB（user + assistant）
    const { error: insertError } = await supabase
      .from('chief_complaint_chats')
      .insert([
        { consultation_id, role: 'user', content: message },
        { consultation_id, role: 'assistant', content: reply },
      ]);
    if (insertError) throw new Error(`DB insert failed: ${insertError.message}`);

    // 简单判定是否完成：达到最大轮数
    const userCount = messages.filter((m) => m.role === 'user').length;
    const isComplete = userCount >= MAX_ROUNDS;

    return json({ reply, is_complete: isComplete });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown error';
    return errorResponse(msg, 500);
  }
});
