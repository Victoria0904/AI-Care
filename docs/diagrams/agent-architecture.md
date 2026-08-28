# 家庭AI陪诊师 · 3 Agent 协作架构

> 诊前 → 诊中 → 诊后 · 多 Agent 串联 + 数据来源 + 算法逻辑
> 配套 HTML 版：`agent-architecture.html`

## 图示说明

| 元素 | 含义 |
|---|---|
| 紫色（焦点） | Agent 协作主路径 |
| 青色 | 真实云端 API（智谱 GLM-4-Flash / mosi.cn） |
| 灰色 | 导航/普通业务流 |
| 青色虚线 | 家属端实时同步（mock → Supabase Realtime） |

## SVG 源（可嵌入 PPT/Markdown 渲染器）

```svg
<svg viewBox="0 0 720 720" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="家庭AI陪诊师 3 Agent 协作架构">
  <defs>
    <marker id="p-arrow-neutral" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="8" markerHeight="8" markerUnits="userSpaceOnUse" orient="auto">
      <path d="M1 1 L7 4 L1 7 Z" fill="#94a3b8"/>
    </marker>
    <marker id="p-arrow-brand" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="8" markerHeight="8" markerUnits="userSpaceOnUse" orient="auto">
      <path d="M1 1 L7 4 L1 7 Z" fill="#7c5cff"/>
    </marker>
    <marker id="p-arrow-teal" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="8" markerHeight="8" markerUnits="userSpaceOnUse" orient="auto">
      <path d="M1 1 L7 4 L1 7 Z" fill="#2dd4bf"/>
    </marker>
  </defs>
  <text x="360" y="28" text-anchor="middle" font-family="sans-serif" font-size="16" font-weight="700" fill="#0f172a">家庭AI陪诊师 · 3 Agent 协作架构</text>
  <text x="360" y="46" text-anchor="middle" font-family="sans-serif" font-size="11" fill="#94a3b8">诊前 → 诊中 → 诊后 · 多 Agent 串联 + 数据来源 + 算法逻辑</text>
  <text x="36" y="78" font-family="sans-serif" font-size="10" font-weight="600" fill="#64748b">数据来源</text>
  <rect x="36" y="84" width="200" height="42" rx="6" fill="#f5f6f8" stroke="#cbd5e1"/>
  <text x="136" y="103" text-anchor="middle" font-family="sans-serif" font-size="11" font-weight="600" fill="#0f172a">患者主诉文本</text>
  <text x="136" y="118" text-anchor="middle" font-family="sans-serif" font-size="9" fill="#94a3b8">键盘输入 · 5 轮内</text>
  <rect x="260" y="84" width="200" height="42" rx="6" fill="#f5f6f8" stroke="#cbd5e1"/>
  <text x="360" y="103" text-anchor="middle" font-family="sans-serif" font-size="11" font-weight="600" fill="#0f172a">医生/患者语音流</text>
  <text x="360" y="118" text-anchor="middle" font-family="sans-serif" font-size="9" fill="#94a3b8">麦克风采采集 · m4a</text>
  <rect x="484" y="84" width="200" height="42" rx="6" fill="#f5f6f8" stroke="#cbd5e1"/>
  <text x="584" y="103" text-anchor="middle" font-family="sans-serif" font-size="11" font-weight="600" fill="#0f172a">转写文本</text>
  <text x="584" y="118" text-anchor="middle" font-family="sans-serif" font-size="9" fill="#94a3b8">Agent2 输出 · 含说话人</text>
  <path d="M136 126 L136 152" fill="none" stroke="#94a3b8" stroke-width="1.5" marker-end="url(#p-arrow-neutral)"/>
  <path d="M360 126 L360 152" fill="none" stroke="#94a3b8" stroke-width="1.5" marker-end="url(#p-arrow-neutral)"/>
  <path d="M584 126 L584 152" fill="none" stroke="#94a3b8" stroke-width="1.5" marker-end="url(#p-arrow-neutral)"/>
  <rect x="36" y="156" width="200" height="232" rx="10" fill="#ffffff" stroke="#7c5cff" stroke-width="2"/>
  <rect x="36" y="156" width="200" height="28" rx="10" fill="#7c5cff"/>
  <rect x="36" y="170" width="200" height="14" fill="#7c5cff"/>
  <text x="136" y="174" text-anchor="middle" font-family="sans-serif" font-size="11" font-weight="700" fill="#ffffff">Agent 1 · 主诉澄清</text>
  <rect x="48" y="192" width="44" height="16" rx="999" fill="#ece6ff"/>
  <text x="70" y="203" text-anchor="middle" font-family="sans-serif" font-size="9" fill="#7c5cff">诊前</text>
  <text x="226" y="203" text-anchor="end" font-family="sans-serif" font-size="9" fill="#94a3b8">GLM-4-Flash</text>
  <text x="48" y="228" font-family="sans-serif" font-size="10" font-weight="600" fill="#0f172a">算法逻辑</text>
  <text x="48" y="244" font-family="sans-serif" font-size="9" fill="#64748b">· 多轮提问 5 轮（症状/部位/</text>
  <text x="48" y="256" font-family="sans-serif" font-size="9" fill="#64748b">  时长/严重度/既往史）</text>
  <text x="48" y="268" font-family="sans-serif" font-size="9" fill="#64748b">· response_format=json_object</text>
  <text x="48" y="280" font-family="sans-serif" font-size="9" fill="#64748b">· schema 字段兜底容错</text>
  <text x="48" y="302" font-family="sans-serif" font-size="10" font-weight="600" fill="#0f172a">输出</text>
  <rect x="48" y="308" width="176" height="36" rx="6" fill="#f5f6f8" stroke="#e2e8f0"/>
  <text x="136" y="324" text-anchor="middle" font-family="sans-serif" font-size="10" font-weight="600" fill="#0f172a">ChiefComplaint</text>
  <text x="136" y="338" text-anchor="middle" font-family="sans-serif" font-size="9" fill="#94a3b8">chief / symptoms[] / severity</text>
  <text x="48" y="362" font-family="sans-serif" font-size="9" fill="#2dd4bf">● 真实接入 · 1s 出</text>
  <text x="48" y="376" font-family="sans-serif" font-size="9" fill="#94a3b8">chatClient.ts → llmClient</text>
  <path d="M236 272 L256 272" fill="none" stroke="#7c5cff" stroke-width="2" marker-end="url(#p-arrow-brand)"/>
  <rect x="200" y="258" width="48" height="14" rx="999" fill="#ece6ff"/>
  <text x="224" y="268" text-anchor="middle" font-family="sans-serif" font-size="8" fill="#7c5cff">主诉完成</text>
  <rect x="260" y="156" width="200" height="232" rx="10" fill="#ffffff" stroke="#7c5cff" stroke-width="2"/>
  <rect x="260" y="156" width="200" height="28" rx="10" fill="#7c5cff"/>
  <rect x="260" y="170" width="200" height="14" fill="#7c5cff"/>
  <text x="360" y="174" text-anchor="middle" font-family="sans-serif" font-size="11" font-weight="700" fill="#ffffff">Agent 2 · 语音转写</text>
  <rect x="272" y="192" width="44" height="16" rx="999" fill="#ece6ff"/>
  <text x="294" y="203" text-anchor="middle" font-family="sans-serif" font-size="9" fill="#7c5cff">诊中</text>
  <text x="450" y="203" text-anchor="end" font-family="sans-serif" font-size="9" fill="#94a3b8">mosi.cn</text>
  <text x="272" y="228" font-family="sans-serif" font-size="10" font-weight="600" fill="#0f172a">算法逻辑</text>
  <text x="272" y="244" font-family="sans-serif" font-size="9" fill="#64748b">· 说话人分离 S01=医生 / S02=患者</text>
  <text x="272" y="256" font-family="sans-serif" font-size="9" fill="#64748b">· SSE 流式逐段返回</text>
  <text x="272" y="268" font-family="sans-serif" font-size="9" fill="#64748b">· diarize=true / stream=true</text>
  <text x="272" y="280" font-family="sans-serif" font-size="9" fill="#64748b">· m4a 上传 → file_id → SSE</text>
  <text x="272" y="302" font-family="sans-serif" font-size="10" font-weight="600" fill="#0f172a">输出</text>
  <rect x="272" y="308" width="176" height="36" rx="6" fill="#f5f6f8" stroke="#e2e8f0"/>
  <text x="360" y="324" text-anchor="middle" font-family="sans-serif" font-size="10" font-weight="600" fill="#0f172a">分段转写文本</text>
  <text x="360" y="338" text-anchor="middle" font-family="sans-serif" font-size="9" fill="#94a3b8">{speaker, text, start, end}[]</text>
  <text x="272" y="362" font-family="sans-serif" font-size="9" fill="#2dd4bf">● 真实接入 · SSE 流</text>
  <text x="272" y="376" font-family="sans-serif" font-size="9" fill="#94a3b8">asrClient.ts → mosi.cn</text>
  <path d="M460 272 L480 272" fill="none" stroke="#7c5cff" stroke-width="2" marker-end="url(#p-arrow-brand)"/>
  <rect x="424" y="258" width="52" height="14" rx="999" fill="#ece6ff"/>
  <text x="450" y="268" text-anchor="middle" font-family="sans-serif" font-size="8" fill="#7c5cff">转写结束</text>
  <rect x="484" y="156" width="200" height="232" rx="10" fill="#ffffff" stroke="#7c5cff" stroke-width="2"/>
  <rect x="484" y="156" width="200" height="28" rx="10" fill="#7c5cff"/>
  <rect x="484" y="170" width="200" height="14" fill="#7c5cff"/>
  <text x="584" y="174" text-anchor="middle" font-family="sans-serif" font-size="11" font-weight="700" fill="#ffffff">Agent 3 · 摘要生成</text>
  <rect x="496" y="192" width="44" height="16" rx="999" fill="#ece6ff"/>
  <text x="518" y="203" text-anchor="middle" font-family="sans-serif" font-size="9" fill="#7c5cff">诊后</text>
  <text x="674" y="203" text-anchor="end" font-family="sans-serif" font-size="9" fill="#94a3b8">GLM-4-Flash</text>
  <text x="496" y="228" font-family="sans-serif" font-size="10" font-weight="600" fill="#0f172a">算法逻辑</text>
  <text x="496" y="244" font-family="sans-serif" font-size="9" fill="#64748b">· ConsultationSummary schema</text>
  <text x="496" y="256" font-family="sans-serif" font-size="9" fill="#64748b">· 药品名/剂量/频次/疗程</text>
  <text x="496" y="268" font-family="sans-serif" font-size="9" fill="#64748b">· 复诊/注意事项提取</text>
  <text x="496" y="280" font-family="sans-serif" font-size="9" fill="#64748b">· 数组字段强制类型转换</text>
  <text x="496" y="302" font-family="sans-serif" font-size="10" font-weight="600" fill="#0f172a">输出</text>
  <rect x="496" y="308" width="176" height="36" rx="6" fill="#f5f6f8" stroke="#e2e8f0"/>
  <text x="584" y="324" text-anchor="middle" font-family="sans-serif" font-size="10" font-weight="600" fill="#0f172a">ConsultationSummary</text>
  <text x="584" y="338" text-anchor="middle" font-family="sans-serif" font-size="9" fill="#94a3b8">dx / meds[] / followUps[]</text>
  <text x="496" y="362" font-family="sans-serif" font-size="9" fill="#2dd4bf">● 真实接入 · 10s 出</text>
  <text x="496" y="376" font-family="sans-serif" font-size="9" fill="#94a3b8">summarizeClient.ts</text>
  <text x="36" y="416" font-family="sans-serif" font-size="10" font-weight="600" fill="#64748b">状态机推进 · consultation.status</text>
  <rect x="36" y="424" width="648" height="32" rx="6" fill="#f5f6f8" stroke="#e2e8f0"/>
  <rect x="48" y="430" width="106" height="20" rx="999" fill="#ffffff" stroke="#7c5cff"/>
  <text x="101" y="443" text-anchor="middle" font-family="sans-serif" font-size="9" fill="#7c5cff">chief_pending</text>
  <path d="M154 440 L170 440" stroke="#7c5cff" stroke-width="1.5" marker-end="url(#p-arrow-brand)"/>
  <rect x="172" y="430" width="96" height="20" rx="999" fill="#ffffff" stroke="#7c5cff"/>
  <text x="220" y="443" text-anchor="middle" font-family="sans-serif" font-size="9" fill="#7c5cff">chief_done</text>
  <path d="M268 440 L284 440" stroke="#7c5cff" stroke-width="1.5" marker-end="url(#p-arrow-brand)"/>
  <rect x="286" y="430" width="86" height="20" rx="999" fill="#ffffff" stroke="#7c5cff"/>
  <text x="329" y="443" text-anchor="middle" font-family="sans-serif" font-size="9" fill="#7c5cff">transcribing</text>
  <path d="M372 440 L388 440" stroke="#7c5cff" stroke-width="1.5" marker-end="url(#p-arrow-brand)"/>
  <rect x="390" y="430" width="90" height="20" rx="999" fill="#ffffff" stroke="#7c5cff"/>
  <text x="435" y="443" text-anchor="middle" font-family="sans-serif" font-size="9" fill="#7c5cff">summarizing</text>
  <path d="M480 440 L496 440" stroke="#7c5cff" stroke-width="1.5" marker-end="url(#p-arrow-brand)"/>
  <rect x="498" y="430" width="86" height="20" rx="999" fill="#7c5cff"/>
  <text x="541" y="443" text-anchor="middle" font-family="sans-serif" font-size="9" fill="#ffffff">completed</text>
  <text x="596" y="443" font-family="sans-serif" font-size="9" fill="#94a3b8">→ 家属端推送</text>
  <path d="M329 460 C 329 490 100 490 100 510" fill="none" stroke="#2dd4bf" stroke-width="1.5" stroke-dasharray="5 3" marker-end="url(#p-arrow-teal)"/>
  <path d="M541 460 C 541 490 660 490 660 510" fill="none" stroke="#2dd4bf" stroke-width="1.5" stroke-dasharray="5 3" marker-end="url(#p-arrow-teal)"/>
  <rect x="36" y="510" width="220" height="48" rx="8" fill="#ffffff" stroke="#2dd4bf" stroke-width="1.5" stroke-dasharray="4 3"/>
  <text x="146" y="528" text-anchor="middle" font-family="sans-serif" font-size="11" font-weight="600" fill="#0d9488">家属端 · 实时转写订阅</text>
  <text x="146" y="544" text-anchor="middle" font-family="sans-serif" font-size="9" fill="#94a3b8">asrPublisher → mockStore 订阅</text>
  <rect x="464" y="510" width="220" height="48" rx="8" fill="#ffffff" stroke="#2dd4bf" stroke-width="1.5" stroke-dasharray="4 3"/>
  <text x="574" y="528" text-anchor="middle" font-family="sans-serif" font-size="11" font-weight="600" fill="#0d9488">家属端 · 摘要详情查看</text>
  <text x="574" y="544" text-anchor="middle" font-family="sans-serif" font-size="9" fill="#94a3b8">(family)/summary/[id]</text>
  <text x="36" y="586" font-family="sans-serif" font-size="10" font-weight="600" fill="#64748b">技术栈与降级</text>
  <text x="36" y="602" font-family="sans-serif" font-size="9" fill="#64748b">· 客户端：Expo RN + expo-router + expo-av + react-native-sse · TanStack Query 状态</text>
  <text x="36" y="616" font-family="sans-serif" font-size="9" fill="#64748b">· 真实云端：智谱 GLM-4-Flash + mosi.cn · 国内服务商 · 数据不出境</text>
  <text x="36" y="630" font-family="sans-serif" font-size="9" fill="#64748b">· 降级策略：LLM 失败 → 自动 fallback mock 脚本 · UI 不空白 · 9 类错误码 + 熔断器</text>
  <text x="36" y="644" font-family="sans-serif" font-size="9" fill="#64748b">· Mock 层：auth/DB/Realtime 走内存 · UI 流程 100% 可演示 · 赛后切 Supabase</text>
  <text x="36" y="678" font-family="sans-serif" font-size="10" font-weight="600" fill="#7c5cff">▲ 焦点：3 Agent 横向串联 + 状态机推进 + 双端实时同步</text>
  <text x="36" y="694" font-family="sans-serif" font-size="9" fill="#94a3b8">每个 Agent 内含「数据来源 → 算法逻辑 → 工具调用 → 结构化输出」四件套</text>
  <text x="36" y="708" font-family="sans-serif" font-size="9" fill="#94a3b8">v0.2 · commit 6774798 · 真实后端 4 项已通 · 真机测试就绪</text>
</svg>
```

## 3 Agent 职责拆解

| Agent | 阶段 | 算法逻辑 | 工具/调用 | 输入 | 输出 |
|---|---|---|---|---|---|
| **Agent 1 · 主诉澄清** | 诊前 | 多轮提问 5 轮 + `response_format=json_object` + schema 字段兜底 | GLM-4-Flash `chatComplete` + `chatJSON` | 患者主诉文本 | `ChiefComplaint` |
| **Agent 2 · 语音转写** | 诊中 | 说话人分离（S01=医生/S02=患者）+ SSE 流式逐段返回 + m4a 上传 → file_id → SSE | mosi.cn `moss-transcribe-diarize` + expo-av 采集 | 医生/患者语音流 | 分段转写文本 `{speaker, text, start, end}[]` |
| **Agent 3 · 摘要生成** | 诊后 | `ConsultationSummary` schema + 药品/复诊提取 + 数组字段强制类型转换 | GLM-4-Flash `chatJSON` | Agent 2 输出转写文本 | `ConsultationSummary` |

## 状态机推进

`consultation.status`：`chief_complaint_pending` → `chief_complaint_done` → `transcribing` → `summarizing` → `completed`

每个状态对应一个 Agent 主导，状态推进即 Agent 协作交接。

## 焦点

每个 Agent 内含「数据来源 → 算法逻辑 → 工具调用 → 结构化输出」四件套，3 Agent 横向串联 + 状态机推进 + 双端实时同步 = 比赛版主架构。
