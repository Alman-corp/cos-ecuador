'use client';

import { useState, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export interface ChatEvent {
  type: string;
  elapsed_ms: number;
  [key: string]: any;
}

export interface Source {
  rank: number;
  content: string;
  source: {
    filename: string;
    page?: number;
    section?: string;
    heading_path: string[];
  };
  relevance_score: number;
  chunk_id: string;
  document_id: string;
  citation_id?: string;
}

export interface ToolExecution {
  name: string;
  input: string;
  output?: string;
  success: boolean;
  duration_ms: number;
  error_message?: string;
}

export interface AssistantMessage {
  id: string;
  role: 'ASSISTANT';
  content: string;
  reasoning?: string;
  agent_used?: string;
  model_used?: string;
  tools: ToolExecution[];
  sources: Source[];
  latency_ms?: number;
  first_token_ms?: number;
  total_tokens?: number;
  cost_usd?: number;
  feedback?: 'thumbs_up' | 'thumbs_down' | null;
  createdAt: string;
}

export interface UserMessage {
  id: string;
  role: 'USER';
  content: string;
  createdAt: string;
}

export type ChatMessage = UserMessage | AssistantMessage;

export type ChatStatus =
  | 'idle'
  | 'connecting'
  | 'thinking'
  | 'calling_tool'
  | 'streaming'
  | 'done'
  | 'error';

interface UseAgentChatReturn {
  messages: ChatMessage[];
  status: ChatStatus;
  currentEvent: ChatEvent | null;
  sessionId: string | null;
  error: string | null;
  sendMessage: (message: string, options?: SendMessageOptions) => Promise<void>;
  stopStreaming: () => void;
  startNewSession: () => void;
}

interface SendMessageOptions {
  clientId?: string;
  agentHint?: string;
  documentIds?: string[];
}

export function useAgentChat(initialSessionId?: string): UseAgentChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId || null);
  const [status, setStatus] = useState<ChatStatus>('idle');
  const [currentEvent, setCurrentEvent] = useState<ChatEvent | null>(null);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const queryClient = useQueryClient();

  const createUserMessage = (content: string): UserMessage => ({
    id: `temp-${Date.now()}`,
    role: 'USER',
    content,
    createdAt: new Date().toISOString(),
  });

  const createAssistantPlaceholder = (): AssistantMessage => ({
    id: `temp-assistant-${Date.now()}`,
    role: 'ASSISTANT',
    content: '',
    tools: [],
    sources: [],
    createdAt: new Date().toISOString(),
  });

  const sendMessage = useCallback(async (
    message: string,
    options: SendMessageOptions = {}
  ) => {
    if (!message.trim()) return;

    setError(null);

    const userMsg = createUserMessage(message);
    setMessages((prev) => [...prev, userMsg]);

    const assistantMsg = createAssistantPlaceholder();
    setMessages((prev) => [...prev, assistantMsg]);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setStatus('connecting');

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          message,
          client_id: options.clientId,
          agent_hint: options.agentHint,
          document_ids: options.documentIds,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let currentSessionId = sessionId;
      let assistantContent = '';
      let assistantReasoning = '';
      const tools: ToolExecution[] = [];
      let sources: Source[] = [];
      let firstTokenMs: number | undefined;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const events = buffer.split('\n\n');
        buffer = events.pop() || '';

        for (const eventBlock of events) {
          if (!eventBlock.trim()) continue;

          const eventMatch = eventBlock.match(/event: (\w+)\ndata: ([\s\S]+)/);
          if (!eventMatch) continue;

          const [, eventType, dataJson] = eventMatch;

          try {
            const data = JSON.parse(dataJson);
            const event: ChatEvent = { type: eventType, ...data };
            setCurrentEvent(event);

            switch (eventType) {
              case 'session_created':
                currentSessionId = data.session_id;
                setSessionId(currentSessionId);
                setStatus('thinking');
                break;

              case 'thinking':
                setStatus('thinking');
                assistantReasoning += (data.content || '') + '\n';
                updateAssistantMessage(assistantMsg.id, { reasoning: assistantReasoning, agent_used: data.agent });
                break;

              case 'tool_call':
                setStatus('calling_tool');
                tools.push({
                  name: data.tool_name,
                  input: data.input,
                  output: undefined,
                  success: true,
                  duration_ms: 0,
                });
                updateAssistantMessage(assistantMsg.id, { tools: [...tools] });
                break;

              case 'tool_result':
                {
                  const lastTool = tools[tools.length - 1];
                  if (lastTool && lastTool.name === data.tool_name) {
                    lastTool.output = data.output;
                    lastTool.success = data.success;
                    lastTool.duration_ms = data.duration_ms;
                    if (data.error_message) lastTool.error_message = data.error_message;
                  }
                  updateAssistantMessage(assistantMsg.id, { tools: [...tools] });
                  setStatus('thinking');
                }
                break;

              case 'chunk':
                if (firstTokenMs === undefined) {
                  firstTokenMs = data.elapsed_ms;
                  setStatus('streaming');
                }
                assistantContent += data.content || '';
                updateAssistantMessage(assistantMsg.id, { content: assistantContent, first_token_ms: firstTokenMs });
                break;

              case 'sources':
                sources = data.sources || [];
                updateAssistantMessage(assistantMsg.id, { sources });
                break;

              case 'model_info':
                updateAssistantMessage(assistantMsg.id, {
                  model_used: data.model,
                  total_tokens: data.tokens,
                  agent_used: data.agent_used,
                });
                break;

              case 'done':
                updateAssistantMessage(assistantMsg.id, {
                  id: data.message_id,
                  latency_ms: data.latency_ms,
                  cost_usd: data.cost_usd,
                });
                setStatus('done');
                break;

              case 'error':
                setError(data.message || 'Error en streaming');
                setStatus('error');
                break;
            }
          } catch (parseErr) {
            console.error('[SSE] Parse error:', parseErr, eventBlock);
          }
        }
      }

      if (currentSessionId) {
        queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
      }

    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('[Chat] Streaming abortado por usuario');
      } else {
        console.error('[Chat] Error:', err);
        setError(err.message || 'Error conectando al agente');
        setStatus('error');
      }
    } finally {
      abortControllerRef.current = null;
    }
  }, [sessionId, queryClient]);

  const updateAssistantMessage = (msgId: string, updates: Partial<AssistantMessage>) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId ? { ...m, ...updates } as AssistantMessage : m
      )
    );
  };

  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setStatus('done');
    }
  }, []);

  const startNewSession = useCallback(() => {
    setSessionId(null);
    setMessages([]);
    setStatus('idle');
    setError(null);
  }, []);

  return {
    messages,
    status,
    currentEvent,
    sessionId,
    error,
    sendMessage,
    stopStreaming,
    startNewSession,
  };
}
