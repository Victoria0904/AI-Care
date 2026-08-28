// 录音 hook：基于 expo-av 录制医患对话音频
// 录制完成后返回音频 URI，供 ASR 客户端上传转写
// 详见 PRD.md 功能 B 与 ARCHITECTURE.md §2.5
//
// 注：expo-av 含原生模块，需 npx expo prebuild 后用 Expo Development Build 运行

import { useCallback, useEffect, useRef, useState } from 'react';
import { Audio } from 'expo-av';

export function useRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);

  // 请求麦克风权限（首次使用时）
  const ensurePermission = useCallback(async () => {
    if (hasPermission === true) return true;
    const { status } = await Audio.requestPermissionsAsync();
    const granted = status === 'granted';
    setHasPermission(granted);
    if (!granted) setError('未获得麦克风权限，无法录音');
    return granted;
  }, [hasPermission]);

  // 开始录音
  const startRecording = useCallback(async () => {
    setError(null);
    const ok = await ensurePermission();
    if (!ok) return;

    try {
      // 配置音频模式：录音模式，静音其他音频
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new Audio.Recording();
      // 使用高质量录音预设，输出 m4a（mosi.cn 支持）
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();
      recordingRef.current = recording;
      setIsRecording(true);
      setAudioUri(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : '录音启动失败';
      setError(msg);
      setIsRecording(false);
    }
  }, [ensurePermission]);

  // 停止录音，返回音频文件 URI
  const stopRecording = useCallback(async (): Promise<string | null> => {
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
      const msg = e instanceof Error ? e.message : '录音停止失败';
      setError(msg);
      setIsRecording(false);
      recordingRef.current = null;
      return null;
    }
  }, []);

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
    hasPermission,
    audioUri,
    error,
    startRecording,
    stopRecording,
  };
}
