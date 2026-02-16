import { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useLayout } from '../contexts/LayoutContext';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSelector from './LanguageSelector';

interface Settings {
  editor: {
    fontSize: number;
    fontFamily: string;
    tabSize: number;
    insertSpaces: boolean;
    wordWrap: boolean;
    lineNumbers: boolean;
    minimap: boolean;
    autoSave: boolean;
    autoSaveDelay: number;
  };
  ui: {
    theme: string;
    language: string;
    showWelcomeScreen: boolean;
    compactMode: boolean;
    animations: boolean;
  };
  git: {
    autoFetch: boolean;
    showInlineBlame: boolean;
    confirmSync: boolean;
  };
  ai: {
    defaultModel: string;
    autoSuggestions: boolean;
    contextLines: number;
    maxTokens: number;
  };
  shortcuts: Record<string, string>;
}

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onShowLayoutPresets?: () => void;
}

export default function SettingsPanel({ isOpen, onClose, onShowLayoutPresets }: SettingsPanelProps) {
  const { theme, setTheme, availableThemes } = useTheme();
  const { resetLayout } = useLayout();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'editor' | 'ui' | 'git' | 'ai' | 'shortcuts'>('editor');
  const [settings, setSettings] = useState<Settings>({
    editor: {
      fontSize: 14,
      fontFamily: 'Consolas, Monaco, monospace',
      tabSize: 2,
      insertSpaces: true,
      wordWrap: false,
      lineNumbers: true,
      minimap: true,
      autoSave: true,
      autoSaveDelay: 1000
    },
    ui: {
      theme: 'dark',
      language: 'tr',
      showWelcomeScreen: true,
      compactMode: false,
      animations: true
    },
    git: {
      autoFetch: true,
      showInlineBlame: false,
      confirmSync: true
    },
    ai: {
      defaultModel: 'main',
      autoSuggestions: true,
      contextLines: 50,
      maxTokens: 2000
    },
    shortcuts: {
      'save': 'Ctrl+S',
      'open': 'Ctrl+O',
      'find': 'Ctrl+F',
      'replace': 'Ctrl+H',
      'commandPalette': 'Ctrl+Shift+P',
      'quickOpen': 'Ctrl+P',
      'toggleSidebar': 'Ctrl+B',
      'toggleTerminal': 'Ctrl+`',
      'newFile': 'Ctrl+N',
      'closeFile': 'Ctrl+W'
    }
  });

  const [editingShortcut, setEditingShortcut] = useState<string | null>(null);
  const [tempShortcut, setTempShortcut] = useState('');

  // Load settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('corex-settings');
    if (saved) {
      try {
        const parsedSettings = JSON.parse(saved);
        setSettings(prev => ({ ...prev, ...parsedSettings }));
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    }
  }, []);

  // ESC tuşu ile kapatma
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  // Save settings to localStorage
  const saveSettings = (newSettings: Settings) => {
    setSettings(newSettings);
    localStorage.setItem('corex-settings', JSON.stringify(newSettings));
  };

  const updateSetting = (category: keyof Settings, key: string, value: any) => {
    const newSettings = {
      ...settings,
      [category]: {
        ...settings[category],
        [key]: value
      }
    };
    saveSettings(newSettings);
  };

  const resetToDefaults = () => {
    if (confirm('Tüm ayarları varsayılan değerlere sıfırlamak istediğinizden emin misiniz?')) {
      localStorage.removeItem('corex-settings');
      localStorage.removeItem('corex-theme');
      localStorage.removeItem('corex-layout');
      
      // Reset to default settings
      const defaultSettings: Settings = {
        editor: {
          fontSize: 14,
          fontFamily: 'Consolas, Monaco, monospace',
          tabSize: 2,
          insertSpaces: true,
          wordWrap: false,
          lineNumbers: true,
          minimap: true,
          autoSave: true,
          autoSaveDelay: 1000
        },
        ui: {
          theme: 'dark',
          language: 'tr',
          showWelcomeScreen: true,
          compactMode: false,
          animations: true
        },
        git: {
          autoFetch: true,
          showInlineBlame: false,
          confirmSync: true
        },
        ai: {
          defaultModel: 'main',
          autoSuggestions: true,
          contextLines: 50,
          maxTokens: 2000
        },
        shortcuts: {
          'save': 'Ctrl+S',
          'open': 'Ctrl+O',
          'find': 'Ctrl+F',
          'replace': 'Ctrl+H',
          'commandPalette': 'Ctrl+Shift+P',
          'quickOpen': 'Ctrl+P',
          'toggleSidebar': 'Ctrl+B',
          'toggleTerminal': 'Ctrl+`',
          'newFile': 'Ctrl+N',
          'closeFile': 'Ctrl+W'
        }
      };
      
      setSettings(defaultSettings);
      setTheme('dark');
      resetLayout();
      
      alert('Ayarlar sıfırlandı!');
    }
  };

  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'corex-settings.json';
    link.click();
    
    URL.revokeObjectURL(url);
  };

  const importSettings = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target?.result as string);
          saveSettings(imported);
          alert('Ayarlar içe aktarıldı!');
        } catch (error) {
          alert('Geçersiz ayar dosyası!');
        }
      };
      reader.readAsText(file);
    };
    
    input.click();
  };

  const handleShortcutEdit = (action: string) => {
    setEditingShortcut(action);
    setTempShortcut(settings.shortcuts[action] || '');
  };

  const saveShortcut = () => {
    if (editingShortcut && tempShortcut) {
      updateSetting('shortcuts', editingShortcut, tempShortcut);
      setEditingShortcut(null);
      setTempShortcut('');
    }
  };

  const cancelShortcutEdit = () => {
    setEditingShortcut(null);
    setTempShortcut('');
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      
      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
          {/* Header */}
          <div className="h-12 bg-[var(--color-background)] border-b border-[var(--color-border)] flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚙️</span>
              <h2 className="text-lg font-semibold text-[var(--color-text)]">
                Ayarlar
              </h2>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={exportSettings}
                className="px-3 py-1.5 text-xs bg-[var(--color-secondary)] text-white rounded hover:opacity-80 transition-opacity"
              >
                📤 Dışa Aktar
              </button>
              <button
                onClick={importSettings}
                className="px-3 py-1.5 text-xs bg-[var(--color-info)] text-white rounded hover:opacity-80 transition-opacity"
              >
                📥 İçe Aktar
              </button>
              <button
                onClick={resetToDefaults}
                className="px-3 py-1.5 text-xs bg-[var(--color-warning)] text-white rounded hover:opacity-80 transition-opacity"
              >
                🔄 Sıfırla
              </button>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center hover:bg-[var(--color-hover)] rounded transition-colors"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="flex h-[calc(80vh-3rem)]">
            {/* Sidebar */}
            <div className="w-48 bg-[var(--color-background)] border-r border-[var(--color-border)] p-2">
              {[
                { id: 'editor', label: 'Editör', icon: '📝' },
                { id: 'ui', label: 'Arayüz', icon: '🎨' },
                { id: 'git', label: 'Git', icon: '📊' },
                { id: 'ai', label: 'AI', icon: '🤖' },
                { id: 'shortcuts', label: 'Kısayollar', icon: '⌨️' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full text-left px-3 py-2 rounded text-sm transition-colors flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'bg-[var(--color-primary)] text-white'
                      : 'hover:bg-[var(--color-hover)]'
                  }`}
                >
                  <span className="text-sm">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'editor' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <span className="text-base">📝</span>
                    <span>Editör Ayarları</span>
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">Font Boyutu</label>
                      <input
                        type="number"
                        min="8"
                        max="24"
                        value={settings.editor.fontSize}
                        onChange={(e) => updateSetting('editor', 'fontSize', Number(e.target.value))}
                        className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded focus:border-[var(--color-primary)] outline-none"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Font Ailesi</label>
                      <select
                        value={settings.editor.fontFamily}
                        onChange={(e) => updateSetting('editor', 'fontFamily', e.target.value)}
                        className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded focus:border-[var(--color-primary)] outline-none"
                      >
                        <option value="Consolas, Monaco, monospace">Consolas</option>
                        <option value="'Fira Code', monospace">Fira Code</option>
                        <option value="'Source Code Pro', monospace">Source Code Pro</option>
                        <option value="'JetBrains Mono', monospace">JetBrains Mono</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Tab Boyutu</label>
                      <select
                        value={settings.editor.tabSize}
                        onChange={(e) => updateSetting('editor', 'tabSize', Number(e.target.value))}
                        className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded focus:border-[var(--color-primary)] outline-none"
                      >
                        <option value={2}>2 Boşluk</option>
                        <option value={4}>4 Boşluk</option>
                        <option value={8}>8 Boşluk</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Otomatik Kaydetme Gecikmesi (ms)</label>
                      <input
                        type="number"
                        min="500"
                        max="5000"
                        step="100"
                        value={settings.editor.autoSaveDelay}
                        onChange={(e) => updateSetting('editor', 'autoSaveDelay', Number(e.target.value))}
                        className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded focus:border-[var(--color-primary)] outline-none"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {[
                      { key: 'insertSpaces', label: 'Tab yerine boşluk kullan' },
                      { key: 'wordWrap', label: 'Kelime kaydırma' },
                      { key: 'lineNumbers', label: 'Satır numaraları' },
                      { key: 'minimap', label: 'Minimap' },
                      { key: 'autoSave', label: 'Otomatik kaydetme' }
                    ].map(option => (
                      <label key={option.key} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.editor[option.key as keyof typeof settings.editor] as boolean}
                          onChange={(e) => updateSetting('editor', option.key, e.target.checked)}
                          className="rounded"
                        />
                        <span>{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'ui' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <span className="text-base">🎨</span>
                    <span>Arayüz Ayarları</span>
                  </h3>
                  
                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">Tema</label>
                      <select
                        value={theme}
                        onChange={(e) => {
                          setTheme(e.target.value as any);
                          updateSetting('ui', 'theme', e.target.value);
                        }}
                        className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded focus:border-[var(--color-primary)] outline-none"
                      >
                        {availableThemes.map(themeName => (
                          <option key={themeName} value={themeName}>
                            {themeName.charAt(0).toUpperCase() + themeName.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">{t('language.title')}</label>
                      <LanguageSelector compact={true} />
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {[
                      { key: 'showWelcomeScreen', label: 'Karşılama ekranını göster' },
                      { key: 'compactMode', label: 'Kompakt mod' },
                      { key: 'animations', label: 'Animasyonlar' }
                    ].map(option => (
                      <label key={option.key} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.ui[option.key as keyof typeof settings.ui] as boolean}
                          onChange={(e) => updateSetting('ui', option.key, e.target.checked)}
                          className="rounded"
                        />
                        <span>{option.label}</span>
                      </label>
                    ))}
                  </div>
                  
                  <div className="border-t border-[var(--color-border)] pt-4">
                    <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <span className="text-xs">🎨</span>
                      <span>Düzen Yönetimi</span>
                    </h4>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          onClose();
                          onShowLayoutPresets?.();
                        }}
                        className="px-3 py-2 bg-[var(--color-primary)] text-white rounded hover:opacity-80 transition-opacity text-sm"
                      >
                        <span className="text-xs">🎨</span>
                        <span>Düzen Presetleri</span>
                      </button>
                      <button
                        onClick={resetLayout}
                        className="px-3 py-2 bg-[var(--color-secondary)] text-white rounded hover:opacity-80 transition-opacity text-sm"
                      >
                        🔄 Düzeni Sıfırla
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'git' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <span className="text-base">📊</span>
                    <span>Git Ayarları</span>
                  </h3>
                  
                  <div className="space-y-3">
                    {[
                      { key: 'autoFetch', label: 'Otomatik fetch' },
                      { key: 'showInlineBlame', label: 'Satır içi blame göster' },
                      { key: 'confirmSync', label: 'Sync işlemlerini onayla' }
                    ].map(option => (
                      <label key={option.key} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.git[option.key as keyof typeof settings.git] as boolean}
                          onChange={(e) => updateSetting('git', option.key, e.target.checked)}
                          className="rounded"
                        />
                        <span>{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'ai' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <span className="text-base">🤖</span>
                    <span>AI Ayarları</span>
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">Varsayılan Model</label>
                      <select
                        value={settings.ai.defaultModel}
                        onChange={(e) => updateSetting('ai', 'defaultModel', e.target.value)}
                        className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded focus:border-[var(--color-primary)] outline-none"
                      >
                        <option value="main">Ana Model</option>
                        <option value="fast">Hızlı Model</option>
                        <option value="planner">Planlayıcı</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Bağlam Satır Sayısı</label>
                      <input
                        type="number"
                        min="10"
                        max="200"
                        value={settings.ai.contextLines}
                        onChange={(e) => updateSetting('ai', 'contextLines', Number(e.target.value))}
                        className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded focus:border-[var(--color-primary)] outline-none"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Maksimum Token</label>
                      <input
                        type="number"
                        min="500"
                        max="8000"
                        step="100"
                        value={settings.ai.maxTokens}
                        onChange={(e) => updateSetting('ai', 'maxTokens', Number(e.target.value))}
                        className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded focus:border-[var(--color-primary)] outline-none"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.ai.autoSuggestions}
                        onChange={(e) => updateSetting('ai', 'autoSuggestions', e.target.checked)}
                        className="rounded"
                      />
                      <span>Otomatik öneriler</span>
                    </label>
                  </div>
                </div>
              )}

              {activeTab === 'shortcuts' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <span className="text-base">⌨️</span>
                    <span>Klavye Kısayolları</span>
                  </h3>
                  
                  <div className="space-y-3">
                    {Object.entries(settings.shortcuts).map(([action, shortcut]) => (
                      <div key={action} className="flex items-center justify-between p-3 bg-[var(--color-background)] border border-[var(--color-border)] rounded">
                        <span className="font-medium capitalize">
                          {action.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        
                        {editingShortcut === action ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={tempShortcut}
                              onChange={(e) => setTempShortcut(e.target.value)}
                              className="px-2 py-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded text-sm font-mono"
                              placeholder="Ctrl+S"
                              autoFocus
                            />
                            <button
                              onClick={saveShortcut}
                              className="px-2 py-1 bg-[var(--color-success)] text-white rounded text-xs"
                            >
                              ✓
                            </button>
                            <button
                              onClick={cancelShortcutEdit}
                              className="px-2 py-1 bg-[var(--color-error)] text-white rounded text-xs"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <kbd className="px-2 py-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded text-sm font-mono">
                              {shortcut}
                            </kbd>
                            <button
                              onClick={() => handleShortcutEdit(action)}
                              className="px-2 py-1 text-xs text-[var(--color-primary)] hover:underline"
                            >
                              Düzenle
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}