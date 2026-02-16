// core/index.ts
// Core Engine - Main entry point for business logic
// Inspired by Continue.dev architecture

import { CoreMessage, GUIMessage } from './protocol';
import { AIManager } from './ai/manager';
import { ContextManager } from './context/manager';
import { PlanningAgent } from './planning/agent';
import { performanceMonitor } from '../utils/performance-monitor';
import { errorHandler, ErrorSeverity } from '../utils/error-handler';

/**
 * Simple EventEmitter implementation for browser
 */
class SimpleEventEmitter {
  private listeners: Map<string, Array<(...args: any[]) => void>> = new Map();
  
  on(event: string, listener: (...args: any[]) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(listener);
  }
  
  emit(event: string, ...args: any[]): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(listener => listener(...args));
    }
  }
  
  removeAllListeners(event?: string): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }
}

/**
 * CoreEngine - The heart of the Continue.dev-style architecture
 * 
 * Responsibilities:
 * - Handle messages from Extension
 * - Coordinate AI, Context, and Planning subsystems
 * - Emit messages to Extension
 * - Maintain business logic state
 */
export class CoreEngine extends SimpleEventEmitter {
  private isInitialized: boolean = false;
  
  // Subsystems
  private aiManager: AIManager;
  private contextManager: ContextManager;
  private planningAgent: PlanningAgent;
  
  constructor() {
    super();
    console.log('🚀 CoreEngine: Initializing...');
    
    // Initialize subsystems immediately
    this.aiManager = new AIManager(this);
    this.contextManager = new ContextManager(this);
    this.planningAgent = new PlanningAgent(this);
  }
  
  /**
   * Initialize the core engine and all subsystems
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.warn('⚠️ CoreEngine: Already initialized');
      return;
    }
    
    try {
      console.log('🔧 CoreEngine: Setting up subsystems...');
      
      // All managers already initialized in constructor
      console.log('✅ CoreEngine: AI Manager ready');
      console.log('✅ CoreEngine: Context Manager ready');
      console.log('✅ CoreEngine: Planning Agent ready');
      
      this.isInitialized = true;
      console.log('✅ CoreEngine: Initialized successfully');
    } catch (error) {
      console.error('❌ CoreEngine: Initialization failed:', error);
      throw error;
    }
  }
  
  /**
   * Handle incoming messages from Extension
   * Routes messages to appropriate subsystems
   */
  async handleMessage(message: GUIMessage): Promise<void> {
    if (!this.isInitialized) {
      const error = 'Core engine not initialized, cannot handle message';
      console.error(`❌ CoreEngine: ${error}`);
      errorHandler.handle(error, ErrorSeverity.ERROR, {
        component: 'CoreEngine',
        operation: 'handleMessage',
        metadata: { messageType: message.messageType },
      });
      this.sendError(error, message.messageId);
      return;
    }
    
    console.log(`📨 CoreEngine: Received message: ${message.messageType}`);
    
    // Start performance monitoring
    performanceMonitor.start(`handle-${message.messageType}`);
    
    try {
      switch (message.messageType) {
        // Chat messages
        case 'chat/request':
          console.log('💬 CoreEngine: Routing to AI Manager');
          await this.aiManager.handleChatRequest(message.data);
          break;
          
        case 'chat/stop':
          console.log('🛑 CoreEngine: Routing to AI Manager');
          await this.aiManager.stopGeneration(message.data.requestId);
          break;
          
        case 'chat/regenerate':
          console.log('🔄 CoreEngine: Routing to AI Manager');
          await this.aiManager.regenerateResponse(message.data);
          break;
        
        // Context messages
        case 'context/request':
          console.log('📂 CoreEngine: Routing to Context Manager');
          await this.contextManager.handleContextRequest(message.data);
          break;
        
        // Planning messages
        case 'planning/request':
          console.log('📋 CoreEngine: Routing to Planning Agent');
          await this.planningAgent.handlePlanRequest(message.data);
          break;
        
        // IDE messages
        case 'ide/file-open':
          console.log('📄 CoreEngine: File opened:', message.data.filePath);
          // Track file opens for context
          this.contextManager.trackFileAccess(message.data.filePath);
          break;
          
        case 'ide/file-edit':
          console.log('✏️ CoreEngine: File edited:', message.data.filePath);
          // Track file edits for context
          this.contextManager.trackFileAccess(message.data.filePath);
          break;
        
        default:
          const unknownError = `Unknown message type: ${(message as any).messageType}`;
          console.warn(`⚠️ CoreEngine: ${unknownError}`);
          errorHandler.handle(unknownError, ErrorSeverity.WARNING, {
            component: 'CoreEngine',
            operation: 'handleMessage',
            metadata: { messageType: (message as any).messageType },
          });
          this.sendError(unknownError, (message as any).messageId);
      }
      
      // End performance monitoring
      performanceMonitor.end(`handle-${message.messageType}`, {
        messageId: message.messageId,
      });
      
    } catch (error) {
      console.error(`❌ CoreEngine: Error handling message:`, error);
      
      // Log error
      errorHandler.handle(
        error instanceof Error ? error : new Error(String(error)),
        ErrorSeverity.ERROR,
        {
          component: 'CoreEngine',
          operation: 'handleMessage',
          metadata: {
            messageType: message.messageType,
            messageId: message.messageId,
          },
        }
      );
      
      // End performance monitoring with error
      performanceMonitor.end(`handle-${message.messageType}`, {
        messageId: message.messageId,
        error: true,
      });
      
      this.sendError(
        error instanceof Error ? error.message : 'Unknown error',
        message.messageId
      );
    }
  }
  
  /**
   * Send a message to Extension (which forwards to GUI)
   */
  sendMessage(message: CoreMessage): void {
    console.log(`📤 CoreEngine: Sending message: ${message.messageType}`);
    this.emit('message', message);
  }
  
  /**
   * Send an error message
   */
  private sendError(error: string, relatedMessageId?: string): void {
    this.sendMessage({
      messageId: `error-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`,
      messageType: 'error',
      timestamp: Date.now(),
      data: {
        error,
        context: { relatedMessageId },
      },
    });
  }
  
  /**
   * Cleanup and shutdown
   */
  async shutdown(): Promise<void> {
    console.log('🔌 CoreEngine: Shutting down...');
    
    // Cleanup subsystems
    await this.aiManager?.cleanup();
    await this.contextManager?.cleanup();
    await this.planningAgent?.cleanup();
    
    this.isInitialized = false;
    this.removeAllListeners();
    
    console.log('✅ CoreEngine: Shutdown complete');
  }
}

// Export singleton instance (optional - can also be instantiated by Extension)
let coreInstance: CoreEngine | null = null;

/**
 * Get or create the singleton CoreEngine instance
 */
export function getCoreEngine(): CoreEngine {
  if (!coreInstance) {
    coreInstance = new CoreEngine();
  }
  return coreInstance;
}

/**
 * Reset the singleton instance (useful for testing)
 */
export function resetCoreEngine(): void {
  if (coreInstance) {
    coreInstance.shutdown();
    coreInstance = null;
  }
}
