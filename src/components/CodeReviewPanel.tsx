import { useState, useEffect } from 'react';
import { performCodeReview } from '../services/ai';

interface CodeReviewPanelProps {
  filePath: string;
  content: string;
  isVisible: boolean;
  onClose: () => void;
}

interface ReviewResult {
  score: number;
  issues: Array<{
    line: number;
    type: 'error' | 'warning' | 'suggestion';
    message: string;
    severity: 'high' | 'medium' | 'low';
  }>;
  suggestions: string[];
  summary: string;
}

export default function CodeReviewPanel({ filePath, content, isVisible, onClose }: CodeReviewPanelProps) {
  const [review, setReview] = useState<ReviewResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isVisible && filePath && content) {
      performReview();
    }
  }, [isVisible, filePath, content]);

  const performReview = async () => {
    setIsLoading(true);
    try {
      const result = await performCodeReview(filePath, content);
      setReview(result);
    } catch (error) {
      console.error('Code review error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'suggestion': return '💡';
      default: return '📝';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg w-[800px] h-[600px] flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b border-[var(--color-border)] flex items-center justify-between">
          <h3 className="text-lg font-semibold">🔍 Code Review - {filePath.split('/').pop()}</h3>
          <button
            onClick={onClose}
            className="text-[var(--color-textSecondary)] hover:text-[var(--color-text)]"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin text-4xl mb-4">🔄</div>
                <p className="text-[var(--color-textSecondary)]">Kod inceleniyor...</p>
              </div>
            </div>
          ) : review ? (
            <div className="space-y-6">
              {/* Score */}
              <div className="text-center">
                <div className={`text-6xl font-bold ${getScoreColor(review.score)}`}>
                  {review.score}
                </div>
                <p className="text-[var(--color-textSecondary)]">Kod Kalitesi Puanı</p>
              </div>

              {/* Summary */}
              <div className="p-4 bg-[var(--color-background)] border border-[var(--color-border)] rounded">
                <h4 className="font-semibold mb-2">📋 Özet</h4>
                <p className="text-sm">{review.summary}</p>
              </div>

              {/* Issues */}
              {review.issues.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">🐛 Tespit Edilen Sorunlar ({review.issues.length})</h4>
                  <div className="space-y-2">
                    {review.issues.map((issue, index) => (
                      <div key={index} className="p-3 bg-[var(--color-background)] border border-[var(--color-border)] rounded">
                        <div className="flex items-start gap-3">
                          <span className="text-lg">{getIssueIcon(issue.type)}</span>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-mono bg-[var(--color-surface)] px-2 py-0.5 rounded">
                                Satır {issue.line}
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded ${getSeverityColor(issue.severity)}`}>
                                {issue.severity.toUpperCase()}
                              </span>
                              <span className="text-xs bg-[var(--color-primary)]/20 text-[var(--color-primary)] px-2 py-0.5 rounded">
                                {issue.type.toUpperCase()}
                              </span>
                            </div>
                            <p className="text-sm">{issue.message}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {review.suggestions.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">💡 İyileştirme Önerileri</h4>
                  <div className="space-y-2">
                    {review.suggestions.map((suggestion, index) => (
                      <div key={index} className="p-3 bg-[var(--color-background)] border border-[var(--color-border)] rounded">
                        <div className="flex items-start gap-3">
                          <span className="text-lg">💡</span>
                          <p className="text-sm flex-1">{suggestion}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No Issues */}
              {review.issues.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">✅</div>
                  <p className="text-[var(--color-textSecondary)]">Harika! Kod incelemesinde önemli bir sorun bulunamadı.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-4xl mb-4">🔍</div>
                <p className="text-[var(--color-textSecondary)]">Kod incelemesi için dosya seçin</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-[var(--color-border)] flex justify-between">
          <button
            onClick={performReview}
            disabled={isLoading || !content}
            className="px-4 py-2 bg-[var(--color-primary)] text-white rounded hover:opacity-80 transition-opacity disabled:opacity-50"
          >
            🔄 Yeniden İncele
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-[var(--color-border)] rounded hover:bg-[var(--color-hover)] transition-colors"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}
