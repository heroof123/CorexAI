// extension/ide.ts
// IDE Interface - Provides IDE operations to Core

import { invoke } from "@tauri-apps/api/core";

/**
 * IDE Interface
 * Provides file and editor operations to the Core
 */
export class IDEInterface {
  constructor() {
    console.log("💻 IDEInterface: Initialized");
  }

  // ============================================================================
  // File Operations
  // ============================================================================

  /**
   * Read file contents
   */
  async readFile(path: string): Promise<string> {
    try {
      const content = await invoke<string>("read_file", { path });
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
      await invoke("write_file", { path, content });
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
      const files = await invoke<string[]>("list_files", { path });
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
  // Editor Operations
  // ============================================================================

  /**
   * Open file in editor
   * Dispatches event that the GUI can listen to
   */
  async openFile(path: string): Promise<void> {
    console.log(`📄 IDEInterface: Open file requested: ${path}`);
    // Dispatch event for GUI to handle
    window.dispatchEvent(
      new CustomEvent("corex-open-file", {
        detail: { path },
      })
    );
  }

  /**
   * Get currently active file
   * Returns the last opened file path from localStorage
   */
  async getActiveFile(): Promise<string | null> {
    try {
      const activeFile = localStorage.getItem("corex_active_file");
      return activeFile || null;
    } catch {
      return null;
    }
  }

  /**
   * Get all open files
   * Returns array of open files from localStorage
   */
  async getOpenFiles(): Promise<string[]> {
    try {
      const openFiles = localStorage.getItem("corex_open_files");
      return openFiles ? JSON.parse(openFiles) : [];
    } catch {
      return [];
    }
  }

  // ============================================================================
  // Terminal Operations
  // ============================================================================

  /**
   * Execute terminal command
   * Dispatches event that the terminal panel can handle
   */
  async executeCommand(command: string): Promise<string> {
    console.log(`⚡ IDEInterface: Execute command requested: ${command}`);

    // Dispatch event for terminal to handle
    window.dispatchEvent(
      new CustomEvent("corex-execute-command", {
        detail: { command },
      })
    );

    return "Command dispatched to terminal";
  }
}
