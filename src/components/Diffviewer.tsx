import { useState } from "react";

interface DiffViewerProps {
  filePath: string;
  oldContent: string;
  newContent: string;
  onAccept: () => void;
  onReject: () => void;
}

export default function DiffViewer({ filePath, oldContent, newContent, onAccept, onReject }: DiffViewerProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Simple diff algorithm - sadece değişen satırları göster
  const generateDiff = () => {
    const oldLines = oldContent.split('\n');
    const newLines = newContent.split('\n');
    const diff: Array<{ type: 'add' | 'remove' | 'unchanged'; content: string; lineNumber?: number }> = [];

    const maxLines = Math.max(oldLines.length, newLines.length);
    
    for (let i = 0; i < maxLines; i++) {
      const oldLine = oldLines[i];
      const newLine = newLines[i];

      if (oldLine === undefined) {
        diff.push({ type: 'add', content: newLine, lineNumber: i + 1 });
      } else if (newLine === undefined) {
        diff.push({ type: 'remove', content: oldLine, lineNumber: i + 1 });
      } else if (oldLine !== newLine) {
        diff.push({ type: 'remove', content: oldLine, lineNumber: i + 1 });
        diff.push({ type: 'add', content: newLine, lineNumber: i + 1 });
      }
      // Unchanged satırları gösterme (kompakt görünüm için)
    }

    return diff;
  };

  const diff = generateDiff();
  const fileName = filePath.split(/[\\/]/).pop() || filePath;
  const changesCount = diff.length;

  return (
    <div className="border border-neutral-700 rounded-md bg-[#1e1e1e] overflow-hidden text-xs">
      {/* Compact Header */}
      <div className="px-3 py-2 bg-[#181818] flex items-center justify-between">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 flex-1 text-left hover:text-white transition-colors"
        >
          <svg
            className={`w-3 h-3 text-neutral-500 transition-transform ${isExpanded ? '' : '-rotate-90'}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          <span className="text-white font-medium">{fileName}</span>
          <span className="text-neutral-500 text-[10px]">
            ({changesCount} değişiklik)
          </span>
        </button>
        <div className="flex gap-1.5">
          <button
            onClick={onReject}
            className="px-2 py-1 bg-red-600/80 hover:bg-red-600 text-white rounded text-[10px] transition-colors"
            title="Reddet"
          >
            ✕
          </button>
          <button
            onClick={onAccept}
            className="px-2 py-1 bg-green-600/80 hover:bg-green-600 text-white rounded text-[10px] transition-colors"
            title="Uygula"
          >
            ✓
          </button>
        </div>
      </div>

      {/* Expandable Diff Content */}
      {isExpanded && (
        <div className="max-h-[200px] overflow-y-auto border-t border-neutral-700">
          <div className="font-mono text-[10px]">
            {diff.map((line, index) => (
              <div
                key={index}
                className={`flex ${
                  line.type === 'add'
                    ? 'bg-green-500/10 text-green-300'
                    : 'bg-red-500/10 text-red-300'
                }`}
              >
                <div className="w-8 px-1 py-0.5 text-neutral-500 bg-[#181818] border-r border-neutral-700 text-right flex-shrink-0">
                  {line.lineNumber}
                </div>
                <div className="w-4 px-1 py-0.5 text-center flex-shrink-0">
                  {line.type === 'add' ? '+' : '-'}
                </div>
                <div className="flex-1 px-2 py-0.5 whitespace-pre-wrap break-all">
                  {line.content || ' '}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
