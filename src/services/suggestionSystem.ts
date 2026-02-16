// services/suggestionSystem.ts - AI Öneri Sistemi
import { callAI } from "./aiProvider";
import { FileIndex } from "../types/index";

export interface Suggestion {
  id: string;
  type: 'feature' | 'improvement' | 'fix' | 'optimization';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  estimatedTime: string;
  files: string[];
  code?: string;
}

export class SuggestionSystem {
  private fileIndex: FileIndex[];
  private projectPath: string;

  constructor(fileIndex: FileIndex[], projectPath: string) {
    this.fileIndex = fileIndex;
    this.projectPath = projectPath;
  }

  // Ana öneri sistemi
  async generateSuggestions(userMessage: string): Promise<Suggestion[]> {
    console.log("💡 Öneriler oluşturuluyor...");

    const prompt = `Sen bir expert developer mentor'usun. Kullanıcının projesini analiz et ve yararlı öneriler sun.

KULLANICI MESAJI: ${userMessage}

PROJE ANALİZİ:
- Proje yolu: ${this.projectPath}
- Toplam dosya: ${this.fileIndex.length}
- Mevcut dosyalar: ${this.fileIndex.slice(0, 15).map(f => f.path).join(', ')}

PROJE İÇERİĞİ (Son 5 dosya):
${this.fileIndex.slice(-5).map(f => `
--- ${f.path} ---
${f.content.substring(0, 500)}...
`).join('\n')}

GÖREV:
Kullanıcının mesajına ve proje durumuna göre 3-5 yararlı öneri sun:

1. **Özellik Önerileri** - Projeye eklenebilecek yeni özellikler
2. **İyileştirme Önerileri** - Mevcut kodun iyileştirilmesi
3. **Hata Düzeltme** - Potansiyel sorunlar ve çözümleri
4. **Optimizasyon** - Performans ve kod kalitesi iyileştirmeleri

ÇIKTI FORMATI (JSON):
{
  "suggestions": [
    {
      "id": "suggestion-1",
      "type": "feature",
      "title": "Film Favorileri Sistemi",
      "description": "Kullanıcıların favori filmlerini kaydetmesi için bir sistem ekleyin. LocalStorage kullanarak kalıcı hale getirin.",
      "priority": "high",
      "estimatedTime": "30 dakika",
      "files": ["src/components/MovieCard.tsx", "src/hooks/useFavorites.ts"],
      "code": "// Örnek kod snippet buraya"
    },
    {
      "id": "suggestion-2", 
      "type": "improvement",
      "title": "Loading State İyileştirmesi",
      "description": "Daha iyi bir loading animasyonu ekleyin ve skeleton loader kullanın.",
      "priority": "medium",
      "estimatedTime": "15 dakika",
      "files": ["src/components/LoadingSpinner.tsx"],
      "code": "// Skeleton loader kodu"
    }
  ]
}

ÖNEMLİ:
- Önerilerin kullanıcının seviyesine uygun olmasına dikkat et
- Pratik ve uygulanabilir öneriler sun
- Her öneri için kısa kod örneği ver
- Öncelikleri gerçekçi belirle

ŞİMDİ ÖNERİLERİ OLUŞTUR:`;

    try {
      const response = await callAI(prompt, "main");
      
      // JSON'u extract et
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.warn("AI'dan JSON çıkarılamadı, varsayılan öneriler oluşturuluyor");
        return this.generateDefaultSuggestions(userMessage);
      }

      const data = JSON.parse(jsonMatch[0]);
      
      if (data.suggestions && Array.isArray(data.suggestions)) {
        console.log(`💡 ${data.suggestions.length} öneri oluşturuldu`);
        return data.suggestions;
      }

      return this.generateDefaultSuggestions(userMessage);

    } catch (error) {
      console.error("Öneri oluşturma hatası:", error);
      return this.generateDefaultSuggestions(userMessage);
    }
  }

  // Varsayılan öneriler (AI başarısız olursa)
  private generateDefaultSuggestions(userMessage: string): Suggestion[] {
    const suggestions: Suggestion[] = [];

    // Mesaja göre akıllı öneriler
    if (userMessage.toLowerCase().includes('film') || userMessage.toLowerCase().includes('movie')) {
      suggestions.push({
        id: 'movie-search',
        type: 'feature',
        title: 'Film Arama Özelliği',
        description: 'Kullanıcıların film arayabilmesi için arama çubuğu ekleyin',
        priority: 'high',
        estimatedTime: '20 dakika',
        files: ['src/components/SearchBar.tsx'],
        code: 'const [searchTerm, setSearchTerm] = useState("");'
      });

      suggestions.push({
        id: 'movie-favorites',
        type: 'feature', 
        title: 'Favori Filmler',
        description: 'Kullanıcıların favori filmlerini kaydetmesi için kalp ikonu ekleyin',
        priority: 'medium',
        estimatedTime: '25 dakika',
        files: ['src/hooks/useFavorites.ts', 'src/components/FavoriteButton.tsx'],
        code: 'const [favorites, setFavorites] = useState<number[]>([]);'
      });
    }

    if (userMessage.toLowerCase().includes('todo') || userMessage.toLowerCase().includes('task')) {
      suggestions.push({
        id: 'todo-categories',
        type: 'feature',
        title: 'Görev Kategorileri',
        description: 'Görevleri kategorilere ayırma özelliği ekleyin (İş, Kişisel, Alışveriş)',
        priority: 'high',
        estimatedTime: '30 dakika',
        files: ['src/types/Todo.ts', 'src/components/CategoryFilter.tsx'],
        code: 'interface Todo { id: number; text: string; category: string; }'
      });
    }

    // Genel iyileştirme önerileri
    suggestions.push({
      id: 'responsive-design',
      type: 'improvement',
      title: 'Responsive Tasarım',
      description: 'Mobil cihazlar için responsive tasarım iyileştirmeleri yapın',
      priority: 'medium',
      estimatedTime: '15 dakika',
      files: ['src/styles/responsive.css'],
      code: '@media (max-width: 768px) { /* mobile styles */ }'
    });

    suggestions.push({
      id: 'error-handling',
      type: 'fix',
      title: 'Hata Yönetimi',
      description: 'Try-catch blokları ve error boundary ekleyin',
      priority: 'high',
      estimatedTime: '20 dakika',
      files: ['src/components/ErrorBoundary.tsx'],
      code: 'class ErrorBoundary extends React.Component { /* error handling */ }'
    });

    return suggestions.slice(0, 4); // En fazla 4 öneri
  }

  // Öneri uygulama
  async applySuggestion(suggestion: Suggestion): Promise<boolean> {
    console.log(`🔧 Öneri uygulanıyor: ${suggestion.title}`);

    const prompt = `Şu öneriyi uygula:

ÖNERİ: ${suggestion.title}
AÇIKLAMA: ${suggestion.description}
DOSYALAR: ${suggestion.files.join(', ')}
ÖRNEK KOD: ${suggestion.code}

MEVCUT PROJE:
${this.fileIndex.slice(-3).map(f => `--- ${f.path} ---\n${f.content.substring(0, 300)}`).join('\n')}

GÖREV:
1. Öneriyi tam olarak uygula
2. Gerekli dosyaları oluştur/güncelle
3. Tam çalışır kod yaz

FORMAT:
src/components/Example.tsx
\`\`\`tsx
// Tam kod buraya
\`\`\`

ÖNERİYİ UYGULA:`;

    try {
      const response = await callAI(prompt, "main");
      
      // Kod bloklarını parse et ve dosyaları oluştur
      const filePattern = /([^\s]+\.(tsx?|jsx?|css|ts|js))\s*```(?:\w+)?\s*([\s\S]*?)```/g;
      let match;
      let filesCreated = 0;

      while ((match = filePattern.exec(response)) !== null) {
        const filePath = match[1].trim();
        const content = match[3].trim();

        if (content.length > 10) {
          const { invoke } = await import("@tauri-apps/api/core");
          await invoke("create_file", { path: filePath, content });
          console.log(`📝 Öneri dosyası oluşturuldu: ${filePath}`);
          filesCreated++;
        }
      }

      return filesCreated > 0;

    } catch (error) {
      console.error("Öneri uygulama hatası:", error);
      return false;
    }
  }
}