// 音频采集 hook：基于 expo-av 采集医患对话音频
// 采集完成后返回音频 URI，供 ASR 客户端上传 mosi.cn 转写
// 注：UI 层对外只暴露"语音识别"概念；此 hook 是 ASR 底层技术依赖（mosi.cn 接口需要音频文件），
//     不在 UI 文案中出现"录音"字眼
// 详见 PRD.md 功能 B 与 ARCHITECTURE.md §2.5
//
// 注：expo-av 含原生模块，需 npx expo prebuild 后用 Expo Development Build 运行

import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { Audio } from 'expo-av';

export function useRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);

  // Web 平台不支持 expo-av 原生录音采集，直接返回不可用状态
  // 演示用真机跑 ASR；web 部署仅展示已识别文本与 LLM 链路
  const isWeb = Platform.OS === 'web';

  // 请求麦克风权限（首次使用时）
  const ensurePermission = useCallback(async () => {
    if (isWeb) return false;
    if (hasPermission === true) return true;
    const { status } = await Audio.requestPermissionsAsync();
    const granted = status === 'granted';
    setHasPermission(granted);
    if (!granted) setError('未获得麦克风权限，无法进行语音识别');
    return granted;
  }, [hasPermission, isWeb]);

  // 开始采集（语音识别启动）
  const startRecording = useCallback(async () => {
    if (isWeb) {
      setError('语音识别需在真机运行，web 端不可用');
      return;
    }
    setError(null);
    const ok = await ensurePermission();
    if (!ok) return;

    try {
      // 配置音频模式：采集模式，静音其他音频
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new Audio.Recording();
      // 使用高质量采集预设，输出 m4a（mosi.cn 支持）
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();
      recordingRef.current = recording;
      setIsRecording(true);
      setAudioUri(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : '语音识别启动失败';
      setError(msg);
      setIsRecording(false);
    }
  }, [ensurePermission, isWeb]);

  // 停止采集，返回音频文件 URI（供 ASR 上传转写）
  const stopRecording = useCallback(async (): Promise<string | null> => {
    if (isWeb) return null;
    const recording = recordingRef.current;
    if (!recording) return null;
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setAudioUri(uri);
      setIsRecording(false);
      recordingRef.current = null;
      return uri;
    } catch (e) {
      const msg = e instanceof Error ? e.message : '语音识别停止失败';
      setError(msg);
      setIsRecording(false);
      recordingRef.current = null;
      return null;
    }
  }, [isWeb]);

  // 卸载时清理
  useEffect(() => {
    return () => {
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
      }
    };
  }, []);

  return {
    isRecording,
    hasPermission: isWeb ? false : hasPermission,
    audioUri,
    error,
    startRecording,
    stopRecording,
  };
}
