// components/KeyboardShortcutsPanel.tsx - Keyboard shortcuts help panel

import { useState } from 'react';
// import { formatShortcut } from '../hooks/useKeyboardShortcuts'; // Gelecekte kullanılacak

interface ShortcutCategory {
  name: string;
  shortcuts: Array<{
    keys: string;
    description: string;
  }>;
}

const SHORTCUTS: ShortcutCategory[] = [
  {
    name: "Genel",
    shortcuts: [
      { keys: "Ctrl+K", description: "Komut paletini aç" },
      { keys: "Ctrl+P", description: "Hızlı dosya aç" },
      { keys: "Ctrl+Shift+P", description: "Komut paleti (gelişmiş)" },
      { keys: "Ctrl+,", description: "Ayarları aç" },
      { keys: "Ctrl+B", description: "Sol sidebar'ı aç/kapat" },
      { keys: "Ctrl+J", description: "Alt paneli aç/kapat" },
      { keys: "F11", description: "Tam ekran" },
      { keys: "Esc", description: "İptal / Kapat" }
    ]
  },
  {
    name: "Dosya İşlemleri",
    shortcuts: [
      { keys: "Ctrl+S", description: "Dosyayı kaydet" },
      { keys: "Ctrl+W", description: "Sekmeyi kapat" },
      { keys: "Ctrl+Shift+S", description: "Tümünü kaydet" },
      { keys: "Ctrl+N", description: "Yeni dosya" },
      { keys: "Ctrl+O", description: "Dosya aç" },
      { keys: "Ctrl+Tab", description: "Sonraki sekme" },
      { keys: "Ctrl+Shift+Tab", description: "Önceki sekme" }
    ]
  },
  {
    name: "Düzenleme",
    shortcuts: [
      { keys: "Ctrl+Z", description: "Geri al" },
      { keys: "Ctrl+Y", description: "Yinele" },
      { keys: "Ctrl+X", description: "Kes" },
      { keys: "Ctrl+C", description: "Kopyala" },
      { keys: "Ctrl+V", description: "Yapıştır" },
      { keys: "Ctrl+A", description: "Tümünü seç" },
      { keys: "Ctrl+F", description: "Bul" },
      { keys: "Ctrl+H", description: "Bul ve değiştir" },
      { keys: "Ctrl+D", description: "Satırı çoğalt" },
      { keys: "Ctrl+/", description: "Satırı yorum yap" }
    ]
  },
  {
    name: "AI & Chat",
    shortcuts: [
      { keys: "Ctrl+L", description: "Chat'i aç/kapat" },
      { keys: "Ctrl+Enter", description: "Mesaj gönder" },
      { keys: "Ctrl+Shift+L", description: "Yeni sohbet" },
      { keys: "Ctrl+Shift+C", description: "Sohbeti temizle" },
      { keys: "Alt+A", description: "AI önerilerini göster" },
      { keys: "Ctrl+Space", description: "AI tamamlama" }
    ]
  },
  {
    name: "Kod Aksiyonları",
    shortcuts: [
      { keys: "Enter", description: "Değişikliği kabul et" },
      { keys: "Esc", description: "Değişikliği reddet" },
      { keys: "Ctrl+Shift+A", description: "Tüm değişiklikleri kabul et" },
      { keys: "Ctrl+Shift+R", description: "Tüm değişiklikleri reddet" }
    ]
  },
  {
    name: "Navigasyon",
    shortcuts: [
      { keys: "Ctrl+G", description: "Satıra git" },
      { keys: "Ctrl+Shift+O", description: "Sembole git" },
      { keys: "F12", description: "Tanıma git" },
      { keys: "Alt+←", description: "Geri git" },
      { keys: "Alt+→", description: "İleri git" },
      { keys: "Ctrl+Shift+E", description: "Explorer'ı göster" },
      { keys: "Ctrl+Shift+F", description: "Dosyalarda ara" }
    ]
  },
  {
    name: "Terminal",
    shortcuts: [
      { keys: "Ctrl+`", description: "Terminal'i aç/kapat" },
      { keys: "Ctrl+Shift+`", description: "Yeni terminal" },
      { keys: "Ctrl+Shift+5", description: "Terminal'i böl" }
    ]
  },
  {
    name: "Debug",
    shortcuts: [
      { keys: "F5", description: "Debug başlat/devam et" },
      { keys: "F9", description: "Breakpoint ekle/kaldır" },
      { keys: "F10", description: "Step over" },
      { keys: "F11", description: "Step into" },
      { keys: "Shift+F11", description: "Step out" },
      { keys: "Shift+F5", description: "Debug'ı durdur" }
    ]
  }
];

interface KeyboardShortcutsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function KeyboardShortcutsPanel({ isOpen, onClose }: KeyboardShortcutsPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filter shortcuts based on search
  const filteredShortcuts = SHORTCUTS.map(category => ({
    ...category,
    shortcuts: category.shortcuts.filter(s => 
      s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.keys.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.shortcuts.length > 0);

  const displayCategories = selectedCategory
    ? filteredShortcuts.filter(c => c.name === selectedCategory)
    : filteredShortcuts;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-[#1e1e1e] rounded-lg shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#252525] px-6 py-4 border-b border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">⌨️ Klavye Kısayolları</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl"
              title="Kapat (Esc)"
            >
              ×
            </button>
          </div>

          {/* Search */}
          <input
            type="text"
            placeholder="Kısayol ara... (örn: 'kaydet', 'Ctrl+S')"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1e1e1e] text-white px-4 py-2 rounded border border-gray-700 focus:outline-none focus:border-blue-500"
            autoFocus
          />
        </div>

        {/* Category Tabs */}
        <div className="bg-[#252525] px-6 py-2 border-b border-gray-700 flex gap-2 overflow-x-auto">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1 rounded text-sm whitespace-nowrap ${
              selectedCategory === null
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-[#1e1e1e]'
            }`}
          >
            Tümü
          </button>
          {SHORTCUTS.map(category => (
            <button
              key={category.name}
              onClick={() => setSelectedCategory(category.name)}
              className={`px-3 py-1 rounded text-sm whitespace-nowrap ${
                selectedCategory === category.name
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-[#1e1e1e]'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-200px)]">
          {displayCategories.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              Kısayol bulunamadı
            </div>
          ) : (
            <div className="space-y-6">
              {displayCategories.map(category => (
                <div key={category.name}>
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <span className="w-1 h-6 bg-blue-600 rounded"></span>
                    {category.name}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {category.shortcuts.map((shortcut, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between bg-[#252525] px-4 py-3 rounded hover:bg-[#2a2a2a] transition-colors"
                      >
                        <span className="text-gray-300 text-sm">{shortcut.description}</span>
                        <kbd className="px-3 py-1 bg-[#1e1e1e] text-gray-400 rounded text-xs font-mono border border-gray-700">
                          {shortcut.keys}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#252525] px-6 py-3 border-t border-gray-700 text-center text-sm text-gray-500">
          <span className="mr-4">💡 İpucu: Kısayolları özelleştirmek için Ayarlar'a gidin</span>
          <kbd className="px-2 py-1 bg-[#1e1e1e] rounded text-xs">Ctrl+,</kbd>
        </div>
      </div>
    </div>
  );
}
