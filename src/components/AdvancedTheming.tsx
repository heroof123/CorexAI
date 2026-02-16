import { useState, useEffect } from 'react';
// import { useTheme } from '../contexts/ThemeContext';

interface AdvancedThemingProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CustomTheme {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    hover: string;
    accent: string;
    success: string;
    warning: string;
    error: string;
  };
  syntax: {
    keyword: string;
    string: string;
    comment: string;
    number: string;
    function: string;
    variable: string;
    type: string;
    operator: string;
  };
  fonts: {
    ui: string;
    code: string;
    size: number;
    lineHeight: number;
  };
}

export default function AdvancedTheming({ isOpen, onClose }: AdvancedThemingProps) {
  // const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('presets');
  const [customThemes, setCustomThemes] = useState<CustomTheme[]>([]);
  const [editingTheme, setEditingTheme] = useState<CustomTheme | null>(null);
  const [previewTheme, setPreviewTheme] = useState<CustomTheme | null>(null);

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

  // Load custom themes
  useEffect(() => {
    if (isOpen) {
      loadCustomThemes();
    }
  }, [isOpen]);

  const loadCustomThemes = () => {
    const saved = localStorage.getItem('corex-custom-themes');
    if (saved) {
      setCustomThemes(JSON.parse(saved));
    }
  };

  const saveCustomThemes = (themes: CustomTheme[]) => {
    localStorage.setItem('corex-custom-themes', JSON.stringify(themes));
    setCustomThemes(themes);
  };

  const predefinedThemes: CustomTheme[] = [
    {
      id: 'dark-pro',
      name: 'Dark Pro',
      colors: {
        primary: '#007acc',
        secondary: '#6c757d',
        background: '#1e1e1e',
        surface: '#252526',
        text: '#cccccc',
        textSecondary: '#969696',
        border: '#3c3c3c',
        hover: '#2a2d2e',
        accent: '#0e639c',
        success: '#4caf50',
        warning: '#ff9800',
        error: '#f44336'
      },
      syntax: {
        keyword: '#569cd6',
        string: '#ce9178',
        comment: '#6a9955',
        number: '#b5cea8',
        function: '#dcdcaa',
        variable: '#9cdcfe',
        type: '#4ec9b0',
        operator: '#d4d4d4'
      },
      fonts: {
        ui: 'Segoe UI, system-ui, sans-serif',
        code: 'Consolas, Monaco, monospace',
        size: 14,
        lineHeight: 1.5
      }
    },
    {
      id: 'light-modern',
      name: 'Light Modern',
      colors: {
        primary: '#0066cc',
        secondary: '#6c757d',
        background: '#ffffff',
        surface: '#f8f9fa',
        text: '#212529',
        textSecondary: '#6c757d',
        border: '#dee2e6',
        hover: '#e9ecef',
        accent: '#0056b3',
        success: '#28a745',
        warning: '#ffc107',
        error: '#dc3545'
      },
      syntax: {
        keyword: '#0000ff',
        string: '#a31515',
        comment: '#008000',
        number: '#098658',
        function: '#795e26',
        variable: '#001080',
        type: '#267f99',
        operator: '#000000'
      },
      fonts: {
        ui: 'Segoe UI, system-ui, sans-serif',
        code: 'Consolas, Monaco, monospace',
        size: 14,
        lineHeight: 1.5
      }
    },
    {
      id: 'cyberpunk-neon',
      name: 'Cyberpunk Neon',
      colors: {
        primary: '#ff0080',
        secondary: '#00ffff',
        background: '#0a0a0a',
        surface: '#1a1a2e',
        text: '#00ffff',
        textSecondary: '#ff0080',
        border: '#ff0080',
        hover: '#16213e',
        accent: '#ff0080',
        success: '#00ff00',
        warning: '#ffff00',
        error: '#ff0040'
      },
      syntax: {
        keyword: '#ff0080',
        string: '#00ff00',
        comment: '#666666',
        number: '#ffff00',
        function: '#00ffff',
        variable: '#ff8000',
        type: '#ff0080',
        operator: '#ffffff'
      },
      fonts: {
        ui: 'Orbitron, monospace',
        code: 'Fira Code, monospace',
        size: 14,
        lineHeight: 1.6
      }
    },
    {
      id: 'forest-green',
      name: 'Forest Green',
      colors: {
        primary: '#2e7d32',
        secondary: '#558b2f',
        background: '#1b2e1b',
        surface: '#2e4a2e',
        text: '#c8e6c9',
        textSecondary: '#a5d6a7',
        border: '#4caf50',
        hover: '#388e3c',
        accent: '#66bb6a',
        success: '#4caf50',
        warning: '#ff9800',
        error: '#f44336'
      },
      syntax: {
        keyword: '#81c784',
        string: '#a5d6a7',
        comment: '#689f38',
        number: '#c8e6c9',
        function: '#66bb6a',
        variable: '#4caf50',
        type: '#8bc34a',
        operator: '#e8f5e8'
      },
      fonts: {
        ui: 'Roboto, sans-serif',
        code: 'Source Code Pro, monospace',
        size: 14,
        lineHeight: 1.5
      }
    }
  ];

  const createNewTheme = () => {
    const newTheme: CustomTheme = {
      id: `custom-${Date.now()}`,
      name: 'My Custom Theme',
      colors: {
        primary: '#007acc',
        secondary: '#6c757d',
        background: '#1e1e1e',
        surface: '#252526',
        text: '#cccccc',
        textSecondary: '#969696',
        border: '#3c3c3c',
        hover: '#2a2d2e',
        accent: '#0e639c',
        success: '#4caf50',
        warning: '#ff9800',
        error: '#f44336'
      },
      syntax: {
        keyword: '#569cd6',
        string: '#ce9178',
        comment: '#6a9955',
        number: '#b5cea8',
        function: '#dcdcaa',
        variable: '#9cdcfe',
        type: '#4ec9b0',
        operator: '#d4d4d4'
      },
      fonts: {
        ui: 'Segoe UI, system-ui, sans-serif',
        code: 'Consolas, Monaco, monospace',
        size: 14,
        lineHeight: 1.5
      }
    };
    setEditingTheme(newTheme);
    setActiveTab('editor');
  };

  const saveTheme = () => {
    if (!editingTheme) return;
    
    const updatedThemes = customThemes.some(t => t.id === editingTheme.id)
      ? customThemes.map(t => t.id === editingTheme.id ? editingTheme : t)
      : [...customThemes, editingTheme];
    
    saveCustomThemes(updatedThemes);
    setEditingTheme(null);
    setActiveTab('presets');
  };

  const deleteTheme = (themeId: string) => {
    const updatedThemes = customThemes.filter(t => t.id !== themeId);
    saveCustomThemes(updatedThemes);
  };

  const applyTheme = (theme: CustomTheme) => {
    // Apply theme to CSS variables
    const root = document.documentElement;
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });
    
    // Apply font settings
    root.style.setProperty('--font-ui', theme.fonts.ui);
    root.style.setProperty('--font-code', theme.fonts.code);
    root.style.setProperty('--font-size', `${theme.fonts.size}px`);
    root.style.setProperty('--line-height', theme.fonts.lineHeight.toString());
    
    // Save theme preference
    localStorage.setItem('corex-active-theme', theme.id);
  };

  const previewThemeHandler = (theme: CustomTheme) => {
    setPreviewTheme(theme);
    applyTheme(theme);
  };

  const stopPreview = () => {
    setPreviewTheme(null);
    // Restore original theme
    // This would need integration with the main theme system
  };

  const exportTheme = (theme: CustomTheme) => {
    const dataStr = JSON.stringify(theme, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${theme.name.toLowerCase().replace(/\s+/g, '-')}-theme.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importTheme = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const theme = JSON.parse(e.target?.result as string) as CustomTheme;
        theme.id = `imported-${Date.now()}`;
        const updatedThemes = [...customThemes, theme];
        saveCustomThemes(updatedThemes);
      } catch (error) {
        alert('Invalid theme file format');
      }
    };
    reader.readAsText(file);
  };

  if (!isOpen) return null;

  const allThemes = [...predefinedThemes, ...customThemes];

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      
      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="h-12 bg-[var(--color-background)] border-b border-[var(--color-border)] flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">🎨</span>
              <h3 className="text-sm font-semibold text-[var(--color-text)]">Advanced Theming</h3>
              {previewTheme && (
                <span className="text-xs px-2 py-1 bg-yellow-500 text-black rounded">
                  Previewing: {previewTheme.name}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {previewTheme && (
                <button
                  onClick={stopPreview}
                  className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:opacity-80 transition-opacity"
                >
                  Stop Preview
                </button>
              )}
              <button
                onClick={onClose}
                className="w-6 h-6 flex items-center justify-center text-[var(--color-textSecondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-hover)] rounded transition-colors"
                title="Close (ESC)"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-[var(--color-border)] bg-[var(--color-background)]">
            <div className="flex">
              {[
                { id: 'presets', name: 'Theme Presets', icon: '🎭' },
                { id: 'editor', name: 'Theme Editor', icon: '✏️' },
                { id: 'fonts', name: 'Font Settings', icon: '🔤' },
                { id: 'syntax', name: 'Syntax Colors', icon: '🌈' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                      : 'border-transparent text-[var(--color-textSecondary)] hover:text-[var(--color-text)]'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
            {/* Theme Presets */}
            {activeTab === 'presets' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-lg font-semibold">Available Themes</h4>
                  <div className="flex gap-2">
                    <input
                      type="file"
                      accept=".json"
                      onChange={importTheme}
                      className="hidden"
                      id="import-theme"
                    />
                    <label
                      htmlFor="import-theme"
                      className="px-3 py-2 bg-blue-600 text-white rounded cursor-pointer hover:opacity-80 transition-opacity text-sm"
                    >
                      📥 Import Theme
                    </label>
                    <button
                      onClick={createNewTheme}
                      className="px-3 py-2 bg-[var(--color-primary)] text-white rounded hover:opacity-80 transition-opacity text-sm"
                    >
                      + Create New Theme
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {allThemes.map(theme => (
                    <div key={theme.id} className="p-4 bg-[var(--color-background)] border border-[var(--color-border)] rounded">
                      <div className="flex justify-between items-start mb-3">
                        <h5 className="font-semibold">{theme.name}</h5>
                        <div className="flex gap-1">
                          <button
                            onClick={() => previewThemeHandler(theme)}
                            className="px-2 py-1 bg-yellow-600 text-white rounded text-xs hover:opacity-80 transition-opacity"
                          >
                            👁️
                          </button>
                          <button
                            onClick={() => applyTheme(theme)}
                            className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:opacity-80 transition-opacity"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => exportTheme(theme)}
                            className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:opacity-80 transition-opacity"
                          >
                            📤
                          </button>
                          {customThemes.some(t => t.id === theme.id) && (
                            <>
                              <button
                                onClick={() => {
                                  setEditingTheme(theme);
                                  setActiveTab('editor');
                                }}
                                className="px-2 py-1 bg-orange-600 text-white rounded text-xs hover:opacity-80 transition-opacity"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => deleteTheme(theme.id)}
                                className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:opacity-80 transition-opacity"
                              >
                                🗑️
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {/* Color Preview */}
                      <div className="grid grid-cols-4 gap-1 mb-3">
                        <div className="h-6 rounded" style={{ backgroundColor: theme.colors.primary }} title="Primary"></div>
                        <div className="h-6 rounded" style={{ backgroundColor: theme.colors.secondary }} title="Secondary"></div>
                        <div className="h-6 rounded" style={{ backgroundColor: theme.colors.background }} title="Background"></div>
                        <div className="h-6 rounded" style={{ backgroundColor: theme.colors.surface }} title="Surface"></div>
                      </div>
                      
                      {/* Code Preview */}
                      <div className="text-xs p-2 rounded border" style={{ 
                        backgroundColor: theme.colors.background,
                        color: theme.colors.text,
                        fontFamily: theme.fonts.code
                      }}>
                        <div style={{ color: theme.syntax.keyword }}>function</div>
                        <div style={{ color: theme.syntax.string }}>"Hello World"</div>
                        <div style={{ color: theme.syntax.comment }}>// Comment</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Theme Editor */}
            {activeTab === 'editor' && editingTheme && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h4 className="text-lg font-semibold">Edit Theme: {editingTheme.name}</h4>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingTheme(null)}
                      className="px-3 py-2 bg-gray-600 text-white rounded hover:opacity-80 transition-opacity text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveTheme}
                      className="px-3 py-2 bg-green-600 text-white rounded hover:opacity-80 transition-opacity text-sm"
                    >
                      Save Theme
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h5 className="font-semibold mb-3">Basic Settings</h5>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Theme Name:</label>
                        <input
                          type="text"
                          value={editingTheme.name}
                          onChange={(e) => setEditingTheme(prev => prev ? { ...prev, name: e.target.value } : null)}
                          className="w-full p-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-semibold mb-3">Color Palette</h5>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(editingTheme.colors).map(([key, value]) => (
                        <div key={key}>
                          <label className="block text-sm font-medium mb-1 capitalize">{key}:</label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={value}
                              onChange={(e) => setEditingTheme(prev => prev ? {
                                ...prev,
                                colors: { ...prev.colors, [key]: e.target.value }
                              } : null)}
                              className="w-12 h-8 border border-[var(--color-border)] rounded cursor-pointer"
                            />
                            <input
                              type="text"
                              value={value}
                              onChange={(e) => setEditingTheme(prev => prev ? {
                                ...prev,
                                colors: { ...prev.colors, [key]: e.target.value }
                              } : null)}
                              className="flex-1 p-1 bg-[var(--color-background)] border border-[var(--color-border)] rounded text-sm font-mono"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Font Settings */}
            {activeTab === 'fonts' && (
              <div className="space-y-6">
                <h4 className="text-lg font-semibold">Font Configuration</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">UI Font Family:</label>
                      <select className="w-full p-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded">
                        <option>Segoe UI, system-ui, sans-serif</option>
                        <option>Roboto, sans-serif</option>
                        <option>Inter, sans-serif</option>
                        <option>Arial, sans-serif</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Code Font Family:</label>
                      <select className="w-full p-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded">
                        <option>Consolas, Monaco, monospace</option>
                        <option>Fira Code, monospace</option>
                        <option>Source Code Pro, monospace</option>
                        <option>JetBrains Mono, monospace</option>
                        <option>Cascadia Code, monospace</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Font Size: 14px</label>
                      <input
                        type="range"
                        min="10"
                        max="24"
                        defaultValue="14"
                        className="w-full"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Line Height: 1.5</label>
                      <input
                        type="range"
                        min="1.0"
                        max="2.0"
                        step="0.1"
                        defaultValue="1.5"
                        className="w-full"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="font-semibold mb-3">Preview</h5>
                    <div className="p-4 bg-[var(--color-background)] border border-[var(--color-border)] rounded">
                      <div className="mb-4">
                        <h6 className="font-medium mb-2">UI Text Sample:</h6>
                        <p className="text-sm">This is how your UI text will look with the selected font settings.</p>
                      </div>
                      
                      <div>
                        <h6 className="font-medium mb-2">Code Sample:</h6>
                        <pre className="text-sm bg-[var(--color-surface)] p-2 rounded font-mono">
{`function hello() {
  console.log("Hello World!");
  return true;
}`}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Syntax Colors */}
            {activeTab === 'syntax' && (
              <div className="space-y-6">
                <h4 className="text-lg font-semibold">Syntax Highlighting Colors</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    {editingTheme && Object.entries(editingTheme.syntax).map(([key, value]) => (
                      <div key={key}>
                        <label className="block text-sm font-medium mb-1 capitalize">{key}:</label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={value}
                            onChange={(e) => setEditingTheme(prev => prev ? {
                              ...prev,
                              syntax: { ...prev.syntax, [key]: e.target.value }
                            } : null)}
                            className="w-12 h-8 border border-[var(--color-border)] rounded cursor-pointer"
                          />
                          <input
                            type="text"
                            value={value}
                            onChange={(e) => setEditingTheme(prev => prev ? {
                              ...prev,
                              syntax: { ...prev.syntax, [key]: e.target.value }
                            } : null)}
                            className="flex-1 p-1 bg-[var(--color-background)] border border-[var(--color-border)] rounded text-sm font-mono"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div>
                    <h5 className="font-semibold mb-3">Syntax Preview</h5>
                    <div className="p-4 bg-[var(--color-background)] border border-[var(--color-border)] rounded">
                      <pre className="text-sm font-mono">
                        {editingTheme && (
                          <>
                            <div style={{ color: editingTheme.syntax.comment }}>// This is a comment</div>
                            <div>
                              <span style={{ color: editingTheme.syntax.keyword }}>function </span>
                              <span style={{ color: editingTheme.syntax.function }}>calculateSum</span>
                              <span style={{ color: editingTheme.syntax.operator }}>(</span>
                              <span style={{ color: editingTheme.syntax.variable }}>a</span>
                              <span style={{ color: editingTheme.syntax.operator }}>: </span>
                              <span style={{ color: editingTheme.syntax.type }}>number</span>
                              <span style={{ color: editingTheme.syntax.operator }}>, </span>
                              <span style={{ color: editingTheme.syntax.variable }}>b</span>
                              <span style={{ color: editingTheme.syntax.operator }}>: </span>
                              <span style={{ color: editingTheme.syntax.type }}>number</span>
                              <span style={{ color: editingTheme.syntax.operator }}>) {`{`}</span>
                            </div>
                            <div>
                              <span>  </span>
                              <span style={{ color: editingTheme.syntax.keyword }}>const </span>
                              <span style={{ color: editingTheme.syntax.variable }}>result </span>
                              <span style={{ color: editingTheme.syntax.operator }}>= </span>
                              <span style={{ color: editingTheme.syntax.variable }}>a </span>
                              <span style={{ color: editingTheme.syntax.operator }}>+ </span>
                              <span style={{ color: editingTheme.syntax.variable }}>b</span>
                              <span style={{ color: editingTheme.syntax.operator }}>;</span>
                            </div>
                            <div>
                              <span>  </span>
                              <span style={{ color: editingTheme.syntax.keyword }}>console</span>
                              <span style={{ color: editingTheme.syntax.operator }}>.</span>
                              <span style={{ color: editingTheme.syntax.function }}>log</span>
                              <span style={{ color: editingTheme.syntax.operator }}>(</span>
                              <span style={{ color: editingTheme.syntax.string }}>"Result: "</span>
                              <span style={{ color: editingTheme.syntax.operator }}>, </span>
                              <span style={{ color: editingTheme.syntax.variable }}>result</span>
                              <span style={{ color: editingTheme.syntax.operator }}>);</span>
                            </div>
                            <div>
                              <span>  </span>
                              <span style={{ color: editingTheme.syntax.keyword }}>return </span>
                              <span style={{ color: editingTheme.syntax.variable }}>result</span>
                              <span style={{ color: editingTheme.syntax.operator }}>;</span>
                            </div>
                            <div>
                              <span style={{ color: editingTheme.syntax.operator }}>{`}`}</span>
                            </div>
                          </>
                        )}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}