import { useState } from 'react';
import { useLayout } from '../contexts/LayoutContext';

interface LayoutPreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  layout: {
    showLeftSidebar: boolean;
    showRightSidebar: boolean;
    showBottomPanel: boolean;
    leftSidebarWidth: number;
    rightSidebarWidth: number;
    bottomPanelHeight: number;
  };
}

const presets: LayoutPreset[] = [
  {
    id: 'default',
    name: 'Varsayılan',
    description: 'Tüm paneller açık, dengeli düzen',
    icon: '🏠',
    layout: {
      showLeftSidebar: true,
      showRightSidebar: true,
      showBottomPanel: true,
      leftSidebarWidth: 320,
      rightSidebarWidth: 256,
      bottomPanelHeight: 256
    }
  },
  {
    id: 'focus',
    name: 'Odaklanma',
    description: 'Sadece kod editörü, dikkat dağıtıcı yok',
    icon: '🎯',
    layout: {
      showLeftSidebar: false,
      showRightSidebar: false,
      showBottomPanel: false,
      leftSidebarWidth: 320,
      rightSidebarWidth: 256,
      bottomPanelHeight: 256
    }
  },
  {
    id: 'debug',
    name: 'Debug',
    description: 'Alt panel büyük, debug için optimize',
    icon: '🐛',
    layout: {
      showLeftSidebar: true,
      showRightSidebar: true,
      showBottomPanel: true,
      leftSidebarWidth: 280,
      rightSidebarWidth: 200,
      bottomPanelHeight: 400
    }
  },
  {
    id: 'chat',
    name: 'AI Sohbet',
    description: 'Sol panel büyük, AI ile çalışma için',
    icon: '🤖',
    layout: {
      showLeftSidebar: true,
      showRightSidebar: true,
      showBottomPanel: true,
      leftSidebarWidth: 450,
      rightSidebarWidth: 200,
      bottomPanelHeight: 200
    }
  },
  {
    id: 'explorer',
    name: 'Keşif',
    description: 'Dosya ağacı büyük, proje keşfi için',
    icon: '📁',
    layout: {
      showLeftSidebar: true,
      showRightSidebar: true,
      showBottomPanel: true,
      leftSidebarWidth: 250,
      rightSidebarWidth: 400,
      bottomPanelHeight: 180
    }
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Sadece gerekli paneller',
    icon: '✨',
    layout: {
      showLeftSidebar: false,
      showRightSidebar: true,
      showBottomPanel: false,
      leftSidebarWidth: 320,
      rightSidebarWidth: 280,
      bottomPanelHeight: 256
    }
  }
];

interface LayoutPresetsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LayoutPresets({ isOpen, onClose }: LayoutPresetsProps) {
  const {
    showLeftSidebar,
    showRightSidebar,
    showBottomPanel,
    leftSidebarWidth,
    rightSidebarWidth,
    bottomPanelHeight,
    toggleLeftSidebar,
    toggleRightSidebar,
    toggleBottomPanel,
    setLeftSidebarWidth,
    setRightSidebarWidth,
    setBottomPanelHeight,
    resetLayout
  } = useLayout();

  const [customPresets, setCustomPresets] = useState<LayoutPreset[]>([]);

  const applyPreset = (preset: LayoutPreset) => {
    const { layout } = preset;
    
    // Apply visibility settings
    if (showLeftSidebar !== layout.showLeftSidebar) toggleLeftSidebar();
    if (showRightSidebar !== layout.showRightSidebar) toggleRightSidebar();
    if (showBottomPanel !== layout.showBottomPanel) toggleBottomPanel();
    
    // Apply dimensions
    setLeftSidebarWidth(layout.leftSidebarWidth);
    setRightSidebarWidth(layout.rightSidebarWidth);
    setBottomPanelHeight(layout.bottomPanelHeight);
    
    onClose();
  };

  const saveCurrentAsPreset = () => {
    const name = prompt('Preset adı:');
    if (!name) return;

    const newPreset: LayoutPreset = {
      id: `custom-${Date.now()}`,
      name,
      description: 'Özel düzen',
      icon: '⭐',
      layout: {
        showLeftSidebar,
        showRightSidebar,
        showBottomPanel,
        leftSidebarWidth,
        rightSidebarWidth,
        bottomPanelHeight
      }
    };

    setCustomPresets(prev => [...prev, newPreset]);
    
    // Save to localStorage
    const saved = localStorage.getItem('corex-layout-presets');
    const existing = saved ? JSON.parse(saved) : [];
    localStorage.setItem('corex-layout-presets', JSON.stringify([...existing, newPreset]));
  };

  const deleteCustomPreset = (id: string) => {
    setCustomPresets(prev => prev.filter(p => p.id !== id));
    
    // Update localStorage
    const saved = localStorage.getItem('corex-layout-presets');
    if (saved) {
      const existing = JSON.parse(saved);
      const filtered = existing.filter((p: LayoutPreset) => p.id !== id);
      localStorage.setItem('corex-layout-presets', JSON.stringify(filtered));
    }
  };

  // Load custom presets on mount
  useState(() => {
    const saved = localStorage.getItem('corex-layout-presets');
    if (saved) {
      try {
        setCustomPresets(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to load custom presets:', error);
      }
    }
  });

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
          {/* Header */}
          <div className="h-12 bg-[var(--color-background)] border-b border-[var(--color-border)] flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">🎨</span>
              <h2 className="text-lg font-semibold text-[var(--color-text)]">
                Düzen Presetleri
              </h2>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={saveCurrentAsPreset}
                className="px-3 py-1.5 text-xs bg-[var(--color-primary)] text-white rounded hover:opacity-80 transition-opacity"
              >
                💾 Mevcut Düzeni Kaydet
              </button>
              <button
                onClick={resetLayout}
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

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(80vh-3rem)]">
            {/* Built-in Presets */}
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-[var(--color-text)] mb-4 flex items-center gap-2">
                <span>🏗️</span>
                Hazır Düzenler
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {presets.map((preset) => (
                  <div
                    key={preset.id}
                    className="p-4 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg hover:border-[var(--color-primary)] transition-colors cursor-pointer group"
                    onClick={() => applyPreset(preset)}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{preset.icon}</span>
                      <div>
                        <h4 className="font-medium text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors">
                          {preset.name}
                        </h4>
                        <p className="text-xs text-[var(--color-textSecondary)]">
                          {preset.description}
                        </p>
                      </div>
                    </div>
                    
                    {/* Layout Preview */}
                    <div className="mt-3 p-2 bg-[var(--color-surface)] rounded border">
                      <div className="flex h-8 gap-1 text-xs">
                        {preset.layout.showLeftSidebar && (
                          <div className="bg-[var(--color-primary)] opacity-60 rounded flex-shrink-0" style={{ width: '30%' }}>
                            <div className="p-1 text-white text-center">Chat</div>
                          </div>
                        )}
                        <div className="bg-[var(--color-accent)] opacity-60 rounded flex-1">
                          <div className="p-1 text-white text-center">Editor</div>
                        </div>
                        {preset.layout.showRightSidebar && (
                          <div className="bg-[var(--color-secondary)] opacity-60 rounded flex-shrink-0" style={{ width: '25%' }}>
                            <div className="p-1 text-white text-center">Files</div>
                          </div>
                        )}
                      </div>
                      {preset.layout.showBottomPanel && (
                        <div className="mt-1 h-4 bg-[var(--color-warning)] opacity-60 rounded">
                          <div className="p-1 text-white text-center text-xs">Panel</div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Custom Presets */}
            {customPresets.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-[var(--color-text)] mb-4 flex items-center gap-2">
                  <span>⭐</span>
                  Özel Düzenler
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {customPresets.map((preset) => (
                    <div
                      key={preset.id}
                      className="p-4 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg hover:border-[var(--color-primary)] transition-colors group relative"
                    >
                      <button
                        onClick={() => deleteCustomPreset(preset.id)}
                        className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-[var(--color-error)] hover:bg-[var(--color-error)] hover:text-white rounded transition-colors opacity-0 group-hover:opacity-100"
                      >
                        ✕
                      </button>
                      
                      <div
                        className="cursor-pointer"
                        onClick={() => applyPreset(preset)}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl">{preset.icon}</span>
                          <div>
                            <h4 className="font-medium text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors">
                              {preset.name}
                            </h4>
                            <p className="text-xs text-[var(--color-textSecondary)]">
                              {preset.description}
                            </p>
                          </div>
                        </div>
                        
                        {/* Layout Preview */}
                        <div className="mt-3 p-2 bg-[var(--color-surface)] rounded border">
                          <div className="flex h-8 gap-1 text-xs">
                            {preset.layout.showLeftSidebar && (
                              <div className="bg-[var(--color-primary)] opacity-60 rounded flex-shrink-0" style={{ width: '30%' }}>
                                <div className="p-1 text-white text-center">Chat</div>
                              </div>
                            )}
                            <div className="bg-[var(--color-accent)] opacity-60 rounded flex-1">
                              <div className="p-1 text-white text-center">Editor</div>
                            </div>
                            {preset.layout.showRightSidebar && (
                              <div className="bg-[var(--color-secondary)] opacity-60 rounded flex-shrink-0" style={{ width: '25%' }}>
                                <div className="p-1 text-white text-center">Files</div>
                              </div>
                            )}
                          </div>
                          {preset.layout.showBottomPanel && (
                            <div className="mt-1 h-4 bg-[var(--color-warning)] opacity-60 rounded">
                              <div className="p-1 text-white text-center text-xs">Panel</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
