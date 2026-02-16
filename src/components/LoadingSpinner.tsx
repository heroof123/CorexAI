// components/LoadingSpinner.tsx - Reusable loading spinner

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

export default function LoadingSpinner({ 
  size = 'md', 
  text, 
  fullScreen = false,
  className = ''
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3',
    xl: 'w-16 h-16 border-4'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg'
  };

  const spinner = (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div
        className={`${sizeClasses[size]} border-[var(--color-primary)] border-t-transparent rounded-full animate-spin`}
        role="status"
        aria-label="Loading"
        aria-live="polite"
      />
      {text && (
        <p className={`${textSizeClasses[size]} text-[var(--color-textSecondary)] animate-pulse`}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-[var(--color-background)]/80 backdrop-blur-sm flex items-center justify-center z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
}

// Convenience exports for common use cases
export function LoadingOverlay({ text }: { text?: string }) {
  return <LoadingSpinner size="lg" text={text} fullScreen />;
}

export function LoadingInline({ text }: { text?: string }) {
  return <LoadingSpinner size="sm" text={text} />;
}

export function LoadingButton() {
  return <LoadingSpinner size="sm" className="inline-flex" />;
}
