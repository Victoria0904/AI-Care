// 聊天输入框组件
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({ onSend, disabled, placeholder }: ChatInputProps) {
  const [value, setValue] = useState('');

  const handleSend = () => {
    if (!value.trim()) return;
    onSend(value);
    setValue('');
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={setValue}
        placeholder={placeholder ?? '请输入您的情况...'}
        placeholderTextColor="#94a3b8"
        multiline
        editable={!disabled}
      />
      <Pressable
        onPress={handleSend}
        disabled={disabled || !value.trim()}
        style={({ pressed }) => [
          styles.sendBtn,
          (disabled || !value.trim()) && styles.sendBtnDisabled,
          pressed && styles.sendBtnPressed,
        ]}
      >
        <Text style={styles.sendText}>发送</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 15,
    backgroundColor: '#f8fafc',
    color: '#0f172a',
  },
  sendBtn: {
    marginLeft: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#2563eb',
    borderRadius: 20,
  },
  sendBtnDisabled: {
    backgroundColor: '#cbd5e1',
  },
  sendBtnPressed: {
    opacity: 0.8,
  },
  sendText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
});
