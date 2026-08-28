import type { ExpoConfig, ConfigContext } from 'expo/config';

// 配置参见 ARCHITECTURE.md §2 与 §9.5
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: '家庭AI陪诊师',
  slug: 'ai-companion',
  version: '0.2.0',
  orientation: 'portrait',
  userInterfaceStyle: 'light',
  newArchEnabled: false,
  ios: {
    bundleIdentifier: 'com.aicompanion.app',
    supportsTablet: true,
    // 提前声明权限，step 4 接 react-native-voice 时不用再改
    infoPlist: {
      NSMicrophoneUsageDescription: '用于诊中实时语音转文字',
      NSSpeechRecognitionUsageDescription: '用于把医患对话实时转为文字',
    },
  },
  android: {
    package: 'com.aicompanion.app',
    permissions: ['android.permission.RECORD_AUDIO'],
  },
  plugins: ['expo-router', 'expo-asset', 'expo-av'],
  // Web 部署：纯 SPA 模式（跳过 SSR）
  // 原因：react-native-sse + @supabase/supabase-js 在 import 顶层访问 window，
  //       SSR(Node 渲染) 阶段会 ReferenceError；SPA 模式浏览器执行时 window 已存在
  web: {
    output: 'single',
    bundler: 'metro',
  },
  experiments: {
    tsconfigPaths: true,
  },
});
