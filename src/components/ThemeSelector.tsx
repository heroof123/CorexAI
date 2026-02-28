import { useState } from 'react';
import { useTheme, Theme } from '../contexts/ThemeContext';

export default function ThemeSelector() {
  const { theme, setTheme, availableThemes } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const themeLabels: Record<Theme, string> = {
    dark: '🌙 Dark',
    light: '☀️ Light', 
    cyberpunk: '🤖 Cyberpunk',
    forest: '🌲 Forest',
    ocean: '🌊 Ocean'
  };

  const themeDescriptions: Record<Theme, string> = {
    dark: 'Klasik koyu tema',
    light: 'Aydınlık tema',
    cyberpunk: 'Neon renkler',
    forest: 'Doğa teması',
    ocean: 'Okyanus mavisi'
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[var(--color-surface)] hover:bg-[var(--color-hover)] border border-[var(--color-border)] transition-colors text-sm"
      >
        <span>{themeLabels[theme]}</span>
        <svg 
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute top-full right-0 mt-2 w-64 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-xl z-50 overflow-hidden">
            <div className="p-2">
              <div className="text-xs font-semibold text-[var(--color-textSecondary)] mb-2 px-2">
                🎨 Tema Seçin
              </div>
              
              {availableThemes.map((themeName) => (
                <button
                  key={themeName}
                  onClick={() => {
                    setTheme(themeName);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-left ${
                    theme === themeName 
                      ? 'bg-[var(--color-primary)] text-white' 
                      : 'hover:bg-[var(--color-hover)] text-[var(--color-text)]'
                  }`}
                >
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-lg">{themeLabels[themeName].split(' ')[0]}</span>
                    <div>
                      <div className="font-medium text-sm">
                        {themeLabels[themeName].split(' ').slice(1).join(' ')}
                      </div>
                      <div className="text-xs opacity-70">
                        {themeDescriptions[themeName]}
                      </div>
                    </div>
                  </div>
                  
                  {theme === themeName && (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
            
            {/* Theme Preview */}
            <div className="border-t border-[var(--color-border)] p-3 bg-[var(--color-background)]">
              <div className="text-xs text-[var(--color-textSecondary)] mb-2">Önizleme:</div>
              <div className="flex gap-2">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: 'var(--color-primary)' }} />
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: 'var(--color-secondary)' }} />
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: 'var(--color-accent)' }} />
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: 'var(--color-success)' }} />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
