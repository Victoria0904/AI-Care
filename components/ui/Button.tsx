import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';

type Variant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps {
  children: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  variant?: Variant;
  style?: ViewStyle;
}

export function Button({ children, onPress, disabled, variant = 'primary', style }: ButtonProps) {
  const backgroundColor = (() => {
    if (disabled) return '#cbd5e1';
    switch (variant) {
      case 'primary':
        return '#2563eb';
      case 'secondary':
        return '#e2e8f0';
      case 'ghost':
        return 'transparent';
    }
  })();

  const textColor = variant === 'primary' ? '#ffffff' : '#1e293b';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.base, { backgroundColor }, style]}
    >
      <Text style={[styles.text, { color: textColor }]}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
});
