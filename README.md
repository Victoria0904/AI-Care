# 家庭AI陪诊师（AiCompanion）

> AI 驱动的家属远程陪诊平台 — 让不在身边的家属，也能全程安心参与患者就医。

## 项目简介

解决家属不在身边、无法每次亲自陪伴患者就诊的问题。本质是家属不在场但深度参与父母就诊的伴诊场景。覆盖诊前准备 → 诊中记录 → 诊后管理与主动推送全流程，以情感连接（安心 / 内疚缓解）为驱动，以全程伴诊为付费基础。


## MVP 范围

| 原功能 | MVP 处理 |
|---|---|
| 诊前整理主诉 | 做（简化版） |
| 推荐医生挂号 | 砍，二期 |
| 诊中实时语音转文字 | 做（on-device ASR，不录音） |
| 诊中 AI 实时提醒 | 简化为家属端实时文本流 |
| 诊后摘要 + 主动推送 | 做 |
| 日常健康记录 | 砍 |

## 技术栈

| 层 | 选型 |
|---|---|
| 移动端 | Expo (React Native) + TypeScript |
| 路由 | Expo Router（文件即路由） |
| 状态 | TanStack Query（服务端） + Zustand（UI） |
| 后端 | Supabase（Auth + Postgres + Realtime + Edge Functions） |
| Edge Functions | Deno，2 个核心函数 |
| LLM | 智谱 GLM-4-Flash |
| ASR | react-native-voice（on-device，无需 API key） |
| UI 组件 | Tamagui 或 NativeWind |

> ⚠️ `react-native-voice` 包含原生模块，需运行 `npx expo prebuild` 切换到 Expo Development Build，无法直接用 Expo Go 扫码。MVP 阶段保留 30 分钟做 prebuild 与 native 首次构建。

完整选型理由见 [ARCHITECTURE.md §2](./ARCHITECTURE.md)。

## 快速开始

### 环境准备

- Node.js ≥ 20
- Expo CLI（`npm i -g expo-cli`）
- Supabase 项目（含 URL 与 anon key）
- 智谱 API Key
- iOS 真机或 Android 真机（on-device ASR 必须在真机测试）

### 安装与运行

```bash
# 1. 安装依赖
npm install

# 2. 复制环境变量模板并填写
cp .env.example .env
# 填入 EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY 等

# 3. 切换到 Development Build（react-native-voice 需要原生模块）
npx expo prebuild

# 4. 在真机上构建并启动 Development Build
# iOS:     npx expo run:ios --device
# Android: npx expo run:android --device

# 5. 后续 JS 代码改动可热重载，无需重新构建原生包
```

### iOS 权限配置

`app.config.ts` 的 `infoPlist` 中需声明：

```
NSMicrophoneUsageDescription: 用于诊中实时语音转文字
NSSpeechRecognitionUsageDescription: 用于把医患对话实时转为文字
```

### 数据库初始化

```bash
# 推送 SQL 迁移到 Supabase
supabase db push

# 部署 Edge Functions
supabase functions deploy chief_complaint_chat
supabase functions deploy consultation_summarize
```

### 演示账号

比赛前预注册两个测试账号：

- 患者账号：`patient@demo.com` / `demo1234`
- 家属账号：`family@demo.com` / `demo1234`

### Mock 模式

在 `.env` 中设置 `USE_MOCK=true`，所有外部 API（LLM / ASR）将返回 `assets/mock/` 下的预置 JSON，用于现场演示兜底。ASR mock 会用定时器按 1.5 秒间隔推送预置文本片段，模拟实时转写效果。

## 项目结构

```
ai_companion_app/
├── app/                  # Expo Router 文件即路由
├── components/           # 可复用 UI 组件
├── features/             # 业务领域封装（auth / consultation / chat / transcription / summary / realtime）
├── lib/                  # 基础设施（Supabase client / 常量）
├── hooks/                # 通用 hooks
├── store/                # Zustand 状态
├── types/                # 类型定义
├── supabase/             # 后端工程（migrations + functions）
└── assets/mock/          # mock JSON
```

完整结构见 [ARCHITECTURE.md §3](./ARCHITECTURE.md)。

## 文档导航

| 文档 | 内容 |
|---|---|
| [README.md](./README.md) | 项目简介、运行方式、技术栈概览（本文件） |
| [PRD.md](./PRD.md) | 产品定位、核心功能、用户使用流程、范围决策 |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | 技术栈理由、目录结构、模块设计、数据模型、代码规范 |

## 文档维护原则

每次有发布或更新时，必须同步更新本目录下的文档：

- 新增 / 删除 / 修改功能 → 更新 `PRD.md` 的功能列表与流程
- 技术栈替换 / 升级 → 更新 `README.md` 技术栈表与 `ARCHITECTURE.md` 选型理由
- 数据表新增 / 字段变更 → 更新 `ARCHITECTURE.md` 数据模型与 ER 图
- 新增 Edge Function → 更新 `ARCHITECTURE.md` 后端说明
- Mock 数据替换为真实服务 → 移除对应 mock 项

文档与代码一起 commit，避免文档与实现脱节。
