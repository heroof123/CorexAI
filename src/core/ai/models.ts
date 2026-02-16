// core/ai/models.ts
// Model Management - Handles AI model selection and configuration

/**
 * Model configuration interface
 */
export interface ModelConfig {
  id: string;
  displayName: string;
  provider: string;
  isActive: boolean;
  contextLength?: number;
  maxTokens?: number;
  temperature?: number;
}

/**
 * Model Manager
 * Manages AI model selection and configuration
 */
export class ModelManager {
  private activeModel: ModelConfig | null = null;
  
  constructor() {
    console.log('🎯 ModelManager: Initialized');
    this.loadActiveModel();
  }
  
  /**
   * Load active model from localStorage
   */
  private loadActiveModel(): void {
    try {
      // Check for GGUF model first
      const ggufConfig = localStorage.getItem('gguf-active-model');
      if (ggufConfig) {
        const config = JSON.parse(ggufConfig);
        this.activeModel = {
          id: config.id || 'gguf-model',
          displayName: config.displayName || 'GGUF Model',
          provider: 'gguf-direct',
          isActive: true,
          contextLength: config.contextLength,
          maxTokens: config.maxTokens
        };
        console.log(`✅ ModelManager: Loaded GGUF model: ${this.activeModel.displayName}`);
        return;
      }
      
      // Check for other providers
      const providersConfig = localStorage.getItem('corex-ai-providers');
      if (providersConfig) {
        const providers = JSON.parse(providersConfig);
        
        // Find active model
        for (const provider of providers) {
          if (!provider.isActive || !provider.models) continue;
          
          for (const model of provider.models) {
            if (model.isActive) {
              this.activeModel = {
                id: model.id,
                displayName: model.displayName,
                provider: provider.id,
                isActive: true
              };
              console.log(`✅ ModelManager: Loaded model: ${this.activeModel.displayName}`);
              return;
            }
          }
        }
      }
      
      console.warn('⚠️ ModelManager: No active model found');
    } catch (error) {
      console.error('❌ ModelManager: Error loading active model:', error);
    }
  }
  
  /**
   * Get active model
   */
  getActiveModel(): ModelConfig | null {
    return this.activeModel;
  }
  
  /**
   * Get active model ID
   */
  getActiveModelId(): string | null {
    return this.activeModel?.id || null;
  }
  
  /**
   * Check if a model is active
   */
  hasActiveModel(): boolean {
    return this.activeModel !== null;
  }
  
  /**
   * Reload active model (useful after settings change)
   */
  reloadActiveModel(): void {
    console.log('🔄 ModelManager: Reloading active model');
    this.loadActiveModel();
  }
  
  /**
   * Get model context length
   */
  getContextLength(): number {
    return this.activeModel?.contextLength || 32768; // Default 32K
  }
  
  /**
   * Get model max tokens
   */
  getMaxTokens(): number {
    return this.activeModel?.maxTokens || 8192; // Default 8K
  }
}

// Export singleton instance
let modelManagerInstance: ModelManager | null = null;

/**
 * Get or create ModelManager singleton
 */
export function getModelManager(): ModelManager {
  if (!modelManagerInstance) {
    modelManagerInstance = new ModelManager();
  }
  return modelManagerInstance;
}

/**
 * Reset ModelManager singleton (useful for testing)
 */
export function resetModelManager(): void {
  modelManagerInstance = null;
}
