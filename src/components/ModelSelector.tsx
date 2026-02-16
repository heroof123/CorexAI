import { useState, useEffect } from "react";

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  onOpenSettings?: () => void;
}

interface AIModel {
  id: string;
  name: string;
  displayName: string;
  description: string;
  specialty: string;
  roles?: ('coder' | 'tester' | 'planner' | 'chat' | 'reviewer' | 'analyzer')[]; // 🆕 Çoklu roller
  isActive?: boolean;
  providerId: string;
  providerName: string;
  providerIcon: string;
}

interface AIProvider {
  id: string;
  name: string;
  type: 'openai' | 'anthropic' | 'local' | 'custom';
  baseUrl: string;
  apiKey?: string;
  models: any[];
  isActive: boolean;
  icon: string;
  description: string;
}

// Model rolleri tanımları
const MODEL_ROLES = {
  coder: { name: 'Coder', icon: '👨‍💻', color: 'bg-blue-500/20 text-blue-400' },
  tester: { name: 'Tester', icon: '🧪', color: 'bg-green-500/20 text-green-400' },
  planner: { name: 'Planner', icon: '📋', color: 'bg-purple-500/20 text-purple-400' },
  chat: { name: 'Chat', icon: '💬', color: 'bg-yellow-500/20 text-yellow-400' },
  reviewer: { name: 'Reviewer', icon: '🔍', color: 'bg-orange-500/20 text-orange-400' },
  analyzer: { name: 'Analyzer', icon: '📊', color: 'bg-red-500/20 text-red-400' }
};

export default function ModelSelector({ selectedModel, onModelChange, onOpenSettings }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [availableModels, setAvailableModels] = useState<AIModel[]>([]);
  const [modelStatus, setModelStatus] = useState<Record<string, 'online' | 'offline' | 'checking'>>({});

  // AI providers'ları yükle ve modelleri düzle
  useEffect(() => {
    console.log('🚀 ModelSelector başlatılıyor...');
    loadModels();
    
    // Provider değişikliklerini dinle
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'corex-ai-providers') {
        console.log('📡 Provider değişikliği algılandı, modeller yeniden yükleniyor...');
        setTimeout(loadModels, 100); // Kısa gecikme ile yükle
      }
    };
    
    // Custom event listener (AI ayarları değiştiğinde)
    const handleProviderUpdate = () => {
      console.log('🔄 Provider güncelleme eventi alındı');
      loadModels();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('ai-providers-updated', handleProviderUpdate);
    
    // SONSUZ DÖNGÜYÜ DURDUR - Periyodik güncellemeyi kaldır
    // const interval = setInterval(() => {
    //   loadModels();
    // }, 1000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('ai-providers-updated', handleProviderUpdate);
      // clearInterval(interval);
    };
  }, []);

  const loadModels = () => {
    try {
      console.log('🔄 Modeller yükleniyor...');
      
      const savedProviders = localStorage.getItem('corex-ai-providers');
      let providers: AIProvider[] = [];
      
      if (savedProviders) {
        try {
          providers = JSON.parse(savedProviders);
          console.log('📥 Provider\'lar yüklendi:', providers.length, 'adet');
        } catch (error) {
          console.error('❌ Provider parse hatası:', error);
          return;
        }
      }
      
      // Eğer hiç provider yoksa default'ları kullan
      if (providers.length === 0) {
        console.log('⚠️ Hiç provider yok, default\'ları yüklüyor...');
        providers = [
          {
            id: "lm-studio",
            name: "LM Studio",
            type: "local",
            baseUrl: "http://127.0.0.1:1234/v1",
            models: [
              {
                id: "main",
                name: "qwen2.5-7b",
                displayName: "Qwen2.5 7B",
                description: "Ana model - Planlama ve kodlama",
                specialty: "Coder",
                roles: ["coder"],
                isActive: true
              }
            ],
            isActive: true,
            icon: "🖥️",
            description: "Yerel LM Studio sunucusu"
          }
        ];
      }
      
      // Tüm aktif provider'lardan aktif modelleri topla
      const models: AIModel[] = [];
      let totalProviders = 0;
      let activeProviders = 0;
      let totalModels = 0;
      let activeModels = 0;
      
      providers.forEach(provider => {
        totalProviders++;
        console.log(`🔍 Provider: ${provider.name} (ID: ${provider.id})`);
        console.log(`  📊 Aktif: ${provider.isActive}, Model sayısı: ${provider.models?.length || 0}`);
        
        if (provider.isActive) {
          activeProviders++;
          
          if (provider.models && Array.isArray(provider.models)) {
            provider.models.forEach(model => {
              totalModels++;
              console.log(`    📋 Model: ${model.displayName || model.name} (Aktif: ${model.isActive})`);
              
              if (model.isActive) {
                activeModels++;
                
                const modelWithProvider = {
                  ...model,
                  providerId: provider.id,
                  providerName: provider.name,
                  providerIcon: provider.icon
                };
                
                models.push(modelWithProvider);
                console.log(`    ✅ Model eklendi: ${model.displayName || model.name}`);
              }
            });
          }
        }
      });
      
      console.log(`📊 Özet:`);
      console.log(`  🏢 Toplam Provider: ${totalProviders}, Aktif: ${activeProviders}`);
      console.log(`  🤖 Toplam Model: ${totalModels}, Aktif: ${activeModels}`);
      console.log(`  🎯 Kullanılabilir Model: ${models.length}`);
      
      // State'i güncelle
      const prevModelCount = availableModels.length;
      setAvailableModels(models);
      
      if (models.length !== prevModelCount) {
        console.log(`🔄 Model listesi güncellendi: ${prevModelCount} → ${models.length}`);
      }
      
      // Eğer seçili model artık mevcut değilse, ilk modeli seç
      if (models.length > 0 && !models.find(m => m.id === selectedModel)) {
        console.log('🔄 Seçili model bulunamadı, ilk modeli seçiyor:', models[0].displayName);
        onModelChange(models[0].id);
      }
      
      // Eğer hiç model yoksa uyarı ver
      if (models.length === 0) {
        console.warn('⚠️ Hiç aktif model bulunamadı!');
      }
      
    } catch (error) {
      console.error('❌ loadModels hatası:', error);
    }
  };

  const currentModel = availableModels.find(m => m.id === selectedModel) || availableModels[0];

  const checkModelStatus = async (model: AIModel) => {
    console.log(`🔍 ${model.displayName} modeli test ediliyor...`);
    setModelStatus(prev => ({ ...prev, [model.id]: 'checking' }));
    
    try {
      // Provider bilgilerini al
      const savedProviders = localStorage.getItem('corex-ai-providers');
      if (!savedProviders) {
        console.error('❌ Provider bilgileri bulunamadı');
        setModelStatus(prev => ({ ...prev, [model.id]: 'offline' }));
        return;
      }
      
      const providers: AIProvider[] = JSON.parse(savedProviders);
      const provider = providers.find(p => p.id === model.providerId);
      
      if (!provider) {
        console.error(`❌ Provider bulunamadı: ${model.providerId}`);
        setModelStatus(prev => ({ ...prev, [model.id]: 'offline' }));
        return;
      }
      
      console.log(`🌐 Bağlantı test ediliyor: ${provider.baseUrl}`);
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
      
      if (provider.apiKey) {
        headers['Authorization'] = `Bearer ${provider.apiKey}`;
      }
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${provider.baseUrl}/models`, {
        method: 'GET',
        headers,
        signal: controller.signal,
        mode: 'cors'
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        console.log(`✅ ${model.displayName} - Bağlantı başarılı`);
        setModelStatus(prev => ({ ...prev, [model.id]: 'online' }));
      } else {
        console.error(`❌ ${model.displayName} - HTTP ${response.status}`);
        setModelStatus(prev => ({ ...prev, [model.id]: 'offline' }));
      }
    } catch (error: any) {
      console.error(`❌ ${model.displayName} - Hata:`, error.message);
      setModelStatus(prev => ({ ...prev, [model.id]: 'offline' }));
    }
  };

  const handleModelSelect = (modelId: string) => {
    onModelChange(modelId);
    setIsOpen(false);
  };

  const getStatusColor = (status: 'online' | 'offline' | 'checking' | undefined) => {
    switch (status) {
      case 'online': return 'text-green-400';
      case 'offline': return 'text-red-400';
      case 'checking': return 'text-yellow-400';
      default: return 'text-neutral-400';
    }
  };

  const getStatusIcon = (status: 'online' | 'offline' | 'checking' | undefined) => {
    switch (status) {
      case 'online': return '🟢';
      case 'offline': return '🔴';
      case 'checking': return '🟡';
      default: return '⚪';
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-2 py-1.5 rounded-md bg-[#252525] hover:bg-[#2a2a2a] border border-neutral-800 hover:border-neutral-700 transition-colors text-xs font-medium flex items-center gap-1.5"
      >
        <span className="text-xs">{currentModel?.providerIcon || '🤖'}</span>
        <span className="text-xs">{currentModel?.displayName || 'AI Model'}</span>
        <svg 
          className={`w-3 h-3 text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-1 w-80 bg-[#252525] border border-neutral-700 rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto">
          <div className="p-2 border-b border-neutral-700">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-white">AI Modelleri</h3>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    console.log('🧪 Tüm modeller test ediliyor...');
                    availableModels.forEach((model, index) => {
                      setTimeout(() => {
                        console.log(`🔍 Model test ediliyor: ${model.displayName}`);
                        checkModelStatus(model);
                      }, index * 500); // Her model için 500ms gecikme
                    });
                  }}
                  className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-white transition-colors"
                >
                  Test Et
                </button>
                <button
                  onClick={() => {
                    onOpenSettings?.();
                    setIsOpen(false);
                  }}
                  className="text-xs px-2 py-1 bg-neutral-600 hover:bg-neutral-700 rounded text-white transition-colors"
                >
                  ⚙️ Ayarlar
                </button>
              </div>
            </div>
          </div>
          
          <div>
            {availableModels.length === 0 ? (
              <div className="p-4 text-center text-neutral-500">
                <div className="text-2xl mb-2">🤖</div>
                <p className="text-sm mb-2">Henüz aktif model yok</p>
                <p className="text-xs mb-3 text-neutral-400">
                  Debug: {availableModels.length} model yüklendi
                </p>
                <div className="text-xs text-left mb-3 p-2 bg-neutral-800 rounded">
                  <div>🔍 Debug Bilgileri:</div>
                  <div>• Yüklenen model sayısı: {availableModels.length}</div>
                  <div>• Seçili model: {selectedModel || 'Yok'}</div>
                  <div>• LocalStorage: {localStorage.getItem('corex-ai-providers') ? 'Var' : 'Yok'}</div>
                </div>
                <button
                  onClick={() => {
                    console.log('🔄 Manuel model yükleme tetiklendi');
                    loadModels();
                  }}
                  className="text-xs px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded text-white transition-colors mr-2"
                >
                  🔄 Yenile
                </button>
                <button
                  onClick={() => {
                    onOpenSettings?.();
                    setIsOpen(false);
                  }}
                  className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-white transition-colors"
                >
                  AI Ayarları
                </button>
              </div>
            ) : (
              availableModels.map((model) => {
                const status = modelStatus[model.id];
                
                return (
                  <div
                    key={`${model.providerId}-${model.id}`}
                    className="p-2 border-b border-neutral-800 last:border-b-0"
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-sm mt-0.5">{model.providerIcon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <button
                            onClick={() => handleModelSelect(model.id)}
                            className={`text-xs font-medium transition-colors ${
                              selectedModel === model.id
                                ? 'text-blue-400'
                                : 'text-white hover:text-blue-300'
                            }`}
                          >
                            {model.displayName}
                          </button>
                          <span className={`text-xs ${getStatusColor(status)}`}>
                            {getStatusIcon(status)}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-400 mb-1">{model.description}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-1.5 py-0.5 bg-neutral-800 text-neutral-300 rounded">
                            {model.specialty}
                          </span>
                          {model.roles && model.roles.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {model.roles.slice(0, 2).map((role) => ( // İlk 2 rolü göster
                                <span key={role} className={`text-xs px-1.5 py-0.5 rounded ${MODEL_ROLES[role].color}`}>
                                  {MODEL_ROLES[role].icon} {MODEL_ROLES[role].name}
                                </span>
                              ))}
                              {model.roles.length > 2 && (
                                <span className="text-xs px-1.5 py-0.5 rounded bg-neutral-600 text-neutral-400">
                                  +{model.roles.length - 2}
                                </span>
                              )}
                            </div>
                          )}
                          <span className="text-xs text-neutral-500">
                            {model.providerName}
                          </span>
                          {selectedModel === model.id && (
                            <span className="text-xs px-1.5 py-0.5 bg-blue-600 text-white rounded">
                              Seçili
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          
          <div className="p-2 border-t border-neutral-700 text-xs text-neutral-500">
            💡 Yeni modeller eklemek için Ayarlar'ı kullanın
          </div>
        </div>
      )}
    </div>
  );
}