'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { Send, Square, Paperclip, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AgentSelector, AgentType } from './AgentSelector';

interface Props {
  onSend: (message: string, options?: any) => Promise<void>;
  onStop: () => void;
  isStreaming: boolean;
  disabled?: boolean;
}

export function ChatInput({ onSend, onStop, isStreaming, disabled }: Props) {
  const [message, setMessage] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<AgentType>('auto');
  const [attachments, setAttachments] = useState<File[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if (!message.trim() || isStreaming || disabled) return;

    await onSend(message.trim(), {
      agentHint: selectedAgent === 'auto' ? undefined : selectedAgent,
      documentIds: [],
    });

    setMessage('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments((prev) => [...prev, ...files]);
  };

  const removeAttachment = (idx: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="border-t bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Agente:</span>
            <AgentSelector selected={selectedAgent} onChange={setSelectedAgent} disabled={isStreaming} />
          </div>
          {selectedAgent !== 'auto' && (
            <Badge variant="outline" className="text-xs">Modo forzado: {selectedAgent}</Badge>
          )}
        </div>
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {attachments.map((file, idx) => (
              <Badge key={idx} variant="secondary" className="gap-1 pr-1">
                <span>📄 {file.name}</span>
                <button onClick={() => removeAttachment(idx)} className="ml-1 hover:bg-muted rounded-full p-0.5">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        <div className={cn(
          'flex items-end gap-2 border rounded-2xl bg-muted/30 p-2',
          'focus-within:ring-2 focus-within:ring-purple-500/50 transition-all'
        )}>
          <label className="p-2 hover:bg-muted rounded-lg cursor-pointer transition-colors">
            <Paperclip className="h-5 w-5 text-muted-foreground" />
            <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileSelect} accept=".pdf,.docx,.xlsx,.txt,.md" />
          </label>

          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isStreaming ? 'El agente está respondiendo...' : 'Escribe tu pregunta...'}
            disabled={isStreaming || disabled}
            className="flex-1 min-h-[40px] max-h-[200px] resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-3 py-2 text-sm"
            rows={1}
            onInput={(e: React.FormEvent<HTMLTextAreaElement>) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = Math.min(target.scrollHeight, 200) + 'px';
            }}
          />

          {isStreaming ? (
            <Button onClick={onStop} size="icon" variant="destructive" className="rounded-full h-10 w-10">
              <Square className="h-4 w-4 fill-current" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              size="icon"
              disabled={!message.trim() || disabled}
              className="rounded-full h-10 w-10 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="text-xs text-muted-foreground text-center">
          Presiona <kbd className="px-1.5 py-0.5 bg-muted rounded">Enter</kbd> para enviar · <kbd className="px-1.5 py-0.5 bg-muted rounded">Shift+Enter</kbd> para nueva línea
        </div>
      </div>
    </div>
  );
}
