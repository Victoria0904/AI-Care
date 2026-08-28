import { Stack } from 'expo-router';

// 家属端 stack
export default function FamilyLayout() {
  return (
    <Stack>
      <Stack.Screen name="home" options={{ title: '家属主页', headerShown: false }} />
      <Stack.Screen name="summary/[id]" options={{ title: '就诊摘要' }} />
    </Stack>
  );
}
