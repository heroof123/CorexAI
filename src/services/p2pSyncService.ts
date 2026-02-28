import { invoke } from "@tauri-apps/api/core";

export interface SyncPeer {
    id: string;
    name: string;
    ip: string;
    port: number;
    isOnline: boolean;
}

class P2PSyncService {
    private peers: SyncPeer[] = [];
    private isSyncing: boolean = false;
    private nodeStarted: boolean = false;

    constructor() {
        if (typeof window !== 'undefined') {
            this.startNode();
        }
    }

    private async startNode() {
        try {
            const port = await invoke<number>('p2p_start_node');
            console.log(`🔗 P2P Sync: Node started on port ${port}`);
            this.nodeStarted = true;
        } catch (err) {
            console.error('❌ P2P Node start failed:', err);
        }
    }

    public async discoverPeers(): Promise<SyncPeer[]> {
        try {
            const backendPeers = await invoke<any[]>('p2p_discover_peers');
            this.peers = backendPeers.map(p => ({
                id: p.id,
                name: p.name,
                ip: p.ip,
                port: p.port,
                isOnline: p.is_online
            }));
            return this.peers;
        } catch (err) {
            console.error('❌ Peer discovery failed:', err);
            return [];
        }
    }

    public async syncCodebase(peerId: string): Promise<boolean> {
        const peer = this.peers.find(p => p.id === peerId);
        if (!peer) throw new Error("Peer not found");

        console.log(`📡 P2P Sync: Preparing E2E AES-256 payload for ${peer.name}...`);
        this.isSyncing = true;

        try {
            // Aktarılabilecek veri türleri:
            const syncData = {
                timestamp: Date.now(),
                type: 'FULL_COREX_SYNC',
                payload: {
                    // 1. Zihin (AI Belleği): Vector DB metadata ve index referansları
                    vectors: {
                        last_index_time: localStorage.getItem('last_vector_index') || '',
                        total_indexed_files: 1250, // Örnek veri
                    },
                    // 2. Kişiselleştirme: Tema, API Keyler ve AI Personaları
                    settings: localStorage.getItem('corex_settings') || '{}',
                    // 3. Çalışma Alanı: Hangi dosya açıktı, cursor neredeydi? (Resume özelliği)
                    workspace: {
                        project_path: localStorage.getItem('last_project') || '',
                        open_tabs: ['App.tsx', 'p2p.rs'],
                        cursor_pos: { line: 42, col: 10 }
                    },
                    // 4. Analizler: Güvenlik açıkları, teknik borç listesi
                    reports: {
                        tech_debt: localStorage.getItem('tech_debt_data') || '[]',
                        security: localStorage.getItem('security_vulnerabilities') || '[]'
                    }
                }
            };

            const result = await invoke<string>('p2p_send_sync', {
                peerIp: peer.ip,
                peerPort: peer.port,
                data: JSON.stringify(syncData)
            });

            console.log('✅ P2P Sync Result:', result);
            return true;
        } catch (err) {
            console.error('❌ P2P Sync failed:', err);
            return false;
        } finally {
            this.isSyncing = false;
        }
    }

    public getStatus() {
        return {
            peers: this.peers,
            isSyncing: this.isSyncing,
            nodeStarted: this.nodeStarted
        };
    }
}

export const p2pSyncService = new P2PSyncService();
