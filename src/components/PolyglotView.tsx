import { useState } from 'react';
import { motion } from 'framer-motion';
import { polyglotEngine } from '../services/polyglotEngine';
import { FileIndex } from '../types';

export const PolyglotView: React.FC<{ fileIndex: FileIndex[] }> = ({ fileIndex }) => {
    const [targetLang, setTargetLang] = useState('Rust');
    const [isTranslating, setIsTranslating] = useState(false);
    const [progress, setProgress] = useState(0);
    const [progressText, setProgressText] = useState('Dosyalar analiz ediliyor ve çeviri uygulanıyor...');

    const handleTranslate = async () => {
        setIsTranslating(true);
        setProgress(0);
        try {
            const interval = setInterval(() => {
                // Sadece görsel efekt olarak %90'a kadar dolmasını sağla, gerisini backend halledecek
                setProgress(prev => Math.min(prev + 2, 90));
            }, 1000);

            await polyglotEngine.translateProject(targetLang, fileIndex, (p: number, label: string) => {
                setProgressText(label);
                if (p > 0) setProgress(Math.max(p, 90));
            });

            clearInterval(interval);
            setProgress(100);
            setProgressText("Tamamlandı!");
            alert(`🚀 Proje başarıyla ${targetLang} diline çevrildi!`);
        } catch (error) {
            console.error(error);
        } finally {
            setIsTranslating(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#0a0a0a] p-4 gap-6">
            <div className="space-y-1">
                <h3 className="text-sm font-black uppercase tracking-widest text-emerald-400">Polyglot Engine</h3>
                <p className="text-[10px] text-neutral-500 italic">Tüm projeyi anında başka bir dile çevir.</p>
            </div>

            <div className="space-y-4 bg-white/[0.02] p-6 rounded-3xl border border-white/5">
                <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black text-neutral-400">Hedef Dil</label>
                    <select
                        value={targetLang}
                        onChange={(e) => setTargetLang(e.target.value)}
                        className="w-full bg-[#121212] border border-white/10 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-emerald-500/50"
                    >
                        <option>Rust</option>
                        <option>Go</option>
                        <option>Python</option>
                        <option>TypeScript</option>
                        <option>Java</option>
                    </select>
                </div>

                <button
                    onClick={handleTranslate}
                    disabled={isTranslating}
                    className="w-full py-4 bg-emerald-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-500 disabled:opacity-50 shadow-[0_4px_20px_rgba(16,185,129,0.2)] transition-all"
                >
                    {isTranslating ? '⏳ Çevriliyor...' : 'Tüm Projeyi Çevir'}
                </button>

                {isTranslating && (
                    <div className="space-y-2">
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-emerald-500"
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}% ` }}
                            />
                        </div>
                        <p className="text-[9px] text-center text-neutral-500">{progressText}</p>
                    </div>
                )}
            </div>

            <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                <h4 className="text-[10px] font-bold text-emerald-400 mb-2">💡 Nasıl Çalışır?</h4>
                <ul className="text-[9px] text-neutral-400 space-y-2">
                    <li>• AI, klasör yapısını ve dosya bağımlılıklarını analiz eder.</li>
                    <li>• Her dosyayı hedef dile uygun idiomatik yapıyla yeniden yazar.</li>
                    <li>• `polyglot_output` klasörüne yeni projeyi oluşturur.</li>
                </ul>
            </div>
        </div>
    );
};
