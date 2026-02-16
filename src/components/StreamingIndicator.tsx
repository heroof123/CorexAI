// components/StreamingIndicator.tsx
// Real-time streaming indicator for AI responses

import { useEffect, useState } from 'react';

interface StreamingIndicatorProps {
  isStreaming: boolean;
  tokensPerSecond?: number;
  totalTokens?: number;
  model?: string;
  className?: string;
}

export default function StreamingIndicator({
  isStreaming,
  tokensPerSecond = 0,
  totalTokens = 0,
  model,
  className = ''
}: StreamingIndicatorProps) {
  const [dots, setDots] = useState('');

  useEffect(() => {
    if (!isStreaming) {
      setDots('');
      return;
    }

    const interval = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);

    return () => clearInterval(interval);
  }, [isStreaming]);

  if (!isStreaming) return null;

  return (
    <div className={`flex items-center gap-3 px-4 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg ${className}`}>
      {/* Animated pulse */}
      <div className="flex gap-1">
        <div className="w-2 h-2 bg-[var(--color-primary)] rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 bg-[var(--color-primary)] rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 bg-[var(--color-primary)] rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
      </div>

      {/* Status text */}
      <div className="flex-1">
        <p className="text-sm font-medium text-[var(--color-text)]">
          AI yanıt oluşturuyor{dots}
        </p>
        <div className="flex items-center gap-3 text-xs text-[var(--color-textSecondary)] mt-1">
          {model && (
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              {model}
            </span>
          )}
          {tokensPerSecond > 0 && (
            <span>{tokensPerSecond.toFixed(1)} token/s</span>
          )}
          {totalTokens > 0 && (
            <span>{totalTokens} token</span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-32 h-1 bg-[var(--color-hover)] rounded-full overflow-hidden">
        <div className="h-full bg-[var(--color-primary)] animate-pulse" style={{ width: '60%' }} />
      </div>
    </div>
  );
}

// Compact version for inline use
export function StreamingIndicatorCompact({ isStreaming }: { isStreaming: boolean }) {
  if (!isStreaming) return null;

  return (
    <div className="inline-flex items-center gap-2 text-xs text-[var(--color-textSecondary)]">
      <div className="flex gap-0.5">
        <div className="w-1 h-1 bg-[var(--color-primary)] rounded-full animate-pulse" />
        <div className="w-1 h-1 bg-[var(--color-primary)] rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
        <div className="w-1 h-1 bg-[var(--color-primary)] rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
      </div>
      <span>Yazıyor...</span>
    </div>
  );
}
