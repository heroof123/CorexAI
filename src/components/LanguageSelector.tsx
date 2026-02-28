import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface LanguageSelectorProps {
  compact?: boolean;
}

export default function LanguageSelector({ compact = false }: LanguageSelectorProps) {
  const { currentLanguage, setLanguage, languages, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const currentLang = languages.find(lang => lang.code === currentLanguage);

  if (compact) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded hover:border-[var(--color-primary)] transition-colors text-sm"
          title={t('language.title')}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">{currentLang?.flag}</span>
            <span>{currentLang?.name}</span>
          </div>
          <span className="text-xs text-[var(--color-textSecondary)]">
            {isOpen ? '▲' : '▼'}
          </span>
        </button>

        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded shadow-lg z-50 max-h-60 overflow-y-auto">
              {languages.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 hover:bg-[var(--color-hover)] transition-colors text-sm ${
                    currentLanguage === lang.code ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]' : ''
                  }`}
                >
                  <span className="text-lg">{lang.flag}</span>
                  <span className="flex-1 text-left">{lang.name}</span>
                  {currentLanguage === lang.code && (
                    <span className="text-[var(--color-primary)]">✓</span>
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-[var(--color-text)] mb-2">
          {t('language.title')}
        </h3>
        <p className="text-xs text-[var(--color-textSecondary)] mb-3">
          {t('language.description')}
        </p>
      </div>

      <div className="space-y-2">
        {languages.map(lang => (
          <button
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={`w-full flex items-center gap-3 p-3 border rounded transition-colors ${
              currentLanguage === lang.code
                ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10'
                : 'border-[var(--color-border)] hover:border-[var(--color-primary)]'
            }`}
          >
            <span className="text-2xl">{lang.flag}</span>
            <div className="flex-1 text-left">
              <div className="font-medium text-[var(--color-text)]">{lang.name}</div>
              <div className="text-xs text-[var(--color-textSecondary)]">{lang.code.toUpperCase()}</div>
            </div>
            {currentLanguage === lang.code && (
              <span className="text-[var(--color-primary)]">✓</span>
            )}
          </button>
        ))}
      </div>

      <div className="p-3 bg-yellow-100 border border-yellow-300 rounded text-yellow-800 text-xs">
        <p className="font-medium">ℹ️ {t('language.restart')}</p>
      </div>
    </div>
  );
}
