// LLM 真实 API 冒烟测试脚本（独立可执行，不依赖 Expo/项目编译）
// 覆盖：诊前主诉下一句提问(chatComplete) + 主诉结构化(chatJSON 主诉) + 就诊摘要结构化(chatJSON 摘要)
// 用法：
//   EXPO_PUBLIC_ZHIPU_API_KEY=sk-xxx [EXPO_PUBLIC_LLM_MODEL=glm-4-flash] node scripts/test-llm.mjs
// 或：在 .env 已配 EXPO_PUBLIC_ZHIPU_API_KEY 后： npm run test:llm
//
// 注：EXPO_PUBLIC_ 前缀是 Expo 规范，本脚本直接读该变量，与客户端一致；
// 若你用非 EXPO 前缀也兼容：ZHIPU_API_KEY=sk-xxx

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as url from 'node:url';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
const DOTENV = path.resolve(__dirname, '..', '.env');
if (fs.existsSync(DOTENV)) {
  const raw = fs.readFileSync(DOTENV, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/i);
    if (!m) continue;
    const [, k, v] = m;
    if (process.env[k]) continue; // 命令行覆盖优先
    process.env[k] = v.replace(/^"([\s\S]*)"$/, '$1').replace(/^'([\s\S]*)'$/, '$1');
  }
}

const API_KEY = process.env.EXPO_PUBLIC_ZHIPU_API_KEY || process.env.ZHIPU_API_KEY || '';
const MODEL_ALIASES = new Set(['glm-4-flash', 'glm-4-plus', 'glm-4-air', 'glm-4.7-flash']);
const MODEL_RAW = process.env.EXPO_PUBLIC_LLM_MODEL || process.env.EXPO_PUBLIC_GLM_MODEL || process.env.LLM_MODEL || 'glm-4-flash';
const MODEL = MODEL_ALIASES.has(MODEL_RAW) ? MODEL_RAW : 'glm-4-flash';
const BASE = process.env.EXPO_PUBLIC_ZHIPU_API_BASE || process.env.ZHIPU_API_BASE || 'https://open.bigmodel.cn/api/paas/v4';

if (!API_KEY || API_KEY === 'your-zhipu-api-key' || /占位|请填入/.test(API_KEY)) {
  console.error('❌ 未配置真实 ZHIPU_API_KEY。请：\n   1) 打开 https://open.bigmodel.cn → 控制台 → API 密钥 → 新建；\n   2) 写入 .env 的 EXPO_PUBLIC_ZHIPU_API_KEY=sk-xxx；\n   3) 再运行 npm run test:llm');
  process.exit(1);
}
if (MODEL !== MODEL_RAW) console.warn(`⚠️  模型名 "${MODEL_RAW}" 不在白名单，回退到 "${MODEL}"（防 404）`);

const HEADERS = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
  Authorization: `Bearer ${API_KEY}`,
};

async function call(body, label) {
  const t0 = Date.now();
  let res;
  try {
    res = await fetch(`${BASE}/chat/completions`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify(body),
    });
  } catch (e) {
    console.error(`\n[${label}] 网络失败:`, e.message);
    return { ok: false, label };
  }
  const ms = Date.now() - t0;
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = text; }
  if (!res.ok) {
    const code = json?.error?.code ?? '';
    const msg = json?.error?.message ?? text.slice(0, 200);
    console.error(`\n[${label}] HTTP ${res.status} ${code} (${ms}ms): ${msg}`);
    return { ok: false, label, status: res.status, code, msg };
  }
  const content = json?.choices?.[0]?.message?.content;
  console.log(`\n[${label}] ✅ HTTP 200 (${ms}ms, model=${json?.model ?? MODEL})`);
  return { ok: true, label, content, raw: json };
}

function extractFirstJSON(s) {
  const m = String(s).match(/\{[\s\S]*\}/);
  return m ? JSON.parse(m[0]) : null;
}

const RESULTS = [];

// —— Case 1：诊前主诉下一句提问（轮1）——
{
  const history = ['最近一周总感觉头晕，早上起床尤其明显'];
  const ctx = history.map((a, i) => `第${i + 1}轮患者回答: ${a}`).join('\n');
  const r = await call(
    {
      model: MODEL,
      messages: [
        { role: 'system', content: '你是医院 AI 陪诊助手，协助患者在就诊前整理主诉。请用简短、口语化的中文生成下一句关键提问，只输出提问本身，不要前缀、不要解释。' },
        { role: 'user', content: `${ctx}\n\n请基于以上患者回答，生成第 2 轮的下一句关键提问。` },
      ],
      temperature: 0.7,
      max_tokens: 120,
    },
    'Case1 主诉问诊下一轮提问'
  );
  RESULTS.push(r);
  if (r.ok) console.log('   AI:', r.content);
}

// —— Case 2：主诉结构化（chatJSON 诉 + response_format）——
{
  const answers = ['最近一周总感觉头晕，早上起床尤其明显', '持续一周左右，偶尔也会有', '大概 5-6 分，不会痛到受不了', '有时候伴随一点恶心，但没吐，血压家里量偏高 145/90'];
  const r = await call(
    {
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: `你是医疗主诉整理助手。根据患者多轮回答，提炼结构化主诉，严格输出 JSON：
{
  "chief_complaint": "一句话主诉（症状+时间）",
  "main_symptoms": ["主要症状1", "伴随症状2"],
  "duration": "持续时间描述",
  "severity": "mild | moderate | severe"
}
severity 判定：自述轻微或 1-4 分 = mild；一般或 5-6 分 = moderate；剧烈或 7-10 分 = severe。只输出 JSON 对象，不要其他文字。`,
        },
        { role: 'user', content: answers.map((a, i) => `第${i + 1}轮: ${a}`).join('\n') },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    },
    'Case2 主诉结构化(JSON)'
  );
  RESULTS.push(r);
  if (r.ok) {
    let data = null;
    try { data = JSON.parse(r.content); } catch { data = extractFirstJSON(r.content); }
    if (data) {
      console.log('   chief_complaint:', data.chief_complaint);
      console.log('   main_symptoms:', data.main_symptoms);
      console.log('   duration:', data.duration, '/ severity:', data.severity);
      const valid =
        typeof data.chief_complaint === 'string' &&
        Array.isArray(data.main_symptoms) &&
        typeof data.duration === 'string' &&
        ['mild', 'moderate', 'severe'].includes(data.severity);
      console.log(`   schema 校验: ${valid ? '✅ 通过' : '❌ 字段缺失/类型错误'}`);
    } else {
      console.log('   ⚠️  JSON 解析失败，原始输出:', r.content.slice(0, 200));
    }
  }
}

// —— Case 3：就诊摘要结构化 ——
{
  const complaint = '头晕一周，血压偏高 145/90，伴随恶心';
  const transcript = [
    '医生：您好，请坐。今天哪里不舒服？',
    '患者：医生，我最近一周总感觉头晕，早上起来特别明显。',
    '医生：头晕是旋转性的还是昏沉感？有没有伴随耳鸣？',
    '患者：是昏昏沉沉的那种，没有耳鸣，但有时候有点恶心。',
    '医生：血压量过吗？最近睡眠怎么样？',
    '患者：家里量过一次偏高，145/90。睡眠不太好，经常半夜醒。',
    '医生：我先给您开个检查单，查一下血常规和颈椎片。给您开两个药：苯磺酸氨氯地平，每天早上吃一片 5mg；倍他司汀，每次一片，一天三次，饭后吃。注意监测血压，低盐饮食，一周后复诊。',
    '患者：好的，谢谢医生。',
  ].join('\n');

  const r = await call(
    {
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: `你是就诊摘要整理助手。根据患者主诉与医患对话转写文本，生成结构化就诊摘要，严格输出 JSON：
{
  "diagnosis": "诊断结论（转写中未明确写"未明确"）",
  "doctor_advice": "医嘱整理：饮食/作息/监测/复诊等要点",
  "medications": [{"name":"药品名","dosage":"剂量","frequency":"频次","duration":"疗程"}],
  "follow_ups": [{"type":"复诊|检查|监测","time":"时间","description":"说明"}],
  "warnings": ["注意事项1","注意事项2"]
}
要求：从转写文本中提取真实医嘱，不要臆造药品；字段无信息时用空数组或"未明确"占位；只输出 JSON 对象，不要其他文字。`,
        },
        { role: 'user', content: `主诉：${complaint}\n\n医患对话转写：\n${transcript}` },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    },
    'Case3 就诊摘要结构化(JSON)'
  );
  RESULTS.push(r);
  if (r.ok) {
    let data = null;
    try { data = JSON.parse(r.content); } catch { data = extractFirstJSON(r.content); }
    if (data) {
      console.log('   diagnosis:', data.diagnosis);
      console.log('   medications:', data.medications?.map((m) => m.name).join(', '));
      console.log('   follow_ups:', data.follow_ups?.length ?? 0, ' 项');
      const valid =
        ['diagnosis', 'doctor_advice'].every((k) => typeof data[k] === 'string') &&
        ['medications', 'follow_ups', 'warnings'].every((k) => Array.isArray(data[k]));
      console.log(`   schema 校验: ${valid ? '✅ 通过' : '❌ 字段缺失/类型错误'}`);
    } else {
      console.log('   ⚠️  JSON 解析失败，原始输出:', r.content.slice(0, 200));
    }
  }
}

// 汇总
console.log('\n========== 冒烟测试汇总 ==========');
const ok = RESULTS.filter((r) => r.ok).length;
const total = RESULTS.length;
for (const r of RESULTS) {
  console.log(`  ${r.ok ? '✅' : '❌'}  ${r.label}`);
}
console.log(`结果: ${ok}/${total} 通过。glm-4-flash 免费 RPM=10，若失败多为限流/鉴权，等 1 分钟重试或检查 key。`);
process.exit(ok === total ? 0 : 2);
