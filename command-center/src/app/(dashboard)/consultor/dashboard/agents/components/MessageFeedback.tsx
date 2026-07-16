'use client';

import { useState } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Props {
  messageId: string;
  onFeedback?: (rating: 'thumbs_up' | 'thumbs_down', comment?: string) => void;
}

export function MessageFeedback({ messageId, onFeedback }: Props) {
  const [rating, setRating] = useState<'thumbs_up' | 'thumbs_down' | null>(null);

  const handleClick = async (newRating: 'thumbs_up' | 'thumbs_down') => {
    const finalRating = rating === newRating ? null : newRating;
    setRating(finalRating);
    if (finalRating) {
      try {
        await fetch('/api/chat/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message_id: messageId,
            session_id: null,
            rating: finalRating,
            was_helpful: finalRating === 'thumbs_up',
          }),
        });
      } catch (err) {
        console.error('Error sending feedback:', err);
      }
      onFeedback?.(finalRating);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleClick('thumbs_up')}
        className={cn('h-7 px-2', rating === 'thumbs_up' && 'text-green-500 bg-green-500/10')}
      >
        <ThumbsUp className="h-3 w-3" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleClick('thumbs_down')}
        className={cn('h-7 px-2', rating === 'thumbs_down' && 'text-red-500 bg-red-500/10')}
      >
        <ThumbsDown className="h-3 w-3" />
      </Button>
    </div>
  );
}
