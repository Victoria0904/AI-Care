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
    supportsTablet: true,
    // 提前声明权限，step 4 接 react-native-voice 时不用再改
    infoPlist: {
      NSMicrophoneUsageDescription: '用于诊中实时语音转文字',
      NSSpeechRecognitionUsageDescription: '用于把医患对话实时转为文字',
    },
  },
  android: {
    permissions: ['android.permission.RECORD_AUDIO'],
  },
  plugins: ['expo-router', 'expo-asset'],
  experiments: {
    tsconfigPaths: true,
  },
});
