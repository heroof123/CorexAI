import { WorkflowState } from "../types/workflow";

interface WorkflowPanelProps {
  workflow: WorkflowState | null;
  onApprove: () => void;
  onReject: () => void;
}

export default function WorkflowPanel({ workflow, onApprove, onReject }: WorkflowPanelProps) {
  if (!workflow || workflow.currentPhase === 'idle') {
    return null;
  }

  // ✅ TAMAMLANDI
  if (workflow.currentPhase === 'completed') {
    const duration = workflow.endTime 
      ? Math.round((workflow.endTime - workflow.startTime) / 1000)
      : 0;
    
    return (
      <div className="mb-4 p-4 bg-green-900/20 border border-green-700 rounded-lg animate-in fade-in duration-300">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">✅</span>
          <span className="text-white font-semibold text-lg">Tamamlandı!</span>
        </div>
        
        <div className="space-y-2 text-sm">
          <div>
            <span className="text-neutral-400">İstek:</span>
            <p className="text-white ml-2">{workflow.userRequest}</p>
          </div>
          
          <div>
            <span className="text-neutral-400">Yapılan:</span>
            <p className="text-white ml-2">{workflow.plan?.goal}</p>
          </div>
          
          <div className="flex items-center gap-4 text-xs text-neutral-500 pt-2 border-t border-green-800">
            <span>✓ Tüm testler geçti</span>
            <span>• {duration}s</span>
            {workflow.iterationCount > 0 && (
              <span>• {workflow.iterationCount + 1} deneme</span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ❌ BAŞARISIZ
  if (workflow.currentPhase === 'failed') {
    return (
      <div className="mb-4 p-4 bg-red-900/20 border border-red-700 rounded-lg animate-in fade-in duration-300">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">❌</span>
          <span className="text-white font-semibold text-lg">Başarısız</span>
        </div>
        
        <div className="space-y-2 text-sm">
          <div>
            <span className="text-neutral-400">İstek:</span>
            <p className="text-white ml-2">{workflow.userRequest}</p>
          </div>
          
          {workflow.testResult && workflow.testResult.errors.length > 0 && (
            <div>
              <span className="text-neutral-400">Son Hatalar:</span>
              <ul className="text-red-300 ml-2 list-disc list-inside text-xs">
                {workflow.testResult.errors.slice(0, 3).map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
              </ul>
            </div>
          )}
          
          <p className="text-xs text-neutral-500 pt-2 border-t border-red-800">
            {workflow.maxIterations} denemeden sonra başarılı olunamadı.
          </p>
        </div>
      </div>
    );
  }

  // 🔄 TEST EDİLİYOR
  if (workflow.currentPhase === 'testing') {
    return (
      <div className="mb-4 p-4 bg-blue-900/20 border border-blue-700 rounded-lg animate-in fade-in duration-300">
        <div className="flex items-center gap-3 mb-2">
          <div className="relative">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <div>
            <p className="text-white font-semibold">Test ediliyor...</p>
            <p className="text-xs text-neutral-400">
              Kod değişiklikleri uygulandı, otomatik test yapılıyor
            </p>
          </div>
        </div>
        
        {workflow.plan && (
          <div className="mt-3 pt-3 border-t border-blue-800">
            <p className="text-xs text-neutral-500 mb-1">Test kriterleri:</p>
            <ul className="text-xs text-neutral-400 list-disc list-inside">
              {workflow.plan.successCriteria.map((criteria, i) => (
                <li key={i}>{criteria}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  // 💻 KOD YAZILIYOR
  if (workflow.currentPhase === 'coding') {
    return (
      <div className="mb-4 p-4 bg-purple-900/20 border border-purple-700 rounded-lg animate-in fade-in duration-300">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <div>
            <p className="text-white font-semibold">Kod yazılıyor...</p>
            <p className="text-xs text-neutral-400">
              {workflow.plan?.affectedFiles.length} dosya güncelleniyor
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 📋 ONAY BEKLENİYOR
  if (workflow.currentPhase === 'awaiting_approval') {
    return (
      <div className="mb-4 p-4 bg-yellow-900/20 border border-yellow-700 rounded-lg animate-in fade-in duration-300">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">📋</span>
          <span className="text-white font-semibold text-lg">Plan Onayı Gerekli</span>
        </div>
        
        <div className="bg-[#252525] p-3 rounded mb-3 space-y-2 text-sm">
          <div>
            <span className="text-neutral-400 text-xs">HEDEF:</span>
            <p className="text-white">{workflow.plan?.goal}</p>
          </div>
          
          <div>
            <span className="text-neutral-400 text-xs">YAKLAŞIM:</span>
            <p className="text-neutral-300 text-xs">{workflow.plan?.approach}</p>
          </div>
          
          <div>
            <span className="text-neutral-400 text-xs">ETKİLENECEK DOSYALAR:</span>
            <ul className="text-neutral-300 text-xs list-disc list-inside ml-2">
              {workflow.plan?.affectedFiles.map(f => (
                <li key={f}>{f.split(/[\\/]/).pop()}</li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={onApprove}
            className="flex-1 bg-green-600 hover:bg-green-700 py-2 rounded text-sm font-medium transition-colors"
          >
            ✅ Onayla ve Başlat
          </button>
          <button
            onClick={onReject}
            className="flex-1 bg-red-600 hover:bg-red-700 py-2 rounded text-sm font-medium transition-colors"
          >
            ❌ Reddet
          </button>
        </div>
        
        <p className="text-xs text-yellow-600 mt-2">
          ⚠️ Bu değişiklikler kritik dosyaları etkiliyor, onayınız gerekli.
        </p>
      </div>
    );
  }

  // 📝 PLAN OLUŞTURULUYOR
  if (workflow.currentPhase === 'planning') {
    return (
      <div className="mb-4 p-4 bg-neutral-800 border border-neutral-700 rounded-lg animate-in fade-in duration-300">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-8 h-8 border-4 border-neutral-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <div>
            <p className="text-white font-semibold">Plan hazırlanıyor...</p>
            <p className="text-xs text-neutral-400">{workflow.userRequest}</p>
          </div>
        </div>
        
        {workflow.iterationCount > 0 && (
          <p className="text-xs text-neutral-500 mt-2">
            🔄 Deneme {workflow.iterationCount + 1}/{workflow.maxIterations}
          </p>
        )}
      </div>
    );
  }

  return null;
}