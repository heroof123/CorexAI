// components/EnhancedDiffViewer.tsx - Gelişmiş diff görüntüleyici

import { useState } from 'react';
import { diffLines } from 'diff';

interface EnhancedDiffViewerProps {
  filePath: string;
  oldContent: string;
  newContent: string;
  onAccept: () => void;
  onReject: () => void;
  onEdit?: (content: string) => void;
}

export default function EnhancedDiffViewer({
  filePath,
  oldContent,
  newContent,
  onAccept,
  onReject,
  onEdit
}: EnhancedDiffViewerProps) {
  const [viewMode, setViewMode] = useState<'split' | 'unified'>('split');
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(newContent);

  // Diff hesapla
  const changes = diffLines(oldContent, newContent);

  // İstatistikler
  const stats = {
    additions: changes.filter(c => c.added).reduce((sum, c) => sum + (c.count || 0), 0),
    deletions: changes.filter(c => c.removed).reduce((sum, c) => sum + (c.count || 0), 0),
    unchanged: changes.filter(c => !c.added && !c.removed).reduce((sum, c) => sum + (c.count || 0), 0)
  };

  const handleSaveEdit = () => {
    if (onEdit) {
      onEdit(editedContent);
    }
    setIsEditing(false);
  };

  const renderUnifiedView = () => {
    let lineNumber = 0;

    return (
      <div className="font-mono text-sm">
        {changes.map((change, idx) => {
          const lines = change.value.split('\n').filter(l => l !== '' || idx === changes.length - 1);
          
          return lines.map((line, lineIdx) => {
            lineNumber++;
            const bgColor = change.added 
              ? 'bg-green-900/30' 
              : change.removed 
                ? 'bg-red-900/30' 
                : 'bg-transparent';
            
            const prefix = change.added ? '+' : change.removed ? '-' : ' ';
            const textColor = change.added 
              ? 'text-green-400' 
              : change.removed 
                ? 'text-red-400' 
                : 'text-gray-300';

            return (
              <div key={`${idx}-${lineIdx}`} className={`flex ${bgColor} hover:bg-opacity-50`}>
                {showLineNumbers && (
                  <span className="w-12 text-right pr-4 text-gray-500 select-none">
                    {!change.removed && lineNumber}
                  </span>
                )}
                <span className={`w-6 ${textColor} select-none`}>{prefix}</span>
                <span className={textColor}>{line || ' '}</span>
              </div>
            );
          });
        })}
      </div>
    );
  };

  const renderSplitView = () => {
    let oldLineNumber = 0;
    let newLineNumber = 0;

    return (
      <div className="grid grid-cols-2 gap-2">
        {/* Old Content */}
        <div className="border-r border-gray-700">
          <div className="bg-red-900/20 px-2 py-1 text-sm font-semibold text-red-400 border-b border-gray-700">
            Eski ({stats.deletions} satır silindi)
          </div>
          <div className="font-mono text-sm">
            {changes.map((change, idx) => {
              if (change.added) return null;
              
              const lines = change.value.split('\n').filter(l => l !== '' || idx === changes.length - 1);
              
              return lines.map((line, lineIdx) => {
                oldLineNumber++;
                const bgColor = change.removed ? 'bg-red-900/30' : 'bg-transparent';
                const textColor = change.removed ? 'text-red-400' : 'text-gray-300';

                return (
                  <div key={`old-${idx}-${lineIdx}`} className={`flex ${bgColor} hover:bg-opacity-50`}>
                    {showLineNumbers && (
                      <span className="w-12 text-right pr-4 text-gray-500 select-none">
                        {oldLineNumber}
                      </span>
                    )}
                    <span className={textColor}>{line || ' '}</span>
                  </div>
                );
              });
            })}
          </div>
        </div>

        {/* New Content */}
        <div>
          <div className="bg-green-900/20 px-2 py-1 text-sm font-semibold text-green-400 border-b border-gray-700">
            Yeni ({stats.additions} satır eklendi)
          </div>
          <div className="font-mono text-sm">
            {changes.map((change, idx) => {
              if (change.removed) return null;
              
              const lines = change.value.split('\n').filter(l => l !== '' || idx === changes.length - 1);
              
              return lines.map((line, lineIdx) => {
                newLineNumber++;
                const bgColor = change.added ? 'bg-green-900/30' : 'bg-transparent';
                const textColor = change.added ? 'text-green-400' : 'text-gray-300';

                return (
                  <div key={`new-${idx}-${lineIdx}`} className={`flex ${bgColor} hover:bg-opacity-50`}>
                    {showLineNumbers && (
                      <span className="w-12 text-right pr-4 text-gray-500 select-none">
                        {newLineNumber}
                      </span>
                    )}
                    <span className={textColor}>{line || ' '}</span>
                  </div>
                );
              });
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="border border-gray-700 rounded-lg overflow-hidden bg-[#1e1e1e]">
      {/* Header */}
      <div className="bg-[#252525] px-4 py-3 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-gray-300">
              📄 {filePath.split(/[\\/]/).pop()}
            </span>
            <span className="text-xs text-gray-500">
              {filePath}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex bg-[#1e1e1e] rounded">
              <button
                onClick={() => setViewMode('split')}
                className={`px-3 py-1 text-xs rounded-l ${
                  viewMode === 'split' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Split
              </button>
              <button
                onClick={() => setViewMode('unified')}
                className={`px-3 py-1 text-xs rounded-r ${
                  viewMode === 'unified' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Unified
              </button>
            </div>

            {/* Line Numbers Toggle */}
            <button
              onClick={() => setShowLineNumbers(!showLineNumbers)}
              className="px-3 py-1 text-xs bg-[#1e1e1e] text-gray-400 hover:text-white rounded"
              title="Satır numaralarını göster/gizle"
            >
              {showLineNumbers ? '🔢' : '📝'}
            </button>

            {/* Edit Button */}
            {onEdit && (
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="px-3 py-1 text-xs bg-[#1e1e1e] text-gray-400 hover:text-white rounded"
                title="Düzenle"
              >
                ✏️
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-4 mt-2 text-xs">
          <span className="text-green-400">+{stats.additions} eklendi</span>
          <span className="text-red-400">-{stats.deletions} silindi</span>
          <span className="text-gray-500">{stats.unchanged} değişmedi</span>
        </div>
      </div>

      {/* Content */}
      <div className="max-h-96 overflow-auto p-4">
        {isEditing ? (
          <div>
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="w-full h-80 bg-[#1e1e1e] text-gray-300 font-mono text-sm p-4 rounded border border-gray-700 focus:outline-none focus:border-blue-500"
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
              >
                Kaydet
              </button>
              <button
                onClick={() => {
                  setEditedContent(newContent);
                  setIsEditing(false);
                }}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm"
              >
                İptal
              </button>
            </div>
          </div>
        ) : (
          viewMode === 'split' ? renderSplitView() : renderUnifiedView()
        )}
      </div>

      {/* Actions */}
      {!isEditing && (
        <div className="bg-[#252525] px-4 py-3 border-t border-gray-700 flex gap-2 justify-end">
          <button
            onClick={onReject}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium transition-colors"
            title="Reddet (Esc)"
          >
            ❌ Reddet
          </button>
          <button
            onClick={onAccept}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium transition-colors"
            title="Kabul Et (Enter)"
          >
            ✅ Kabul Et
          </button>
        </div>
      )}
    </div>
  );
}
