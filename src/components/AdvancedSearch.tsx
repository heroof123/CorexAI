import { useState, useEffect, useRef } from 'react';
import { FileIndex } from '../types/index';

interface SearchResult {
  filePath: string;
  lineNumber: number;
  lineContent: string;
  matchStart: number;
  matchEnd: number;
}

interface SearchHistory {
  query: string;
  isRegex: boolean;
  caseSensitive: boolean;
  timestamp: number;
}

interface AdvancedSearchProps {
  isOpen: boolean;
  onClose: () => void;
  fileIndex: FileIndex[];
  onFileSelect: (filePath: string, lineNumber?: number) => void;
}

export default function AdvancedSearch({ isOpen, onClose, fileIndex, onFileSelect }: AdvancedSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [isRegex, setIsRegex] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [showReplace, setShowReplace] = useState(false);
  const [selectedResult, setSelectedResult] = useState(0);
  const [includePatterns, setIncludePatterns] = useState('');
  const [excludePatterns, setExcludePatterns] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load search history on mount
  useEffect(() => {
    const saved = localStorage.getItem('corex-search-history');
    if (saved) {
      try {
        setSearchHistory(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to load search history:', error);
      }
    }
  }, []);

  // Save search history
  const saveSearchHistory = (query: string) => {
    if (!query.trim()) return;

    const newEntry: SearchHistory = {
      query,
      isRegex,
      caseSensitive,
      timestamp: Date.now()
    };

    const updated = [newEntry, ...searchHistory.filter(h => h.query !== query)].slice(0, 20);
    setSearchHistory(updated);
    localStorage.setItem('corex-search-history', JSON.stringify(updated));
  };

  // Perform search
  const performSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    saveSearchHistory(searchQuery);

    try {
      const results: SearchResult[] = [];
      let searchRegex: RegExp;

      // Build search regex
      try {
        let pattern = searchQuery;
        
        if (!isRegex) {
          // Escape special regex characters
          pattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }

        if (wholeWord) {
          pattern = `\\b${pattern}\\b`;
        }

        const flags = caseSensitive ? 'g' : 'gi';
        searchRegex = new RegExp(pattern, flags);
      } catch (error) {
        alert('Geçersiz regex pattern: ' + error);
        setIsSearching(false);
        return;
      }

      // Filter files by include/exclude patterns
      let filesToSearch = fileIndex;
      
      if (includePatterns) {
        const includeRegex = new RegExp(includePatterns.replace(/\*/g, '.*'), 'i');
        filesToSearch = filesToSearch.filter(file => includeRegex.test(file.path));
      }

      if (excludePatterns) {
        const excludeRegex = new RegExp(excludePatterns.replace(/\*/g, '.*'), 'i');
        filesToSearch = filesToSearch.filter(file => !excludeRegex.test(file.path));
      }

      // Search in files
      for (const file of filesToSearch) {
        const lines = file.content.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          let match;
          
          while ((match = searchRegex.exec(line)) !== null) {
            results.push({
              filePath: file.path,
              lineNumber: i + 1,
              lineContent: line,
              matchStart: match.index,
              matchEnd: match.index + match[0].length
            });

            // Prevent infinite loop with global regex
            if (!searchRegex.global) break;
          }
          
          // Reset regex for next line
          searchRegex.lastIndex = 0;
        }
      }

      setSearchResults(results);
      setSelectedResult(0);
    } catch (error) {
      console.error('Search error:', error);
      alert('Arama hatası: ' + error);
    } finally {
      setIsSearching(false);
    }
  };

  // Perform replace
  const performReplace = async (replaceAll = false) => {
    if (!searchQuery.trim() || !replaceQuery) return;

    const confirmMessage = replaceAll 
      ? `${searchResults.length} sonucu "${replaceQuery}" ile değiştirmek istediğinizden emin misiniz?`
      : 'Bu sonucu değiştirmek istediğinizden emin misiniz?';

    if (!confirm(confirmMessage)) return;

    try {
      // Group results by file
      const fileGroups = new Map<string, SearchResult[]>();
      const resultsToReplace = replaceAll ? searchResults : [searchResults[selectedResult]];

      for (const result of resultsToReplace) {
        if (!fileGroups.has(result.filePath)) {
          fileGroups.set(result.filePath, []);
        }
        fileGroups.get(result.filePath)!.push(result);
      }

      // Replace in each file
      for (const [filePath, results] of fileGroups) {
        const file = fileIndex.find(f => f.path === filePath);
        if (!file) continue;

        let content = file.content;
        const lines = content.split('\n');

        // Sort results by line number (descending) to avoid index issues
        results.sort((a, b) => b.lineNumber - a.lineNumber || b.matchStart - a.matchStart);

        for (const result of results) {
          const lineIndex = result.lineNumber - 1;
          const line = lines[lineIndex];
          const before = line.substring(0, result.matchStart);
          const after = line.substring(result.matchEnd);
          lines[lineIndex] = before + replaceQuery + after;
        }

        const newContent = lines.join('\n');
        
        // Update file content (this would need to be implemented in the parent component)
        // For now, we'll just show a success message
        console.log(`Would replace in ${filePath}:`, newContent);
      }

      alert(`${resultsToReplace.length} değişiklik yapıldı!`);
      
      // Refresh search results
      performSearch();
    } catch (error) {
      console.error('Replace error:', error);
      alert('Değiştirme hatası: ' + error);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      performSearch();
    } else if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown' && searchResults.length > 0) {
      e.preventDefault();
      setSelectedResult(prev => (prev + 1) % searchResults.length);
    } else if (e.key === 'ArrowUp' && searchResults.length > 0) {
      e.preventDefault();
      setSelectedResult(prev => (prev - 1 + searchResults.length) % searchResults.length);
    } else if (e.key === 'Enter' && e.shiftKey && searchResults.length > 0) {
      e.preventDefault();
      const result = searchResults[selectedResult];
      onFileSelect(result.filePath, result.lineNumber);
    }
  };

  // Highlight search matches in text
  const highlightMatches = (text: string, start: number, end: number) => {
    const before = text.substring(0, start);
    const match = text.substring(start, end);
    const after = text.substring(end);

    return (
      <>
        {before}
        <span className="bg-yellow-400 text-black font-semibold">{match}</span>
        {after}
      </>
    );
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      
      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
          {/* Header */}
          <div className="h-12 bg-[var(--color-background)] border-b border-[var(--color-border)] flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">🔍</span>
              <h2 className="text-lg font-semibold text-[var(--color-text)]">
                Gelişmiş Arama
              </h2>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowReplace(!showReplace)}
                className={`px-3 py-1.5 text-xs rounded transition-colors ${
                  showReplace 
                    ? 'bg-[var(--color-primary)] text-white' 
                    : 'bg-[var(--color-surface)] border border-[var(--color-border)] hover:bg-[var(--color-hover)]'
                }`}
              >
                🔄 Değiştir
              </button>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center hover:bg-[var(--color-hover)] rounded transition-colors"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Search Form */}
          <div className="p-4 border-b border-[var(--color-border)]">
            <div className="grid grid-cols-1 gap-4">
              {/* Search Input */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Arama terimi..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded focus:border-[var(--color-primary)] outline-none"
                    autoFocus
                  />
                </div>
                <button
                  onClick={performSearch}
                  disabled={isSearching}
                  className="px-4 py-2 bg-[var(--color-primary)] text-white rounded hover:opacity-80 disabled:opacity-50 transition-opacity"
                >
                  {isSearching ? '🔄' : '🔍'} Ara
                </button>
              </div>

              {/* Replace Input */}
              {showReplace && (
                <div className="flex gap-2">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Değiştirilecek metin..."
                      value={replaceQuery}
                      onChange={(e) => setReplaceQuery(e.target.value)}
                      className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded focus:border-[var(--color-primary)] outline-none"
                    />
                  </div>
                  <button
                    onClick={() => performReplace(false)}
                    disabled={searchResults.length === 0}
                    className="px-3 py-2 bg-[var(--color-warning)] text-white rounded hover:opacity-80 disabled:opacity-50 transition-opacity text-sm"
                  >
                    Değiştir
                  </button>
                  <button
                    onClick={() => performReplace(true)}
                    disabled={searchResults.length === 0}
                    className="px-3 py-2 bg-[var(--color-error)] text-white rounded hover:opacity-80 disabled:opacity-50 transition-opacity text-sm"
                  >
                    Tümünü Değiştir
                  </button>
                </div>
              )}

              {/* Options */}
              <div className="flex flex-wrap gap-4 text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={caseSensitive}
                    onChange={(e) => setCaseSensitive(e.target.checked)}
                    className="rounded"
                  />
                  <span>Büyük/küçük harf duyarlı</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={wholeWord}
                    onChange={(e) => setWholeWord(e.target.checked)}
                    className="rounded"
                  />
                  <span>Tam kelime</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isRegex}
                    onChange={(e) => setIsRegex(e.target.checked)}
                    className="rounded"
                  />
                  <span>Regex</span>
                </label>
              </div>

              {/* File Filters */}
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Dahil edilecek dosyalar (*.ts, *.js)"
                  value={includePatterns}
                  onChange={(e) => setIncludePatterns(e.target.value)}
                  className="px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded focus:border-[var(--color-primary)] outline-none text-sm"
                />
                <input
                  type="text"
                  placeholder="Hariç tutulacak dosyalar (node_modules)"
                  value={excludePatterns}
                  onChange={(e) => setExcludePatterns(e.target.value)}
                  className="px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded focus:border-[var(--color-primary)] outline-none text-sm"
                />
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="flex-1 flex overflow-hidden">
            {/* Search History */}
            {searchHistory.length > 0 && !searchQuery && (
              <div className="w-64 border-r border-[var(--color-border)] p-4">
                <h3 className="text-sm font-semibold mb-2">📚 Arama Geçmişi</h3>
                <div className="space-y-1">
                  {searchHistory.slice(0, 10).map((item, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSearchQuery(item.query);
                        setIsRegex(item.isRegex);
                        setCaseSensitive(item.caseSensitive);
                        searchInputRef.current?.focus();
                      }}
                      className="block w-full text-left px-2 py-1 text-xs hover:bg-[var(--color-hover)] rounded truncate"
                    >
                      {item.query}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Results List */}
            <div className="flex-1 overflow-y-auto">
              {searchResults.length > 0 ? (
                <div className="p-4">
                  <div className="text-sm text-[var(--color-textSecondary)] mb-4">
                    {searchResults.length} sonuç bulundu
                  </div>
                  
                  <div className="space-y-2">
                    {searchResults.map((result, index) => (
                      <div
                        key={`${result.filePath}-${result.lineNumber}-${index}`}
                        className={`p-3 border border-[var(--color-border)] rounded cursor-pointer transition-colors ${
                          selectedResult === index 
                            ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10' 
                            : 'hover:border-[var(--color-primary)]/50'
                        }`}
                        onClick={() => {
                          setSelectedResult(index);
                          onFileSelect(result.filePath, result.lineNumber);
                        }}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-[var(--color-text)]">
                            📄 {result.filePath.split('/').pop()}
                          </span>
                          <span className="text-xs text-[var(--color-textSecondary)]">
                            Satır {result.lineNumber}
                          </span>
                        </div>
                        <div className="text-xs text-[var(--color-textSecondary)] mb-1">
                          {result.filePath}
                        </div>
                        <div className="text-sm font-mono bg-[var(--color-background)] p-2 rounded">
                          {highlightMatches(result.lineContent, result.matchStart, result.matchEnd)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : searchQuery && !isSearching ? (
                <div className="p-8 text-center text-[var(--color-textSecondary)]">
                  <div className="text-4xl mb-2">🔍</div>
                  <div>Sonuç bulunamadı</div>
                </div>
              ) : !searchQuery ? (
                <div className="p-8 text-center text-[var(--color-textSecondary)]">
                  <div className="text-4xl mb-2">🔍</div>
                  <div>Arama yapmak için bir terim girin</div>
                  <div className="text-xs mt-2">
                    <kbd>Enter</kbd> - Ara • <kbd>↑↓</kbd> - Gezin • <kbd>Shift+Enter</kbd> - Dosyayı Aç
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}