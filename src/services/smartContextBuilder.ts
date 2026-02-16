// services/smartContextBuilder.ts - Akıllı context oluşturma
// 🧠 TASK 28: Infinite Context Illusion - Semantic Brain entegrasyonu

import { FileIndex } from "../types/index";
import { dependencyAnalyzer } from "./dependencyAnalyzer";
import { cosineSimilarity } from "./embedding";
import { 
  parseFile, 
  buildDependencyGraph, 
  findSymbols, 
  getRelatedSymbols,
  type FileAnalysis,
  type DependencyGraph,
  type Symbol as SemanticSymbol
} from "./semanticBrain";

interface ContextFile {
  path: string;
  content: string;
  score: number;
  reason: string;
  symbols?: SemanticSymbol[]; // 🆕 Semantic symbols
  relevantSymbols?: string[]; // 🆕 Relevant symbol names
}

interface ContextBuildOptions {
  maxFiles?: number;
  maxTokens?: number;
  includeRecent?: boolean;
  includeDependencies?: boolean;
  prioritizeOpen?: boolean;
}

export class SmartContextBuilder {
  private recentFiles: string[] = [];
  private openFiles: Set<string> = new Set();
  private editHistory: Map<string, number> = new Map(); // file -> last edit timestamp
  
  // 🆕 TASK 28: Semantic Brain cache
  private semanticCache: Map<string, FileAnalysis> = new Map(); // filePath -> analysis
  private dependencyGraph: DependencyGraph | null = null;
  private lastGraphUpdate: number = 0;
  private graphUpdateInterval: number = 60000; // 1 dakika

  /**
   * 🆕 TASK 28: Semantic Brain ile dosya analizi
   */
  private async analyzeFile(filePath: string, content: string): Promise<FileAnalysis | null> {
    // Cache kontrolü
    if (this.semanticCache.has(filePath)) {
      return this.semanticCache.get(filePath)!;
    }
    
    try {
      // Sadece TypeScript/JavaScript dosyalarını analiz et
      if (!/\.(ts|tsx|js|jsx)$/.test(filePath)) {
        return null;
      }
      
      console.log('🔍 Analyzing file:', filePath);
      const analysis = parseFile(filePath, content);
      
      // Cache'e ekle
      this.semanticCache.set(filePath, analysis);
      
      return analysis;
    } catch (error) {
      console.warn('⚠️ File analysis failed:', filePath, error);
      return null;
    }
  }
  
  /**
   * 🆕 TASK 28: Dependency graph güncelle
   */
  private async updateDependencyGraph(allFiles: FileIndex[]): Promise<void> {
    const now = Date.now();
    
    // Çok sık güncelleme yapma
    if (this.dependencyGraph && (now - this.lastGraphUpdate) < this.graphUpdateInterval) {
      return;
    }
    
    console.log('🔗 Updating dependency graph...');
    
    // Tüm dosyaları analiz et
    const analyses: FileAnalysis[] = [];
    
    for (const file of allFiles) {
      const analysis = await this.analyzeFile(file.path, file.content);
      if (analysis) {
        analyses.push(analysis);
      }
    }
    
    // Graph oluştur
    if (analyses.length > 0) {
      this.dependencyGraph = buildDependencyGraph(analyses);
      this.lastGraphUpdate = now;
      console.log('✅ Dependency graph updated:', analyses.length, 'files');
    }
  }
  
  /**
   * 🆕 TASK 28: Symbol-based context search
   */
  private findSymbolContext(query: string): ContextFile[] {
    if (!this.dependencyGraph) {
      return [];
    }
    
    const contextFiles: ContextFile[] = [];
    
    // Query'de symbol ismi var mı?
    const symbols = findSymbols(query, this.dependencyGraph, 5);
    
    if (symbols.length === 0) {
      return [];
    }
    
    console.log('🎯 Found symbols:', symbols.map(s => s.name).join(', '));
    
    // Her symbol için related symbols bul
    symbols.forEach(symbol => {
      const related = getRelatedSymbols(symbol.name, this.dependencyGraph!);
      
      // Symbol'ün bulunduğu dosyayı ekle
      const analysis = this.semanticCache.get(symbol.filePath);
      if (analysis) {
        const fileContent = this.buildSymbolContext(analysis, symbol, related);
        
        contextFiles.push({
          path: symbol.filePath,
          content: fileContent,
          score: 0.95,
          reason: `Symbol: ${symbol.name}`,
          symbols: [symbol],
          relevantSymbols: related.map(s => s.name)
        });
      }
      
      // Related symbols'ların dosyalarını ekle
      const relatedFiles = new Set(related.map(s => s.filePath));
      relatedFiles.forEach(filePath => {
        if (filePath !== symbol.filePath) {
          const relatedAnalysis = this.semanticCache.get(filePath);
          if (relatedAnalysis) {
            const relatedSymbols = relatedAnalysis.symbols.filter(s => 
              related.some(r => r.name === s.name)
            );
            
            const fileContent = this.buildSymbolContext(relatedAnalysis, null, relatedSymbols);
            
            contextFiles.push({
              path: filePath,
              content: fileContent,
              score: 0.85,
              reason: `Related to ${symbol.name}`,
              symbols: relatedSymbols,
              relevantSymbols: relatedSymbols.map(s => s.name)
            });
          }
        }
      });
    });
    
    return contextFiles;
  }
  
  /**
   * 🆕 TASK 28: Symbol context builder
   */
  private buildSymbolContext(
    analysis: FileAnalysis,
    targetSymbol: SemanticSymbol | null,
    relatedSymbols: SemanticSymbol[]
  ): string {
    let context = `// File: ${analysis.filePath}\n`;
    context += `// Symbols: ${analysis.symbols.length}, Complexity: ${analysis.complexity}\n\n`;
    
    // Imports
    if (analysis.imports.length > 0) {
      context += '// Imports:\n';
      analysis.imports.forEach(imp => {
        context += `// - ${imp.moduleName}: ${imp.importedSymbols.join(', ')}\n`;
      });
      context += '\n';
    }
    
    // Target symbol (eğer varsa)
    if (targetSymbol) {
      context += `// 🎯 Target Symbol: ${targetSymbol.name}\n`;
      if (targetSymbol.documentation) {
        context += `// ${targetSymbol.documentation}\n`;
      }
      context += `${targetSymbol.signature}\n\n`;
    }
    
    // Related symbols
    if (relatedSymbols.length > 0) {
      context += `// 🔗 Related Symbols:\n`;
      relatedSymbols.forEach(symbol => {
        context += `// - ${symbol.name} (${symbol.kind})\n`;
        if (symbol.signature) {
          context += `${symbol.signature}\n\n`;
        }
      });
    }
    
    // Dependencies
    if (analysis.dependencies.length > 0) {
      context += `// 📦 Dependencies: ${analysis.dependencies.join(', ')}\n`;
    }
    
    // Dependents
    if (analysis.dependents.length > 0) {
      context += `// 👥 Used by: ${analysis.dependents.join(', ')}\n`;
    }
    
    return context;
  }
  
  /**
   * Akıllı context oluştur (🆕 TASK 28: Semantic Brain entegrasyonu)
   */
  async buildContext(
    query: string,
    queryEmbedding: number[],
    allFiles: FileIndex[],
    currentFile?: string,
    options: ContextBuildOptions = {}
  ): Promise<ContextFile[]> {
    const {
      maxFiles = 10,
      maxTokens = 8000,
      includeRecent = true,
      includeDependencies = true,
      prioritizeOpen = true
    } = options;

    const contextFiles: ContextFile[] = [];
    const addedPaths = new Set<string>();
    
    // 🆕 TASK 28: Dependency graph güncelle
    await this.updateDependencyGraph(allFiles);
    
    // 🆕 TASK 28: Symbol-based context (en yüksek öncelik)
    const symbolContext = this.findSymbolContext(query);
    symbolContext.forEach(file => {
      if (!addedPaths.has(file.path)) {
        contextFiles.push(file);
        addedPaths.add(file.path);
      }
    });

    // 1. Mevcut dosya (yüksek öncelik)
    if (currentFile) {
      const file = allFiles.find(f => f.path === currentFile);
      if (file && !addedPaths.has(file.path)) {
        // 🆕 Semantic analysis ekle
        const analysis = await this.analyzeFile(file.path, file.content);
        
        contextFiles.push({
          path: file.path,
          content: file.content,
          score: 1.0,
          reason: "Aktif dosya",
          symbols: analysis?.symbols,
          relevantSymbols: analysis?.symbols.map(s => s.name)
        });
        addedPaths.add(file.path);
      }
    }

    // 2. Semantic search (embedding similarity)
    const semanticMatches = this.findSemanticMatches(queryEmbedding, allFiles, 5)
      .filter(f => !addedPaths.has(f.path));

    semanticMatches.forEach(file => {
      contextFiles.push({
        path: file.path,
        content: file.content,
        score: file.score,
        reason: `Semantic match (${(file.score * 100).toFixed(0)}%)`
      });
      addedPaths.add(file.path);
    });

    // 3. Bağımlılık analizi (🆕 TASK 28: Semantic Brain kullan)
    if (includeDependencies && currentFile && this.dependencyGraph) {
      // Semantic Brain'den dependency bilgisi al
      const currentAnalysis = this.semanticCache.get(currentFile);
      
      if (currentAnalysis) {
        // Direct dependencies
        currentAnalysis.dependencies.forEach(depPath => {
          if (!addedPaths.has(depPath)) {
            const file = allFiles.find(f => f.path === depPath || f.path.endsWith(depPath));
            if (file) {
              const analysis = this.semanticCache.get(file.path);
              
              contextFiles.push({
                path: file.path,
                content: file.content,
                score: 0.85,
                reason: "Bağımlılık (Semantic)",
                symbols: analysis?.symbols,
                relevantSymbols: analysis?.symbols.map(s => s.name)
              });
              addedPaths.add(file.path);
            }
          }
        });
        
        // Dependents (bu dosyayı kullanan dosyalar)
        currentAnalysis.dependents.slice(0, 2).forEach(depPath => {
          if (!addedPaths.has(depPath)) {
            const file = allFiles.find(f => f.path === depPath);
            if (file) {
              const analysis = this.semanticCache.get(file.path);
              
              contextFiles.push({
                path: file.path,
                content: file.content,
                score: 0.75,
                reason: "Dependent (Semantic)",
                symbols: analysis?.symbols,
                relevantSymbols: analysis?.symbols.map(s => s.name)
              });
              addedPaths.add(file.path);
            }
          }
        });
      } else {
        // Fallback: Eski dependency analyzer
        const dependencies = dependencyAnalyzer.suggestContext(currentFile, 3)
          .filter(path => !addedPaths.has(path));

        dependencies.forEach(path => {
          const file = allFiles.find(f => f.path === path);
          if (file) {
            contextFiles.push({
              path: file.path,
              content: file.content,
              score: 0.8,
              reason: "Bağımlılık"
            });
            addedPaths.add(file.path);
          }
        });
      }
    }

    // 4. Son düzenlenen dosyalar
    if (includeRecent) {
      const recentEdited = this.getRecentlyEdited(3)
        .filter(path => !addedPaths.has(path));

      recentEdited.forEach(path => {
        const file = allFiles.find(f => f.path === path);
        if (file) {
          contextFiles.push({
            path: file.path,
            content: file.content,
            score: 0.7,
            reason: "Son düzenlenen"
          });
          addedPaths.add(file.path);
        }
      });
    }

    // 5. Açık dosyalar
    if (prioritizeOpen) {
      const openFilesArray = Array.from(this.openFiles)
        .filter(path => !addedPaths.has(path))
        .slice(0, 2);

      openFilesArray.forEach(path => {
        const file = allFiles.find(f => f.path === path);
        if (file) {
          contextFiles.push({
            path: file.path,
            content: file.content,
            score: 0.75,
            reason: "Açık dosya"
          });
          addedPaths.add(file.path);
        }
      });
    }

    // 6. Keyword matching (query'de geçen dosya isimleri)
    const keywordMatches = this.findKeywordMatches(query, allFiles)
      .filter(f => !addedPaths.has(f.path))
      .slice(0, 2);

    keywordMatches.forEach(file => {
      contextFiles.push({
        path: file.path,
        content: file.content,
        score: 0.85,
        reason: "Keyword match"
      });
      addedPaths.add(file.path);
    });

    // Score'a göre sırala ve limit uygula
    const sorted = contextFiles
      .sort((a, b) => b.score - a.score)
      .slice(0, maxFiles);

    // Token limiti uygula
    return this.applyTokenLimit(sorted, maxTokens);
  }

  /**
   * Semantic similarity ile dosya bul
   */
  private findSemanticMatches(
    queryEmbedding: number[],
    files: FileIndex[],
    topK: number
  ): Array<{ path: string; content: string; score: number }> {
    const scores = files.map(file => ({
      path: file.path,
      content: file.content,
      score: cosineSimilarity(queryEmbedding, file.embedding)
    }));

    return scores
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .filter(f => f.score > 0.15);
  }

  /**
   * Query'de geçen keyword'lere göre dosya bul
   */
  private findKeywordMatches(
    query: string,
    files: FileIndex[]
  ): Array<{ path: string; content: string }> {
    const keywords = query.toLowerCase().split(/\s+/);
    const matches: Array<{ path: string; content: string; matchCount: number }> = [];

    files.forEach(file => {
      const fileName = file.path.toLowerCase();
      const fileContent = file.content.toLowerCase();
      
      let matchCount = 0;
      keywords.forEach(keyword => {
        if (fileName.includes(keyword)) matchCount += 3; // Dosya adı daha önemli
        if (fileContent.includes(keyword)) matchCount += 1;
      });

      if (matchCount > 0) {
        matches.push({
          path: file.path,
          content: file.content,
          matchCount
        });
      }
    });

    return matches
      .sort((a, b) => b.matchCount - a.matchCount)
      .map(({ path, content }) => ({ path, content }));
  }

  /**
   * Token limiti uygula (🆕 TASK 28: Smart chunking)
   */
  private applyTokenLimit(files: ContextFile[], maxTokens: number): ContextFile[] {
    let totalTokens = 0;
    const result: ContextFile[] = [];

    for (const file of files) {
      // Rough token estimation: 1 token ≈ 4 characters
      const fileTokens = Math.ceil(file.content.length / 4);
      
      if (totalTokens + fileTokens > maxTokens) {
        // 🆕 TASK 28: Smart chunking - sadece relevant symbols'ları al
        if (file.relevantSymbols && file.relevantSymbols.length > 0) {
          const chunkedContent = this.smartChunk(file.content, file.relevantSymbols, maxTokens - totalTokens);
          
          if (chunkedContent.length > 500) {
            result.push({
              ...file,
              content: chunkedContent,
              reason: file.reason + ' (chunked)'
            });
            totalTokens += Math.ceil(chunkedContent.length / 4);
          }
        } else {
          // Fallback: Basit kırpma
          const remainingTokens = maxTokens - totalTokens;
          const remainingChars = remainingTokens * 4;
          
          if (remainingChars > 500) {
            result.push({
              ...file,
              content: file.content.substring(0, remainingChars) + "\n\n[... truncated]"
            });
          }
        }
        break;
      }

      result.push(file);
      totalTokens += fileTokens;
    }

    return result;
  }
  
  /**
   * 🆕 TASK 28: Smart chunking - sadece relevant kısımları al
   */
  private smartChunk(content: string, relevantSymbols: string[], maxTokens: number): string {
    const maxChars = maxTokens * 4;
    let result = '';
    let currentLength = 0;
    
    // Her relevant symbol için kod bloğunu bul
    relevantSymbols.forEach(symbolName => {
      // Symbol'ü içeren satırları bul
      const lines = content.split('\n');
      let symbolStartLine = -1;
      let symbolEndLine = -1;
      let braceCount = 0;
      let inSymbol = false;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Symbol başlangıcını bul
        if (!inSymbol && (
          line.includes(`function ${symbolName}`) ||
          line.includes(`class ${symbolName}`) ||
          line.includes(`interface ${symbolName}`) ||
          line.includes(`const ${symbolName}`) ||
          line.includes(`export ${symbolName}`)
        )) {
          symbolStartLine = Math.max(0, i - 2); // 2 satır önceden başla (JSDoc için)
          inSymbol = true;
        }
        
        // Brace counting
        if (inSymbol) {
          braceCount += (line.match(/{/g) || []).length;
          braceCount -= (line.match(/}/g) || []).length;
          
          // Symbol bitişini bul
          if (braceCount === 0 && line.includes('}')) {
            symbolEndLine = Math.min(lines.length - 1, i + 1);
            break;
          }
        }
      }
      
      // Symbol bloğunu ekle
      if (symbolStartLine !== -1 && symbolEndLine !== -1) {
        const symbolBlock = lines.slice(symbolStartLine, symbolEndLine + 1).join('\n');
        
        if (currentLength + symbolBlock.length < maxChars) {
          result += symbolBlock + '\n\n';
          currentLength += symbolBlock.length + 2;
        }
      }
    });
    
    if (result.length === 0) {
      // Fallback: İlk N karakteri al
      result = content.substring(0, maxChars);
    }
    
    return result + '\n\n[... smart chunked]';
  }

  /**
   * Son düzenlenen dosyaları getir
   */
  private getRecentlyEdited(count: number): string[] {
    return Array.from(this.editHistory.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, count)
      .map(([path]) => path);
  }

  // ===== STATE MANAGEMENT =====

  trackFileEdit(filePath: string): void {
    this.editHistory.set(filePath, Date.now());
    this.addToRecent(filePath);
  }

  trackFileOpen(filePath: string): void {
    this.openFiles.add(filePath);
    this.addToRecent(filePath);
  }

  trackFileClose(filePath: string): void {
    this.openFiles.delete(filePath);
  }

  private addToRecent(filePath: string): void {
    // Remove if exists
    this.recentFiles = this.recentFiles.filter(p => p !== filePath);
    // Add to front
    this.recentFiles.unshift(filePath);
    // Keep only last 20
    if (this.recentFiles.length > 20) {
      this.recentFiles = this.recentFiles.slice(0, 20);
    }
  }

  getRecentFiles(): string[] {
    return [...this.recentFiles];
  }

  getOpenFiles(): string[] {
    return Array.from(this.openFiles);
  }

  clearHistory(): void {
    this.recentFiles = [];
    this.openFiles.clear();
    this.editHistory.clear();
  }
  
  /**
   * 🆕 TASK 28: Clear semantic cache
   */
  clearSemanticCache(): void {
    this.semanticCache.clear();
    this.dependencyGraph = null;
    this.lastGraphUpdate = 0;
    console.log('🗑️ Semantic cache cleared');
  }
  
  /**
   * 🆕 TASK 28: Get semantic stats
   */
  getSemanticStats(): {
    cachedFiles: number;
    totalSymbols: number;
    graphNodes: number;
    graphEdges: number;
  } {
    const totalSymbols = Array.from(this.semanticCache.values())
      .reduce((sum, analysis) => sum + analysis.symbols.length, 0);
    
    const graphEdges = this.dependencyGraph 
      ? Array.from(this.dependencyGraph.edges.values())
          .reduce((sum, set) => sum + set.size, 0)
      : 0;
    
    return {
      cachedFiles: this.semanticCache.size,
      totalSymbols,
      graphNodes: this.dependencyGraph?.nodes.size || 0,
      graphEdges
    };
  }

  /**
   * Context kalitesini değerlendir (🆕 TASK 28: Semantic metrics)
   */
  evaluateContextQuality(contextFiles: ContextFile[]): {
    score: number;
    coverage: string;
    suggestions: string[];
    semanticMetrics?: {
      totalSymbols: number;
      relevantSymbols: number;
      dependencyDepth: number;
    };
  } {
    const suggestions: string[] = [];
    let score = 0;

    // Dosya sayısı
    if (contextFiles.length === 0) {
      suggestions.push("Context boş - daha fazla dosya ekle");
      return { score: 0, coverage: "none", suggestions };
    }

    score += Math.min(contextFiles.length * 10, 50); // Max 50 puan

    // Score dağılımı
    const avgScore = contextFiles.reduce((sum, f) => sum + f.score, 0) / contextFiles.length;
    score += avgScore * 30; // Max 30 puan

    // Çeşitlilik
    const reasons = new Set(contextFiles.map(f => f.reason));
    score += reasons.size * 5; // Max 20 puan (4 farklı reason)
    
    // 🆕 TASK 28: Semantic metrics
    const totalSymbols = contextFiles.reduce((sum, f) => sum + (f.symbols?.length || 0), 0);
    const relevantSymbols = contextFiles.reduce((sum, f) => sum + (f.relevantSymbols?.length || 0), 0);
    const hasSemanticData = contextFiles.some(f => f.symbols && f.symbols.length > 0);
    
    if (hasSemanticData) {
      score += 10; // Semantic data bonus
    }

    // Öneriler
    if (avgScore < 0.5) {
      suggestions.push("Düşük relevance - query'yi daha spesifik yap");
    }
    if (contextFiles.length < 3) {
      suggestions.push("Az dosya - daha fazla context ekle");
    }
    if (reasons.size === 1) {
      suggestions.push("Tek kaynak - farklı dosya türleri ekle");
    }
    if (!hasSemanticData) {
      suggestions.push("Semantic analiz eksik - TypeScript/JavaScript dosyaları ekle");
    }

    const coverage = score > 80 ? "excellent" : score > 60 ? "good" : score > 40 ? "fair" : "poor";

    return { 
      score, 
      coverage, 
      suggestions,
      semanticMetrics: hasSemanticData ? {
        totalSymbols,
        relevantSymbols,
        dependencyDepth: this.calculateDependencyDepth(contextFiles)
      } : undefined
    };
  }
  
  /**
   * 🆕 TASK 28: Calculate dependency depth
   */
  private calculateDependencyDepth(contextFiles: ContextFile[]): number {
    if (!this.dependencyGraph) return 0;
    
    // En derin dependency chain'i bul
    let maxDepth = 0;
    
    contextFiles.forEach(file => {
      const analysis = this.semanticCache.get(file.path);
      if (analysis) {
        const depth = this.getDepthRecursive(analysis.filePath, new Set(), 0);
        maxDepth = Math.max(maxDepth, depth);
      }
    });
    
    return maxDepth;
  }
  
  /**
   * 🆕 TASK 28: Recursive dependency depth calculation
   */
  private getDepthRecursive(filePath: string, visited: Set<string>, currentDepth: number): number {
    if (visited.has(filePath) || currentDepth > 10) {
      return currentDepth;
    }
    
    visited.add(filePath);
    
    const analysis = this.semanticCache.get(filePath);
    if (!analysis || analysis.dependencies.length === 0) {
      return currentDepth;
    }
    
    let maxDepth = currentDepth;
    
    analysis.dependencies.forEach(dep => {
      const depth = this.getDepthRecursive(dep, new Set(visited), currentDepth + 1);
      maxDepth = Math.max(maxDepth, depth);
    });
    
    return maxDepth;
  }
}

// Singleton instance
export const smartContextBuilder = new SmartContextBuilder();
