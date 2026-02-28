import { useState, useEffect, useRef } from "react";
import { FileIndex } from "../types/index";

interface SearchResult {
  filePath: string;
  fileName: string;
  lineNumber: number;
  lineContent: string;
  matchStart: number;
  matchEnd: number;
}

interface FindInFilesProps {
  isOpen: boolean;
  onClose: () => void;
  fileIndex: FileIndex[];
  onFileSelect: (filePath: string, lineNumber?: number) => void;
}

export default function FindInFiles({ isOpen, onClose, fileIndex, onFileSelect }: FindInFilesProps) {
  const [query, setQuery] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Search in files
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const searchFiles = async () => {
      setIsSearching(true);
      const searchResults: SearchResult[] = [];

      try {
        let searchPattern: RegExp;
        
        if (useRegex) {
          searchPattern = new RegExp(query, caseSensitive ? 'g' : 'gi');
        } else {
          const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const pattern = wholeWord ? `\\b${escapedQuery}\\b` : escapedQuery;
          searchPattern = new RegExp(pattern, caseSensitive ? 'g' : 'gi');
        }

        for (const file of fileIndex) {
          const lines = file.content.split('\n');
          
          lines.forEach((line, lineIndex) => {
            let match;
            searchPattern.lastIndex = 0; // Reset regex
            
            while ((match = searchPattern.exec(line)) !== null) {
              searchResults.push({
                filePath: file.path,
                fileName: file.path.split(/[\\/]/).pop() || '',
                lineNumber: lineIndex + 1,
                lineContent: line,
                matchStart: match.index,
                matchEnd: match.index + match[0].length
              });
              
              // Prevent infinite loop for zero-length matches
              if (match.index === searchPattern.lastIndex) {
                searchPattern.lastIndex++;
              }
            }
          });
        }

        setResults(searchResults.slice(0, 100)); // Limit to 100 results
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      }

      setIsSearching(false);
    };

    const debounceTimer = setTimeout(searchFiles, 300);
    return () => clearTimeout(debounceTimer);
  }, [query, caseSensitive, wholeWord, useRegex, fileIndex]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

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
            prev < results.length - 1 ? prev + 1 : 0
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : results.length - 1
          );
          break;
        case "Enter":
          e.preventDefault();
          if (results[selectedIndex]) {
            const result = results[selectedIndex];
            onFileSelect(result.filePath, result.lineNumber);
            onClose();
          }
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, results, selectedIndex, onClose, onFileSelect]);

  const highlightMatch = (text: string, start: number, end: number) => {
    return (
      <>
        {text.substring(0, start)}
        <span className="bg-yellow-500/30 text-yellow-300 px-1 rounded">
          {text.substring(start, end)}
        </span>
        {text.substring(end)}
      </>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-20 z-50">
      <div className="w-full max-w-4xl bg-[#252525] border border-neutral-700 rounded-lg shadow-2xl overflow-hidden">
        {/* Search Input */}
        <div className="p-4 border-b border-neutral-700">
          <div className="relative mb-3">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              placeholder="Projede ara... (örn: useState, function, class)"
              className="w-full pl-10 pr-4 py-3 bg-[#1e1e1e] border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 text-sm"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          
          {/* Search Options */}
          <div className="flex items-center gap-4 text-xs">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={caseSensitive}
                onChange={(e) => setCaseSensitive(e.target.checked)}
                className="rounded"
              />
              <span className="text-neutral-300">Aa (Büyük/küçük harf)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={wholeWord}
                onChange={(e) => setWholeWord(e.target.checked)}
                className="rounded"
              />
              <span className="text-neutral-300">Ab (Tam kelime)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={useRegex}
                onChange={(e) => setUseRegex(e.target.checked)}
                className="rounded"
              />
              <span className="text-neutral-300">.*  (Regex)</span>
            </label>
          </div>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {isSearching ? (
            <div className="p-8 text-center text-neutral-500">
              <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-sm">Aranıyor...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center text-neutral-500">
              <svg className="w-12 h-12 mx-auto mb-4 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="text-sm">
                {query ? `"${query}" için sonuç bulunamadı` : 'Projede arama yapın'}
              </p>
              <p className="text-xs text-neutral-600 mt-1">
                Aranacak metni girin
              </p>
            </div>
          ) : (
            <div className="py-2">
              {results.map((result, index) => (
                <button
                  key={`${result.filePath}-${result.lineNumber}-${index}`}
                  onClick={() => {
                    onFileSelect(result.filePath, result.lineNumber);
                    onClose();
                  }}
                  className={`w-full text-left px-4 py-3 hover:bg-neutral-700 transition-colors ${
                    index === selectedIndex ? 'bg-blue-600/20 border-l-2 border-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-lg mt-1">📄</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-medium text-white truncate">
                          {result.fileName}
                        </h3>
                        <span className="text-xs text-neutral-500 bg-neutral-800 px-2 py-1 rounded">
                          Satır {result.lineNumber}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 font-mono leading-relaxed">
                        {highlightMatch(result.lineContent.trim(), result.matchStart, result.matchEnd)}
                      </p>
                      <p className="text-xs text-neutral-600 mt-1 truncate">
                        {result.filePath}
                      </p>
                    </div>
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
              <span>Enter Git</span>
              <span>Esc Kapat</span>
            </div>
            <span>{results.length} sonuç</span>
          </div>
        </div>
      </div>
    </div>
  );
}
