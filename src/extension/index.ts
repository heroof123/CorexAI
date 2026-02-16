// extension/index.ts
// Extension Entry Point - Tauri Adapter for Continue.dev architecture

import { CoreEngine } from '../core';
import { Messenger } from './messenger';
import { TauriBridge } from './tauri-bridge';
import { IDEInterface } from './ide';

/**
 * Extension - Main adapter between Core and GUI
 * Inspired by Continue.dev's extension architecture
 */
export class Extension {
  private core: CoreEngine;
  private messenger: Messenger;
  private tauriBridge: TauriBridge;
  private ide: IDEInterface;
  private isInitialized: boolean = false;
  
  constructor() {
    console.log('🔌 Extension: Initializing...');
    
    // Create subsystems
    this.core = new CoreEngine();
    this.messenger = new Messenger(this.core);
    this.tauriBridge = new TauriBridge(this.messenger);
    this.ide = new IDEInterface();
  }
  
  /**
   * Initialize the extension
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.warn('⚠️ Extension: Already initialized');
      return;
    }
    
    try {
      console.log('🔧 Extension: Setting up message handlers...');
      
      // Setup message flow: Core → Extension → GUI
      this.setupCoreToGUIFlow();
      
      // Setup message flow: GUI → Extension → Core
      this.setupGUIToCoreFlow();
      
      // Initialize Core
      await this.core.initialize();
      
      // Initialize Tauri Bridge
      await this.tauriBridge.initialize();
      
      this.isInitialized = true;
      console.log('✅ Extension: Initialized successfully');
    } catch (error) {
      console.error('❌ Extension: Initialization failed:', error);
      throw error;
    }
  }
  
  /**
   * Setup Core → GUI message flow
   */
  private setupCoreToGUIFlow(): void {
    // Listen to Core messages
    this.core.on('message', (message) => {
      console.log(`📨 Extension: Core → GUI: ${message.messageType}`);
      this.messenger.sendToGUI(message);
    });
  }
  
  /**
   * Setup GUI → Core message flow
   */
  private setupGUIToCoreFlow(): void {
    // Listen to GUI messages
    this.messenger.on('gui-message', (message) => {
      console.log(`📨 Extension: GUI → Core: ${message.messageType}`);
      this.core.handleMessage(message);
    });
  }
  
  /**
   * Get IDE interface
   */
  getIDE(): IDEInterface {
    return this.ide;
  }
  
  /**
   * Get Core engine
   */
  getCore(): CoreEngine {
    return this.core;
  }
  
  /**
   * Shutdown the extension
   */
  async shutdown(): Promise<void> {
    console.log('🔌 Extension: Shutting down...');
    
    await this.core.shutdown();
    this.messenger.removeAllListeners();
    
    this.isInitialized = false;
    console.log('✅ Extension: Shutdown complete');
  }
}

// Export singleton instance
let extensionInstance: Extension | null = null;

/**
 * Get or create Extension singleton
 */
export function getExtension(): Extension {
  if (!extensionInstance) {
    extensionInstance = new Extension();
  }
  return extensionInstance;
}

/**
 * Initialize Extension singleton
 */
export async function initializeExtension(): Promise<Extension> {
  const extension = getExtension();
  await extension.initialize();
  return extension;
}

/**
 * Reset Extension singleton (useful for testing)
 */
export function resetExtension(): void {
  if (extensionInstance) {
    extensionInstance.shutdown();
    extensionInstance = null;
  }
}
