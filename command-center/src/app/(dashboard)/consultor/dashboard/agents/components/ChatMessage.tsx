'use client';

import { useState } from 'react';
import { Bot, User, ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AssistantMessage, UserMessage } from '@/lib/agents/useAgentChat';
import { SourceCitation } from '@/app/(dashboard)/consultor/tributario/components/SourceCitation';
import { ToolCallCard } from './ToolCallCard';
import { MessageFeedback } from './MessageFeedback';

interface Props {
  message: AssistantMessage | UserMessage;
  isStreaming?: boolean;
  onFeedback?: (rating: 'thumbs_up' | 'thumbs_down', comment?: string) => void;
}

export function ChatMessage({ message, isStreaming, onFeedback }: Props) {
  const isUser = message.role === 'USER';
  const isAssistant = message.role === 'ASSISTANT';
  const assistantMsg = isAssistant ? (message as AssistantMessage) : null;

  const [showReasoning, setShowReasoning] = useState(false);
  const [showTools, setShowTools] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (assistantMsg?.content) {
      navigator.clipboard.writeText(assistantMsg.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={cn('flex gap-4 p-4', isUser ? 'bg-transparent' : 'bg-muted/30')}>
      <div className={cn(
        'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
        isUser ? 'bg-primary' : 'bg-gradient-to-br from-purple-500 to-pink-500'
      )}>
        {isUser ? <User className="h-5 w-5 text-white" /> : <Bot className="h-5 w-5 text-white" />}
      </div>

      <div className="flex-1 min-w-0 space-y-3">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">{isUser ? 'Tú' : (assistantMsg?.agent_used || 'Asistente')}</span>
          {isAssistant && assistantMsg?.agent_used && (
            <Badge variant="outline" className="text-xs">{assistantMsg.agent_used}</Badge>
          )}
          {isAssistant && assistantMsg?.model_used && (
            <Badge variant="secondary" className="text-xs">{assistantMsg.model_used}</Badge>
          )}
          {isAssistant && assistantMsg?.latency_ms && (
            <span className="text-xs text-muted-foreground">{(assistantMsg.latency_ms / 1000).toFixed(1)}s</span>
          )}
        </div>

        {assistantMsg?.reasoning && (
          <div className="border-l-2 border-purple-500/30 pl-3">
            <button
              onClick={() => setShowReasoning(!showReasoning)}
              className="flex items-center gap-1 text-xs text-purple-500 hover:text-purple-400"
            >
              {showReasoning ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              <span>Razonamiento interno</span>
            </button>
            {showReasoning && (
              <pre className="mt-2 text-xs text-muted-foreground whitespace-pre-wrap font-mono bg-black/20 p-3 rounded max-h-60 overflow-y-auto">
                {assistantMsg.reasoning}
              </pre>
            )}
          </div>
        )}

        {assistantMsg?.tools && assistantMsg.tools.length > 0 && (
          <div>
            <button
              onClick={() => setShowTools(!showTools)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              {showTools ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              <span>{assistantMsg.tools.length} herramient{assistantMsg.tools.length === 1 ? 'a' : 'as'} usada{assistantMsg.tools.length === 1 ? '' : 's'}</span>
            </button>
            {showTools && (
              <div className="mt-2 space-y-2">
                {assistantMsg.tools.map((tool, idx) => (
                  <ToolCallCard key={idx} tool={tool} />
                ))}
              </div>
            )}
          </div>
        )}

        {message.content && (
          <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap">
            {message.content}
            {isStreaming && <span className="inline-block w-2 h-4 bg-foreground animate-pulse ml-0.5" />}
          </div>
        )}

        {isStreaming && !message.content && !assistantMsg?.reasoning && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span>Pensando...</span>
          </div>
        )}

        {assistantMsg?.sources && assistantMsg.sources.length > 0 && (
          <SourceCitation citations={assistantMsg.sources.map(s => ({
            content: s.content,
            score: s.relevance_score || 0,
            law_type: s.source?.section || '',
            article: '',
            has_isd: false,
          }))} />
        )}

        {isAssistant && !isStreaming && message.content && (
          <div className="flex items-center gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7 px-2">
              {copied ? <Check className="h-3 w-3 mr-1 text-green-500" /> : <Copy className="h-3 w-3 mr-1" />}
              {copied ? 'Copiado' : 'Copiar'}
            </Button>
            <MessageFeedback messageId={message.id} onFeedback={onFeedback} />
            {assistantMsg?.cost_usd !== undefined && (
              <span className="text-xs text-muted-foreground ml-auto">
                ${assistantMsg.cost_usd.toFixed(4)} · {assistantMsg.total_tokens} tokens
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
