import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { startupGenerator } from '../services/startupGenerator';

export const StartupGenView: React.FC = () => {
    const [idea, setIdea] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [steps, setSteps] = useState<string[]>([]);

    const handleGenerate = async () => {
        if (!idea.trim()) return;
        setIsGenerating(true);
        setSteps(['Fikir analiz ediliyor...', 'Pazar araştırması yapılıyor...', 'Teknoloji stacki belirleniyor...']);

        try {
            await startupGenerator.generateStartup(idea, ".", (step) => {
                setSteps(prev => [...prev, step]);
            });

            setSteps(prev => [...prev, '🔥 Girişim başarıyla başlatıldı!']);
            alert("🚀 Girişiminiz hazır! Klasörü kontrol edin.");
        } catch (error) {
            console.error(error);
            setSteps(prev => [...prev, `❌ Hata: ${error}`]);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#0a0a0a] p-4 gap-6">
            <div className="space-y-1">
                <h3 className="text-sm font-black uppercase tracking-widest text-orange-400">Autonomous Entrepreneur</h3>
                <p className="text-[10px] text-neutral-500 italic">Hayalindeki şirketi saniyeler içinde kur.</p>
            </div>

            <div className="space-y-4">
                <textarea
                    value={idea}
                    onChange={(e) => setIdea(e.target.value)}
                    placeholder="Örn: Yuvadaki kuşları takip eden ve AI ile türlerini belirleyen bir SaaS mobil uygulaması..."
                    className="w-full bg-white/[0.02] border border-white/5 rounded-3xl p-4 text-xs text-white outline-none focus:border-orange-500/50 min-h-[120px] resize-none"
                    disabled={isGenerating}
                />

                <button
                    onClick={handleGenerate}
                    disabled={isGenerating || !idea.trim()}
                    className="w-full py-4 bg-orange-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-orange-500 disabled:opacity-50 shadow-[0_4px_20px_rgba(249,115,22,0.2)] transition-all"
                >
                    {isGenerating ? '🚀 İnşa Ediliyor...' : 'Şirketi İnşa Et'}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto">
                <div className="space-y-2">
                    <AnimatePresence>
                        {steps.map((step, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex items-center gap-3 text-[10px] text-neutral-400 bg-white/[0.02] p-2 rounded-lg border border-white/5"
                            >
                                <span className="text-orange-500">{i === steps.length - 1 ? '➡️' : '✅'}</span>
                                {step}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};
