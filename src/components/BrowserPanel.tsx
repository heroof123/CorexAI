import { useState, useRef, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface BrowserPanelProps {
  isVisible: boolean;
  onClose: () => void;
  initialUrl?: string;
}

export default function BrowserPanel({ isVisible, onClose, initialUrl = 'http://localhost:3000' }: BrowserPanelProps) {
  const [url, setUrl] = useState(initialUrl);
  const [currentUrl, setCurrentUrl] = useState(initialUrl);
  const [isLoading, setIsLoading] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [history, setHistory] = useState<string[]>([initialUrl]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [viewportSize, setViewportSize] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [showDevTools, setShowDevTools] = useState(false);
  const [showIframeError, setShowIframeError] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Yaygın development server portları
  const commonPorts = [
    { name: 'React/Vite', port: 3000, url: 'http://localhost:3000' },
    { name: 'Next.js', port: 3000, url: 'http://localhost:3000' },
    { name: 'Vue.js', port: 8080, url: 'http://localhost:8080' },
    { name: 'Angular', port: 4200, url: 'http://localhost:4200' },
    { name: 'Svelte', port: 5173, url: 'http://localhost:5173' },
    { name: 'Express', port: 3001, url: 'http://localhost:3001' },
    { name: 'Flask', port: 5000, url: 'http://localhost:5000' },
    { name: 'Django', port: 8000, url: 'http://localhost:8000' },
    { name: 'Spring Boot', port: 8080, url: 'http://localhost:8080' },
    { name: 'Tauri Dev', port: 1420, url: 'http://localhost:1420' },
    { name: 'Corex Dev', port: 1422, url: 'http://localhost:1422' },
  ];

  useEffect(() => {
    if (isVisible) {
      setUrl(currentUrl);
    }
  }, [isVisible, currentUrl]);

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigateToUrl(url);
  };

  const navigateToUrl = (targetUrl: string) => {
    setIsLoading(true);
    setShowIframeError(false);
    
    // URL formatını düzelt
    let formattedUrl = targetUrl;
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'http://' + formattedUrl;
    }
    
    setCurrentUrl(formattedUrl);
    
    // History'ye ekle
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(formattedUrl);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    
    updateNavigationButtons(newHistory.length - 1, newHistory);
    
    // Iframe yükleme simülasyonu
    setTimeout(() => {
      setIsLoading(false);
      
      // Google, Facebook gibi siteler iframe'i engelleyebilir
      const blockedDomains = ['google.com', 'facebook.com', 'twitter.com', 'instagram.com', 'youtube.com'];
      const isBlocked = blockedDomains.some(domain => formattedUrl.includes(domain));
      
      if (isBlocked) {
        setTimeout(() => {
          setShowIframeError(true);
        }, 2000);
      }
    }, 1000);
  };

  const updateNavigationButtons = (index: number, hist: string[]) => {
    setCanGoBack(index > 0);
    setCanGoForward(index < hist.length - 1);
  };

  const goBack = () => {
    if (canGoBack) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setCurrentUrl(history[newIndex]);
      setUrl(history[newIndex]);
      updateNavigationButtons(newIndex, history);
    }
  };

  const goForward = () => {
    if (canGoForward) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setCurrentUrl(history[newIndex]);
      setUrl(history[newIndex]);
      updateNavigationButtons(newIndex, history);
    }
  };

  const refresh = () => {
    setIsLoading(true);
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  const openInExternalBrowser = async () => {
    try {
      // Windows için
      await invoke('execute_command', {
        command: 'cmd',
        args: ['/c', 'start', currentUrl],
        cwd: null
      });
    } catch (error) {
      console.error('External browser açma hatası:', error);
      // Fallback: clipboard'a kopyala
      try {
        await navigator.clipboard.writeText(currentUrl);
        alert(`URL clipboard'a kopyalandı: ${currentUrl}`);
      } catch (clipError) {
        alert(`URL: ${currentUrl}`);
      }
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div 
        className="w-full h-full max-w-7xl max-h-[90vh] bg-[#1e1e1e] rounded-lg border border-neutral-800 flex flex-col m-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-neutral-800 bg-[#252525]">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
            </svg>
            <h3 className="text-white font-semibold">Browser Panel</h3>
            <span className="text-xs text-neutral-400">Web geliştirme test aracı</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={openInExternalBrowser}
              className="p-2 hover:bg-neutral-700 rounded transition-colors"
              title="Harici browser'da aç"
            >
              <svg className="w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </button>
            <button
              onClick={() => {
                // Screenshot functionality (simulated)
                alert('Screenshot özelliği yakında eklenecek!');
              }}
              className="p-2 hover:bg-neutral-700 rounded transition-colors"
              title="Screenshot al"
            >
              <svg className="w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <button
              onClick={() => setShowDevTools(prev => !prev)}
              className={`p-2 hover:bg-neutral-700 rounded transition-colors ${showDevTools ? 'bg-blue-600' : ''}`}
              title="DevTools aç/kapat"
            >
              <svg className="w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-neutral-700 rounded transition-colors"
            >
              <svg className="w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Navigation Bar */}
        <div className="flex items-center gap-2 p-3 border-b border-neutral-800 bg-[#1e1e1e]">
          {/* Navigation Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={goBack}
              disabled={!canGoBack}
              className="p-2 hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
              title="Geri"
            >
              <svg className="w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={goForward}
              disabled={!canGoForward}
              className="p-2 hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
              title="İleri"
            >
              <svg className="w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button
              onClick={refresh}
              className="p-2 hover:bg-neutral-700 rounded transition-colors"
              title="Yenile"
            >
              <svg className={`w-4 h-4 text-neutral-400 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>

          {/* URL Bar */}
          <form onSubmit={handleUrlSubmit} className="flex-1 flex items-center gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="http://localhost:3000"
                className="w-full bg-[#252525] border border-neutral-700 focus:border-blue-500 rounded px-3 py-2 text-sm text-white placeholder-neutral-500 outline-none transition-colors"
              />
              {isLoading && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors text-sm"
            >
              Git
            </button>
          </form>
        </div>

        {/* Quick Access Buttons */}
        <div className="flex items-center gap-2 p-3 border-b border-neutral-800 bg-[#1e1e1e] overflow-x-auto">
          {/* Development Servers Dropdown */}
          <div className="relative group">
            <button className="px-3 py-1 bg-[#252525] hover:bg-[#2a2a2a] border border-neutral-700 hover:border-blue-500/50 rounded text-xs text-neutral-300 whitespace-nowrap transition-colors flex items-center gap-1">
              🚀 Dev Servers
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className="absolute top-full left-0 mt-1 w-48 bg-[#252525] border border-neutral-700 rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              {commonPorts.map((port) => (
                <button
                  key={port.port}
                  onClick={() => navigateToUrl(port.url)}
                  className="block w-full text-left px-3 py-2 hover:bg-neutral-700 text-xs text-neutral-300 transition-colors"
                  title={port.url}
                >
                  {port.name}
                </button>
              ))}
            </div>
          </div>
          
          {/* Popular Sites */}
          <button
            onClick={() => navigateToUrl('https://google.com')}
            className="px-3 py-1 bg-[#252525] hover:bg-[#2a2a2a] border border-neutral-700 hover:border-blue-500/50 rounded text-xs text-neutral-300 whitespace-nowrap transition-colors"
          >
            🔍 Google
          </button>
          <button
            onClick={() => navigateToUrl('https://github.com')}
            className="px-3 py-1 bg-[#252525] hover:bg-[#2a2a2a] border border-neutral-700 hover:border-blue-500/50 rounded text-xs text-neutral-300 whitespace-nowrap transition-colors"
          >
            🐙 GitHub
          </button>
          <button
            onClick={() => navigateToUrl('https://stackoverflow.com')}
            className="px-3 py-1 bg-[#252525] hover:bg-[#2a2a2a] border border-neutral-700 hover:border-blue-500/50 rounded text-xs text-neutral-300 whitespace-nowrap transition-colors"
          >
            📚 Stack Overflow
          </button>
          <button
            onClick={() => navigateToUrl('https://developer.mozilla.org')}
            className="px-3 py-1 bg-[#252525] hover:bg-[#2a2a2a] border border-neutral-700 hover:border-blue-500/50 rounded text-xs text-neutral-300 whitespace-nowrap transition-colors"
          >
            📖 MDN Docs
          </button>
          
          <div className="border-l border-neutral-700 h-6 mx-2"></div>
          
          {/* Viewport Size Controls */}
          <span className="text-xs text-neutral-500 whitespace-nowrap">Görünüm:</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setViewportSize('desktop')}
              className={`px-2 py-1 rounded text-xs transition-colors ${
                viewportSize === 'desktop' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-[#252525] text-neutral-300 hover:bg-[#2a2a2a]'
              }`}
              title="Desktop (1920x1080)"
            >
              🖥️ Desktop
            </button>
            <button
              onClick={() => setViewportSize('tablet')}
              className={`px-2 py-1 rounded text-xs transition-colors ${
                viewportSize === 'tablet' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-[#252525] text-neutral-300 hover:bg-[#2a2a2a]'
              }`}
              title="Tablet (768x1024)"
            >
              📱 Tablet
            </button>
            <button
              onClick={() => setViewportSize('mobile')}
              className={`px-2 py-1 rounded text-xs transition-colors ${
                viewportSize === 'mobile' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-[#252525] text-neutral-300 hover:bg-[#2a2a2a]'
              }`}
              title="Mobile (375x667)"
            >
              📱 Mobile
            </button>
          </div>
        </div>

        {/* Browser Content */}
        <div className="flex-1 relative bg-white flex">
          {/* Main Browser Area */}
          <div className={`relative bg-white flex items-center justify-center transition-all duration-300 ${
            showDevTools ? 'w-2/3' : 'w-full'
          }`}>
            {isLoading && (
              <div className="absolute inset-0 bg-[#1e1e1e] flex items-center justify-center z-10">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-neutral-400 text-sm">Sayfa yükleniyor...</p>
                  <p className="text-neutral-600 text-xs mt-1">{currentUrl}</p>
                </div>
              </div>
            )}

            {/* Iframe Error Overlay */}
            {showIframeError && (
              <div className="absolute inset-0 bg-[#1e1e1e] flex items-center justify-center z-20">
                <div className="text-center max-w-md p-6">
                  <div className="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <h3 className="text-white font-semibold mb-2">Site Iframe'de Açılamıyor</h3>
                  <p className="text-neutral-400 text-sm mb-4">
                    Bu site güvenlik nedeniyle iframe içinde açılmayı engelliyor. 
                    Google, Facebook gibi büyük siteler bu korumayı kullanır.
                  </p>
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={openInExternalBrowser}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors text-sm"
                    >
                      🔗 Harici Browser'da Aç
                    </button>
                    <button
                      onClick={() => setShowIframeError(false)}
                      className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded transition-colors text-sm"
                    >
                      Kapat
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Responsive iframe container */}
            <div 
              className={`bg-white border border-neutral-300 transition-all duration-300 ${
                viewportSize === 'desktop' ? 'w-full h-full' :
                viewportSize === 'tablet' ? 'w-[768px] h-[1024px] max-w-full max-h-full' :
                'w-[375px] h-[667px] max-w-full max-h-full'
              }`}
              style={{
                transform: viewportSize !== 'desktop' ? 'scale(0.8)' : 'scale(1)',
                transformOrigin: 'center center'
              }}
            >
              <iframe
                ref={iframeRef}
                src={currentUrl}
                className="w-full h-full border-0"
                title="Browser Panel"
                onLoad={() => setIsLoading(false)}
                onError={() => {
                  setIsLoading(false);
                  console.error('Iframe yükleme hatası:', currentUrl);
                }}
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-top-navigation allow-downloads"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            </div>
          </div>

          {/* DevTools Panel */}
          {showDevTools && (
            <div className="w-1/3 border-l border-neutral-800 bg-[#1e1e1e] flex flex-col">
              <div className="p-3 border-b border-neutral-800">
                <h4 className="text-white font-medium text-sm">Developer Tools</h4>
              </div>
              <div className="flex-1 p-3 text-xs text-neutral-400 space-y-2">
                <div className="bg-[#252525] p-2 rounded">
                  <div className="text-green-400 mb-1">Console</div>
                  <div className="text-neutral-500">Browser console burada görünecek</div>
                </div>
                <div className="bg-[#252525] p-2 rounded">
                  <div className="text-blue-400 mb-1">Network</div>
                  <div className="text-neutral-500">Network istekleri burada görünecek</div>
                </div>
                <div className="bg-[#252525] p-2 rounded">
                  <div className="text-purple-400 mb-1">Elements</div>
                  <div className="text-neutral-500">DOM yapısı burada görünecek</div>
                </div>
                <div className="bg-[#252525] p-2 rounded">
                  <div className="text-yellow-400 mb-1">Performance</div>
                  <div className="text-neutral-500">Performans metrikleri burada görünecek</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between px-3 py-2 border-t border-neutral-800 bg-[#252525] text-xs">
          <div className="flex items-center gap-4">
            <span className="text-neutral-400">URL: {currentUrl}</span>
            <span className="text-neutral-500">|</span>
            <span className="text-neutral-400">History: {historyIndex + 1}/{history.length}</span>
            <span className="text-neutral-500">|</span>
            <span className="text-neutral-400">
              Viewport: {
                viewportSize === 'desktop' ? '🖥️ Desktop' :
                viewportSize === 'tablet' ? '📱 Tablet (768x1024)' :
                '📱 Mobile (375x667)'
              }
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
            <span className="text-neutral-400">{isLoading ? 'Yükleniyor' : 'Hazır'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
