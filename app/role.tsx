import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAppStore } from '@/store/useAppStore';
import { signOut } from '@/features/auth/authClient';

export default function RoleScreen() {
  const setRole = useAppStore((s) => s.setRole);

  // 选完角色后 _layout 的 useEffect 会自动跳转到对应 home
  const handleSelectRole = (role: 'patient' | 'family') => {
    setRole(role);
  };

  const handleSignOut = async () => {
    await signOut();
    useAppStore.getState().reset();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>选择身份</Text>
      <Text style={styles.subtitle}>演示用：选择后可随时切换</Text>

      <Card style={styles.card}>
        <Text style={styles.roleTitle}>我是患者</Text>
        <Text style={styles.roleDesc}>父母端：整理主诉、实时转写、查看摘要</Text>
        <Button onPress={() => handleSelectRole('patient')} style={styles.button}>进入患者端</Button>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.roleTitle}>我是家属</Text>
        <Text style={styles.roleDesc}>子女端：实时看到转写文本、收到摘要推送</Text>
        <Button onPress={() => handleSelectRole('family')} variant="secondary" style={styles.button}>进入家属端</Button>
      </Card>

      <Button onPress={handleSignOut} variant="ghost" style={styles.signOut}>退出登录</Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 32,
  },
  card: {
    marginBottom: 16,
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 6,
  },
  roleDesc: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 16,
    lineHeight: 20,
  },
  button: {
    marginTop: 4,
  },
  signOut: {
    marginTop: 24,
  },
});
