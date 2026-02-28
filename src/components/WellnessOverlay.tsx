import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { wellnessService, WellnessStats } from "../services/wellnessService";

export const WellnessOverlay: React.FC = () => {
    const [show, setShow] = useState(false);
    const [stats, setStats] = useState<WellnessStats | null>(null);

    useEffect(() => {
        const unsub = wellnessService.subscribe((newStats) => {
            setStats(newStats);
            // If active for more than 45 mins, show overlay
            if (newStats.activeTime >= 45 && !show) {
                setShow(true);
            }
        });

        return unsub;
    }, [show]);

    const handleClose = () => {
        wellnessService.resetBreak();
        setShow(false);
    };

    if (!show) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl p-8"
            >
                <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    className="max-w-xl w-full bg-gradient-to-br from-[#1a1c2c] to-[#0a0a0a] border border-blue-500/30 rounded-[32px] p-12 text-center shadow-2xl relative overflow-hidden"
                >
                    {/* Animated Background Orbs */}
                    <div className="absolute -top-24 -left-24 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] animate-pulse" />
                    <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px] animate-pulse delay-700" />

                    <div className="relative z-10">
                        <div className="text-6xl mb-6">🧘</div>
                        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-4 tracking-tight">
                            Biyolojik Bütünlük Zamanı
                        </h1>
                        <p className="text-neutral-400 text-lg mb-8 leading-relaxed">
                            Aga, tam <span className="text-blue-400 font-bold">{stats?.activeTime} dakikadır</span> aralıksız kod yazıyorsun.
                            Beynin ve gözlerin bir molayı hak etti. Rust derlenirken bile olsa bir ayağa kalk, su al.
                        </p>

                        <div className="grid grid-cols-2 gap-4 mb-10">
                            <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
                                <div className="text-xs text-neutral-500 uppercase font-bold tracking-widest mb-1">Focus Streak</div>
                                <div className="text-2xl font-mono text-white">{stats?.streak} 🔥</div>
                            </div>
                            <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
                                <div className="text-xs text-neutral-500 uppercase font-bold tracking-widest mb-1">Next Recommendation</div>
                                <div className="text-2xl font-mono text-white">5m Walk 🚶</div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={handleClose}
                                className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/20 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                            >
                                Mola Verdim, Devam Et
                            </button>
                            <button
                                onClick={() => setShow(false)}
                                className="w-full py-3 text-neutral-500 hover:text-neutral-300 text-sm font-medium transition-colors"
                            >
                                Şimdi Değil (5 dk sonra hatırlat)
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
