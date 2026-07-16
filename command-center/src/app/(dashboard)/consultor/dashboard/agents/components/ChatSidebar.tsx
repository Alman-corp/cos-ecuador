'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, MessageSquare, Trash2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Props {
  currentSessionId: string | null;
  onNewSession: () => void;
}

export function ChatSidebar({ currentSessionId, onNewSession }: Props) {
  const queryClient = useQueryClient();

  const { data: sessionsData, isLoading } = useQuery({
    queryKey: ['chat-sessions'],
    queryFn: async () => {
      const res = await fetch('/api/chat/sessions');
      return res.json();
    },
  });

  const deleteSession = useMutation({
    mutationFn: async (sessionId: string) => {
      await fetch(`/api/chat/sessions/${sessionId}`, { method: 'DELETE' });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['chat-sessions'] }),
  });

  const sessions = sessionsData?.sessions || [];

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const groups: Record<string, any[]> = { today: [], yesterday: [], week: [], older: [] };

  for (const s of sessions) {
    const date = new Date(s.last_message_at || s.created_at);
    if (date.toDateString() === today.toDateString()) groups.today.push(s);
    else if (date.toDateString() === yesterday.toDateString()) groups.yesterday.push(s);
    else if (date > weekAgo) groups.week.push(s);
    else groups.older.push(s);
  }

  return (
    <div className="w-72 border-r bg-muted/10 flex flex-col">
      <div className="p-4 border-b">
        <Button onClick={onNewSession} className="w-full gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
          <Plus className="h-4 w-4" />
          Nueva conversación
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-2 space-y-4">
          {renderGroup('Hoy', groups.today, currentSessionId, deleteSession)}
          {renderGroup('Ayer', groups.yesterday, currentSessionId, deleteSession)}
          {renderGroup('Últimos 7 días', groups.week, currentSessionId, deleteSession)}
          {renderGroup('Anteriores', groups.older, currentSessionId, deleteSession)}

          {!isLoading && sessions.length === 0 && (
            <div className="text-center py-8 text-sm text-muted-foreground">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Sin conversaciones aún</p>
            </div>
          )}
        </div>
      </div>

      <div className="p-3 border-t text-xs text-muted-foreground flex items-center gap-2">
        <Sparkles className="h-3 w-3" />
        <span>Powered by LangGraph + RAG/ISD</span>
      </div>
    </div>
  );
}

function renderGroup(title: string, sessions: any[], currentSessionId: string | null, deleteSession: any) {
  if (sessions.length === 0) return null;

  return (
    <div>
      <div className="text-xs font-semibold text-muted-foreground px-2 py-1 uppercase tracking-wide">{title}</div>
      <div className="space-y-1">
        {sessions.map((s: any) => (
          <a
            key={s.id}
            href={`/consultor/dashboard/agents?session=${s.id}`}
            className={cn(
              'group flex items-start gap-2 p-2 rounded-lg text-sm hover:bg-muted transition-colors',
              s.id === currentSessionId && 'bg-muted'
            )}
          >
            <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <div className="truncate font-medium">{s.title}</div>
              {s.primary_agent && <div className="text-xs text-muted-foreground">{s.primary_agent}</div>}
            </div>
            <button
              onClick={(e) => { e.preventDefault(); if (confirm('¿Eliminar conversación?')) deleteSession.mutate(s.id); }}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted-foreground/10 rounded"
            >
              <Trash2 className="h-3 w-3 text-muted-foreground" />
            </button>
          </a>
        ))}
      </div>
    </div>
  );
}
