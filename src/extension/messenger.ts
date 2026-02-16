// extension/messenger.ts
// Messenger - Routes messages between Core and GUI

import { CoreEngine } from '../core';
import { CoreMessage, GUIMessage, isGUIMessage, isCoreMessage } from '../core/protocol';

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
  
  listenerCount(event: string): number {
    return this.listeners.get(event)?.length || 0;
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
 * Messenger - Message Router
 * Routes messages between Core and GUI through the Extension
 */
export class Messenger extends SimpleEventEmitter {
  constructor(_core: CoreEngine) {
    super();
    // Core reference not needed - Extension handles the connection
    console.log('📬 Messenger: Initialized');
  }
  
  /**
   * Send message to GUI
   * Called by Extension when Core emits a message
   */
  sendToGUI(message: CoreMessage): void {
    // Validate message
    if (!isCoreMessage(message)) {
      console.error('❌ Messenger: Invalid Core message:', message);
      return;
    }
    
    console.log(`📤 Messenger: Sending to GUI: ${message.messageType}`);
    
    // Emit event that TauriBridge will listen to
    this.emit('core-message', message);
  }
  
  /**
   * Receive message from GUI
   * Called by TauriBridge when GUI sends a message
   */
  receiveFromGUI(message: GUIMessage): void {
    // Validate message
    if (!isGUIMessage(message)) {
      console.error('❌ Messenger: Invalid GUI message:', message);
      return;
    }
    
    console.log(`📥 Messenger: Received from GUI: ${message.messageType}`);
    
    // Emit event that Extension will listen to
    this.emit('gui-message', message);
  }
  
  /**
   * Get message statistics
   */
  getStats(): {
    coreListeners: number;
    guiListeners: number;
  } {
    return {
      coreListeners: this.listenerCount('core-message'),
      guiListeners: this.listenerCount('gui-message')
    };
  }
}
