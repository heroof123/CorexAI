import { useState } from 'react';

interface Model {
  id: string;
  name: string;
  displayName: string;
  size: string;
  sizeBytes: number;
  quantization: string;
  parameters?: string;
  contextLength?: number;
}

interface ModelComparisonProps {
  models: Model[];
  onClose: () => void;
}

export default function ModelComparison({ models, onClose }: ModelComparisonProps) {
  const [model1, setModel1] = useState<Model | null>(models[0] || null);
  const [model2, setModel2] = useState<Model | null>(models[1] || null);

  const calculateVRAM = (model: Model, context: number = 8192) => {
    const sizeGB = model.sizeBytes / (1024 ** 3);
    
    // Model size (Q4 quantization için)
    const modelVRAM = sizeGB;
    
    // KV Cache hesaplama (doğru formül)
    // KV cache = 2 (K+V) × layers × context × hidden_size × bytes / 1e9
    const layers = 28; // Qwen/Llama için tipik
    const hiddenSize = 4096;
    const bytesPerElement = 2; // fp16
    
    const kvCacheGB = (2 * layers * context * hiddenSize * bytesPerElement) / 1_000_000_000;
    
    return modelVRAM + kvCacheGB;
  };

  const estimateSpeed = (model: Model) => {
    const sizeGB = model.sizeBytes / (1024 ** 3);
    
    // Küçük modeller daha hızlı
    if (sizeGB < 3) return 45; // 3B model
    if (sizeGB < 5) return 28; // 7B model
    return 15; // 13B+ model
  };

  const getQualityStars = (model: Model) => {
    const quant = model.quantization;
    if (quant.includes('Q6') || quant.includes('Q8')) return 5;
    if (quant.includes('Q5')) return 4;
    if (quant.includes('Q4')) return 3;
    return 2;
  };

  if (!model1 || !model2) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-lg p-6 max-w-md">
          <h3 className="text-white text-lg mb-4">⚠️ Yetersiz Model</h3>
          <p className="text-gray-300 mb-4">Karşılaştırma için en az 2 model gerekli.</p>
          <button onClick={onClose} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded">
            Tamam
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg border border-gray-700 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">⚖️ Model Karşılaştırma</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>

        {/* Model Selection */}
        <div className="p-4 grid grid-cols-2 gap-4 border-b border-gray-700">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Model 1</label>
            <select
              value={model1.id}
              onChange={(e) => setModel1(models.find(m => m.id === e.target.value) || null)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
            >
              {models.map(m => (
                <option key={m.id} value={m.id}>{m.displayName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Model 2</label>
            <select
              value={model2.id}
              onChange={(e) => setModel2(models.find(m => m.id === e.target.value) || null)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
            >
              {models.map(m => (
                <option key={m.id} value={m.id}>{m.displayName}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="p-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-2 text-gray-400">Özellik</th>
                <th className="text-center py-2 text-blue-400">{model1.displayName}</th>
                <th className="text-center py-2 text-green-400">{model2.displayName}</th>
              </tr>
            </thead>
            <tbody className="text-white">
              {/* Boyut */}
              <tr className="border-b border-gray-700/50">
                <td className="py-3 text-gray-400">📦 Dosya Boyutu</td>
                <td className="text-center">{model1.size}</td>
                <td className="text-center">{model2.size}</td>
              </tr>

              {/* Parametreler */}
              {(model1.parameters || model2.parameters) && (
                <tr className="border-b border-gray-700/50">
                  <td className="py-3 text-gray-400">🔢 Parametreler</td>
                  <td className="text-center">{model1.parameters || '-'}</td>
                  <td className="text-center">{model2.parameters || '-'}</td>
                </tr>
              )}

              {/* Quantization */}
              <tr className="border-b border-gray-700/50">
                <td className="py-3 text-gray-400">⚙️ Quantization</td>
                <td className="text-center">{model1.quantization}</td>
                <td className="text-center">{model2.quantization}</td>
              </tr>

              {/* VRAM (8K) */}
              <tr className="border-b border-gray-700/50">
                <td className="py-3 text-gray-400">🎮 VRAM (8K context)</td>
                <td className="text-center">{Math.round(calculateVRAM(model1, 8192))} GB</td>
                <td className="text-center">{Math.round(calculateVRAM(model2, 8192))} GB</td>
              </tr>

              {/* VRAM (16K) */}
              <tr className="border-b border-gray-700/50">
                <td className="py-3 text-gray-400">🎮 VRAM (16K context)</td>
                <td className="text-center">{Math.round(calculateVRAM(model1, 16384))} GB</td>
                <td className="text-center">{Math.round(calculateVRAM(model2, 16384))} GB</td>
              </tr>

              {/* Tahmini Hız */}
              <tr className="border-b border-gray-700/50">
                <td className="py-3 text-gray-400">⚡ Tahmini Hız</td>
                <td className="text-center">{estimateSpeed(model1)} token/s</td>
                <td className="text-center">{estimateSpeed(model2)} token/s</td>
              </tr>

              {/* Kalite */}
              <tr className="border-b border-gray-700/50">
                <td className="py-3 text-gray-400">⭐ Kalite</td>
                <td className="text-center">{'⭐'.repeat(getQualityStars(model1))}</td>
                <td className="text-center">{'⭐'.repeat(getQualityStars(model2))}</td>
              </tr>

              {/* Öneri */}
              <tr>
                <td className="py-3 text-gray-400">💡 Öneri</td>
                <td className="text-center text-xs">
                  {calculateVRAM(model1, 8192) < 8 ? '✅ 12GB VRAM için uygun' : '⚠️ Yüksek VRAM gerekir'}
                </td>
                <td className="text-center text-xs">
                  {calculateVRAM(model2, 8192) < 8 ? '✅ 12GB VRAM için uygun' : '⚠️ Yüksek VRAM gerekir'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 bg-gray-900/50">
          <div className="text-xs text-gray-400 space-y-1">
            <p>💡 <strong>İpucu:</strong> Küçük modeller daha hızlı, büyük modeller daha kaliteli cevap verir.</p>
            <p>🎮 <strong>VRAM:</strong> Senin sistemin 12 GB VRAM'e sahip (RTX 5070).</p>
            <p>⚡ <strong>Hız:</strong> Tahmini değerler, gerçek hız sistem ve ayarlara göre değişir.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
