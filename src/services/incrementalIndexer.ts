// services/incrementalIndexer.ts - Sadece değişen dosyaları indexle

import { invoke } from "@tauri-apps/api/core";
import { createEmbedding, shouldIndexFile } from "./embedding";
import { cacheManager, generateFileCacheKey } from "./cache";
import { FileIndex } from "../types/index";

interface IndexingResult {
  indexed: FileIndex[];
  skipped: number;
  updated: number;
  added: number;
  removed: number;
  duration: number;
}

export class IncrementalIndexer {
  private previousIndex: Map<string, FileIndex> = new Map();
  
  /**
   * Incremental indexing - sadece değişen dosyaları indexle
   */
  async indexProject(
    projectPath: string,
    existingIndex: FileIndex[] = [],
    onProgress?: (current: number, total: number, file: string) => void
  ): Promise<IndexingResult> {
    const startTime = Date.now();
    console.log("🚀 Incremental indexing başlatılıyor...");
    
    // Mevcut index'i Map'e çevir (hızlı lookup için)
    this.previousIndex.clear();
    existingIndex.forEach(file => {
      this.previousIndex.set(file.path, file);
    });
    
    // Tüm dosyaları tara
    const allFiles = await invoke<string[]>("scan_project", { path: projectPath });
    const filteredFiles = allFiles.filter(shouldIndexFile);
    
    console.log(`📁 ${filteredFiles.length} dosya bulundu (${allFiles.length - filteredFiles.length} filtrelendi)`);
    
    const newIndex: FileIndex[] = [];
    const currentFilePaths = new Set(filteredFiles);
    
    let skipped = 0;
    let updated = 0;
    let added = 0;
    
    // Her dosyayı kontrol et
    for (let i = 0; i < filteredFiles.length; i++) {
      const filePath = filteredFiles[i];
      
      if (onProgress) {
        onProgress(i + 1, filteredFiles.length, filePath);
      }
      
      try {
        // Dosya içeriğini oku
        const content = await invoke<string>("read_file", { path: filePath });
        
        // Dosya metadata'sını al
        const metadata = await this.getFileMetadata(filePath);
        
        // Önceki index'te var mı?
        const previousFile = this.previousIndex.get(filePath);
        
        // Değişiklik kontrolü
        if (previousFile && !cacheManager.hasFileChanged(filePath, metadata.lastModified)) {
          // Dosya değişmemiş, cache'den al
          console.log(`⏭️ Atlandı (değişmemiş): ${filePath}`);
          newIndex.push(previousFile);
          skipped++;
          continue;
        }
        
        // Cache'de embedding var mı?
        const cacheKey = generateFileCacheKey(filePath, content);
        let embedding = cacheManager.getEmbedding(cacheKey);
        
        if (!embedding) {
          // Yeni embedding oluştur
          console.log(`🔄 Indexleniyor: ${filePath}`);
          embedding = await createEmbedding(content);
          cacheManager.setEmbedding(cacheKey, embedding);
        } else {
          console.log(`💾 Cache'den alındı: ${filePath}`);
        }
        
        // Metadata'yı cache'le
        cacheManager.setFileMetadata({
          path: filePath,
          lastModified: metadata.lastModified,
          size: metadata.size,
          hash: cacheKey
        });
        
        newIndex.push({
          path: filePath,
          content: content.substring(0, 10000), // İlk 10KB
          embedding,
          lastModified: metadata.lastModified
        });
        
        if (previousFile) {
          updated++;
        } else {
          added++;
        }
        
      } catch (error) {
        console.error(`❌ Dosya indexleme hatası (${filePath}):`, error);
      }
    }
    
    // Silinen dosyaları tespit et
    const removed = existingIndex.filter(file => !currentFilePaths.has(file.path)).length;
    
    const duration = Date.now() - startTime;
    
    console.log(`✅ Indexing tamamlandı:
      - Toplam: ${newIndex.length} dosya
      - Eklenen: ${added}
      - Güncellenen: ${updated}
      - Atlanan: ${skipped}
      - Silinen: ${removed}
      - Süre: ${(duration / 1000).toFixed(2)}s
    `);
    
    return {
      indexed: newIndex,
      skipped,
      updated,
      added,
      removed,
      duration
    };
  }
  
  /**
   * Tek bir dosyayı indexle (hızlı güncelleme için)
   */
  async indexSingleFile(filePath: string): Promise<FileIndex | null> {
    try {
      if (!shouldIndexFile(filePath)) {
        console.log(`⏭️ Dosya filtrelendi: ${filePath}`);
        return null;
      }
      
      const content = await invoke<string>("read_file", { path: filePath });
      const metadata = await this.getFileMetadata(filePath);
      
      // Cache kontrolü
      const cacheKey = generateFileCacheKey(filePath, content);
      let embedding = cacheManager.getEmbedding(cacheKey);
      
      if (!embedding) {
        console.log(`🔄 Tek dosya indexleniyor: ${filePath}`);
        embedding = await createEmbedding(content);
        cacheManager.setEmbedding(cacheKey, embedding);
      }
      
      cacheManager.setFileMetadata({
        path: filePath,
        lastModified: metadata.lastModified,
        size: metadata.size,
        hash: cacheKey
      });
      
      return {
        path: filePath,
        content: content.substring(0, 10000),
        embedding,
        lastModified: metadata.lastModified
      };
      
    } catch (error) {
      console.error(`❌ Tek dosya indexleme hatası (${filePath}):`, error);
      return null;
    }
  }
  
  /**
   * Dosya metadata'sını al
   */
  private async getFileMetadata(filePath: string): Promise<{ lastModified: number; size: number }> {
    try {
      const metadata = await invoke<any>("get_file_metadata", { path: filePath });
      return {
        lastModified: metadata.modified || Date.now(),
        size: metadata.size || 0
      };
    } catch (error) {
      // Fallback
      return {
        lastModified: Date.now(),
        size: 0
      };
    }
  }
  
  /**
   * Batch indexing - birden fazla dosyayı paralel indexle
   */
  async indexBatch(filePaths: string[], batchSize: number = 5): Promise<FileIndex[]> {
    const results: FileIndex[] = [];
    
    for (let i = 0; i < filePaths.length; i += batchSize) {
      const batch = filePaths.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(path => this.indexSingleFile(path))
      );
      
      results.push(...batchResults.filter(r => r !== null) as FileIndex[]);
    }
    
    return results;
  }
}

// Singleton instance
export const incrementalIndexer = new IncrementalIndexer();
