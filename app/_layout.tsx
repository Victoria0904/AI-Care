import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/useAuth';
import { useAppStore } from '@/store/useAppStore';
import { LoadingScreen } from '@/components/common/LoadingScreen';

const queryClient = new QueryClient();

/**
 * 根导航：根据登录态与角色自动跳转
 * 未登录 → /           (登录页)
 * 已登录但无角色 → /role (角色选择)
 * 已登录+有角色 → /(patient)/home 或 /(family)/home
 */
function RootNavigator() {
  const { session, loading } = useAuth();
  const role = useAppStore((s) => s.role);

  useEffect(() => {
    if (loading) return;
    if (!session) {
      router.replace('/');
    } else if (!role) {
      router.replace('/role');
    } else if (role === 'patient') {
      router.replace('/(patient)/home');
    } else if (role === 'family') {
      router.replace('/(family)/home');
    }
  }, [session, loading, role]);

  if (loading) return <LoadingScreen message="检查登录态..." />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="role" />
      <Stack.Screen name="(patient)" />
      <Stack.Screen name="(family)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="dark" />
      <RootNavigator />
    </QueryClientProvider>
  );
}
