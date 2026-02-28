// extension/tauri-bridge.ts
// Tauri Bridge - Connects Extension to Tauri event system

import { emit, listen, UnlistenFn } from '@tauri-apps/api/event';
import { Messenger } from './messenger';
import { CoreMessage, GUIMessage } from '../core/protocol';

/**
 * Tauri Bridge
 * Bridges the Extension with Tauri's event system
 */
export class TauriBridge {
  private messenger: Messenger;
  private unlistenFunctions: UnlistenFn[] = [];
  private isInitialized: boolean = false;

  constructor(messenger: Messenger) {
    this.messenger = messenger;
    console.log('🌉 TauriBridge: Initialized');
  }

  /**
   * Initialize Tauri event listeners
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.warn('⚠️ TauriBridge: Already initialized');
      return;
    }

    // 🛡️ Tauri ortam kontrolü — normal tarayıcıda çalışırken atla
    const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
    if (!isTauri) {
      console.warn('⚠️ TauriBridge: Not running inside Tauri shell — bridge disabled');
      this.isInitialized = true; // mark as initialized to avoid re-entry
      return;
    }

    try {
      console.log('🔧 TauriBridge: Setting up event listeners...');

      // Listen to GUI messages (from React)
      const unlistenGUI = await listen<GUIMessage>('gui-message', (event) => {
        console.log(`📨 TauriBridge: Received GUI message: ${event.payload.messageType}`);
        this.messenger.receiveFromGUI(event.payload);
      });
      this.unlistenFunctions.push(unlistenGUI);

      // Listen to Core messages (from Messenger) and forward to GUI
      this.messenger.on('core-message', (message: CoreMessage) => {
        console.log(`📨 TauriBridge: Forwarding Core message to GUI: ${message.messageType}`);
        this.emitToGUI(message);
      });

      this.isInitialized = true;
      console.log('✅ TauriBridge: Initialized successfully');
    } catch (error) {
      console.error('❌ TauriBridge: Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Emit message to GUI (React)
   */
  private async emitToGUI(message: CoreMessage): Promise<void> {
    const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
    if (!isTauri) return;
    try {
      await emit('core-message', message);
    } catch (error) {
      console.error('❌ TauriBridge: Failed to emit to GUI:', error);
    }
  }

  /**
   * Cleanup event listeners
   */
  async cleanup(): Promise<void> {
    console.log('🧹 TauriBridge: Cleaning up event listeners...');

    // Unlisten all Tauri events
    for (const unlisten of this.unlistenFunctions) {
      unlisten();
    }
    this.unlistenFunctions = [];

    // Remove Messenger listeners
    this.messenger.removeAllListeners('core-message');

    this.isInitialized = false;
    console.log('✅ TauriBridge: Cleanup complete');
  }
}
