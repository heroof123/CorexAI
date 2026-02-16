// services/undoRedoManager.ts - Undo/Redo sistemi

interface HistoryEntry {
  type: 'file-edit' | 'file-create' | 'file-delete' | 'action-accept' | 'action-reject';
  timestamp: number;
  data: any;
  description: string;
}

export class UndoRedoManager {
  private undoStack: HistoryEntry[] = [];
  private redoStack: HistoryEntry[] = [];
  private maxHistorySize = 50;

  /**
   * Yeni bir aksiyon kaydet
   */
  recordAction(
    type: HistoryEntry['type'],
    data: HistoryEntry['data'],
    description: string
  ): void {
    const entry: HistoryEntry = {
      type,
      timestamp: Date.now(),
      data,
      description
    };

    this.undoStack.push(entry);
    
    // Redo stack'i temizle (yeni aksiyon sonrası redo yapılamaz)
    this.redoStack = [];

    // History boyutunu kontrol et
    if (this.undoStack.length > this.maxHistorySize) {
      this.undoStack.shift(); // En eski entry'yi sil
    }

    console.log(`📝 Action recorded: ${description}`);
  }

  /**
   * Son aksiyonu geri al
   */
  undo(): HistoryEntry | null {
    const entry = this.undoStack.pop();
    if (!entry) {
      console.log("⚠️ Undo stack boş");
      return null;
    }

    this.redoStack.push(entry);
    console.log(`↩️ Undo: ${entry.description}`);
    return entry;
  }

  /**
   * Geri alınan aksiyonu yeniden yap
   */
  redo(): HistoryEntry | null {
    const entry = this.redoStack.pop();
    if (!entry) {
      console.log("⚠️ Redo stack boş");
      return null;
    }

    this.undoStack.push(entry);
    console.log(`↪️ Redo: ${entry.description}`);
    return entry;
  }

  /**
   * Undo yapılabilir mi?
   */
  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  /**
   * Redo yapılabilir mi?
   */
  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  /**
   * Son N aksiyonu getir (history görüntüleme için)
   */
  getHistory(count: number = 10): HistoryEntry[] {
    return this.undoStack.slice(-count).reverse();
  }

  /**
   * Redo stack'i getir
   */
  getRedoHistory(count: number = 10): HistoryEntry[] {
    return this.redoStack.slice(-count).reverse();
  }

  /**
   * History'yi temizle
   */
  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
    console.log("🗑️ History temizlendi");
  }

  /**
   * History istatistikleri
   */
  getStats() {
    return {
      undoCount: this.undoStack.length,
      redoCount: this.redoStack.length,
      totalActions: this.undoStack.length + this.redoStack.length,
      canUndo: this.canUndo(),
      canRedo: this.canRedo()
    };
  }

  /**
   * Belirli bir zamana geri dön (time travel)
   */
  undoUntil(timestamp: number): HistoryEntry[] {
    const undoneEntries: HistoryEntry[] = [];

    while (this.undoStack.length > 0) {
      const lastEntry = this.undoStack[this.undoStack.length - 1];
      if (lastEntry.timestamp <= timestamp) {
        break;
      }
      const entry = this.undo();
      if (entry) {
        undoneEntries.push(entry);
      }
    }

    return undoneEntries;
  }

  /**
   * Belirli bir tipteki tüm aksiyonları bul
   */
  findActionsByType(type: HistoryEntry['type']): HistoryEntry[] {
    return this.undoStack.filter(entry => entry.type === type);
  }

  /**
   * Son N dakikadaki aksiyonları getir
   */
  getRecentActions(minutes: number = 5): HistoryEntry[] {
    const cutoffTime = Date.now() - (minutes * 60 * 1000);
    return this.undoStack.filter(entry => entry.timestamp >= cutoffTime);
  }
}

// Singleton instance
export const undoRedoManager = new UndoRedoManager();

// Helper functions for common actions

export function recordFileEdit(filePath: string, oldContent: string, newContent: string): void {
  undoRedoManager.recordAction(
    'file-edit',
    { filePath, oldContent, newContent },
    `Dosya düzenlendi: ${filePath.split(/[\\/]/).pop()}`
  );
}

export function recordFileCreate(filePath: string, content: string): void {
  undoRedoManager.recordAction(
    'file-create',
    { filePath, content },
    `Dosya oluşturuldu: ${filePath.split(/[\\/]/).pop()}`
  );
}

export function recordFileDelete(filePath: string, content: string): void {
  undoRedoManager.recordAction(
    'file-delete',
    { filePath, content },
    `Dosya silindi: ${filePath.split(/[\\/]/).pop()}`
  );
}

export function recordActionAccept(actionId: string, action: { filePath: string; content: string }): void {
  undoRedoManager.recordAction(
    'action-accept',
    { actionId, action },
    `Değişiklik kabul edildi: ${action.filePath?.split(/[\\/]/).pop() || 'unknown'}`
  );
}

export function recordActionReject(actionId: string, action: { filePath: string; content: string }): void {
  undoRedoManager.recordAction(
    'action-reject',
    { actionId, action },
    `Değişiklik reddedildi: ${action.filePath?.split(/[\\/]/).pop() || 'unknown'}`
  );
}
