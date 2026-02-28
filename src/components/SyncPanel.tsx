import React, { useState, useEffect } from 'react';
import { p2pSyncService, SyncPeer } from '../services/p2pSyncService';
import { motion } from 'framer-motion';

export const SyncPanel: React.FC = () => {
    const [peers, setPeers] = useState<SyncPeer[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [syncingId, setSyncingId] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);

    const refreshPeers = async () => {
        setIsSearching(true);
        const found = await p2pSyncService.discoverPeers();
        setPeers(found);
        setIsSearching(false);
    };

    useEffect(() => {
        refreshPeers();
        const interval = setInterval(refreshPeers, 10000); // Auto-refresh every 10s
        return () => clearInterval(interval);
    }, []);

    const handleSync = async (peerId: string) => {
        setSyncingId(peerId);
        setProgress(0);

        // Simulate progress for "upload baremi" effect
        const progressInterval = setInterval(() => {
            setProgress(prev => (prev < 90 ? prev + Math.random() * 15 : prev));
        }, 300);

        const success = await p2pSyncService.syncCodebase(peerId);

        clearInterval(progressInterval);
        setProgress(100);

        setTimeout(() => {
            if (success) {
                alert("✅ Senkronizasyon başarıyla tamamlandı (AES-256 E2E)");
            } else {
                alert("❌ Senkronizasyon başarısız oldu.");
            }
            setSyncingId(null);
            setProgress(0);
        }, 500);
    };

    return (
        <div className="flex flex-col h-full bg-[#0a0a0a] text-white p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-8 cursor-default select-none">
                <div>
                    <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                        Otonom P2P Keşif
                    </h1>
                    <p className="text-neutral-500 text-[10px] mt-1 uppercase tracking-widest font-bold">LAN Discovery Active • UDP Port: 8091</p>
                </div>
                <button
                    onClick={refreshPeers}
                    disabled={isSearching}
                    className={`p-2 rounded-full bg-white/5 hover:bg-white/10 transition-all ${isSearching ? 'animate-spin opacity-50' : ''}`}
                >
                    🔄
                </button>
            </div>

            <div className="grid gap-4">
                {peers.map(peer => (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        key={peer.id}
                        className="p-5 rounded-[2rem] bg-indigo-500/5 border border-white/5 flex flex-col gap-4 group hover:border-blue-500/40 transition-all hover:bg-indigo-500/10"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-xl shadow-lg shadow-blue-500/20">
                                        💻
                                    </div>
                                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#0a0a0a] ${peer.isOnline ? 'bg-green-500' : 'bg-neutral-600'}`} />
                                </div>
                                <div>
                                    <h3 className="font-black text-lg group-hover:text-blue-400 transition-colors uppercase tracking-tight">{peer.name}</h3>
                                    <p className="text-[10px] text-neutral-500 font-mono tracking-tighter opacity-80">{peer.ip}:{peer.port}</p>
                                </div>
                            </div>

                            {!syncingId && (
                                <button
                                    onClick={() => handleSync(peer.id)}
                                    className="px-5 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-xs font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
                                >
                                    Eşitle
                                </button>
                            )}
                        </div>

                        {syncingId === peer.id && (
                            <div className="space-y-2 mt-2">
                                <div className="flex justify-between text-[9px] font-black uppercase tracking-tighter text-blue-400">
                                    <span>Veri Paketleniyor & Şifreleniyor...</span>
                                    <span>%{Math.floor(progress)}</span>
                                </div>
                                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progress}%` }}
                                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                                    />
                                </div>
                            </div>
                        )}
                    </motion.div>
                ))}

                {peers.length === 0 && !isSearching && (
                    <div className="flex flex-col items-center justify-center py-24 bg-white/[0.02] rounded-[3rem] border border-dashed border-white/5 relative overflow-hidden">
                        <div className="absolute inset-0 bg-blue-500/5 blur-3xl rounded-full" />
                        <div className="text-6xl mb-6 relative animate-pulse">📡</div>
                        <h4 className="text-white font-black text-xl mb-2 relative">Ağ taranıyor...</h4>
                        <p className="text-neutral-500 text-xs text-center px-10 relative">
                            Yerel ağdaki diğer bilgisayarların Corex'i açmasını bekliyoruz.
                            UDP sinyalleri otomatik olarak yakalanacaktır.
                        </p>
                    </div>
                )}
            </div>

            <div className="mt-auto pt-10">
                <div className="p-6 rounded-[2.5rem] bg-gradient-to-br from-indigo-500/10 to-transparent border border-white/5 backdrop-blur-3xl">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="text-blue-400 text-xl">🛡️</span>
                        <h4 className="text-sm font-black uppercase tracking-widest text-white">Görünmezlik Modu Aktif</h4>
                    </div>
                    <p className="text-[11px] text-neutral-400 leading-relaxed font-medium">
                        Verileriniz yerel hattınızdan çıkmadan önce <span className="text-blue-400">AES-256 GCM</span> ile zırhlanır.
                        Ağdaki diğer kişiler verilerinizi görse bile, anahtarınız olmadan sadece anlamsız gürültü görürler.
                        Bulut yok, Takip yok, Sadece sen ve kodların.
                    </p>
                </div>
            </div>
        </div>
    );
};
