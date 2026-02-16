import { useState, useEffect } from "react";
import { ProactiveSuggestion, ProactiveAssistant } from "../services/proactiveAssistant";
import { FileIndex } from "../types/index";

interface ProactiveSuggestionsProps {
  fileIndex: FileIndex[];
  currentFile?: string;
  onSuggestionClick: (action: string) => void;
}

export default function ProactiveSuggestions({
  fileIndex,
  currentFile,
  onSuggestionClick,
}: ProactiveSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<ProactiveSuggestion[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [userDismissed, setUserDismissed] = useState(false);
  const [assistant] = useState(new ProactiveAssistant());
  const [autoHideTimer, setAutoHideTimer] = useState<NodeJS.Timeout | null>(null);

  // Auto-hide after 10 seconds of no interaction
  useEffect(() => {
    if (isVisible && suggestions.length > 0) {
      // Clear existing timer
      if (autoHideTimer) {
        clearTimeout(autoHideTimer);
      }
      
      // Set new timer
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 10000); // 10 seconds
      
      setAutoHideTimer(timer);
      
      return () => {
        if (timer) clearTimeout(timer);
      };
    }
  }, [isVisible, suggestions.length]);

  // Reset timer on user interaction
  const resetAutoHideTimer = () => {
    if (autoHideTimer) {
      clearTimeout(autoHideTimer);
    }
    
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 10000);
    
    setAutoHideTimer(timer);
  };

  useEffect(() => {
    const analyzePeriodically = async () => {
      if (fileIndex.length === 0 || userDismissed) return;
      
      const newSuggestions = await assistant.analyzeProject(fileIndex, currentFile);
      setSuggestions(newSuggestions);
      setIsVisible(newSuggestions.length > 0);
    };

    // İlk analiz 10 saniye sonra (kullanıcı projeyi açtıktan sonra)
    const initialTimeout = setTimeout(analyzePeriodically, 10000);

    // Periyodik analiz 2 dakikada bir (daha az sıklık)
    const interval = setInterval(analyzePeriodically, 120000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [fileIndex, currentFile, assistant, userDismissed]);

  // Kullanıcı kapatırsa, 10 dakika boyunca gösterme
  const handleDismiss = () => {
    setIsVisible(false);
    setUserDismissed(true);
    
    // 10 dakika sonra tekrar gösterebilir
    setTimeout(() => {
      setUserDismissed(false);
    }, 600000); // 10 dakika
  };

  if (!isVisible || suggestions.length === 0 || userDismissed) return null;

  return (
    <div className="border-b border-neutral-800 bg-gradient-to-r from-blue-500/5 to-purple-500/5">
      <div className="p-2">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-blue-400">💡 Akıllı Öneriler</span>
            <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-300 text-xs rounded-full">
              1
            </span>
          </div>
          <button
            onClick={handleDismiss}
            className="text-neutral-500 hover:text-neutral-300 text-xs"
            title="10 dakika boyunca gizle"
          >
            ✕
          </button>
        </div>
        
        <div className="space-y-1">
          {suggestions.slice(0, 1).map((suggestion) => (
            <div
              key={suggestion.id}
              className={`p-2 rounded-lg border transition-colors ${
                suggestion.priority === 'high'
                  ? 'bg-red-500/10 border-red-500/20 hover:bg-red-500/15'
                  : suggestion.priority === 'medium'
                  ? 'bg-yellow-500/10 border-yellow-500/20 hover:bg-yellow-500/15'
                  : 'bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/15'
              }`}
              onMouseEnter={resetAutoHideTimer}
              onMouseLeave={resetAutoHideTimer}
            >
              <div className="flex items-start gap-2">
                <span className="text-sm mt-0.5">{suggestion.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-xs font-medium text-white">
                      {suggestion.title}
                    </h4>
                    <span
                      className={`px-1.5 py-0.5 text-xs rounded-full ${
                        suggestion.priority === 'high'
                          ? 'bg-red-500/20 text-red-300'
                          : suggestion.priority === 'medium'
                          ? 'bg-yellow-500/20 text-yellow-300'
                          : 'bg-blue-500/20 text-blue-300'
                      }`}
                    >
                      {suggestion.priority === 'high' ? 'Yüksek' : 
                       suggestion.priority === 'medium' ? 'Orta' : 'Düşük'}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 mb-1">
                    {suggestion.description}
                  </p>
                  {suggestion.action && (
                    <button
                      onClick={() => onSuggestionClick(suggestion.action!)}
                      className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                    >
                      {suggestion.action}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-2 text-xs text-neutral-600 text-center">
          Bu öneriler kodunuz analiz edilerek otomatik oluşturuldu
        </div>
      </div>
    </div>
  );
}