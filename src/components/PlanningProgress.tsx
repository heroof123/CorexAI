// components/PlanningProgress.tsx
// Visual progress indicator for planning agent

import { CheckCircle, Circle, XCircle, Clock } from 'lucide-react';

interface PlanStep {
  id: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  result?: string;
  error?: string;
}

interface Plan {
  id: string;
  task: string;
  steps: PlanStep[];
  currentStep: number;
  status: 'planning' | 'executing' | 'completed' | 'failed';
}

interface PlanningProgressProps {
  plan: Plan;
  onCancel?: () => void;
  className?: string;
}

export default function PlanningProgress({
  plan,
  onCancel,
  className = ''
}: PlanningProgressProps) {
  const progress = (plan.steps.filter(s => s.status === 'completed').length / plan.steps.length) * 100;

  const getStepIcon = (step: PlanStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'in-progress':
        return <Clock className="w-5 h-5 text-[var(--color-primary)] animate-spin" />;
      default:
        return <Circle className="w-5 h-5 text-[var(--color-textSecondary)]" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-500';
      case 'failed':
        return 'text-red-500';
      case 'in-progress':
        return 'text-[var(--color-primary)]';
      default:
        return 'text-[var(--color-textSecondary)]';
    }
  };

  return (
    <div className={`bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-[var(--color-text)] mb-1">
            📋 Plan Yürütülüyor
          </h3>
          <p className="text-sm text-[var(--color-textSecondary)]">
            {plan.task}
          </p>
        </div>
        {onCancel && plan.status === 'executing' && (
          <button
            onClick={onCancel}
            className="px-3 py-1 text-sm bg-red-500/10 text-red-500 rounded hover:bg-red-500/20 transition-colors"
          >
            İptal
          </button>
        )}
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-[var(--color-textSecondary)]">
            İlerleme: {plan.currentStep + 1} / {plan.steps.length}
          </span>
          <span className={`font-medium ${getStatusColor(plan.status)}`}>
            {progress.toFixed(0)}%
          </span>
        </div>
        <div className="w-full h-2 bg-[var(--color-hover)] rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--color-primary)] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {plan.steps.map((step, index) => (
          <div
            key={step.id}
            className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
              step.status === 'in-progress'
                ? 'bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/30'
                : 'bg-[var(--color-hover)]'
            }`}
          >
            {/* Icon */}
            <div className="flex-shrink-0 mt-0.5">
              {getStepIcon(step)}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-[var(--color-textSecondary)]">
                  Adım {index + 1}
                </span>
                <span className={`text-xs font-medium ${getStatusColor(step.status)}`}>
                  {step.status === 'pending' && 'Bekliyor'}
                  {step.status === 'in-progress' && 'Yürütülüyor...'}
                  {step.status === 'completed' && 'Tamamlandı'}
                  {step.status === 'failed' && 'Başarısız'}
                </span>
              </div>
              <p className="text-sm text-[var(--color-text)] mb-1">
                {step.description}
              </p>
              
              {/* Result or Error */}
              {step.result && (
                <p className="text-xs text-[var(--color-textSecondary)] mt-2 p-2 bg-[var(--color-background)] rounded">
                  ✓ {step.result}
                </p>
              )}
              {step.error && (
                <p className="text-xs text-red-500 mt-2 p-2 bg-red-500/10 rounded">
                  ✗ {step.error}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      {plan.status === 'completed' && (
        <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
          <p className="text-sm text-green-600 font-medium">
            ✓ Plan başarıyla tamamlandı!
          </p>
        </div>
      )}
      {plan.status === 'failed' && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-sm text-red-600 font-medium">
            ✗ Plan başarısız oldu. Lütfen tekrar deneyin.
          </p>
        </div>
      )}
    </div>
  );
}

// Compact version for sidebar
export function PlanningProgressCompact({ plan }: { plan: Plan }) {
  const progress = (plan.steps.filter(s => s.status === 'completed').length / plan.steps.length) * 100;

  return (
    <div className="flex items-center gap-2 text-sm">
      <div className="w-16 h-1.5 bg-[var(--color-hover)] rounded-full overflow-hidden">
        <div
          className="h-full bg-[var(--color-primary)]"
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="text-xs text-[var(--color-textSecondary)]">
        {plan.currentStep + 1}/{plan.steps.length}
      </span>
    </div>
  );
}
