import { GGUFModel } from './types';
import { calculateRequirements, QUANT_INFO } from './utils';

interface LocalModelListProps {
    filteredModels: GGUFModel[];
    activeGpuModel: string | null;
    contextLength: number;
    showRequirements: string | null;
    setShowRequirements: (id: string | null) => void;
    isBenchmarking: boolean;
    deleteModel: (id: string) => void;
    handleModelSelect: (model: GGUFModel) => void;
    runBenchmark: (model: GGUFModel) => void;
    setSelectedModelForConfig: (model: GGUFModel | null) => void;
    readModelMetadata: (path: string) => void;
    addToDownloadQueue: (model: GGUFModel) => void;
    toggleFavorite: (id: string) => void;
}

export default function LocalModelList({
    filteredModels,
    activeGpuModel,
    contextLength,
    showRequirements,
    setShowRequirements,
    isBenchmarking,
    deleteModel,
    handleModelSelect,
    runBenchmark,
    setSelectedModelForConfig,
    readModelMetadata,
    addToDownloadQueue,
    toggleFavorite
}: LocalModelListProps) {
    return (
        <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredModels.length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm">
                    <p className="mb-2">📦 Henüz model eklenmemiş</p>
                    <p className="text-xs">Yukarıdaki "📄 Dosya Ekle" butonuna tıklayarak GGUF model ekleyin</p>
                    <p className="text-xs mt-1">veya 🤗 Hugging Face'den model arayın</p>
                </div>
            )}

            {filteredModels.map(model => {
                const requirements = calculateRequirements(model, contextLength);
                const quantInfo = QUANT_INFO[model.quantization];

                return (
                    <div key={model.id} className={`p-2 rounded border text-xs ${model.isDownloaded ? 'border-green-500 bg-green-900/10' : 'border-gray-600 bg-gray-800/50'} hover:border-blue-500 transition-colors`}>
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1 mb-0.5">
                                    <button
                                        onClick={() => toggleFavorite(model.id)}
                                        className={`text-sm ${model.isFavorite ? 'text-yellow-400' : 'text-gray-600 hover:text-yellow-400'} transition-colors`}
                                        title={model.isFavorite ? 'Favorilerden çıkar' : 'Favorilere ekle'}
                                    >
                                        {model.isFavorite ? '⭐' : '☆'}
                                    </button>
                                    <h4 className="font-semibold text-white truncate">{model.displayName}</h4>
                                    {model.isDownloaded && <span className="text-green-400 text-xs">✓</span>}
                                    {activeGpuModel === model.localPath && <span className="text-blue-400 text-xs animate-pulse" title="GPU'da aktif">🎮</span>}
                                    {model.usageCount && model.usageCount > 0 && (
                                        <span className="text-xs text-gray-500" title={`${model.usageCount} kez kullanıldı`}>
                                            ({model.usageCount}×)
                                        </span>
                                    )}
                                </div>
                                <p className="text-gray-400 text-xs mb-1 truncate">{model.description}</p>
                                <div className="flex flex-wrap gap-1 text-xs">
                                    {model.size !== 'Bilinmiyor' && <span className="px-1.5 py-0.5 bg-gray-700 rounded">{model.size}</span>}
                                    <span className="px-1.5 py-0.5 bg-blue-700 rounded">{model.quantization}</span>
                                    {model.parameters && <span className="px-1.5 py-0.5 bg-purple-700 rounded">{model.parameters}</span>}
                                    {model.lastUsed && (
                                        <span className="px-1.5 py-0.5 bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-textSecondary)]" title="Son kullanım">
                                            🕐 {new Date(model.lastUsed).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                                        </span>
                                    )}
                                </div>

                                {model.isDownloading && (
                                    <div className="mt-2 space-y-1">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-blue-400">⬇️ İndiriliyor...</span>
                                            <span className="text-white font-semibold">
                                                {model.downloadProgress?.toFixed(1) || 0}%
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                                            <div
                                                className="bg-blue-500 h-full transition-all duration-300 ease-out"
                                                style={{ width: `${model.downloadProgress || 0}%` }}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between text-xs text-gray-400">
                                            <span>
                                                {((model.downloadedBytes || 0) / (1024 ** 3)).toFixed(2)} GB / {model.size}
                                            </span>
                                            <span>
                                                {(() => {
                                                    if (!model.downloadProgress || model.downloadProgress === 0) return 'Başlatılıyor...';
                                                    if (model.downloadProgress >= 100) return 'Tamamlandı!';

                                                    const elapsedSeconds = (Date.now() - (model.downloadStartTime || Date.now())) / 1000;
                                                    const downloadedBytes = model.downloadedBytes || 0;
                                                    const totalBytes = model.sizeBytes;
                                                    const remainingBytes = totalBytes - downloadedBytes;

                                                    if (elapsedSeconds < 2) return 'Hesaplanıyor...';

                                                    const bytesPerSecond = downloadedBytes / elapsedSeconds;
                                                    const speedMBps = (bytesPerSecond / (1024 * 1024)).toFixed(1);
                                                    const remainingSeconds = Math.ceil(remainingBytes / bytesPerSecond);

                                                    let timeStr = '';
                                                    if (remainingSeconds < 60) timeStr = `${remainingSeconds} sn`;
                                                    else if (remainingSeconds < 3600) timeStr = `${Math.ceil(remainingSeconds / 60)} dk`;
                                                    else timeStr = `${(remainingSeconds / 3600).toFixed(1)} saat`;

                                                    return `${speedMBps} MB/s • ~${timeStr}`;
                                                })()}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {showRequirements === model.id && model.sizeBytes > 0 && (
                                    <div className="mt-2 p-2 bg-gray-900 rounded text-xs space-y-1">
                                        <div className="flex justify-between"><span>💾 Min RAM:</span><span className="font-semibold">{requirements.minRAM} GB</span></div>
                                        <div className="flex justify-between"><span>🎮 Min VRAM:</span><span className="font-semibold">{requirements.minVRAM} GB</span></div>
                                        <div className="flex justify-between"><span>💾 Önerilen RAM:</span><span className="font-semibold text-green-400">{requirements.recommendedRAM} GB</span></div>
                                        <div className="flex justify-between"><span>🎮 Önerilen VRAM:</span><span className="font-semibold text-green-400">{requirements.recommendedVRAM} GB</span></div>
                                        {quantInfo && <div className="pt-1 border-t border-gray-700"><span className="text-gray-400">{quantInfo.quality}</span></div>}
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-1">
                                {model.sizeBytes > 0 && (
                                    <button onClick={() => setShowRequirements(showRequirements === model.id ? null : model.id)} className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs whitespace-nowrap" title="Sistem gereksinimleri">ℹ️</button>
                                )}
                                {model.isDownloaded && (
                                    <>
                                        <button onClick={() => handleModelSelect(model)} className="px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-xs whitespace-nowrap" title="Ayarla ve Kullan">⚙️</button>
                                        <button
                                            onClick={() => runBenchmark(model)}
                                            disabled={isBenchmarking}
                                            className={`px-2 py-1 rounded text-xs whitespace-nowrap ${isBenchmarking
                                                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                                : 'bg-yellow-600 hover:bg-yellow-700 text-[var(--color-text)]'
                                                }`}
                                            title="Hız testi yap"
                                        >
                                            {isBenchmarking ? '⏳' : '⚡'}
                                        </button>
                                        <button
                                            onClick={() => {
                                                setSelectedModelForConfig(model);
                                                readModelMetadata(model.localPath!);
                                            }}
                                            className="px-2 py-1 bg-cyan-600 hover:bg-cyan-700 rounded text-xs whitespace-nowrap"
                                            title="Metadata oku"
                                        >
                                            📊
                                        </button>
                                    </>
                                )}
                                {!model.isDownloaded && !model.isDownloading && (
                                    <button
                                        onClick={() => addToDownloadQueue(model)}
                                        className="px-2 py-1 bg-orange-600 hover:bg-orange-700 rounded text-xs whitespace-nowrap"
                                        title="Kuyruğa ekle"
                                    >
                                        📥
                                    </button>
                                )}
                                <button onClick={() => deleteModel(model.id)} className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs whitespace-nowrap" title="Listeden Kaldır">🗑️</button>
                                {model.huggingFaceUrl && <a href={model.huggingFaceUrl} target="_blank" rel="noopener noreferrer" className="px-2 py-1 bg-purple-700 hover:bg-purple-600 rounded text-xs text-center" title="Hugging Face'de aç">🤗</a>}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
