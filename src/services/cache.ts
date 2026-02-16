// services/cache.ts - Performans için cache sistemi

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface FileMetadata {
  path: string;
  lastModified: number;
  size: number;
  hash: string;
}

class CacheManager {
  private embeddingCache: Map<string, CacheEntry<number[]>> = new Map();
  private aiResponseCache: Map<string, CacheEntry<string>> = new Map();
  private fileMetadataCache: Map<string, FileMetadata> = new Map();
  private genericCache: Map<string, CacheEntry<any>> = new Map();
  
  // Cache TTL (Time To Live) in milliseconds
  private readonly EMBEDDING_TTL = 24 * 60 * 60 * 1000; // 24 hours
  private readonly AI_RESPONSE_TTL = 60 * 60 * 1000; // 1 hour
  private readonly DEFAULT_TTL = 60 * 60 * 1000; // 1 hour
  // private readonly METADATA_TTL = 5 * 60 * 1000; // 5 minutes (şu an kullanılmıyor)
  
  // Max cache sizes
  private readonly MAX_EMBEDDING_CACHE = 1000;
  private readonly MAX_AI_CACHE = 100;
  private readonly MAX_GENERIC_CACHE = 1000;
  
  // Stats
  private hits = 0;
  private misses = 0;

  // ===== EMBEDDING CACHE =====
  
  getEmbedding(key: string): number[] | null {
    const entry = this.embeddingCache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expiresAt) {
      this.embeddingCache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  setEmbedding(key: string, embedding: number[]): void {
    // LRU eviction if cache is full
    if (this.embeddingCache.size >= this.MAX_EMBEDDING_CACHE) {
      const firstKey = this.embeddingCache.keys().next().value;
      if (firstKey) {
        this.embeddingCache.delete(firstKey);
      }
    }
    
    this.embeddingCache.set(key, {
      data: embedding,
      timestamp: Date.now(),
      expiresAt: Date.now() + this.EMBEDDING_TTL
    });
  }

  // ===== AI RESPONSE CACHE =====
  
  getAIResponse(key: string): string | null {
    const entry = this.aiResponseCache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expiresAt) {
      this.aiResponseCache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  setAIResponse(key: string, response: string): void {
    if (this.aiResponseCache.size >= this.MAX_AI_CACHE) {
      const firstKey = this.aiResponseCache.keys().next().value;
      if (firstKey) {
        this.aiResponseCache.delete(firstKey);
      }
    }
    
    this.aiResponseCache.set(key, {
      data: response,
      timestamp: Date.now(),
      expiresAt: Date.now() + this.AI_RESPONSE_TTL
    });
  }

  // ===== FILE METADATA CACHE =====
  
  getFileMetadata(path: string): FileMetadata | null {
    const entry = this.fileMetadataCache.get(path);
    if (!entry) return null;
    return entry;
  }

  setFileMetadata(metadata: FileMetadata): void {
    this.fileMetadataCache.set(metadata.path, metadata);
  }

  hasFileChanged(path: string, currentModified: number): boolean {
    const cached = this.getFileMetadata(path);
    if (!cached) return true;
    return cached.lastModified !== currentModified;
  }

  // ===== GENERIC CACHE (for tests and general use) =====
  
  set<T>(key: string, value: T, ttl?: number): void {
    if (this.genericCache.size >= this.MAX_GENERIC_CACHE) {
      const firstKey = this.genericCache.keys().next().value;
      if (firstKey) {
        this.genericCache.delete(firstKey);
      }
    }
    
    const expiresAt = ttl ? Date.now() + ttl : Date.now() + this.DEFAULT_TTL;
    
    this.genericCache.set(key, {
      data: value,
      timestamp: Date.now(),
      expiresAt
    });
  }
  
  get<T>(key: string): T | null {
    const entry = this.genericCache.get(key);
    if (!entry) {
      this.misses++;
      return null;
    }
    
    if (Date.now() > entry.expiresAt) {
      this.genericCache.delete(key);
      this.misses++;
      return null;
    }
    
    this.hits++;
    return entry.data as T;
  }
  
  has(key: string): boolean {
    const entry = this.genericCache.get(key);
    if (!entry) return false;
    
    if (Date.now() > entry.expiresAt) {
      this.genericCache.delete(key);
      return false;
    }
    
    return true;
  }
  
  delete(key: string): void {
    this.genericCache.delete(key);
  }
  
  clear(): void {
    this.genericCache.clear();
    this.hits = 0;
    this.misses = 0;
  }
  
  // ===== CACHE MANAGEMENT =====
  
  clearEmbeddingCache(): void {
    this.embeddingCache.clear();
    console.log("🗑️ Embedding cache temizlendi");
  }

  clearAICache(): void {
    this.aiResponseCache.clear();
    console.log("🗑️ AI response cache temizlendi");
  }

  clearAll(): void {
    this.embeddingCache.clear();
    this.aiResponseCache.clear();
    this.fileMetadataCache.clear();
    this.genericCache.clear();
    this.hits = 0;
    this.misses = 0;
    console.log("🗑️ Tüm cache temizlendi");
  }

  getCacheStats() {
    return {
      size: this.genericCache.size,
      hits: this.hits,
      misses: this.misses,
      embeddings: {
        size: this.embeddingCache.size,
        max: this.MAX_EMBEDDING_CACHE,
        usage: `${((this.embeddingCache.size / this.MAX_EMBEDDING_CACHE) * 100).toFixed(1)}%`
      },
      aiResponses: {
        size: this.aiResponseCache.size,
        max: this.MAX_AI_CACHE,
        usage: `${((this.aiResponseCache.size / this.MAX_AI_CACHE) * 100).toFixed(1)}%`
      },
      metadata: {
        size: this.fileMetadataCache.size
      }
    };
  }

  // ===== PERSISTENCE (Optional - IndexedDB) =====
  
  async saveToDisk(): Promise<void> {
    try {
      const data = {
        embeddings: Array.from(this.embeddingCache.entries()),
        metadata: Array.from(this.fileMetadataCache.entries()),
        timestamp: Date.now()
      };
      
      localStorage.setItem('corex_cache', JSON.stringify(data));
      console.log("💾 Cache disk'e kaydedildi");
    } catch (error) {
      console.error("❌ Cache kaydetme hatası:", error);
    }
  }

  async loadFromDisk(): Promise<void> {
    try {
      const stored = localStorage.getItem('corex_cache');
      if (!stored) return;
      
      const data = JSON.parse(stored);
      
      // Check if cache is not too old (max 7 days)
      const MAX_AGE = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - data.timestamp > MAX_AGE) {
        console.log("⏰ Cache çok eski, temizleniyor");
        localStorage.removeItem('corex_cache');
        return;
      }
      
      // Restore embeddings
      for (const [key, entry] of data.embeddings) {
        if (Date.now() < entry.expiresAt) {
          this.embeddingCache.set(key, entry);
        }
      }
      
      // Restore metadata
      for (const [key, metadata] of data.metadata) {
        this.fileMetadataCache.set(key, metadata);
      }
      
      console.log("📂 Cache disk'ten yüklendi:", this.getCacheStats());
    } catch (error) {
      console.error("❌ Cache yükleme hatası:", error);
    }
  }
}

// Singleton instance
export const cacheManager = new CacheManager();

// Simple hash function for cache keys
export function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(36);
}

// Generate cache key for file content
export function generateFileCacheKey(path: string, content: string): string {
  return `${path}:${hashString(content)}`;
}

// Generate cache key for AI prompt
export function generateAICacheKey(prompt: string, context: string): string {
  return hashString(prompt + context);
}
