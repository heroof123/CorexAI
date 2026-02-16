// core/context/providers/FileContextProvider.ts
// Provides context from file system

import { readTextFile, stat, readDir } from '@tauri-apps/plugin-fs';

export interface FileContext {
  path: string;
  content: string;
  language: string;
  size: number;
  lastModified: number;
}

export class FileContextProvider {
  private fileCache: Map<string, FileContext> = new Map();
  private readonly MAX_FILE_SIZE = 1024 * 1024; // 1MB

  /**
   * Get context from a specific file
   */
  async getFileContext(filePath: string): Promise<FileContext | null> {
    // Check cache first
    const cached = this.fileCache.get(filePath);
    if (cached) {
      return cached;
    }

    try {
      // Read file using Tauri
      const content = await readTextFile(filePath);

      // Get file stats
      const stats = await stat(filePath);

      // Check file size
      if (stats.size > this.MAX_FILE_SIZE) {
        console.warn(`File too large: ${filePath} (${stats.size} bytes)`);
        return null;
      }

      // Detect language from extension
      const language = this.detectLanguage(filePath);

      const context: FileContext = {
        path: filePath,
        content,
        language,
        size: stats.size,
        lastModified: stats.mtime ? new Date(stats.mtime).getTime() : Date.now(),
      };

      // Cache it
      this.fileCache.set(filePath, context);

      return context;
    } catch (error) {
      console.error(`Failed to read file: ${filePath}`, error);
      return null;
    }
  }

  /**
   * Get context from multiple files
   */
  async getMultipleFileContext(filePaths: string[]): Promise<FileContext[]> {
    const results = await Promise.allSettled(
      filePaths.map(path => this.getFileContext(path))
    );

    return results
      .filter((r): r is PromiseFulfilledResult<FileContext> => 
        r.status === 'fulfilled' && r.value !== null
      )
      .map(r => r.value);
  }

  /**
   * Get context from files in a directory
   */
  async getDirectoryContext(dirPath: string, recursive = false): Promise<FileContext[]> {
    try {
      const entries = await readDir(dirPath);

      const filePaths: string[] = [];
      
      for (const entry of entries) {
        if (entry.isDirectory) {
          if (recursive) {
            const subFiles = await this.getDirectoryContext(entry.name, true);
            filePaths.push(...subFiles.map(f => f.path));
          }
        } else {
          if (this.shouldIncludeFile(entry.name)) {
            filePaths.push(entry.name);
          }
        }
      }

      return await this.getMultipleFileContext(filePaths);
    } catch (error) {
      console.error(`Failed to read directory: ${dirPath}`, error);
      return [];
    }
  }

  /**
   * Detect programming language from file extension
   */
  private detectLanguage(filePath: string): string {
    const ext = filePath.split('.').pop()?.toLowerCase();
    
    const languageMap: Record<string, string> = {
      ts: 'typescript',
      tsx: 'typescriptreact',
      js: 'javascript',
      jsx: 'javascriptreact',
      py: 'python',
      rs: 'rust',
      go: 'go',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      cs: 'csharp',
      rb: 'ruby',
      php: 'php',
      swift: 'swift',
      kt: 'kotlin',
      html: 'html',
      css: 'css',
      scss: 'scss',
      json: 'json',
      md: 'markdown',
      yaml: 'yaml',
      yml: 'yaml',
      toml: 'toml',
      xml: 'xml',
      sql: 'sql',
    };

    return languageMap[ext || ''] || 'plaintext';
  }

  /**
   * Check if file should be included in context
   */
  private shouldIncludeFile(filePath: string): boolean {
    const excludePatterns = [
      /node_modules/,
      /\.git/,
      /dist/,
      /build/,
      /\.next/,
      /\.cache/,
      /\.vscode/,
      /\.idea/,
      /\.DS_Store/,
      /\.env/,
      /package-lock\.json/,
      /yarn\.lock/,
    ];

    return !excludePatterns.some(pattern => pattern.test(filePath));
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.fileCache.clear();
  }

  /**
   * Get cache stats
   */
  getCacheStats() {
    return {
      size: this.fileCache.size,
      files: Array.from(this.fileCache.keys()),
    };
  }
}
