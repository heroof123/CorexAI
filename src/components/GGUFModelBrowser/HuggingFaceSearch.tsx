import { GGUFModel } from './types';
import { openUrl } from '@tauri-apps/plugin-opener';

interface HuggingFaceSearchProps {
    isVisible: boolean;
    onClose: () => void;
    searchQuery: string;
    setSearchQuery: (val: string) => void;
    isSearching: boolean;
    searchResults: GGUFModel[];
    setSearchResults: (val: GGUFModel[]) => void;
    addModelFromSearch: (model: GGUFModel) => void;
    addToDownloadQueue: (model: GGUFModel) => void;
}

export default function HuggingFaceSearch({
    isVisible,
    onClose,
    searchQuery,
    setSearchQuery,
    isSearching,
    searchResults,
    setSearchResults,
    addModelFromSearch,
    addToDownloadQueue
}: HuggingFaceSearchProps) {
    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg p-4 max-w-3xl w-full max-h-[80vh] overflow-y-auto m-4" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-[var(--color-text)]">🤗 Hugging Face Model Ara</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-[var(--color-text)] text-xl">✕</button>
                </div>

                <div className="mb-3">
                    <input
                        type="text"
                        placeholder="Model ara... (örn: tinyllama, qwen, phi, llama)"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-[var(--color-text)] placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                        autoFocus
                    />
                    {isSearching && <div className="mt-2 text-sm text-gray-400">🔄 Aranıyor...</div>}
                </div>

                {searchResults.length > 0 ? (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-[var(--color-text)]">📋 {searchResults.length} sonuç bulundu</span>
                            <button onClick={() => setSearchResults([])} className="text-xs text-gray-400 hover:text-[var(--color-text)]">Temizle</button>
                        </div>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {searchResults.map(model => (
                                <div key={model.id} className="bg-[var(--color-surface)] border border-[var(--color-border)] p-4 rounded-xl shadow-sm hover:shadow-md transition-all">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <h5 className="font-semibold text-[var(--color-text)] text-sm mb-1">{model.displayName}</h5>
                                            <p className="text-gray-400 text-xs mb-2">{model.description}</p>
                                            <div className="flex flex-wrap gap-1">
                                                <span className="px-2 py-0.5 bg-gray-700 rounded text-xs">{model.size}</span>
                                                <span className="px-2 py-0.5 bg-blue-700 rounded text-xs">{model.quantization}</span>
                                                {model.parameters && <span className="px-2 py-0.5 bg-purple-700 rounded text-xs">{model.parameters}</span>}
                                                {model.downloads && <span className="px-2 py-0.5 bg-green-700 rounded text-xs">⬇️ {(model.downloads / 1000).toFixed(0)}K</span>}
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <button
                                                onClick={() => {
                                                    addModelFromSearch(model);
                                                    onClose();
                                                }}
                                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-xs whitespace-nowrap"
                                            >
                                                + Ekle ve İndir
                                            </button>
                                            <button
                                                onClick={() => addToDownloadQueue(model)}
                                                className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 rounded text-xs whitespace-nowrap"
                                            >
                                                📥 Kuyruğa Ekle
                                            </button>
                                            <button
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    try {
                                                        await openUrl(model.huggingFaceUrl);
                                                    } catch (error) {
                                                        console.error('URL açma hatası:', error);
                                                        alert('Tarayıcı açılamadı: ' + error);
                                                    }
                                                }}
                                                className="px-3 py-1.5 bg-purple-700 hover:bg-purple-600 rounded text-xs whitespace-nowrap cursor-pointer"
                                            >
                                                🤗 Sayfasını Aç
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : searchQuery.length > 0 && !isSearching ? (
                    <div className="text-center py-8 text-gray-400">
                        <p className="mb-2">🔍 Sonuç bulunamadı</p>
                        <p className="text-xs">Farklı anahtar kelimeler deneyin</p>
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-400">
                        <p className="mb-2">🤗 Hugging Face'de model arayın</p>
                        <p className="text-xs">Popüler modeller: tinyllama, qwen, phi, llama, mistral</p>
                    </div>
                )}
            </div>
        </div>
    );
}
