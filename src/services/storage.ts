// services/storage.ts
// Tauri Store + localStorage fallback
// Tauri olmadan (npm run dev) da çalışır

const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

// ── Tauri Store (sadece Tauri ortamında) ────────────────────────────────────
let _uiStore: any = null;
let _secureStore: any = null;
let _settingsStore: any = null;

async function getTauriStores() {
    if (!isTauri) return null;
    try {
        const { Store } = await import('@tauri-apps/plugin-store');
        if (!_uiStore) _uiStore = await Store.load('.ui-state.dat');
        if (!_secureStore) _secureStore = await Store.load('.secure.dat');
        if (!_settingsStore) _settingsStore = await Store.load('.settings.dat');
        return { uiStore: _uiStore, secureStore: _secureStore, settingsStore: _settingsStore };
    } catch (e) {
        console.warn('⚠️ Tauri Store unavailable, falling back to localStorage:', e);
        return null;
    }
}

// ── localStorage helpers ────────────────────────────────────────────────────
function lsGet<T>(key: string): T | null {
    try {
        const raw = localStorage.getItem(`corex:${key}`);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

function lsSet<T>(key: string, value: T): void {
    try {
        localStorage.setItem(`corex:${key}`, JSON.stringify(value));
    } catch (e) {
        console.warn('localStorage set failed:', e);
    }
}

function lsDelete(key: string): void {
    try {
        localStorage.removeItem(`corex:${key}`);
    } catch { }
}

// ── Public API ──────────────────────────────────────────────────────────────
export const storage = {
    // UI state
    async getUI<T>(key: string): Promise<T | null> {
        const stores = await getTauriStores();
        if (stores) {
            const val = await stores.uiStore.get(key) as T | undefined;
            return val ?? null;
        }
        return lsGet<T>(key);
    },
    async setUI<T>(key: string, value: T): Promise<void> {
        const stores = await getTauriStores();
        if (stores) {
            await stores.uiStore.set(key, value);
            await stores.uiStore.save();
        } else {
            lsSet(key, value);
        }
    },
    async removeUI(key: string): Promise<void> {
        const stores = await getTauriStores();
        if (stores) {
            await stores.uiStore.delete(key);
            await stores.uiStore.save();
        } else {
            lsDelete(key);
        }
    },

    // Settings (AI provider config, model config vs.)
    async getSettings<T>(key: string): Promise<T | null> {
        const stores = await getTauriStores();
        if (stores) {
            const val = await stores.settingsStore.get(key) as T | undefined;
            return val ?? null;
        }
        // Fallback: önce eski localStorage key'ini dene (migration)
        const legacy = localStorage.getItem(key);
        if (legacy) {
            try { return JSON.parse(legacy); } catch { return legacy as unknown as T; }
        }
        return lsGet<T>(key);
    },
    async setSettings<T>(key: string, value: T): Promise<void> {
        const stores = await getTauriStores();
        if (stores) {
            await stores.settingsStore.set(key, value);
            await stores.settingsStore.save();
        } else {
            lsSet(key, value);
        }
    },

    // Secure (token, api key)
    async getSecure<T>(key: string): Promise<T | null> {
        const stores = await getTauriStores();
        if (stores) {
            const val = await stores.secureStore.get(key) as T | undefined;
            return val ?? null;
        }
        return lsGet<T>(key);
    },
    async setSecure<T>(key: string, value: T): Promise<void> {
        const stores = await getTauriStores();
        if (stores) {
            await stores.secureStore.set(key, value);
            await stores.secureStore.save();
        } else {
            lsSet(key, value);
        }
    },
};


// Migrasyon: Mevcut localStorage verisini taşı (sadece Tauri'de)
export async function migrateFromLocalStorage(): Promise<void> {
    if (!isTauri) return; // browser'da gerek yok
    const keys = [
        'corex-ai-providers', 'gguf-models', 'gguf-active-model',
        'gguf-download-folder', 'corex-dismissed-insights',
        'gguf-performance-logs', 'gguf-conversation-history',
        'gpu-info-cache', 'ai-output-mode', 'user_profiles'
    ];
    for (const key of keys) {
        const val = localStorage.getItem(key);
        if (val) {
            try {
                const parsed = JSON.parse(val);
                if (key === 'user_profiles') {
                    await storage.setSecure(key, parsed);
                } else {
                    await storage.setSettings(key, parsed);
                }
                localStorage.removeItem(key);
            } catch {
                await storage.setUI(key, val);
                localStorage.removeItem(key);
            }
        }
    }
    console.log('✅ localStorage → Tauri Store migration tamamlandı');
}
