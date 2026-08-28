import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { signInWithEmail } from '@/features/auth/authClient';

export default function LoginScreen() {
  // 默认填演示账号，演示时不用手输
  const [email, setEmail] = useState('patient@demo.com');
  const [password, setPassword] = useState('demo1234');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithEmail(email, password);
      // 登录成功后，_layout 的 useEffect 会自动跳到 /role
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '登录失败';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingScreen message="登录中..." />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>家庭AI陪诊师</Text>
        <Text style={styles.subtitle}>让不在身边的家属，也能全程安心参与父母就医</Text>
      </View>

      <Card style={styles.card}>
        <Input
          label="邮箱"
          value={email}
          onChangeText={setEmail}
          placeholder="patient@demo.com"
          keyboardType="email-address"
        />
        <Input
          label="密码"
          value={password}
          onChangeText={setPassword}
          placeholder="demo1234"
          secureTextEntry
        />
        {error && <Text style={styles.error}>{error}</Text>}
        <Button onPress={handleLogin} style={styles.button}>登录</Button>
      </Card>

      <Text style={styles.tip}>演示账号：patient@demo.com / family@demo.com，密码 demo1234</Text>
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
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  card: {
    marginBottom: 24,
  },
  button: {
    marginTop: 8,
  },
  error: {
    color: '#dc2626',
    fontSize: 13,
    marginBottom: 12,
  },
  tip: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
  },
});
