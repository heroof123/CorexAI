// Modern HuggingFace Model Browser - LM Studio Style
import { useState, useMemo } from 'react';
import { showToast } from './ToastContainer';

// GGUFModelBrowser ile uyumlu interface
interface GGUFModel {
  id: string;
  name: string;
  displayName: string;
  size: string;
  sizeBytes: number;
  quantization: string;
  description: string;
  huggingFaceUrl: string;
  downloadUrl: string;
  localPath?: string;
  isDownloaded: boolean;
  isDownloading: boolean;
  parameters?: string;
  downloads?: number;
  likes?: number;
}

interface ModelFile {
  filename: string;
  size: number;
  quantization: string;
  downloadUrl: string;
}

interface HFModel {
  id: string;
  name: string;
  author: string;
  downloads: number;
  likes: number;
  lastModified: string;
  description: string;
  tags: string[];
  files: ModelFile[];
  isRecommended?: boolean;
  parameters?: string;
}

interface ModernModelBrowserProps {
  onModelSelect: (model: GGUFModel) => void;
}

export default function ModernModelBrowser({ onModelSelect }: ModernModelBrowserProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [models, setModels] = useState<HFModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<HFModel | null>(null);
  const [sortBy, setSortBy] = useState<'relevance' | 'downloads' | 'likes' | 'recent'>('relevance');
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  console.log('🎨 ModernModelBrowser render:', { searchQuery, modelsCount: models.length, isLoading });

  // Input değiştiğinde çağrılacak fonksiyon
  const handleSearchChange = (value: string) => {
    console.log('⌨️ handleSearchChange çağrıldı:', value);
    setSearchQuery(value);
    
    // Önceki timeout'u iptal et
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // Yeni timeout başlat
    if (value.length >= 2) {
      const timeout = setTimeout(() => {
        console.log('⏰ Timeout bitti, arama başlıyor:', value);
        searchModels(value);
      }, 800);
      setSearchTimeout(timeout);
    } else {
      setModels([]);
    }
  };

  // Quantization çıkar
  const extractQuantization = (filename: string): string => {
    const match = filename.match(/[Qq](\d+)_[KkMmSs](_[LlMmSs])?/);
    return match ? match[0].toUpperCase() : 'Unknown';
  };

  // Açıklama çıkar
  const extractDescription = (model: any): string => {
    if (model.cardData?.description) return model.cardData.description;
    if (model.tags?.includes('text-generation')) return 'Text generation model';
    if (model.tags?.includes('code')) return 'Code generation model';
    return 'GGUF model';
  };

  // Önerilen mi?
  const isRecommended = (model: any): boolean => {
    const name = model.id.toLowerCase();
    return name.includes('llava') || name.includes('qwen') || name.includes('mistral');
  };

  // Parametre sayısı çıkar
  const extractParameters = (name: string): string => {
    const match = name.match(/(\d+)[Bb]/);
    return match ? `${match[1]}B` : '';
  };

  // Akıllı arama - duplicate'leri temizle
  const searchModels = async (query: string) => {
    if (!query.trim()) {
      setModels([]);
      return;
    }

    setIsLoading(true);
    console.log('🔍 Arama başlatılıyor:', query);
    
    try {
      const apiUrl = `https://huggingface.co/api/models?search=${encodeURIComponent(query)}&filter=gguf&sort=downloads&limit=50`;
      console.log('📡 API URL:', apiUrl);
      
      const response = await fetch(apiUrl);
      console.log('📥 Response status:', response.status);

      if (!response.ok) {
        console.error('❌ API hatası:', response.status, response.statusText);
        throw new Error('Arama başarısız');
      }

      const data = await response.json();
      console.log('📦 API Response:', data.length, 'model bulundu');
      
      // Modelleri grupla (aynı base model)
      const groupedModels = new Map<string, HFModel>();
      
      for (const hfModel of data) {
        console.log('🔍 İşleniyor:', hfModel.id);
        
        // Base model adını çıkar (quantization olmadan)
        const baseModelName = hfModel.id.split('/')[1]?.replace(/-GGUF$/i, '') || hfModel.id;
        
        if (!groupedModels.has(baseModelName)) {
          // Dosyaları al
          const filesUrl = `https://huggingface.co/api/models/${hfModel.id}/tree/main`;
          console.log('📂 Dosyalar alınıyor:', filesUrl);
          
          const filesResponse = await fetch(filesUrl);
          
          if (!filesResponse.ok) {
            console.warn('⚠️ Dosyalar alınamadı:', hfModel.id);
            continue;
          }
          
          const filesData = await filesResponse.json();
          console.log('📁 Dosya sayısı:', filesData.length);
          
          const ggufFiles: ModelFile[] = filesData
            .filter((f: any) => f.rfilename?.endsWith('.gguf'))
            .map((f: any) => ({
              filename: f.rfilename,
              size: f.size || 0,
              quantization: extractQuantization(f.rfilename),
              downloadUrl: `https://huggingface.co/${hfModel.id}/resolve/main/${f.rfilename}`
            }))
            .sort((a: ModelFile, b: ModelFile) => b.size - a.size);

          console.log('📦 GGUF dosyaları:', ggufFiles.length);

          if (ggufFiles.length > 0) {
            groupedModels.set(baseModelName, {
              id: hfModel.id,
              name: baseModelName,
              author: hfModel.id.split('/')[0],
              downloads: hfModel.downloads || 0,
              likes: hfModel.likes || 0,
              lastModified: hfModel.lastModified || '',
              description: extractDescription(hfModel),
              tags: hfModel.tags || [],
              files: ggufFiles,
              isRecommended: isRecommended(hfModel),
              parameters: extractParameters(baseModelName)
            });
            console.log('✅ Model eklendi:', baseModelName);
          }
        }
      }

      const finalModels = Array.from(groupedModels.values());
      console.log('🎯 Toplam model:', finalModels.length);
      setModels(finalModels);
    } catch (error) {
      console.error('❌ Arama hatası:', error);
      showToast('Arama başarısız oldu: ' + error, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Sıralama
  const sortedModels = useMemo(() => {
    const sorted = [...models];
    
    switch (sortBy) {
      case 'downloads':
        return sorted.sort((a, b) => b.downloads - a.downloads);
      case 'likes':
        return sorted.sort((a, b) => b.likes - a.likes);
      case 'recent':
        return sorted.sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());
      default: // relevance
        return sorted.sort((a, b) => {
          if (a.isRecommended && !b.isRecommended) return -1;
          if (!a.isRecommended && b.isRecommended) return 1;
          return b.downloads - a.downloads;
        });
    }
  }, [models, sortBy]);

  // Dosya boyutunu formatla
  const formatSize = (bytes: number): string => {
    const gb = bytes / (1024 ** 3);
    return `${gb.toFixed(1)} GB`;
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#1a1a1a] rounded-lg border border-neutral-800">
      {/* Debug Info */}
      <div className="p-2 bg-green-500/10 border-b border-green-500/30">
        <p className="text-green-400 text-xs">
          ✅ ModernModelBrowser yüklendi! searchQuery: "{searchQuery}" | models: {models.length}
        </p>
      </div>
      
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-neutral-800">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Modern Model Browser</h2>
          <p className="text-xs text-neutral-400">HuggingFace GGUF Models - LM Studio Style</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="p-4 border-b border-neutral-800 space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              console.log('⌨️ Input onChange:', e.target.value);
              handleSearchChange(e.target.value);
            }}
            placeholder="Model ara... (örn: llava, qwen, mistral)"
            className="w-full pl-10 pr-4 py-2.5 bg-[#252525] border border-neutral-700 rounded-lg text-sm text-white placeholder-neutral-500 focus:border-blue-500 focus:outline-none"
          />
          {isLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Sort Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-neutral-500">Sırala:</span>
          {(['relevance', 'downloads', 'likes', 'recent'] as const).map((sort) => (
            <button
              key={sort}
              onClick={() => setSortBy(sort)}
              className={`px-3 py-1 rounded-md text-xs transition-colors ${
                sortBy === sort
                  ? 'bg-blue-600 text-white'
                  : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
              }`}
            >
              {sort === 'relevance' && '🎯 En İyi Eşleşme'}
              {sort === 'downloads' && '📥 İndirme'}
              {sort === 'likes' && '❤️ Beğeni'}
              {sort === 'recent' && '🕐 Yeni'}
            </button>
          ))}
          
          <span className="text-xs text-neutral-600 ml-auto">
            {sortedModels.length} model bulundu
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Model List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {sortedModels.length === 0 && !isLoading && searchQuery && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-800 flex items-center justify-center">
                <svg className="w-8 h-8 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-neutral-400 text-sm">Model bulunamadı</p>
              <p className="text-neutral-600 text-xs mt-1">Farklı bir arama terimi deneyin</p>
            </div>
          )}

          {sortedModels.map((model) => (
            <button
              key={model.id}
              onClick={() => setSelectedModel(model)}
              className={`w-full p-4 rounded-lg border transition-all text-left ${
                selectedModel?.id === model.id
                  ? 'bg-blue-500/10 border-blue-500'
                  : 'bg-[#252525] border-neutral-800 hover:border-neutral-700 hover:bg-[#2a2a2a]'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-white text-sm truncate">{model.name}</h3>
                    {model.isRecommended && (
                      <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-[10px] rounded-full font-medium">
                        ⭐ Önerilen
                      </span>
                    )}
                    {model.parameters && (
                      <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-[10px] rounded-full font-medium">
                        {model.parameters}
                      </span>
                    )}
                  </div>
                  
                  <p className="text-xs text-neutral-500 mb-2">
                    {model.author} • {model.files.length} dosya
                  </p>
                  
                  <p className="text-xs text-neutral-400 line-clamp-2 mb-2">
                    {model.description}
                  </p>
                  
                  <div className="flex items-center gap-3 text-xs text-neutral-500">
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                      {(model.downloads / 1000).toFixed(1)}K
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                      </svg>
                      {model.likes}
                    </span>
                  </div>
                </div>
                
                <svg className={`w-5 h-5 flex-shrink-0 transition-transform ${selectedModel?.id === model.id ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          ))}
        </div>

        {/* Model Details */}
        {selectedModel && (
          <div className="w-96 border-l border-neutral-800 overflow-y-auto p-4 bg-[#1e1e1e]">
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-white mb-1">{selectedModel.name}</h3>
                <p className="text-xs text-neutral-400">{selectedModel.author}</p>
              </div>

              <div className="p-3 bg-[#252525] rounded-lg border border-neutral-800">
                <p className="text-xs text-neutral-300">{selectedModel.description}</p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-white mb-2">İndirme Seçenekleri</h4>
                <p className="text-xs text-neutral-500 mb-3">{selectedModel.files.length} dosya mevcut</p>
                
                <div className="space-y-2">
                  {selectedModel.files.slice(0, 5).map((file, idx) => {
                    const ggufModel: GGUFModel = {
                      id: `hf-${selectedModel.id}-${file.filename}`,
                      name: file.filename,
                      displayName: selectedModel.name,
                      size: formatSize(file.size),
                      sizeBytes: file.size,
                      quantization: file.quantization,
                      description: selectedModel.description,
                      huggingFaceUrl: `https://huggingface.co/${selectedModel.id}`,
                      downloadUrl: file.downloadUrl,
                      isDownloaded: false,
                      isDownloading: false,
                      parameters: selectedModel.parameters,
                      downloads: selectedModel.downloads,
                      likes: selectedModel.likes
                    };
                    
                    return (
                      <div
                        key={idx}
                        className="p-3 bg-[#252525] rounded-lg border border-neutral-800 hover:border-neutral-700 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-white">{file.quantization}</span>
                          <span className="text-xs text-neutral-400">{formatSize(file.size)}</span>
                        </div>
                        
                        <button
                          onClick={() => {
                            onModelSelect(ggufModel);
                            showToast(`${selectedModel.name} (${file.quantization}) eklendi`, 'success');
                          }}
                          className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-md transition-colors font-medium"
                        >
                          Seç ve İndir
                        </button>
                      </div>
                    );
                  })}
                  
                  {selectedModel.files.length > 5 && (
                    <p className="text-xs text-neutral-500 text-center">
                      +{selectedModel.files.length - 5} dosya daha
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-800">
                <a
                  href={`https://huggingface.co/${selectedModel.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                    <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                  </svg>
                  HuggingFace'de Aç
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
