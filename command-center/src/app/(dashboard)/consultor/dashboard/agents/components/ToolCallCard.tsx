'use client';

import { useState } from 'react';
import { ToolExecution } from '@/lib/agents/useAgentChat';
import { Wrench, ChevronDown, ChevronRight, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Props {
  tool: ToolExecution;
}

export function ToolCallCard({ tool }: Props) {
  const [expanded, setExpanded] = useState(false);

  const statusIcon = tool.output === undefined ? (
    <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
  ) : tool.success ? (
    <CheckCircle className="h-4 w-4 text-green-500" />
  ) : (
    <XCircle className="h-4 w-4 text-red-500" />
  );

  return (
    <div className="border rounded-lg bg-background/50 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 p-3 hover:bg-muted/50 transition-colors text-left"
      >
        {statusIcon}
        <Wrench className="h-4 w-4 text-muted-foreground" />
        <span className="font-mono text-sm flex-1">{tool.name}</span>
        {tool.duration_ms > 0 && (
          <Badge variant="outline" className="text-xs">{tool.duration_ms}ms</Badge>
        )}
        {expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
      </button>
      {expanded && (
        <div className="border-t p-3 space-y-2 text-xs">
          <div>
            <div className="text-muted-foreground font-semibold mb-1">Input:</div>
            <pre className="bg-black/20 p-2 rounded overflow-x-auto max-h-40 whitespace-pre-wrap">
              {typeof tool.input === 'string' ? tool.input : JSON.stringify(tool.input, null, 2)}
            </pre>
          </div>
          {tool.output !== undefined && (
            <div>
              <div className="text-muted-foreground font-semibold mb-1">Output:</div>
              <pre className="bg-black/20 p-2 rounded overflow-x-auto max-h-60 whitespace-pre-wrap">
                {typeof tool.output === 'string' ? tool.output : JSON.stringify(tool.output, null, 2)}
              </pre>
            </div>
          )}
          {tool.error_message && (
            <div className="p-2 bg-red-500/10 border border-red-500/30 rounded">
              <div className="text-red-500 font-semibold">Error:</div>
              <div className="text-red-400">{tool.error_message}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
