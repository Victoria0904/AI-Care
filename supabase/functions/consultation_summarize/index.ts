// Edge Function: consultation_summarize
// 读取主诉对话 + 转写文本 → 调 GLM-4-Flash 生成结构化摘要 → 写 DB → 更新状态
// 入参：{ consultation_id }
// 详见 ARCHITECTURE.md §6.1 与 §7.1
import { handleCors, json, errorResponse } from '../_shared/cors.ts';
import { chatJSON, type ChatMessage } from '../_shared/llm.ts';
import { supabase } from '../_shared/supabase.ts';

interface SummaryResult {
  diagnosis: string | null;
  doctor_advice: string | null;
  medications: Array<{ name: string; dosage: string; frequency: string; duration: string }>;
  follow_ups: Array<{ type: string; time: string; description: string }>;
  warnings: string[];
}

const SUMMARIZE_SYSTEM = `你是就诊摘要整理助手。根据患者主诉与医患对话转写文本，生成结构化就诊摘要，严格输出 JSON：
{
  "diagnosis": "诊断结论（转写中未明确写"未明确"）",
  "doctor_advice": "医嘱整理：饮食/作息/监测/复诊等要点",
  "medications": [{"name":"药品名","dosage":"剂量","frequency":"频次","duration":"疗程"}],
  "follow_ups": [{"type":"复诊|检查|监测","time":"时间","description":"说明"}],
  "warnings": ["注意事项1","注意事项2"]
}
要求：从转写文本中提取真实医嘱，不要臆造药品；字段无信息时用空数组或"未明确"占位；只输出 JSON 对象，不要其他文字。`;

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const { consultation_id } = (await req.json()) as { consultation_id: string };
    if (!consultation_id) return errorResponse('missing consultation_id', 400);

    // 1. 读取主诉文本
    const { data: consultation } = await supabase
      .from('consultations')
      .select('chief_complaint_text')
      .eq('id', consultation_id)
      .single();

    // 2. 读取转写文本（按 sequence_no 拼接，含说话人）
    const { data: transcripts } = await supabase
      .from('transcripts')
      .select('speaker, content')
      .eq('consultation_id', consultation_id)
      .order('sequence_no', { ascending: true });
    const transcriptText = (transcripts ?? [])
      .map((t: { speaker: string | null; content: string }) => {
        const speaker = t.speaker === 'doctor' ? '医生' : t.speaker === 'patient' ? '患者' : '未知';
        return `${speaker}：${t.content}`;
      })
      .join('\n');

    const userContent = `主诉：${consultation?.chief_complaint_text ?? '未提供'}\n\n医患对话转写：\n${transcriptText || '（无转写内容）'}`;

    // 3. 调 LLM 生成结构化摘要
    const messages: ChatMessage[] = [
      { role: 'system', content: SUMMARIZE_SYSTEM },
      { role: 'user', content: userContent },
    ];
    const result = await chatJSON<SummaryResult>(messages);

    // 4. 写入 consultation_summaries（先删旧的允许重试）
    await supabase.from('consultation_summaries').delete().eq('consultation_id', consultation_id);
    const { error: insertError } = await supabase
      .from('consultation_summaries')
      .insert({
        consultation_id,
        diagnosis: result.diagnosis ?? '未明确',
        doctor_advice: result.doctor_advice ?? '',
        medications: Array.isArray(result.medications) ? result.medications : [],
        follow_ups: Array.isArray(result.follow_ups) ? result.follow_ups : [],
        warnings: Array.isArray(result.warnings) ? result.warnings : [],
      });
    if (insertError) throw new Error(`DB insert failed: ${insertError.message}`);

    // 5. 更新 consultation 状态
    await supabase
      .from('consultations')
      .update({ status: 'completed' })
      .eq('id', consultation_id);

    return json({
      consultation_id,
      summary: {
        diagnosis: result.diagnosis ?? '未明确',
        doctor_advice: result.doctor_advice ?? '',
        medications: result.medications ?? [],
        follow_ups: result.follow_ups ?? [],
        warnings: result.warnings ?? [],
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown error';
    return errorResponse(msg, 500);
  }
});
