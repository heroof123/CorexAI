import { useState, useEffect, useRef } from "react";

interface FileItem {
  path: string;
  name: string;
  directory: string;
  extension: string;
}

interface QuickFileOpenProps {
  isOpen: boolean;
  onClose: () => void;
  files: string[];
  onFileSelect: (filePath: string) => void;
}

export default function QuickFileOpen({ isOpen, onClose, files, onFileSelect }: QuickFileOpenProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Convert file paths to structured data
  const fileItems: FileItem[] = files.map(filePath => {
    const parts = filePath.split(/[\\/]/);
    const name = parts[parts.length - 1];
    const directory = parts.slice(0, -1).join('/');
    const extension = name.split('.').pop() || '';
    
    return {
      path: filePath,
      name,
      directory,
      extension
    };
  });

  // Filter files based on query
  const filteredFiles = fileItems.filter(file =>
    file.name.toLowerCase().includes(query.toLowerCase()) ||
    file.path.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 50); // Limit to 50 results for performance

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < filteredFiles.length - 1 ? prev + 1 : 0
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : filteredFiles.length - 1
          );
          break;
        case "Enter":
          e.preventDefault();
          if (filteredFiles[selectedIndex]) {
            onFileSelect(filteredFiles[selectedIndex].path);
            onClose();
          }
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredFiles, selectedIndex, onClose, onFileSelect]);

  const getFileIcon = (extension: string) => {
    const iconMap: Record<string, string> = {
      'tsx': '⚛️',
      'ts': '🔷',
      'jsx': '⚛️',
      'js': '🟨',
      'json': '📋',
      'md': '📝',
      'css': '🎨',
      'scss': '🎨',
      'html': '🌐',
      'rs': '🦀',
      'py': '🐍',
      'toml': '⚙️',
      'yaml': '📄',
      'yml': '📄',
      'txt': '📄',
      'gitignore': '🚫',
      'env': '🔐'
    };
    return iconMap[extension] || '📄';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-20 z-50">
      <div 
        className="w-full max-w-2xl bg-[#252525] border border-neutral-700 rounded-lg shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="p-4 border-b border-neutral-700">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              placeholder="Dosya ara... (örn: app.tsx, main.rs)"
              className="w-full pl-10 pr-4 py-3 bg-[#1e1e1e] border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 text-sm"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Files List */}
        <div className="max-h-96 overflow-y-auto">
          {filteredFiles.length === 0 ? (
            <div className="p-8 text-center text-neutral-500">
              <svg className="w-12 h-12 mx-auto mb-4 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33" />
              </svg>
              <p className="text-sm">
                {query ? `"${query}" için dosya bulunamadı` : 'Dosya ara'}
              </p>
              <p className="text-xs text-neutral-600 mt-1">
                Dosya adı veya yolu yazın
              </p>
            </div>
          ) : (
            <div className="py-2">
              {filteredFiles.map((file, index) => (
                <button
                  key={file.path}
                  onClick={() => {
                    onFileSelect(file.path);
                    onClose();
                  }}
                  className={`w-full text-left px-4 py-3 hover:bg-neutral-700 transition-colors ${
                    index === selectedIndex ? 'bg-blue-600/20 border-l-2 border-blue-500' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{getFileIcon(file.extension)}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-white truncate">
                        {file.name}
                      </h3>
                      <p className="text-xs text-neutral-400 truncate">
                        {file.directory || '/'}
                      </p>
                    </div>
                    <span className="text-xs text-neutral-600 bg-neutral-800 px-2 py-1 rounded">
                      {file.extension.toUpperCase()}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-neutral-700 bg-[#1e1e1e]">
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <div className="flex items-center gap-4">
              <span>↑↓ Gezin</span>
              <span>Enter Aç</span>
              <span>Esc Kapat</span>
            </div>
            <span>{filteredFiles.length} dosya</span>
          </div>
        </div>
      </div>
    </div>
  );
}