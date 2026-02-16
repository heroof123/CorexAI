// core/context/manager.ts
// Context Manager - Manages conversation context and file relevance

import { CoreEngine } from '../index';
import { generateMessageId } from '../protocol';
import { performanceMonitor } from '../../utils/performance-monitor';
import { errorHandler, ErrorSeverity, retry } from '../../utils/error-handler';

export interface ContextFile {
  path: string;
  content: string;
  relevanceScore: number;
  lastAccessed: number;
}

export interface ContextRequest {
  query: string;
  maxFiles?: number;
  maxTokens?: number;
}

/**
 * Context Manager
 * Intelligently selects relevant files and context for AI requests
 */
export class ContextManager {
  private core: CoreEngine;
  private recentFiles: Map<string, number> = new Map(); // path -> lastAccessed
  private fileCache: Map<string, string> = new Map(); // path -> content
  
  constructor(core: CoreEngine) {
    this.core = core;
    console.log('📂 ContextManager: Initialized');
  }
  
  /**
   * Handle context request from GUI
   */
  async handleContextRequest(data: {
    requestId: string;
    query: string;
    maxFiles?: number;
    maxTokens?: number;
  }): Promise<void> {
    console.log(`📂 ContextManager: Handling context request: ${data.requestId}`);
    
    // Start performance monitoring
    performanceMonitor.start(`context-request-${data.requestId}`);
    
    try {
      // Get relevant files with retry logic
      const relevantFiles = await retry(
        async () => {
          return await this.getRelevantFiles({
            query: data.query,
            maxFiles: data.maxFiles || 5,
            maxTokens: data.maxTokens || 4000
          });
        },
        {
          maxAttempts: 3,
          delay: 500,
          context: {
            component: 'ContextManager',
            operation: 'handleContextRequest',
            metadata: { requestId: data.requestId }
          }
        }
      );
      
      // Send context update
      this.core.sendMessage({
        messageId: generateMessageId('context-update'),
        messageType: 'context/update',
        timestamp: Date.now(),
        data: {
          requestId: data.requestId,
          files: relevantFiles,
          totalTokens: this.estimateTokens(relevantFiles)
        }
      });
      
      console.log(`✅ ContextManager: Sent ${relevantFiles.length} relevant files`);
      
      // End performance monitoring
      performanceMonitor.end(`context-request-${data.requestId}`, {
        requestId: data.requestId,
        fileCount: relevantFiles.length,
        totalTokens: this.estimateTokens(relevantFiles)
      });
      
    } catch (error) {
      console.error('❌ ContextManager: Error:', error);
      
      // Log error
      errorHandler.handle(
        error instanceof Error ? error : new Error(String(error)),
        ErrorSeverity.ERROR,
        {
          component: 'ContextManager',
          operation: 'handleContextRequest',
          metadata: {
            requestId: data.requestId,
            query: data.query
          }
        }
      );
      
      // End performance monitoring (error)
      performanceMonitor.end(`context-request-${data.requestId}`, {
        requestId: data.requestId,
        error: true
      });
      
      throw error;
    }
  }
  
  /**
   * Get relevant files based on query
   */
  private async getRelevantFiles(request: ContextRequest): Promise<ContextFile[]> {
    performanceMonitor.start('context-get-relevant-files');
    
    try {
      // Get all indexed files
      const { getProjectIndex } = await import('../../services/db');
      const projectPath = localStorage.getItem('corex-current-project') || '';
      const index = await getProjectIndex(projectPath);
      
      if (!index || index.files.length === 0) {
        console.warn('⚠️ ContextManager: No indexed files found');
        performanceMonitor.end('context-get-relevant-files', { fileCount: 0 });
        return [];
      }
      
      // Calculate relevance scores
      const scoredFiles = index.files.map(file => ({
        path: file.path,
        content: file.content,
        relevanceScore: this.calculateRelevance(file, request.query),
        lastAccessed: this.recentFiles.get(file.path) || 0
      }));
      
      // Sort by relevance (score + recency)
      scoredFiles.sort((a, b) => {
        const scoreA = a.relevanceScore + (a.lastAccessed > 0 ? 0.2 : 0);
        const scoreB = b.relevanceScore + (b.lastAccessed > 0 ? 0.2 : 0);
        return scoreB - scoreA;
      });
      
      // Take top N files within token limit
      const selectedFiles: ContextFile[] = [];
      let totalTokens = 0;
      
      for (const file of scoredFiles) {
        const fileTokens = this.estimateTokens([file]);
        
        if (totalTokens + fileTokens > (request.maxTokens || 4000)) {
          break;
        }
        
        if (selectedFiles.length >= (request.maxFiles || 5)) {
          break;
        }
        
        selectedFiles.push(file);
        totalTokens += fileTokens;
      }
      
      performanceMonitor.end('context-get-relevant-files', {
        totalFiles: index.files.length,
        selectedFiles: selectedFiles.length,
        totalTokens
      });
      
      return selectedFiles;
      
    } catch (error) {
      errorHandler.handle(
        error instanceof Error ? error : new Error(String(error)),
        ErrorSeverity.ERROR,
        {
          component: 'ContextManager',
          operation: 'getRelevantFiles',
          metadata: { query: request.query }
        }
      );
      
      performanceMonitor.end('context-get-relevant-files', { error: true });
      throw error;
    }
  }
  
  /**
   * Calculate relevance score for a file
   */
  private calculateRelevance(file: any, query: string): number {
    let score = 0;
    
    const queryLower = query.toLowerCase();
    const contentLower = file.content.toLowerCase();
    const pathLower = file.path.toLowerCase();
    
    // Keyword matching in content (0-0.5)
    const keywords = queryLower.split(/\s+/).filter(k => k.length > 3);
    for (const keyword of keywords) {
      if (contentLower.includes(keyword)) {
        score += 0.1;
      }
    }
    
    // Filename matching (0-0.3)
    for (const keyword of keywords) {
      if (pathLower.includes(keyword)) {
        score += 0.15;
      }
    }
    
    // File type relevance (0-0.2)
    if (queryLower.includes('component') && pathLower.includes('component')) {
      score += 0.2;
    }
    if (queryLower.includes('service') && pathLower.includes('service')) {
      score += 0.2;
    }
    if (queryLower.includes('util') && pathLower.includes('util')) {
      score += 0.2;
    }
    
    return Math.min(score, 1.0);
  }
  
  /**
   * Track file access
   */
  trackFileAccess(filePath: string): void {
    this.recentFiles.set(filePath, Date.now());
  }
  
  /**
   * Estimate token count
   */
  private estimateTokens(files: ContextFile[]): number {
    let total = 0;
    for (const file of files) {
      // Simple estimation: words * 1.3
      const words = file.content.split(/\s+/).length;
      total += Math.ceil(words * 1.3);
    }
    return total;
  }
  
  /**
   * Clear cache
   */
  clearCache(): void {
    this.fileCache.clear();
    this.recentFiles.clear();
    console.log('🧹 ContextManager: Cache cleared');
  }
  
  /**
   * Cleanup
   */
  async cleanup(): Promise<void> {
    this.clearCache();
    console.log('✅ ContextManager: Cleanup complete');
  }
}
