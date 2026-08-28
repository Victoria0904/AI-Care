// 主诉对话 hook：管理多轮对话状态
// 流程：AI 提问 → 用户回答 → 下一轮 AI 提问 → ... → 5 轮后生成结构化主诉
// 详见 PRD.md 功能 A 与 ARCHITECTURE.md §2.4

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Constants } from '@/lib/constants';
import * as mock from '@/lib/mockStore';
import { MAX_CHAT_ROUNDS, getAiPrompt, summarizeChiefComplaint } from './chatClient';
import type { ChiefComplaint } from '@/features/consultation/types';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface UseChatOptions {
  consultationId: string | null;
  onComplete?: (complaint: ChiefComplaint) => void;
}

export function useChat({ consultationId, onComplete }: UseChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [round, setRound] = useState(0);
  const [aiThinking, setAiThinking] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [done, setDone] = useState(false);

  // 持久化消息到 DB（mock 模式存内存）
  const persistMessage = useCallback(
    (role: 'user' | 'assistant', content: string) => {
      if (!consultationId) return;
      if (Constants.USE_MOCK) {
        mock.addChat(consultationId, role, content);
      } else {
        supabase.from('chief_complaint_chats').insert({ consultation_id: consultationId, role, content }).then();
      }
    },
    [consultationId]
  );

  // 初始化：加载历史 + 触发第一轮 AI 提问
  useEffect(() => {
    if (!consultationId) return;
    // 加载历史
    let history: ChatMessage[] = [];
    if (Constants.USE_MOCK) {
      history = mock.getChats(consultationId).map((c) => ({ id: c.id, role: c.role as 'user' | 'assistant', content: c.content }));
    }
    setMessages(history);
    // 如果还没有 AI 消息，触发第一轮提问
    if (history.filter((m) => m.role === 'assistant').length === 0) {
      askAi(0, history);
    } else {
      setRound(history.filter((m) => m.role === 'user').length);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consultationId]);

  // 请求 AI 提问
  const askAi = useCallback(async (currentRound: number, existing: ChatMessage[]) => {
    if (currentRound >= MAX_CHAT_ROUNDS) {
      // 达到最大轮数，生成主诉
      await generateSummary(existing);
      return;
    }
    setAiThinking(true);
    const userAnswers = existing.filter((m) => m.role === 'user').map((m) => m.content);
    const prompt = await getAiPrompt(currentRound, userAnswers);
    const msg: ChatMessage = { id: Math.random().toString(36).slice(2), role: 'assistant', content: prompt };
    setMessages((prev) => [...prev, msg]);
    persistMessage('assistant', prompt);
    setAiThinking(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persistMessage]);

  // 用户发送回答
  const sendUserMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || done || aiThinking) return;
      const msg: ChatMessage = { id: Math.random().toString(36).slice(2), role: 'user', content };
      setMessages((prev) => {
        const next = [...prev, msg];
        // 触发下一轮 AI
        const newRound = round + 1;
        setRound(newRound);
        askAi(newRound, next);
        return next;
      });
      persistMessage('user', content);
    },
    [round, done, aiThinking, persistMessage, askAi]
  );

  // 生成结构化主诉
  const generateSummary = useCallback(
    async (existing: ChatMessage[]) => {
      setSummarizing(true);
      const userAnswers = existing.filter((m) => m.role === 'user').map((m) => m.content);
      const complaint = await summarizeChiefComplaint(userAnswers);
      setDone(true);
      setSummarizing(false);
      onComplete?.(complaint);
    },
    [onComplete]
  );

  // 提前结束（用户可主动点"已说清"）
  const finishEarly = useCallback(() => {
    generateSummary(messages);
  }, [generateSummary, messages]);

  return {
    messages,
    round,
    aiThinking,
    summarizing,
    done,
    sendUserMessage,
    finishEarly,
  };
}
