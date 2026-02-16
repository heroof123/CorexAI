// extension/ide.ts
// IDE Interface - Provides IDE operations to Core

import { invoke } from '@tauri-apps/api/core';

/**
 * IDE Interface
 * Provides file and editor operations to the Core
 */
export class IDEInterface {
  constructor() {
    console.log('💻 IDEInterface: Initialized');
  }
  
  // ============================================================================
  // File Operations
  // ============================================================================
  
  /**
   * Read file contents
   */
  async readFile(path: string): Promise<string> {
    try {
      const content = await invoke<string>('read_file', { path });
      console.log(`📖 IDEInterface: Read file: ${path}`);
      return content;
    } catch (error) {
      console.error(`❌ IDEInterface: Failed to read file: ${path}`, error);
      throw error;
    }
  }
  
  /**
   * Write file contents
   */
  async writeFile(path: string, content: string): Promise<void> {
    try {
      await invoke('write_file', { path, content });
      console.log(`✏️ IDEInterface: Wrote file: ${path}`);
    } catch (error) {
      console.error(`❌ IDEInterface: Failed to write file: ${path}`, error);
      throw error;
    }
  }
  
  /**
   * List files in directory
   */
  async listFiles(path: string): Promise<string[]> {
    try {
      const files = await invoke<string[]>('list_files', { path });
      console.log(`📂 IDEInterface: Listed ${files.length} files in: ${path}`);
      return files;
    } catch (error) {
      console.error(`❌ IDEInterface: Failed to list files: ${path}`, error);
      throw error;
    }
  }
  
  /**
   * Check if file exists
   */
  async fileExists(path: string): Promise<boolean> {
    try {
      await this.readFile(path);
      return true;
    } catch {
      return false;
    }
  }
  
  // ============================================================================
  // Editor Operations (Future)
  // ============================================================================
  
  /**
   * Open file in editor
   * TODO: Implement when editor integration is ready
   */
  async openFile(path: string): Promise<void> {
    console.log(`📄 IDEInterface: Open file requested: ${path}`);
    // This would emit an event to the GUI to open the file
    // For now, just log
  }
  
  /**
   * Get currently active file
   * TODO: Implement when editor integration is ready
   */
  async getActiveFile(): Promise<string | null> {
    console.log('📍 IDEInterface: Get active file requested');
    // This would query the GUI for the active file
    // For now, return null
    return null;
  }
  
  /**
   * Get all open files
   * TODO: Implement when editor integration is ready
   */
  async getOpenFiles(): Promise<string[]> {
    console.log('📑 IDEInterface: Get open files requested');
    // This would query the GUI for open files
    // For now, return empty array
    return [];
  }
  
  // ============================================================================
  // Terminal Operations (Future)
  // ============================================================================
  
  /**
   * Execute terminal command
   * TODO: Implement when terminal integration is ready
   */
  async executeCommand(command: string): Promise<string> {
    console.log(`⚡ IDEInterface: Execute command requested: ${command}`);
    // This would execute a command in the terminal
    // For now, just log
    return '';
  }
}
