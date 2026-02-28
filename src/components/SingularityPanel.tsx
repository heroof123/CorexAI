import { useState } from "react";
import { FileIndex } from "../types";

interface SingularityPanelProps {
    isOpen: boolean;
    onClose: () => void;
    fileIndex: FileIndex[];
    onStart: (intention: string) => void;
}

export default function SingularityPanel({ isOpen, onClose, onStart }: SingularityPanelProps) {
    const [agreed, setAgreed] = useState(false);
    const [intention, setIntention] = useState("");

    const vramRequirementWarning = "⚠️ UYARI: The Singularity, 500GB+ VRAM gerektiren tam otonom bir sistemdir. Bu panel kendi kaynak kodunu manipüle eder. Donanımınız yetersizse sisteminiz çökebilir veya kalıcı hasar görebilir.";

    if (!isOpen) return null;

    const handleStart = () => {
        if (!intention.trim()) return;
        onStart(intention);
    };

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 animate-fade-in" onClick={onClose} />

            {/* Modal */}
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
                <div className="glass-panel w-full max-w-3xl overflow-hidden rounded-3xl animate-fade-in shadow-[0_0_150px_rgba(255,0,0,0.3)] border border-red-500/20 flex flex-col pointer-events-auto bg-black/80">

                    {/* Header */}
                    <div className="h-24 border-b border-red-500/10 flex items-center justify-between px-8 bg-gradient-to-r from-red-600/10 to-transparent relative overflow-hidden">
                        <div className="absolute inset-0 bg-red-500/5 animate-pulse" />
                        <div className="flex flex-col relative z-10">
                            <div className="flex items-center gap-3">
                                <span className="text-3xl animate-bounce">👑</span>
                                <h2 className="text-3xl font-black text-white uppercase tracking-widest text-shadow-red glow-text-red">
                                    THE SINGULARITY
                                </h2>
                            </div>
                            <p className="text-xs uppercase font-bold tracking-[0.4em] text-red-400/80 mt-1">
                                Kendi Kendini Yeniden Yazan Yazılım Fabrikası
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 relative z-10 flex items-center justify-center hover:bg-white/10 rounded-full transition-all text-white/70 hover:text-white"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="p-8 flex flex-col gap-6 max-h-[70vh] overflow-y-auto">

                        {/* Warning Message */}
                        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/20 blur-3xl rounded-full" />
                            <p className="text-sm font-bold text-red-200 uppercase tracking-widest leading-relaxed">
                                {vramRequirementWarning}
                            </p>

                            <label className="flex items-center gap-3 mt-4 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={agreed}
                                    onChange={(e) => setAgreed(e.target.checked)}
                                    className="w-5 h-5 rounded border-red-500/30 bg-black/50 text-red-500 focus:ring-red-500/20 accent-red-600"
                                />
                                <span className="text-xs text-red-300 font-bold uppercase tracking-widest">Riski anladım ve 500GB+ VRAM altyapım var</span>
                            </label>
                        </div>

                        <div className={`transition-opacity duration-500 ${agreed ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                            <div className="flex flex-col gap-4">
                                <label className="text-xs font-black text-white/70 uppercase tracking-widest px-1">
                                    Sistemi Neye Dönüştürmek İstiyorsun?
                                </label>
                                <textarea
                                    value={intention}
                                    onChange={(e) => setIntention(e.target.value)}
                                    placeholder="Örn: Uygulamaya tam teşekküllü bir Docker yönetim arayüzü ekle ve projenin sol barını buna göre yeniden mimari et."
                                    className="w-full h-32 bg-black/60 border border-white/10 rounded-xl p-4 text-xs font-mono text-white outline-none focus:border-red-500/50 transition-all resize-none shadow-inner"
                                />

                                <button
                                    onClick={handleStart}
                                    disabled={!intention.trim() || !agreed}
                                    className={`py-4 rounded-xl text-sm font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${!intention.trim() || !agreed
                                        ? 'bg-red-500/10 text-red-500/50 cursor-not-allowed border border-red-500/10'
                                        : 'bg-red-600 text-white shadow-[0_0_30px_rgba(220,38,38,0.4)] hover:shadow-[0_0_50px_rgba(220,38,38,0.6)] hover:bg-red-500 border border-red-400/30'
                                        }`}
                                >
                                    SOHBET PANELİNE BAĞLAN VE BAŞLAT
                                </button>
                            </div>

                        </div>

                    </div>
                </div>
            </div>
        </>
    );
}
