// services/snippetManager.ts - Code snippet yönetimi

export interface Snippet {
  id: string;
  name: string;
  description: string;
  language: string;
  code: string;
  tags: string[];
  createdAt: number;
  usageCount: number;
}

export class SnippetManager {
  private snippets: Map<string, Snippet> = new Map();
  private readonly STORAGE_KEY = 'corex_snippets';

  constructor() {
    this.loadFromStorage();
    this.addDefaultSnippets();
  }

  /**
   * Snippet ekle
   */
  addSnippet(snippet: Omit<Snippet, 'id' | 'createdAt' | 'usageCount'>): Snippet {
    const newSnippet: Snippet = {
      ...snippet,
      id: this.generateId(),
      createdAt: Date.now(),
      usageCount: 0
    };

    this.snippets.set(newSnippet.id, newSnippet);
    this.saveToStorage();
    
    console.log(`✅ Snippet eklendi: ${newSnippet.name}`);
    return newSnippet;
  }

  /**
   * Snippet güncelle
   */
  updateSnippet(id: string, updates: Partial<Snippet>): boolean {
    const snippet = this.snippets.get(id);
    if (!snippet) return false;

    const updated = { ...snippet, ...updates };
    this.snippets.set(id, updated);
    this.saveToStorage();
    
    console.log(`✅ Snippet güncellendi: ${updated.name}`);
    return true;
  }

  /**
   * Snippet sil
   */
  deleteSnippet(id: string): boolean {
    const deleted = this.snippets.delete(id);
    if (deleted) {
      this.saveToStorage();
      console.log(`🗑️ Snippet silindi: ${id}`);
    }
    return deleted;
  }

  /**
   * Snippet getir
   */
  getSnippet(id: string): Snippet | undefined {
    return this.snippets.get(id);
  }

  /**
   * Tüm snippet'leri getir
   */
  getAllSnippets(): Snippet[] {
    return Array.from(this.snippets.values());
  }

  /**
   * Dile göre filtrele
   */
  getSnippetsByLanguage(language: string): Snippet[] {
    return this.getAllSnippets().filter(s => s.language === language);
  }

  /**
   * Tag'e göre filtrele
   */
  getSnippetsByTag(tag: string): Snippet[] {
    return this.getAllSnippets().filter(s => s.tags.includes(tag));
  }

  /**
   * Arama
   */
  searchSnippets(query: string): Snippet[] {
    const lowerQuery = query.toLowerCase();
    return this.getAllSnippets().filter(s =>
      s.name.toLowerCase().includes(lowerQuery) ||
      s.description.toLowerCase().includes(lowerQuery) ||
      s.code.toLowerCase().includes(lowerQuery) ||
      s.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Snippet kullan (usage count artır)
   */
  useSnippet(id: string): Snippet | undefined {
    const snippet = this.snippets.get(id);
    if (!snippet) return undefined;

    snippet.usageCount++;
    this.snippets.set(id, snippet);
    this.saveToStorage();
    
    return snippet;
  }

  /**
   * En çok kullanılanlar
   */
  getMostUsed(count: number = 10): Snippet[] {
    return this.getAllSnippets()
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, count);
  }

  /**
   * Son eklenenler
   */
  getRecent(count: number = 10): Snippet[] {
    return this.getAllSnippets()
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, count);
  }

  /**
   * Tüm dilleri getir
   */
  getAllLanguages(): string[] {
    const languages = new Set(this.getAllSnippets().map(s => s.language));
    return Array.from(languages).sort();
  }

  /**
   * Tüm tag'leri getir
   */
  getAllTags(): string[] {
    const tags = new Set<string>();
    this.getAllSnippets().forEach(s => s.tags.forEach(tag => tags.add(tag)));
    return Array.from(tags).sort();
  }

  /**
   * İstatistikler
   */
  getStats() {
    const snippets = this.getAllSnippets();
    return {
      total: snippets.length,
      languages: this.getAllLanguages().length,
      tags: this.getAllTags().length,
      totalUsage: snippets.reduce((sum, s) => sum + s.usageCount, 0),
      mostUsed: this.getMostUsed(1)[0]?.name || 'N/A'
    };
  }

  // ===== PRIVATE METHODS =====

  private generateId(): string {
    return `snippet-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  private saveToStorage(): void {
    try {
      const data = Array.from(this.snippets.values());
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('❌ Snippet kaydetme hatası:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data: Snippet[] = JSON.parse(stored);
        data.forEach(snippet => this.snippets.set(snippet.id, snippet));
        console.log(`📂 ${data.length} snippet yüklendi`);
      }
    } catch (error) {
      console.error('❌ Snippet yükleme hatası:', error);
    }
  }

  private addDefaultSnippets(): void {
    // Eğer hiç snippet yoksa, default'ları ekle
    if (this.snippets.size > 0) return;

    const defaults: Array<Omit<Snippet, 'id' | 'createdAt' | 'usageCount'>> = [
      {
        name: 'React Component',
        description: 'Functional React component template',
        language: 'typescript',
        code: `import React from 'react';

interface Props {
  // Props here
}

export default function ComponentName({ }: Props) {
  return (
    <div>
      {/* Content */}
    </div>
  );
}`,
        tags: ['react', 'component', 'typescript']
      },
      {
        name: 'Async Function',
        description: 'Async/await function with error handling',
        language: 'typescript',
        code: `async function functionName() {
  try {
    const result = await someAsyncOperation();
    return result;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}`,
        tags: ['async', 'error-handling', 'typescript']
      },
      {
        name: 'Express Route',
        description: 'Express.js route handler',
        language: 'typescript',
        code: `app.get('/api/endpoint', async (req, res) => {
  try {
    const data = await fetchData();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});`,
        tags: ['express', 'api', 'node']
      },
      {
        name: 'Rust Function',
        description: 'Basic Rust function',
        language: 'rust',
        code: `fn function_name(param: &str) -> Result<String, Error> {
    // Implementation
    Ok(String::from("result"))
}`,
        tags: ['rust', 'function']
      },
      {
        name: 'Python Class',
        description: 'Python class template',
        language: 'python',
        code: `class ClassName:
    def __init__(self, param):
        self.param = param
    
    def method_name(self):
        pass`,
        tags: ['python', 'class', 'oop']
      }
    ];

    defaults.forEach(snippet => this.addSnippet(snippet));
    console.log(`✅ ${defaults.length} default snippet eklendi`);
  }
}

// Singleton instance
export const snippetManager = new SnippetManager();
