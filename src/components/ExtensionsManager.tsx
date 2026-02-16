import { useState, useEffect } from 'react';

interface Extension {
  id: string;
  name: string;
  displayName: string;
  description: string;
  version: string;
  author: string;
  category: 'ai' | 'tools' | 'themes' | 'languages' | 'debuggers' | 'formatters' | 'snippets';
  enabled: boolean;
  installed: boolean;
  downloads: number;
  rating: number;
  icon: string;
  tags: string[];
  repository?: string;
  homepage?: string;
  size?: string;
  lastUpdated?: string;
}

interface ExtensionsManagerProps {
  isVisible: boolean;
}

export default function ExtensionsManager({ isVisible }: ExtensionsManagerProps) {
  const [activeTab, setActiveTab] = useState('installed');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [extensions, setExtensions] = useState<Extension[]>([]);
  const [installedExtensions, setInstalledExtensions] = useState<Extension[]>([]);

  // Load extensions data
  useEffect(() => {
    if (isVisible) {
      loadExtensions();
      loadInstalledExtensions();
    }
  }, [isVisible]);

  const loadExtensions = () => {
    // Marketplace extensions (simulated data)
    const marketplaceExtensions: Extension[] = [
      {
        id: 'ms-vscode.vscode-typescript-next',
        name: 'TypeScript Importer',
        displayName: 'TypeScript Importer',
        description: 'Automatically searches for TypeScript definitions and suggests imports',
        version: '1.0.0',
        author: 'Microsoft',
        category: 'languages',
        enabled: false,
        installed: false,
        downloads: 2500000,
        rating: 4.8,
        icon: '📘',
        tags: ['typescript', 'imports', 'intellisense'],
        repository: 'https://github.com/microsoft/vscode-typescript-next',
        size: '2.1 MB',
        lastUpdated: '2024-01-15'
      },
      {
        id: 'esbenp.prettier-vscode',
        name: 'Prettier',
        displayName: 'Prettier - Code formatter',
        description: 'Code formatter using prettier',
        version: '10.1.0',
        author: 'Prettier',
        category: 'formatters',
        enabled: false,
        installed: false,
        downloads: 15000000,
        rating: 4.9,
        icon: '💅',
        tags: ['formatter', 'javascript', 'typescript', 'css'],
        repository: 'https://github.com/prettier/prettier-vscode',
        size: '1.8 MB',
        lastUpdated: '2024-01-10'
      },
      {
        id: 'ms-python.python',
        name: 'Python',
        displayName: 'Python',
        description: 'IntelliSense, Linting, Debugging, code formatting, refactoring, unit tests, and more.',
        version: '2024.0.1',
        author: 'Microsoft',
        category: 'languages',
        enabled: false,
        installed: false,
        downloads: 50000000,
        rating: 4.7,
        icon: '🐍',
        tags: ['python', 'intellisense', 'debugging', 'linting'],
        repository: 'https://github.com/microsoft/vscode-python',
        size: '15.2 MB',
        lastUpdated: '2024-01-18'
      },
      {
        id: 'github.copilot',
        name: 'GitHub Copilot',
        displayName: 'GitHub Copilot',
        description: 'Your AI pair programmer',
        version: '1.156.0',
        author: 'GitHub',
        category: 'ai',
        enabled: false,
        installed: false,
        downloads: 8000000,
        rating: 4.5,
        icon: '🤖',
        tags: ['ai', 'copilot', 'autocomplete', 'suggestions'],
        repository: 'https://github.com/github/copilot-docs',
        size: '5.4 MB',
        lastUpdated: '2024-01-19'
      },
      {
        id: 'bradlc.vscode-tailwindcss',
        name: 'Tailwind CSS IntelliSense',
        displayName: 'Tailwind CSS IntelliSense',
        description: 'Intelligent Tailwind CSS tooling for VS Code',
        version: '0.10.5',
        author: 'Tailwind Labs',
        category: 'languages',
        enabled: false,
        installed: false,
        downloads: 3500000,
        rating: 4.8,
        icon: '🎨',
        tags: ['tailwind', 'css', 'intellisense', 'autocomplete'],
        repository: 'https://github.com/tailwindlabs/tailwindcss-intellisense',
        size: '3.2 MB',
        lastUpdated: '2024-01-12'
      },
      {
        id: 'rust-lang.rust-analyzer',
        name: 'rust-analyzer',
        displayName: 'rust-analyzer',
        description: 'Rust language support for Visual Studio Code',
        version: '0.4.1821',
        author: 'The Rust Programming Language',
        category: 'languages',
        enabled: false,
        installed: false,
        downloads: 1200000,
        rating: 4.6,
        icon: '🦀',
        tags: ['rust', 'language-server', 'intellisense'],
        repository: 'https://github.com/rust-lang/rust-analyzer',
        size: '8.7 MB',
        lastUpdated: '2024-01-17'
      },
      {
        id: 'ms-vscode.vscode-json',
        name: 'JSON Language Features',
        displayName: 'JSON Language Features',
        description: 'JSON language support',
        version: '1.0.0',
        author: 'Microsoft',
        category: 'languages',
        enabled: false,
        installed: false,
        downloads: 45000000,
        rating: 4.4,
        icon: '📄',
        tags: ['json', 'language-support'],
        size: '0.8 MB',
        lastUpdated: '2024-01-05'
      },
      {
        id: 'dracula-theme.theme-dracula',
        name: 'Dracula Official',
        displayName: 'Dracula Official',
        description: 'Official Dracula Theme. A dark theme for many editors, shells, and more.',
        version: '2.24.2',
        author: 'Dracula Theme',
        category: 'themes',
        enabled: false,
        installed: false,
        downloads: 4200000,
        rating: 4.9,
        icon: '🧛',
        tags: ['theme', 'dark', 'dracula'],
        repository: 'https://github.com/dracula/visual-studio-code',
        size: '0.5 MB',
        lastUpdated: '2024-01-08'
      }
    ];

    setExtensions(marketplaceExtensions);
  };

  const loadInstalledExtensions = () => {
    // Load from localStorage
    const saved = localStorage.getItem('corex-installed-extensions');
    if (saved) {
      setInstalledExtensions(JSON.parse(saved));
    }
  };

  const saveInstalledExtensions = (exts: Extension[]) => {
    localStorage.setItem('corex-installed-extensions', JSON.stringify(exts));
    setInstalledExtensions(exts);
  };

  const installExtension = (extension: Extension) => {
    const installedExt = { ...extension, installed: true, enabled: true };
    const updatedInstalled = [...installedExtensions, installedExt];
    saveInstalledExtensions(updatedInstalled);
    
    // Update marketplace list
    setExtensions(prev => prev.map(ext => 
      ext.id === extension.id ? { ...ext, installed: true } : ext
    ));
  };

  const uninstallExtension = (extensionId: string) => {
    const updatedInstalled = installedExtensions.filter(ext => ext.id !== extensionId);
    saveInstalledExtensions(updatedInstalled);
    
    // Update marketplace list
    setExtensions(prev => prev.map(ext => 
      ext.id === extensionId ? { ...ext, installed: false } : ext
    ));
  };

  const toggleExtension = (extensionId: string) => {
    const updatedInstalled = installedExtensions.map(ext => 
      ext.id === extensionId ? { ...ext, enabled: !ext.enabled } : ext
    );
    saveInstalledExtensions(updatedInstalled);
  };

  const categories = [
    { id: 'all', name: 'All Categories', count: extensions.length },
    { id: 'ai', name: 'AI & Machine Learning', count: extensions.filter(e => e.category === 'ai').length },
    { id: 'languages', name: 'Programming Languages', count: extensions.filter(e => e.category === 'languages').length },
    { id: 'themes', name: 'Themes', count: extensions.filter(e => e.category === 'themes').length },
    { id: 'formatters', name: 'Formatters', count: extensions.filter(e => e.category === 'formatters').length },
    { id: 'tools', name: 'Tools', count: extensions.filter(e => e.category === 'tools').length },
    { id: 'debuggers', name: 'Debuggers', count: extensions.filter(e => e.category === 'debuggers').length }
  ];

  const filteredExtensions = extensions.filter(ext => {
    const matchesSearch = ext.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ext.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ext.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || ext.category === selectedCategory;
    
    if (activeTab === 'installed') {
      return installedExtensions.some(installed => installed.id === ext.id) && matchesSearch && matchesCategory;
    }
    
    return matchesSearch && matchesCategory;
  });

  const sortedExtensions = [...filteredExtensions].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'downloads':
        return b.downloads - a.downloads;
      case 'rating':
        return b.rating - a.rating;
      case 'updated':
        return new Date(b.lastUpdated || 0).getTime() - new Date(a.lastUpdated || 0).getTime();
      default:
        return 0;
    }
  });

  const formatDownloads = (downloads: number) => {
    if (downloads >= 1000000) {
      return `${(downloads / 1000000).toFixed(1)}M`;
    } else if (downloads >= 1000) {
      return `${(downloads / 1000).toFixed(1)}K`;
    }
    return downloads.toString();
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={i} className="text-yellow-400">★</span>);
    }
    if (hasHalfStar) {
      stars.push(<span key="half" className="text-yellow-400">☆</span>);
    }
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<span key={`empty-${i}`} className="text-gray-400">☆</span>);
    }
    
    return stars;
  };

  if (!isVisible) return null;

  return (
    <div className="h-full flex flex-col bg-[var(--color-surface)]">
      {/* Header */}
      <div className="px-3 py-2 border-b border-[var(--color-border)]">
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-2">Extensions</h2>
        
        {/* Search */}
        <div className="relative mb-2">
          <input
            type="text"
            placeholder="Search extensions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded text-sm focus:outline-none focus:border-[var(--color-primary)]"
          />
          <span className="absolute left-2.5 top-2.5 text-[var(--color-textSecondary)]">🔍</span>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[var(--color-border)]">
          {[
            { id: 'installed', name: 'Installed', count: installedExtensions.length },
            { id: 'popular', name: 'Popular', count: null },
            { id: 'recommended', name: 'Recommended', count: null }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                  : 'border-transparent text-[var(--color-textSecondary)] hover:text-[var(--color-text)]'
              }`}
            >
              {tab.name}
              {tab.count !== null && (
                <span className="ml-1 px-1.5 py-0.5 bg-[var(--color-background)] rounded text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="px-3 py-1.5 border-b border-[var(--color-border)] bg-[var(--color-background)]">
        <div className="flex flex-col gap-1.5 sm:flex-row sm:gap-2 items-stretch sm:items-center">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="flex-1 px-2 py-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded text-sm min-w-0"
          >
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.name} ({cat.count})
              </option>
            ))}
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="flex-1 px-2 py-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded text-sm min-w-0"
          >
            <option value="name">Sort by Name</option>
            <option value="downloads">Sort by Downloads</option>
            <option value="rating">Sort by Rating</option>
            <option value="updated">Sort by Updated</option>
          </select>
        </div>
      </div>

      {/* Extensions List */}
      <div className="flex-1 overflow-y-auto">
        {sortedExtensions.length === 0 ? (
          <div className="px-3 py-8 text-center text-[var(--color-textSecondary)]">
            <div className="text-4xl mb-4">🧩</div>
            <h3 className="text-lg font-medium mb-2">No extensions found</h3>
            <p className="text-sm">
              {activeTab === 'installed' 
                ? 'You haven\'t installed any extensions yet.'
                : 'Try adjusting your search or filters.'
              }
            </p>
          </div>
        ) : (
          <div className="px-3 py-2 space-y-2">
            {sortedExtensions.map(extension => {
              const isInstalled = installedExtensions.some(inst => inst.id === extension.id);
              const installedExt = installedExtensions.find(inst => inst.id === extension.id);
              
              return (
                <div key={extension.id} className="p-3 bg-[var(--color-background)] border border-[var(--color-border)] rounded hover:border-[var(--color-primary)] transition-colors">
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className="w-10 h-10 bg-[var(--color-surface)] border border-[var(--color-border)] rounded flex items-center justify-center text-lg flex-shrink-0">
                      {extension.icon}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1.5">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-[var(--color-text)] truncate text-sm">
                            {extension.displayName}
                          </h3>
                          <p className="text-xs text-[var(--color-textSecondary)]">
                            by {extension.author}
                          </p>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex gap-1.5 ml-3 flex-shrink-0">
                          {isInstalled ? (
                            <>
                              <button
                                onClick={() => toggleExtension(extension.id)}
                                className={`px-2 py-1 rounded text-xs transition-colors ${
                                  installedExt?.enabled
                                    ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                                    : 'bg-gray-600 text-white hover:bg-gray-700'
                                }`}
                              >
                                {installedExt?.enabled ? 'Disable' : 'Enable'}
                              </button>
                              <button
                                onClick={() => uninstallExtension(extension.id)}
                                className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors"
                              >
                                Uninstall
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => installExtension(extension)}
                              className="px-2 py-1 bg-[var(--color-primary)] text-white rounded text-xs hover:opacity-80 transition-opacity"
                            >
                              Install
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-xs text-[var(--color-textSecondary)] mb-2 line-clamp-2">
                        {extension.description}
                      </p>
                      
                      {/* Metadata */}
                      <div className="flex items-center gap-3 text-xs text-[var(--color-textSecondary)] mb-1.5">
                        <div className="flex items-center gap-1">
                          {renderStars(extension.rating)}
                          <span className="ml-1">({extension.rating})</span>
                        </div>
                        <span>📥 {formatDownloads(extension.downloads)}</span>
                        <span>v{extension.version}</span>
                        {extension.size && <span>📦 {extension.size}</span>}
                      </div>
                      
                      {/* Tags */}
                      <div className="flex flex-wrap gap-1">
                        {extension.tags.slice(0, 3).map(tag => (
                          <span
                            key={tag}
                            className="px-1.5 py-0.5 bg-[var(--color-surface)] text-xs rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}