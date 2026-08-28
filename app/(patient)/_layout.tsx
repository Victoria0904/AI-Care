import { Stack } from 'expo-router';

// 患者端 stack：所有患者侧页面统一在此声明
export default function PatientLayout() {
  return (
    <Stack>
      <Stack.Screen name="home" options={{ title: '患者主页', headerShown: false }} />
      <Stack.Screen name="chat" options={{ title: '诊前主诉' }} />
      <Stack.Screen name="transcription" options={{ title: '实时转写' }} />
      <Stack.Screen name="summary" options={{ title: '就诊摘要' }} />
    </Stack>
  );
}
