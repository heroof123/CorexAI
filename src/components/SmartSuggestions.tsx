import { useState, useEffect } from "react";

interface SmartSuggestionsProps {
  input: string;
  currentFile?: string;
  projectContext?: {
    name: string;
    type: string;
    mainLanguages: string[];
  };
  onSuggestionSelect: (suggestion: string) => void;
}

interface Suggestion {
  text: string;
  description: string;
  icon: string;
}

export default function SmartSuggestions({
  input,
  currentFile,
  projectContext,
  onSuggestionSelect,
}: SmartSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (input.length < 2) {
      setIsVisible(false);
      return;
    }

    const newSuggestions = generateSuggestions(input, currentFile, projectContext);
    setSuggestions(newSuggestions);
    setIsVisible(newSuggestions.length > 0);
  }, [input, currentFile, projectContext]);

  if (!isVisible) return null;

  return (
    <div className="absolute bottom-full left-0 right-0 mb-2 bg-[#252525] border border-neutral-700 rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
      <div className="p-2">
        <div className="text-xs text-neutral-500 mb-2 px-2">💡 Öneriler</div>
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => {
              onSuggestionSelect(suggestion.text);
              setIsVisible(false);
            }}
            className="w-full text-left px-3 py-2 hover:bg-neutral-700 rounded text-sm flex items-start gap-2 transition-colors"
          >
            <span className="text-base mt-0.5">{suggestion.icon}</span>
            <div>
              <div className="text-neutral-200">{suggestion.text}</div>
              <div className="text-xs text-neutral-500">{suggestion.description}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function generateSuggestions(
  input: string,
  currentFile?: string,
  projectContext?: { name: string; type: string; mainLanguages: string[] }
): Suggestion[] {
  const lowerInput = input.toLowerCase();
  const suggestions: Suggestion[] = [];

  // File-specific suggestions
  if (currentFile) {
    const fileName = currentFile.split(/[\\/]/).pop() || currentFile;
    
    if (lowerInput.includes('açıkla') || lowerInput.includes('explain')) {
      suggestions.push({
        text: `${fileName} dosyasını detaylı açıkla`,
        description: "Dosyanın amacını ve işlevini açıkla",
        icon: "📖"
      });
    }
    
    if (lowerInput.includes('hata') || lowerInput.includes('error') || lowerInput.includes('bug')) {
      suggestions.push({
        text: `${fileName} dosyasında hata var mı kontrol et`,
        description: "Kod hatalarını ve potansiyel sorunları bul",
        icon: "🐛"
      });
    }
    
    if (lowerInput.includes('test')) {
      suggestions.push({
        text: `${fileName} için unit test yaz`,
        description: "Kapsamlı test dosyası oluştur",
        icon: "🧪"
      });
    }
    
    if (lowerInput.includes('optimize') || lowerInput.includes('iyileştir')) {
      suggestions.push({
        text: `${fileName} dosyasını optimize et`,
        description: "Performans ve kod kalitesini artır",
        icon: "⚡"
      });
    }
  }

  // Project-specific suggestions
  if (projectContext) {
    if (lowerInput.includes('proje') || lowerInput.includes('project')) {
      suggestions.push({
        text: `${projectContext.name} projesinin mimarisini açıkla`,
        description: "Proje yapısı ve bileşenler",
        icon: "🏗️"
      });
    }
    
    // Language-specific suggestions
    if (projectContext.mainLanguages.includes('TypeScript')) {
      if (lowerInput.includes('type') || lowerInput.includes('tip')) {
        suggestions.push({
          text: "TypeScript tiplerini iyileştir",
          description: "Tip güvenliğini artır",
          icon: "🔷"
        });
      }
    }
    
    if (projectContext.mainLanguages.includes('React')) {
      if (lowerInput.includes('component') || lowerInput.includes('bileşen')) {
        suggestions.push({
          text: "Yeni React bileşeni oluştur",
          description: "Modern React bileşeni şablonu",
          icon: "⚛️"
        });
      }
    }
  }

  // General suggestions based on input
  if (lowerInput.includes('dark') || lowerInput.includes('karanlık')) {
    suggestions.push({
      text: "Dark mode özelliği ekle",
      description: "Tema değiştirme sistemi",
      icon: "🌙"
    });
  }
  
  if (lowerInput.includes('api')) {
    suggestions.push({
      text: "API entegrasyonu yap",
      description: "REST API bağlantısı kur",
      icon: "🔌"
    });
  }
  
  if (lowerInput.includes('database') || lowerInput.includes('veritabanı')) {
    suggestions.push({
      text: "Veritabanı şeması tasarla",
      description: "Veri modeli oluştur",
      icon: "🗄️"
    });
  }
  
  if (lowerInput.includes('auth') || lowerInput.includes('giriş')) {
    suggestions.push({
      text: "Kullanıcı authentication sistemi ekle",
      description: "Giriş/çıkış ve yetkilendirme",
      icon: "🔐"
    });
  }

  // Common development tasks
  const commonTasks = [
    {
      keywords: ['refactor', 'düzenle'],
      text: "Kodu refactor et",
      description: "Kod kalitesini artır",
      icon: "🔧"
    },
    {
      keywords: ['document', 'dokümantasyon'],
      text: "Kod dokümantasyonu yaz",
      description: "README ve kod yorumları",
      icon: "📝"
    },
    {
      keywords: ['performance', 'performans'],
      text: "Performans optimizasyonu yap",
      description: "Hız ve verimlilik artışı",
      icon: "🚀"
    }
  ];

  commonTasks.forEach(task => {
    if (task.keywords.some(keyword => lowerInput.includes(keyword))) {
      suggestions.push({
        text: task.text,
        description: task.description,
        icon: task.icon
      });
    }
  });

  // Limit to 5 suggestions
  return suggestions.slice(0, 5);
}