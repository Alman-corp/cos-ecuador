'use client';

import { useEffect, useRef } from 'react';
import { useAgentChat } from '@/lib/agents/useAgentChat';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { ChatSidebar } from './components/ChatSidebar';
import { ChatStatusBar } from './components/ChatStatusBar';
import { Sparkles } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function AgentsChatPage() {
  const {
    messages,
    status,
    currentEvent,
    sessionId,
    error,
    sendMessage,
    stopStreaming,
    startNewSession,
  } = useAgentChat();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentEvent]);

  const isStreaming = ['connecting', 'thinking', 'calling_tool', 'streaming'].includes(status);

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background">
      <ChatSidebar currentSessionId={sessionId} onNewSession={startNewSession} />

      <div className="flex-1 flex flex-col">
        <ChatStatusBar status={status} currentEvent={currentEvent} />

        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <WelcomeScreen />
          ) : (
            <div className="max-w-4xl mx-auto py-6">
              {messages.map((msg, idx) => (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  isStreaming={isStreaming && idx === messages.length - 1 && msg.role === 'ASSISTANT'}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {error && (
          <div className="px-4">
            <Alert className="border-red-500/50 bg-red-500/10">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}

        <ChatInput
          onSend={sendMessage}
          onStop={stopStreaming}
          isStreaming={isStreaming}
          disabled={status === 'error'}
        />
      </div>
    </div>
  );
}

function WelcomeScreen() {
  const suggestions = [
    {
      icon: '💰',
      title: 'Análisis financiero',
      prompt: 'Analiza el riesgo de liquidez del cliente Acme Corp basado en sus últimos estados financieros.',
    },
    {
      icon: '📅',
      title: 'Obligaciones tributarias',
      prompt: '¿Qué declaraciones del SRI vencen esta semana para mis clientes?',
    },
    {
      icon: '📊',
      title: 'Valuación DCF',
      prompt: 'Calcula el Enterprise Value de una empresa con EBITDA de $500K y crecimiento del 8%.',
    },
    {
      icon: '⚖️',
      title: 'Revisión contractual',
      prompt: '¿Cuáles son las cláusulas de mayor riesgo en el contrato de servicios profesionales?',
    },
  ];

  return (
    <div className="h-full flex items-center justify-center p-8">
      <div className="max-w-3xl w-full space-y-8">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30">
            <Sparkles className="h-4 w-4 text-purple-400" />
            <span className="text-sm">Multi-Agente IA con RAG + ISD</span>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
            ¿En qué puedo ayudarte hoy?
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Conversa con agentes especializados en finanzas, tributario, legal y comercial.
            Cada respuesta incluye <strong>fuentes trazables</strong> a documentos reales.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => {
                const input = document.querySelector('textarea') as HTMLTextAreaElement;
                if (input) {
                  input.value = s.prompt;
                  input.focus();
                }
              }}
              className="p-4 text-left border rounded-xl hover:bg-muted/50 hover:border-purple-500/30 transition-all group"
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl">{s.icon}</div>
                <div className="flex-1">
                  <div className="font-semibold group-hover:text-purple-400">{s.title}</div>
                  <div className="text-sm text-muted-foreground mt-1 line-clamp-2">{s.prompt}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
