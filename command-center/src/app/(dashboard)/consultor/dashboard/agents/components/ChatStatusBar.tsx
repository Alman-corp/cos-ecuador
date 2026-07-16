'use client';

import { ChatEvent, ChatStatus } from '@/lib/agents/useAgentChat';
import { Loader2, Wifi, WifiOff, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Props {
  status: ChatStatus;
  currentEvent: ChatEvent | null;
}

export function ChatStatusBar({ status, currentEvent }: Props) {
  const getStatusDisplay = () => {
    switch (status) {
      case 'connecting':
        return { icon: <Loader2 className="h-3 w-3 animate-spin" />, text: 'Conectando al agente...', color: 'text-blue-500' };
      case 'thinking':
        return { icon: <Sparkles className="h-3 w-3 animate-pulse" />, text: currentEvent?.content || 'Razonando...', color: 'text-purple-500' };
      case 'calling_tool':
        return { icon: <Loader2 className="h-3 w-3 animate-spin" />, text: `Ejecutando ${currentEvent?.tool_name || 'herramienta'}...`, color: 'text-orange-500' };
      case 'streaming':
        return { icon: <Wifi className="h-3 w-3" />, text: `Generando respuesta (${currentEvent?.elapsed_ms || 0}ms)`, color: 'text-green-500' };
      case 'done':
        return { icon: <Wifi className="h-3 w-3" />, text: 'Listo', color: 'text-muted-foreground' };
      case 'error':
        return { icon: <WifiOff className="h-3 w-3" />, text: 'Error de conexión', color: 'text-red-500' };
      default:
        return null;
    }
  };

  const display = getStatusDisplay();
  if (!display) return null;

  return (
    <div className="border-b bg-muted/20 px-4 py-2">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className={cn('flex items-center gap-2 text-sm', display.color)}>
          {display.icon}
          <span className="truncate max-w-md">{display.text}</span>
        </div>
        <div className="flex items-center gap-2">
          {currentEvent?.agent && <Badge variant="outline" className="text-xs">{currentEvent.agent}</Badge>}
        </div>
      </div>
    </div>
  );
}
