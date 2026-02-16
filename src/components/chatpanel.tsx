import { useState, useRef, useEffect, memo } from "react";
import { Message, CodeAction } from "../types/index";
import DiffViewer from "./Diffviewer";
import SmartSuggestions from "./SmartSuggestions";

interface ChatPanelProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
  pendingActions: CodeAction[];
  onAcceptAction: (actionId: string) => void;
  onRejectAction: (actionId: string) => void;
  onAcceptAllActions?: () => void;
  onNewSession?: () => void;
  isIndexing: boolean;
  currentFile?: string;
  projectContext?: {
    name: string;
    type: string;
    mainLanguages: string[];
  };
  onStopGeneration?: () => void; // 🆕 Stop button
  onRegenerateResponse?: () => void; // 🆕 Regenerate button
  isStreaming?: boolean; // 🆕 Streaming state
}

// 🔧 Mesaj komponenti - Memo ile optimize edildi
const MessageItem = memo(({ msg }: { msg: Message }) => {
  return (
    <div
      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`w-full rounded-lg px-3 py-2 ${
          msg.role === "user"
            ? "bg-blue-600 text-white"
            : msg.role === "system"
            ? msg.toolExecution
              ? "bg-purple-500/10 text-purple-300 border border-purple-500/20"
              : "bg-yellow-500/10 text-yellow-300 border border-yellow-500/20"
            : "bg-[#252525] text-neutral-100 border border-neutral-800"
        }`}
      >
        {/* Tool Execution UI */}
        {msg.toolExecution && (
          <div className="flex items-center gap-2 mb-1">
            {msg.toolExecution.status === 'running' && (
              <div className="w-3 h-3 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            )}
            {msg.toolExecution.status === 'completed' && (
              <div className="w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
            {msg.toolExecution.status === 'failed' && (
              <div className="w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            )}
            <span className="text-[10px] font-mono opacity-70">
              {msg.toolExecution.toolName}
            </span>
            {msg.toolExecution.endTime && (
              <span className="text-[10px] opacity-50">
                ({((msg.toolExecution.endTime - msg.toolExecution.startTime) / 1000).toFixed(1)}s)
              </span>
            )}
          </div>
        )}
        
        <div className="text-xs whitespace-pre-wrap font-sans leading-relaxed overflow-y-auto custom-scrollbar" style={{ maxHeight: '400px' }}>
          {msg.content}
        </div>
        
        {/* Tool Result Details (collapsible) */}
        {msg.toolExecution?.result && msg.toolExecution.status === 'completed' && (
          <details className="mt-2 text-[10px] opacity-70">
            <summary className="cursor-pointer hover:opacity-100">Detaylar</summary>
            <pre className="mt-1 p-2 bg-black/20 rounded overflow-x-auto">
              {JSON.stringify(msg.toolExecution.result, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
});

MessageItem.displayName = 'MessageItem';

function ChatPanel({
  messages,
  isLoading,
  onSendMessage,
  pendingActions,
  onAcceptAction,
  onRejectAction,
  onAcceptAllActions,
  onNewSession,
  isIndexing,
  currentFile,
  projectContext,
  onStopGeneration,
  onRegenerateResponse,
  isStreaming = false,
}: ChatPanelProps) {
  // 🔧 Model seçimi kaldırıldı - Tek model kullanılıyor
  const currentModelName = "Corex AI";

  const [input, setInput] = useState("");
  const [isPendingExpanded, setIsPendingExpanded] = useState(true);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]); // 🆕 Base64 images
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null); // 🆕 Container ref
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null); // 🆕 File input ref
  const isUserScrollingRef = useRef(false); // 🆕 Kullanıcı scroll yapıyor mu?
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 🆕 Scroll pozisyonunu kontrol et
  const checkScrollPosition = () => {
    if (!messagesContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50; // 50px tolerans
    
    // Kullanıcı scroll yapıyorsa, auto-scroll'u durdur
    if (!isAtBottom) {
      isUserScrollingRef.current = true;
      
      // 2 saniye sonra tekrar auto-scroll'a dön
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => {
        isUserScrollingRef.current = false;
      }, 2000);
    } else {
      isUserScrollingRef.current = false;
    }
  };

  // 🔧 Smooth scroll to bottom (sadece gerektiğinde)
  const scrollToBottom = (force = false) => {
    if (!messagesEndRef.current || !messagesContainerRef.current) return;
    
    // Kullanıcı scroll yapıyorsa ve force değilse, scroll yapma
    if (isUserScrollingRef.current && !force) return;
    
    // 🔥 FIXED: Streaming sırasında da smooth scroll kullan, ama throttle et
    // Instant scroll jitter'a neden oluyor
    messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
  };

  // Mesajlar değiştiğinde scroll yap (throttled)
  const scrollTimeoutRef2 = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // 🔥 FIXED: Scroll'u throttle et - her mesaj güncellemesinde değil, 50ms'de bir
    if (scrollTimeoutRef2.current) clearTimeout(scrollTimeoutRef2.current);
    
    scrollTimeoutRef2.current = setTimeout(() => {
      scrollToBottom();
    }, isStreaming ? 100 : 0); // Streaming sırasında 100ms throttle
    
    return () => {
      if (scrollTimeoutRef2.current) clearTimeout(scrollTimeoutRef2.current);
    };
  }, [messages, isStreaming]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + "px";
    }
  }, [input]);

  const handleSend = async () => {
    if (!input.trim() || isLoading || isIndexing) return;
    
    // 🆕 Resimlerle birlikte mesaj gönder
    let messageToSend = input;
    
    if (uploadedImages.length > 0) {
      messageToSend = `[IMAGES:${uploadedImages.length}]\n${uploadedImages.map((img, i) => `[IMAGE_${i}]:${img}`).join('\n')}\n\n${input}`;
    }
    
    // 🔧 Model seçimi kaldırıldı
    onSendMessage(messageToSend);
    setInput("");
    setUploadedImages([]); // 🆕 Resimleri temizle
  };

  // 🆕 Resim yükleme handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) {
        alert('Sadece resim dosyaları yükleyebilirsiniz!');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setUploadedImages((prev) => [...prev, base64]);
      };
      reader.readAsDataURL(file);
    });

    // Input'u temizle
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 🆕 Resim silme
  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const quickActions = [
    {
      icon: "📖",
      text: "Açıkla",
      message: currentFile ? `${currentFile} dosyasını açıkla` : "Bu projeyi açıkla"
    },
    {
      icon: "🐛", 
      text: "Hata Kontrol",
      message: currentFile ? `${currentFile} dosyasında hata var mı kontrol et` : "Projede hata var mı kontrol et"
    },
    {
      icon: "🧪",
      text: "Test Ekle", 
      message: currentFile ? `${currentFile} için test yaz` : "Bu proje için testler yaz"
    },
    {
      icon: "🎨",
      text: "Optimize Et",
      message: currentFile ? `${currentFile} dosyasını optimize et` : "Bu projeyi optimize et"
    }
  ];

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e]">
      {/* Header - Compact Mini Bar with New Session Button */}
      <div className="flex-shrink-0 border-b border-neutral-800 px-3 py-1.5 bg-[#181818]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <span className="text-[10px] font-medium text-neutral-400">{currentModelName}</span>
            
            {/* Conversation Length Indicator */}
            {messages.length > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-neutral-600">•</span>
                <span className={`text-[10px] font-medium ${
                  messages.length > 40 ? 'text-red-500' : 
                  messages.length > 30 ? 'text-yellow-500' : 
                  'text-neutral-500'
                }`}>
                  {messages.length} mesaj
                </span>
                {messages.length > 30 && (
                  <span className="text-[10px] text-yellow-500" title="Context dolmak üzere, yeni oturum önerilir">
                    ⚠️
                  </span>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {isIndexing && (
              <span className="text-[10px] text-yellow-500 animate-pulse">🧠 İndeksleniyor...</span>
            )}
            
            {/* New Session Button */}
            {messages.length > 0 && onNewSession && (
              <button
                onClick={onNewSession}
                className="px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] rounded transition-colors flex items-center gap-1"
                title={`Yeni oturum başlat (${messages.length} mesaj temizlenecek)`}
              >
                <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Yeni Oturum
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={messagesContainerRef}
        onScroll={checkScrollPosition}
        className="flex-1 overflow-y-auto px-3 py-2 space-y-2 min-h-0"
      >
        {messages.length === 0 && (
          <div className="text-center text-neutral-500 text-xs mt-6">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <p className="text-white font-medium mb-2 text-xs">Corex AI ile sohbete başlayın 😊</p>
            <p className="text-xs text-neutral-600 mb-4">
              Kodunuz hakkında soru sorun, sohbet edin veya değişiklik isteyin
            </p>
            
            {/* Chat Starters */}
            <div className="mb-4 p-3 bg-[#252525] rounded-lg border border-neutral-800">
              <p className="text-xs text-neutral-400 mb-2 font-medium">💬 Sohbet Başlatıcıları:</p>
              <div className="grid grid-cols-1 gap-1.5">
                {[
                  "Selam! Nasılsın?",
                  "Merhaba Corex",
                  "Bu proje hakkında ne düşünüyorsun?",
                  "Bugün ne yapabiliriz?"
                ].map((starter, index) => (
                  <button
                    key={index}
                    onClick={() => onSendMessage(starter)}
                    className="px-2 py-1 bg-[#1e1e1e] hover:bg-[#2a2a2a] rounded text-xs transition-colors text-left border border-neutral-700 hover:border-blue-500/50"
                  >
                    {starter}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Quick Action Buttons */}
            <div className="grid grid-cols-2 gap-1.5 max-w-xs mx-auto mb-3">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => onSendMessage(action.message)}
                  className="px-2 py-1.5 bg-[#252525] hover:bg-[#2a2a2a] rounded-md border border-neutral-800 hover:border-neutral-700 text-xs transition-colors flex items-center gap-1.5"
                >
                  <span className="text-xs">{action.icon}</span>
                  <span className="text-xs">{action.text}</span>
                </button>
              ))}
            </div>
            
            <div className="text-xs text-neutral-600 space-y-0.5">
              <div>💡 "Bu dosyayı açıkla" - Kod analizi</div>
              <div>🎨 "Dark mode ekle" - Yeni özellik</div>
              <div>🔧 "Bu hatayı düzelt" - Hata çözümü</div>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <MessageItem key={msg.id} msg={msg} />
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-[#252525] border border-neutral-800 rounded-lg px-3 py-2">
              <div className="flex items-center gap-3">
                {/* Kiro-style thinking animation */}
                <div className="relative">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center">
                    {/* Blinking eyes */}
                    <div className="flex gap-0.5">
                      <div className="w-1 h-1 bg-black rounded-full animate-pulse" style={{ animationDelay: "0ms" }} />
                      <div className="w-1 h-1 bg-black rounded-full animate-pulse" style={{ animationDelay: "200ms" }} />
                    </div>
                  </div>
                  {/* Rotating ring around avatar */}
                  <div className="absolute inset-0 rounded-full border border-transparent border-t-cyan-400 animate-spin" style={{ animationDuration: "2s" }} />
                </div>
                
                <div className="flex flex-col">
                  <span className="text-white text-xs font-medium">Corex düşünüyor...</span>
                  <div className="flex gap-0.5 mt-0.5">
                    <div className="w-0.5 h-0.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-0.5 h-0.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-0.5 h-0.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Pending Actions - Compact */}
      {pendingActions.length > 0 && (
        <div className="flex-shrink-0 border-t border-neutral-800">
          <button
            onClick={() => setIsPendingExpanded(!isPendingExpanded)}
            className="w-full px-3 py-2 flex items-center justify-between hover:bg-[#252525] transition-colors"
          >
            <div className="flex items-center gap-2">
              <svg
                className={`w-3 h-3 text-neutral-500 transition-transform ${isPendingExpanded ? '' : '-rotate-90'}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              <span className="text-xs font-semibold text-white">
                💡 Bekleyen Değişiklikler
              </span>
              <span className="px-1.5 py-0.5 bg-blue-500 text-white text-[10px] rounded-full font-medium">
                {pendingActions.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {/* Tümünü Uygula Butonu */}
              {onAcceptAllActions && pendingActions.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAcceptAllActions();
                  }}
                  className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-[10px] rounded transition-colors"
                  title="Tüm değişiklikleri uygula ve dosyaları aç"
                >
                  ✓ Tümü
                </button>
              )}
            </div>
          </button>

          {isPendingExpanded && (
            <div className="max-h-[300px] overflow-y-auto p-2 space-y-2 bg-[#181818]">
              {pendingActions.map((action) => (
                <DiffViewer
                  key={action.id}
                  filePath={action.filePath}
                  oldContent={action.oldContent || ""}
                  newContent={action.content}
                  onAccept={() => onAcceptAction(action.id)}
                  onReject={() => onRejectAction(action.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Input Area */}
      <div className="flex-shrink-0 border-t border-neutral-800 p-2 bg-[#181818]">
        <div className="relative">
          {/* Smart Suggestions */}
          <SmartSuggestions
            input={input}
            currentFile={currentFile}
            projectContext={projectContext}
            onSuggestionSelect={(suggestion) => {
              setInput(suggestion);
              textareaRef.current?.focus();
            }}
          />
          
          {/* 🆕 Yüklenen resimlerin önizlemesi */}
          {uploadedImages.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {uploadedImages.map((img, index) => (
                <div key={index} className="relative group">
                  <img
                    src={img}
                    alt={`Upload ${index + 1}`}
                    className="w-20 h-20 object-cover rounded border border-neutral-700"
                  />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Resmi kaldır"
                  >
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <textarea
            ref={textareaRef}
            className="w-full bg-[#252525] border border-neutral-700 focus:border-blue-500 rounded-lg px-2.5 py-1.5 pr-8 text-xs outline-none resize-none text-neutral-100 placeholder-neutral-500 transition-colors"
            placeholder={
              isIndexing
                ? "İndeksleme tamamlanmasını bekleyin..."
                : uploadedImages.length > 0
                ? `${uploadedImages.length} resim yüklendi. Mesajınızı yazın...`
                : "Mesajınızı yazın... (💡 Öneriler için yazmaya başlayın)"
            }
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={isLoading || isIndexing}
            style={{ minHeight: "32px", maxHeight: "100px" }}
          />
          
          {/* 🆕 Resim yükleme input'u (gizli) */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
          />
          
          {/* Gönder butonu - Sağ altta */}
          <button
            onClick={handleSend}
            disabled={isLoading || isIndexing || !input.trim()}
            className="absolute right-1.5 bottom-1.5 p-1 rounded-md bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-700 disabled:opacity-50 text-white transition-colors"
            title="Gönder (Enter)"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        
        <div className="mt-1 flex items-center justify-between text-xs text-neutral-600">
          {/* Sol taraf - Resim yükleme ve Stop/Regenerate butonları */}
          <div className="flex items-center gap-2">
            {/* 🆕 Resim yükleme butonu */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || isIndexing}
              className="flex items-center gap-1 p-1 rounded-md hover:bg-neutral-700 disabled:opacity-50 text-neutral-500 hover:text-neutral-300 transition-colors"
              title="Resim ekle (Vision AI)"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
            
            {/* 🆕 Stop Generation butonu */}
            {isStreaming && onStopGeneration && (
              <button
                onClick={onStopGeneration}
                className="flex items-center gap-1 px-2 py-1 rounded-md bg-red-600/10 hover:bg-red-600/20 text-red-400 hover:text-red-300 transition-colors border border-red-600/30"
                title="Durdur"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="text-xs">Durdur</span>
              </button>
            )}
            
            {/* 🆕 Regenerate butonu */}
            {!isStreaming && !isLoading && messages.length > 0 && onRegenerateResponse && (
              <button
                onClick={onRegenerateResponse}
                className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-neutral-700 text-neutral-500 hover:text-neutral-300 transition-colors"
                title="Yeniden oluştur"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="text-xs">Yeniden Oluştur</span>
              </button>
            )}
          </div>
          
          <span>Enter: Gönder • Shift+Enter: Yeni satır</span>
        </div>
      </div>
    </div>
  );
}

export default memo(ChatPanel);
