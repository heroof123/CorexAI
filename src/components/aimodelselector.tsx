import { useState, useEffect } from "react";
import { loadAIProviders, testProviderConnection } from "../services/aiProvider";

interface AIModel {
  id: string;
  name: string;
  description: string;
  icon: string;
  available: boolean;
}

const AI_MODELS: AIModel[] = [
  {
    id: "qwen",
    name: "Qwen 2.5",
    description: "Ana zekâ - Planlayıcı ve kodlayıcı",
    icon: "🚀",
    available: true,
  },
  {
    id: "planner",
    name: "Planner",
    description: "Rol: Sadece plan yapar, kod yazmaz",
    icon: "📋",
    available: true,
  },
  {
    id: "coder",
    name: "Coder",
    description: "Rol: Sadece kod yazar, plan yapmaz",
    icon: "💻",
    available: true,
  },
  {
    id: "reviewer",
    name: "Reviewer",
    description: "Rol: Sadece kod kontrolü yapar",
    icon: "🔍",
    available: true,
  },
  {
    id: "tester",
    name: "Tester",
    description: "Rol: Sadece test raporu yazar, çözüm önermez",
    icon: "🧪",
    available: true,
  },
];

interface AIModelSelectorProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
}

export default function AIModelSelector({ selectedModel, onModelChange }: AIModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<Record<string, boolean>>({});
  const [activeProviders, setActiveProviders] = useState(0);

  // Provider durumlarını kontrol et
  useEffect(() => {
    const checkProviders = async () => {
      const providers = loadAIProviders();
      const activeCount = providers.filter(p => p.isActive).length;
      setActiveProviders(activeCount);
      
      // Aktif provider'ları test et
      const statusPromises = providers
        .filter(p => p.isActive)
        .map(async (provider) => {
          const isOnline = await testProviderConnection(provider);
          return { id: provider.id, isOnline };
        });
      
      const results = await Promise.all(statusPromises);
      const newStatus: Record<string, boolean> = {};
      results.forEach(result => {
        newStatus[result.id] = result.isOnline;
      });
      setConnectionStatus(newStatus);
    };

    checkProviders();
    
    // Her 10 saniyede bir kontrol et
    const interval = setInterval(checkProviders, 10000);
    return () => clearInterval(interval);
  }, []);

  const currentModel = AI_MODELS.find(m => m.id === selectedModel) || AI_MODELS[0];
  const hasActiveConnection = Object.values(connectionStatus).some(status => status);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors text-xs ${
          hasActiveConnection 
            ? 'bg-[#252525] hover:bg-[#2a2a2a] border-green-500/30' 
            : 'bg-[#252525] hover:bg-[#2a2a2a] border-red-500/30'
        }`}
      >
        {/* Bağlantı durumu göstergesi */}
        <div className={`w-2 h-2 rounded-full ${
          hasActiveConnection ? 'bg-green-500 animate-pulse' : 'bg-red-500'
        }`}></div>
        
        <span className="text-base">{currentModel.icon}</span>
        <span className="text-neutral-300 font-medium">{currentModel.name}</span>
        
        <svg
          className={`w-4 h-4 text-neutral-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute top-full mt-2 left-0 w-72 bg-[#252525] border border-neutral-800 rounded-lg shadow-xl z-20 overflow-hidden">
            <div className="px-3 py-2 border-b border-neutral-800">
              <div className="flex items-center justify-between">
                <p className="text-xs text-neutral-500 font-semibold uppercase tracking-wider">
                  AI Modeli Seç
                </p>
                <div className="flex items-center gap-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    hasActiveConnection ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <span className="text-xs text-neutral-500">
                    {activeProviders} provider
                  </span>
                </div>
              </div>
            </div>

            {!hasActiveConnection && (
              <div className="px-3 py-2 bg-red-500/10 border-b border-neutral-800">
                <p className="text-xs text-red-400">
                  ⚠️ Aktif AI bağlantısı yok. Ayarlardan provider'ları kontrol edin.
                </p>
              </div>
            )}

            <div className="max-h-80 overflow-y-auto">
              {/* Ana Model */}
              <div className="px-3 py-2 border-b border-neutral-800">
                <p className="text-xs text-neutral-500 font-semibold uppercase tracking-wider mb-1">
                  🧠 Ana Zekâ
                </p>
                {AI_MODELS.filter(m => m.id === "qwen").map((model) => (
                  <button
                    key={model.id}
                    onClick={() => {
                      if (model.available && hasActiveConnection) {
                        onModelChange(model.id);
                        setIsOpen(false);
                      }
                    }}
                    disabled={!model.available || !hasActiveConnection}
                    className={`w-full px-3 py-2.5 flex items-start gap-3 hover:bg-[#2a2a2a] transition-colors text-left rounded ${
                      (!model.available || !hasActiveConnection) ? 'opacity-50 cursor-not-allowed' : ''
                    } ${selectedModel === model.id ? 'bg-blue-500/10' : ''}`}
                  >
                    <span className="text-xl mt-0.5">{model.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm text-white font-medium">{model.name}</p>
                        {selectedModel === model.id && (
                          <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <p className="text-xs text-neutral-500">{model.description}</p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Rol Modelleri */}
              <div className="px-3 py-2">
                <p className="text-xs text-neutral-500 font-semibold uppercase tracking-wider mb-2">
                  👉 Rol Modelleri
                </p>
                {AI_MODELS.filter(m => m.id !== "qwen").map((model) => (
                  <button
                    key={model.id}
                    onClick={() => {
                      if (model.available && hasActiveConnection) {
                        onModelChange(model.id);
                        setIsOpen(false);
                      }
                    }}
                    disabled={!model.available || !hasActiveConnection}
                    className={`w-full px-3 py-2.5 flex items-start gap-3 hover:bg-[#2a2a2a] transition-colors text-left rounded mb-1 ${
                      (!model.available || !hasActiveConnection) ? 'opacity-50 cursor-not-allowed' : ''
                    } ${selectedModel === model.id ? 'bg-blue-500/10' : ''}`}
                  >
                    <span className="text-xl mt-0.5">{model.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm text-white font-medium">{model.name}</p>
                        {selectedModel === model.id && (
                          <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <p className="text-xs text-neutral-500">{model.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="px-3 py-2 border-t border-neutral-800 bg-[#1e1e1e]">
              <p className="text-xs text-neutral-600">
                💡 AI ayarlarından IP/Port yapılandırması yapın
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}