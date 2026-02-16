// services/dependencyAnalyzer.ts - Kod bağımlılık analizi

import { FileIndex } from "../types/index";

interface DependencyGraph {
  [filePath: string]: {
    imports: string[];
    exports: string[];
    dependencies: string[];
    dependents: string[];
  };
}

export class DependencyAnalyzer {
  private graph: DependencyGraph = {};

  /**
   * Proje dosyalarından bağımlılık grafiği oluştur
   */
  buildGraph(files: FileIndex[]): DependencyGraph {
    this.graph = {};

    // Her dosya için import/export analizi
    files.forEach(file => {
      const imports = this.extractImports(file.content, file.path);
      const exports = this.extractExports(file.content);

      this.graph[file.path] = {
        imports,
        exports,
        dependencies: [],
        dependents: []
      };
    });

    // Bağımlılıkları çöz
    this.resolveDependencies(files);

    return this.graph;
  }

  /**
   * Import statement'ları çıkar
   */
  private extractImports(content: string, filePath: string): string[] {
    const imports: string[] = [];

    // ES6 imports
    const es6ImportRegex = /import\s+(?:[\w\s{},*]+\s+from\s+)?['"]([^'"]+)['"]/g;
    let match;
    while ((match = es6ImportRegex.exec(content)) !== null) {
      imports.push(this.resolveImportPath(match[1], filePath));
    }

    // CommonJS require
    const requireRegex = /require\s*\(['"]([^'"]+)['"]\)/g;
    while ((match = requireRegex.exec(content)) !== null) {
      imports.push(this.resolveImportPath(match[1], filePath));
    }

    // TypeScript import type
    const typeImportRegex = /import\s+type\s+(?:[\w\s{},*]+\s+from\s+)?['"]([^'"]+)['"]/g;
    while ((match = typeImportRegex.exec(content)) !== null) {
      imports.push(this.resolveImportPath(match[1], filePath));
    }

    return [...new Set(imports)]; // Remove duplicates
  }

  /**
   * Export statement'ları çıkar
   */
  private extractExports(content: string): string[] {
    const exports: string[] = [];

    // Named exports
    const namedExportRegex = /export\s+(?:const|let|var|function|class|interface|type|enum)\s+(\w+)/g;
    let match;
    while ((match = namedExportRegex.exec(content)) !== null) {
      exports.push(match[1]);
    }

    // Export { ... }
    const exportBlockRegex = /export\s*\{([^}]+)\}/g;
    while ((match = exportBlockRegex.exec(content)) !== null) {
      const names = match[1].split(',').map(n => n.trim().split(/\s+as\s+/)[0]);
      exports.push(...names);
    }

    // Default export
    if (/export\s+default/.test(content)) {
      exports.push('default');
    }

    return [...new Set(exports)];
  }

  /**
   * Import path'i çöz (relative -> absolute)
   */
  private resolveImportPath(importPath: string, currentFile: string): string {
    // Node modules'ü atla
    if (!importPath.startsWith('.')) {
      return importPath;
    }

    // Relative path'i çöz
    const currentDir = currentFile.split(/[\\/]/).slice(0, -1).join('/');
    const parts = importPath.split('/');
    const dirParts = currentDir.split('/');

    for (const part of parts) {
      if (part === '..') {
        dirParts.pop();
      } else if (part !== '.') {
        dirParts.push(part);
      }
    }

    let resolved = dirParts.join('/');

    // Extension ekle
    if (!resolved.match(/\.(ts|tsx|js|jsx)$/)) {
      // Try common extensions
      const extensions = ['.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx'];
      for (const ext of extensions) {
        // Bu basitleştirilmiş bir çözüm, gerçek dosya sistemine bakmıyor
        resolved = resolved + ext;
        break;
      }
    }

    return resolved;
  }

  /**
   * Bağımlılıkları çöz (hangi dosya hangi dosyaya bağımlı)
   */
  private resolveDependencies(files: FileIndex[]): void {
    const filePathMap = new Map(files.map(f => [f.path, f]));

    Object.keys(this.graph).forEach(filePath => {
      const node = this.graph[filePath];

      node.imports.forEach(importPath => {
        // Tam eşleşme ara
        let targetFile = filePathMap.get(importPath);

        // Eğer bulunamazsa, partial match dene
        if (!targetFile) {
          for (const [path, file] of filePathMap.entries()) {
            if (path.includes(importPath) || importPath.includes(path)) {
              targetFile = file;
              break;
            }
          }
        }

        if (targetFile) {
          node.dependencies.push(targetFile.path);
          
          if (!this.graph[targetFile.path].dependents.includes(filePath)) {
            this.graph[targetFile.path].dependents.push(filePath);
          }
        }
      });
    });
  }

  /**
   * Bir dosyanın tüm bağımlılıklarını getir (recursive)
   */
  getAllDependencies(filePath: string, visited = new Set<string>()): string[] {
    if (visited.has(filePath) || !this.graph[filePath]) {
      return [];
    }

    visited.add(filePath);
    const deps = [...this.graph[filePath].dependencies];

    this.graph[filePath].dependencies.forEach(dep => {
      deps.push(...this.getAllDependencies(dep, visited));
    });

    return [...new Set(deps)];
  }

  /**
   * Bir dosyaya bağımlı olan tüm dosyaları getir (recursive)
   */
  getAllDependents(filePath: string, visited = new Set<string>()): string[] {
    if (visited.has(filePath) || !this.graph[filePath]) {
      return [];
    }

    visited.add(filePath);
    const dependents = [...this.graph[filePath].dependents];

    this.graph[filePath].dependents.forEach(dep => {
      dependents.push(...this.getAllDependents(dep, visited));
    });

    return [...new Set(dependents)];
  }

  /**
   * Bir dosyanın etki alanını hesapla (kaç dosyayı etkiler)
   */
  getImpactScore(filePath: string): number {
    const dependents = this.getAllDependents(filePath);
    return dependents.length;
  }

  /**
   * En önemli dosyaları bul (en çok bağımlılığı olan)
   */
  getCriticalFiles(topN: number = 10): Array<{ path: string; score: number }> {
    const scores = Object.keys(this.graph).map(path => ({
      path,
      score: this.getImpactScore(path)
    }));

    return scores
      .sort((a, b) => b.score - a.score)
      .slice(0, topN);
  }

  /**
   * İki dosya arasındaki ilişkiyi bul
   */
  getRelationship(file1: string, file2: string): 'depends-on' | 'depended-by' | 'related' | 'unrelated' {
    if (!this.graph[file1] || !this.graph[file2]) {
      return 'unrelated';
    }

    if (this.graph[file1].dependencies.includes(file2)) {
      return 'depends-on';
    }

    if (this.graph[file1].dependents.includes(file2)) {
      return 'depended-by';
    }

    // Ortak bağımlılık var mı?
    const deps1 = new Set(this.getAllDependencies(file1));
    const deps2 = new Set(this.getAllDependencies(file2));
    
    for (const dep of deps1) {
      if (deps2.has(dep)) {
        return 'related';
      }
    }

    return 'unrelated';
  }

  /**
   * Dosya için context önerisi (hangi dosyalar birlikte gönderilmeli)
   */
  suggestContext(filePath: string, maxFiles: number = 5): string[] {
    if (!this.graph[filePath]) {
      return [];
    }

    const suggestions = new Set<string>();

    // 1. Direkt bağımlılıklar (import ettiği dosyalar)
    this.graph[filePath].dependencies.forEach(dep => suggestions.add(dep));

    // 2. Direkt dependents (bu dosyayı import eden dosyalar)
    this.graph[filePath].dependents.slice(0, 2).forEach(dep => suggestions.add(dep));

    // 3. Aynı dizindeki dosyalar
    const dir = filePath.split(/[\\/]/).slice(0, -1).join('/');
    Object.keys(this.graph).forEach(path => {
      if (path.startsWith(dir) && path !== filePath) {
        suggestions.add(path);
      }
    });

    return Array.from(suggestions).slice(0, maxFiles);
  }
}

// Singleton instance
export const dependencyAnalyzer = new DependencyAnalyzer();
