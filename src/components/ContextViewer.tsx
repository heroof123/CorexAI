// components/ContextViewer.tsx
// Visual display of active context files

import { useState } from 'react';
import { FileText, X, ChevronDown, ChevronRight } from 'lucide-react';

interface ContextFile {
  path: string;
  content: string;
  relevanceScore: number;
  lastAccessed: number;
}

interface ContextViewerProps {
  files: ContextFile[];
  totalTokens?: number;
  maxTokens?: number;
  onRemoveFile?: (path: string) => void;
  className?: string;
}

export default function ContextViewer({
  files,
  totalTokens = 0,
  maxTokens = 4000,
  onRemoveFile,
  className = ''
}: ContextViewerProps) {
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());

  const toggleFile = (path: string) => {
    setExpandedFiles(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const getRelevanceColor = (score: number) => {
    if (score >= 0.7) return 'text-green-500';
    if (score >= 0.4) return 'text-yellow-500';
    return 'text-[var(--color-textSecondary)]';
  };

  const getRelevanceLabel = (score: number) => {
    if (score >= 0.7) return 'Yüksek';
    if (score >= 0.4) return 'Orta';
    return 'Düşük';
  };

  const tokenUsagePercent = (totalTokens / maxTokens) * 100;

  if (files.length === 0) {
    return (
      <div className={`bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-4 ${className}`}>
        <p className="text-sm text-[var(--color-textSecondary)] text-center">
          Henüz context dosyası yok
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-[var(--color-border)]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[var(--color-text)]">
            📂 Aktif Context ({files.length} dosya)
          </h3>
          <span className="text-xs text-[var(--color-textSecondary)]">
            {totalTokens.toLocaleString()} / {maxTokens.toLocaleString()} token
          </span>
        </div>

        {/* Token usage bar */}
        <div className="w-full h-2 bg-[var(--color-hover)] rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              tokenUsagePercent > 90
                ? 'bg-red-500'
                : tokenUsagePercent > 70
                ? 'bg-yellow-500'
                : 'bg-[var(--color-primary)]'
            }`}
            style={{ width: `${Math.min(tokenUsagePercent, 100)}%` }}
          />
        </div>
      </div>

      {/* Files list */}
      <div className="max-h-96 overflow-y-auto">
        {files.map((file) => {
          const isExpanded = expandedFiles.has(file.path);
          const fileName = file.path.split('/').pop() || file.path;
          const fileDir = file.path.substring(0, file.path.lastIndexOf('/'));

          return (
            <div
              key={file.path}
              className="border-b border-[var(--color-border)] last:border-b-0"
            >
              {/* File header */}
              <div className="flex items-center gap-2 p-3 hover:bg-[var(--color-hover)] transition-colors">
                <button
                  onClick={() => toggleFile(file.path)}
                  className="flex-shrink-0 text-[var(--color-textSecondary)] hover:text-[var(--color-text)]"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>

                <FileText className="w-4 h-4 text-[var(--color-primary)] flex-shrink-0" />

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--color-text)] truncate">
                    {fileName}
                  </p>
                  {fileDir && (
                    <p className="text-xs text-[var(--color-textSecondary)] truncate">
                      {fileDir}
                    </p>
                  )}
                </div>

                {/* Relevance badge */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs font-medium ${getRelevanceColor(file.relevanceScore)}`}>
                    {getRelevanceLabel(file.relevanceScore)}
                  </span>
                  <span className="text-xs text-[var(--color-textSecondary)]">
                    {(file.relevanceScore * 100).toFixed(0)}%
                  </span>
                </div>

                {/* Remove button */}
                {onRemoveFile && (
                  <button
                    onClick={() => onRemoveFile(file.path)}
                    className="flex-shrink-0 p-1 text-[var(--color-textSecondary)] hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                    title="Context'ten kaldır"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* File content (expanded) */}
              {isExpanded && (
                <div className="px-3 pb-3 pl-11">
                  <div className="bg-[var(--color-background)] rounded p-3 max-h-48 overflow-y-auto">
                    <pre className="text-xs text-[var(--color-text)] whitespace-pre-wrap font-mono">
                      {file.content.length > 500
                        ? file.content.substring(0, 500) + '\n...'
                        : file.content}
                    </pre>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-[var(--color-textSecondary)]">
                    <span>{file.content.length} karakter</span>
                    <span>
                      Son erişim:{' '}
                      {file.lastAccessed > 0
                        ? new Date(file.lastAccessed).toLocaleTimeString('tr-TR')
                        : 'Hiç'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      {tokenUsagePercent > 90 && (
        <div className="p-3 bg-red-500/10 border-t border-red-500/30">
          <p className="text-xs text-red-600">
            ⚠️ Context limiti dolmak üzere! Bazı dosyaları kaldırmayı düşünün.
          </p>
        </div>
      )}
    </div>
  );
}

// Compact version for status bar
export function ContextViewerCompact({ fileCount, tokenCount }: { fileCount: number; tokenCount: number }) {
  return (
    <div className="flex items-center gap-2 text-xs text-[var(--color-textSecondary)]">
      <FileText className="w-3 h-3" />
      <span>{fileCount} dosya</span>
      <span>•</span>
      <span>{tokenCount.toLocaleString()} token</span>
    </div>
  );
}
