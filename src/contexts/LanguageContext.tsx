import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'tr' | 'en' | 'de' | 'fr' | 'zh' | 'es' | 'ar';

interface LanguageContextType {
  currentLanguage: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  languages: Array<{ code: Language; name: string; flag: string }>;
}

const translations = {
  tr: {
    // Menu Bar
    'menu.file': 'Dosya',
    'menu.edit': 'Düzenle',
    'menu.selection': 'Seçim',
    'menu.view': 'Görünüm',
    'menu.go': 'Git',
    'menu.run': 'Çalıştır',
    'menu.terminal': 'Terminal',
    'menu.tools': 'Araçlar',
    'menu.help': 'Yardım',
    
    // Activity Bar
    'activity.explorer': 'Gezgin',
    'activity.search': 'Ara',
    'activity.sourceControl': 'Kaynak Kontrolü',
    'activity.runDebug': 'Çalıştır ve Hata Ayıkla',
    'activity.extensions': 'Eklentiler',
    'activity.accounts': 'Hesaplar',
    'activity.settings': 'Ayarlar',
    'activity.workspace': 'Çalışma Alanı',
    'activity.database': 'Veritabanı',
    'activity.apiTesting': 'API Test',
    'activity.tasks': 'Görevler',
    'activity.docker': 'Docker',
    
    // File Operations
    'file.openProject': 'Proje Aç...',
    'file.openFile': 'Dosya Aç...',
    'file.closeFile': 'Dosyayı Kapat',
    'file.save': 'Kaydet',
    'file.exit': 'Çıkış',
    
    // Extensions
    'extensions.title': 'Eklentiler',
    'extensions.search': 'Eklenti ara...',
    'extensions.installed': 'Yüklü',
    'extensions.popular': 'Popüler',
    'extensions.recommended': 'Önerilen',
    'extensions.install': 'Yükle',
    'extensions.uninstall': 'Kaldır',
    'extensions.enable': 'Etkinleştir',
    'extensions.disable': 'Devre Dışı Bırak',
    'extensions.noExtensions': 'Henüz eklenti yüklenmedi.',
    'extensions.getStarted': 'Başlamak için "Eklenti Ekle" ye tıklayın.',
    
    // Search
    'search.title': 'Ara',
    'search.placeholder': 'Ara',
    'search.includeFiles': 'Dahil edilecek dosyalar',
    'search.excludeFiles': 'Hariç tutulacak dosyalar',
    'search.matchCase': 'Büyük/Küçük Harf Duyarlı',
    'search.wholeWord': 'Tam Kelime',
    'search.regex': 'Düzenli İfade Kullan',
    'search.noResults': 'Sonuç bulunamadı',
    'search.searching': 'Aranıyor...',
    'search.searchWorkspace': 'Çalışma alanınızdaki dosyalarda arama yapın',
    
    // Source Control
    'git.title': 'Kaynak Kontrolü',
    'git.commit': 'Commit',
    'git.changes': 'Değişiklikler',
    'git.stagedChanges': 'Hazırlanmış Değişiklikler',
    'git.commitMessage': 'Mesaj (Ctrl+Enter ile commit)',
    
    // Settings
    'settings.title': 'Ayarlar',
    'settings.searchSettings': 'Ayarlarda ara',
    'settings.user': 'Kullanıcı',
    'settings.workspace': 'Çalışma Alanı',
    'settings.appearance': 'Görünüm',
    'settings.keyboard': 'Klavye Kısayolları',
    'settings.features': 'Özellikler',
    'settings.remote': 'Uzak',
    'settings.security': 'Güvenlik',
    
    // Common
    'common.close': 'Kapat',
    'common.cancel': 'İptal',
    'common.save': 'Kaydet',
    'common.delete': 'Sil',
    'common.edit': 'Düzenle',
    'common.refresh': 'Yenile',
    'common.loading': 'Yükleniyor...',
    'common.error': 'Hata',
    'common.success': 'Başarılı',
    'common.warning': 'Uyarı',
    'common.info': 'Bilgi',
    
    // Bottom Panel
    'panel.problems': 'Sorunlar',
    'panel.aiSuggestions': 'AI Önerileri',
    'panel.aiActions': 'AI Aksiyonları',
    'panel.output': 'Çıktı',
    'panel.terminal': 'Terminal',
    'panel.debugTest': 'Hata Ayıklama ve Test',
    
    // Language Settings
    'language.title': 'Dil',
    'language.description': 'Arayüz dilini seçin',
    'language.restart': 'Dil değişikliği için uygulamayı yeniden başlatın',
    
    // Debug
    'debug.launchProgram': 'Program Başlat',
    'debug.attachProcess': 'İşleme Bağlan',
    'debug.launchChrome': 'Chrome Başlat',
    'debug.variables': 'Değişkenler',
    'debug.watch': 'İzle',
    'debug.callStack': 'Çağrı Yığını',
    'debug.breakpoints': 'Kesme Noktaları',
    'debug.noVariables': 'Gösterilecek değişken yok',
    'debug.noWatch': 'İzleme ifadesi yok',
    'debug.notPaused': 'Hiçbir thread\'de duraklatılmadı',
    'debug.noBreakpoints': 'Kesme noktası ayarlanmadı',
    
    // Accounts
    'accounts.githubDesc': 'Ayarları senkronize etmek için giriş yapın',
    'accounts.microsoftDesc': 'Azure kaynaklarına erişin',
    'accounts.signInGithub': 'GitHub ile Giriş Yap',
    'accounts.signInMicrosoft': 'Microsoft ile Giriş Yap',
    
    // Settings descriptions
    'settings.userDesc': 'Genel olarak uygulanan kullanıcı ayarları',
    'settings.workspaceDesc': 'Bu projeye uygulanan çalışma alanı ayarları',
    'settings.appearanceDesc': 'Tema, font ve UI özelleştirmesi',
    'settings.keyboardDesc': 'Klavye kısayollarını özelleştir',
    'settings.extensionsDesc': 'Yüklü eklentileri yönet',
    'settings.featuresDesc': 'Editör özelliklerini etkinleştir veya devre dışı bırak',
    'settings.remoteDesc': 'Uzak geliştirme ayarları',
    'settings.securityDesc': 'Güvenlik ve gizlilik ayarları',
    
    // Common additions
    'common.run': 'Hata Ayıklamayı Başlat',
    
    // New Features
    'workspace.openWorkspace': 'Çalışma Alanı Aç',
    'workspace.newProject': 'Yeni Proje',
    'workspace.noWorkspaces': 'Henüz çalışma alanı yok',
    'workspace.getStarted': 'Başlamak için bir klasör açın veya yeni proje oluşturun',
    'workspace.active': 'Aktif',
    'workspace.files': 'dosya',
    'workspace.lastOpened': 'Son açılma',
    
    'database.addConnection': 'Bağlantı Ekle',
    'database.connections': 'Bağlantılar',
    'database.tables': 'Tablolar',
    'database.sqlQuery': 'SQL Sorgusu',
    'database.execute': 'Çalıştır',
    'database.running': 'Çalıştırılıyor...',
    'database.noConnection': 'Veritabanı bağlantısı yok',
    'database.addConnectionDesc': 'Başlamak için bir bağlantı ekleyin',
    
    'api.newRequest': 'Yeni İstek',
    'api.requests': 'İstekler',
    'api.send': 'Gönder',
    'api.sending': 'Gönderiliyor...',
    'api.params': 'Parametreler',
    'api.headers': 'Başlıklar',
    'api.body': 'Gövde',
    'api.noResponse': 'Henüz yanıt yok',
    'api.sendRequest': 'Yanıtı görmek için bir istek gönderin',
    
    'tasks.board': 'Pano',
    'tasks.list': 'Liste',
    'tasks.milestones': 'Kilometre Taşları',
    'tasks.addTask': 'Görev Ekle',
    'tasks.addMilestone': 'Kilometre Taşı Ekle',
    'tasks.todo': 'Yapılacak',
    'tasks.inProgress': 'Devam Ediyor',
    'tasks.done': 'Tamamlandı',
    'tasks.allStatus': 'Tüm Durumlar',
    'tasks.allPriority': 'Tüm Öncelikler',
    'tasks.high': 'Yüksek',
    'tasks.medium': 'Orta',
    'tasks.low': 'Düşük',
    
    'docker.containers': 'Konteynerler',
    'docker.images': 'İmajlar',
    'docker.compose': 'Docker Compose',
    'docker.running': 'Çalışıyor',
    'docker.stopped': 'Durduruldu',
    'docker.paused': 'Duraklatıldı',
    'docker.start': 'Başlat',
    'docker.stop': 'Durdur',
    'docker.restart': 'Yeniden Başlat',
    'docker.logs': 'Loglar',
    'docker.remove': 'Kaldır',
    'docker.pull': 'Çek',
    'docker.run': 'Çalıştır'
  },
  
  en: {
    // Menu Bar
    'menu.file': 'File',
    'menu.edit': 'Edit',
    'menu.selection': 'Selection',
    'menu.view': 'View',
    'menu.go': 'Go',
    'menu.run': 'Run',
    'menu.terminal': 'Terminal',
    'menu.tools': 'Tools',
    'menu.help': 'Help',
    
    // Activity Bar
    'activity.explorer': 'Explorer',
    'activity.search': 'Search',
    'activity.sourceControl': 'Source Control',
    'activity.runDebug': 'Run and Debug',
    'activity.extensions': 'Extensions',
    'activity.accounts': 'Accounts',
    'activity.settings': 'Settings',
    'activity.workspace': 'Workspace',
    'activity.database': 'Database',
    'activity.apiTesting': 'API Testing',
    'activity.tasks': 'Tasks',
    'activity.docker': 'Docker',
    
    // File Operations
    'file.openProject': 'Open Project...',
    'file.openFile': 'Open File...',
    'file.closeFile': 'Close File',
    'file.save': 'Save',
    'file.exit': 'Exit',
    
    // Extensions
    'extensions.title': 'Extensions',
    'extensions.search': 'Search extensions...',
    'extensions.installed': 'Installed',
    'extensions.popular': 'Popular',
    'extensions.recommended': 'Recommended',
    'extensions.install': 'Install',
    'extensions.uninstall': 'Uninstall',
    'extensions.enable': 'Enable',
    'extensions.disable': 'Disable',
    'extensions.noExtensions': 'No extensions installed yet.',
    'extensions.getStarted': 'Click "Add Extension" to get started.',
    
    // Search
    'search.title': 'Search',
    'search.placeholder': 'Search',
    'search.includeFiles': 'Files to include',
    'search.excludeFiles': 'Files to exclude',
    'search.matchCase': 'Match Case',
    'search.wholeWord': 'Match Whole Word',
    'search.regex': 'Use Regular Expression',
    'search.noResults': 'No results found',
    'search.searching': 'Searching...',
    'search.searchWorkspace': 'Search across files in your workspace',
    
    // Source Control
    'git.title': 'Source Control',
    'git.commit': 'Commit',
    'git.changes': 'Changes',
    'git.stagedChanges': 'Staged Changes',
    'git.commitMessage': 'Message (press Ctrl+Enter to commit)',
    
    // Settings
    'settings.title': 'Settings',
    'settings.searchSettings': 'Search settings',
    'settings.user': 'User',
    'settings.workspace': 'Workspace',
    'settings.appearance': 'Appearance',
    'settings.keyboard': 'Keyboard Shortcuts',
    'settings.features': 'Features',
    'settings.remote': 'Remote',
    'settings.security': 'Security',
    
    // Common
    'common.close': 'Close',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.refresh': 'Refresh',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.warning': 'Warning',
    'common.info': 'Info',
    
    // Bottom Panel
    'panel.problems': 'Problems',
    'panel.aiSuggestions': 'AI Suggestions',
    'panel.aiActions': 'AI Actions',
    'panel.output': 'Output',
    'panel.terminal': 'Terminal',
    'panel.debugTest': 'Debug & Test',
    
    // Language Settings
    'language.title': 'Language',
    'language.description': 'Select interface language',
    'language.restart': 'Restart application for language change',
    
    // Debug
    'debug.launchProgram': 'Launch Program',
    'debug.attachProcess': 'Attach to Process',
    'debug.launchChrome': 'Launch Chrome',
    'debug.variables': 'Variables',
    'debug.watch': 'Watch',
    'debug.callStack': 'Call Stack',
    'debug.breakpoints': 'Breakpoints',
    'debug.noVariables': 'No variables to display',
    'debug.noWatch': 'No watch expressions',
    'debug.notPaused': 'Not paused on any thread',
    'debug.noBreakpoints': 'No breakpoints set',
    
    // Accounts
    'accounts.githubDesc': 'Sign in to sync settings',
    'accounts.microsoftDesc': 'Access Azure resources',
    'accounts.signInGithub': 'Sign In with GitHub',
    'accounts.signInMicrosoft': 'Sign In with Microsoft',
    
    // Settings descriptions
    'settings.userDesc': 'User settings that apply globally',
    'settings.workspaceDesc': 'Workspace settings that apply to this project',
    'settings.appearanceDesc': 'Theme, font, and UI customization',
    'settings.keyboardDesc': 'Customize keyboard shortcuts',
    'settings.extensionsDesc': 'Manage installed extensions',
    'settings.featuresDesc': 'Enable or disable editor features',
    'settings.remoteDesc': 'Remote development settings',
    'settings.securityDesc': 'Security and privacy settings',
    
    // Common additions
    'common.run': 'Start Debugging',
    
    // New Features
    'workspace.openWorkspace': 'Open Workspace',
    'workspace.newProject': 'New Project',
    'workspace.noWorkspaces': 'No workspaces yet',
    'workspace.getStarted': 'Open a folder or create a new project to get started',
    'workspace.active': 'Active',
    'workspace.files': 'files',
    'workspace.lastOpened': 'Last opened',
    
    'database.addConnection': 'Add Connection',
    'database.connections': 'Connections',
    'database.tables': 'Tables',
    'database.sqlQuery': 'SQL Query',
    'database.execute': 'Execute',
    'database.running': 'Running...',
    'database.noConnection': 'No database connected',
    'database.addConnectionDesc': 'Add a connection to get started',
    
    'api.newRequest': 'New Request',
    'api.requests': 'Requests',
    'api.send': 'Send',
    'api.sending': 'Sending...',
    'api.params': 'Params',
    'api.headers': 'Headers',
    'api.body': 'Body',
    'api.noResponse': 'No response yet',
    'api.sendRequest': 'Send a request to see the response',
    
    'tasks.board': 'Board',
    'tasks.list': 'List',
    'tasks.milestones': 'Milestones',
    'tasks.addTask': 'Add Task',
    'tasks.addMilestone': 'Add Milestone',
    'tasks.todo': 'To Do',
    'tasks.inProgress': 'In Progress',
    'tasks.done': 'Done',
    'tasks.allStatus': 'All Status',
    'tasks.allPriority': 'All Priority',
    'tasks.high': 'High',
    'tasks.medium': 'Medium',
    'tasks.low': 'Low',
    
    'docker.containers': 'Containers',
    'docker.images': 'Images',
    'docker.compose': 'Docker Compose',
    'docker.running': 'Running',
    'docker.stopped': 'Stopped',
    'docker.paused': 'Paused',
    'docker.start': 'Start',
    'docker.stop': 'Stop',
    'docker.restart': 'Restart',
    'docker.logs': 'Logs',
    'docker.remove': 'Remove',
    'docker.pull': 'Pull',
    'docker.run': 'Run'
  },
  
  de: {
    // Menu Bar
    'menu.file': 'Datei',
    'menu.edit': 'Bearbeiten',
    'menu.selection': 'Auswahl',
    'menu.view': 'Ansicht',
    'menu.go': 'Gehe zu',
    'menu.run': 'Ausführen',
    'menu.terminal': 'Terminal',
    'menu.tools': 'Werkzeuge',
    'menu.help': 'Hilfe',
    
    // Activity Bar
    'activity.explorer': 'Explorer',
    'activity.search': 'Suchen',
    'activity.sourceControl': 'Quellcodeverwaltung',
    'activity.runDebug': 'Ausführen und Debuggen',
    'activity.extensions': 'Erweiterungen',
    'activity.accounts': 'Konten',
    'activity.settings': 'Einstellungen',
    'activity.workspace': 'Arbeitsbereich',
    'activity.database': 'Datenbank',
    'activity.apiTesting': 'API-Tests',
    'activity.tasks': 'Aufgaben',
    'activity.docker': 'Docker',
    
    // File Operations
    'file.openProject': 'Projekt öffnen...',
    'file.openFile': 'Datei öffnen...',
    'file.closeFile': 'Datei schließen',
    'file.save': 'Speichern',
    'file.exit': 'Beenden',
    
    // Extensions
    'extensions.title': 'Erweiterungen',
    'extensions.search': 'Erweiterungen suchen...',
    'extensions.installed': 'Installiert',
    'extensions.popular': 'Beliebt',
    'extensions.recommended': 'Empfohlen',
    'extensions.install': 'Installieren',
    'extensions.uninstall': 'Deinstallieren',
    'extensions.enable': 'Aktivieren',
    'extensions.disable': 'Deaktivieren',
    'extensions.noExtensions': 'Noch keine Erweiterungen installiert.',
    'extensions.getStarted': 'Klicken Sie auf "Erweiterung hinzufügen" um zu beginnen.',
    
    // Search
    'search.title': 'Suchen',
    'search.placeholder': 'Suchen',
    'search.includeFiles': 'Einzuschließende Dateien',
    'search.excludeFiles': 'Auszuschließende Dateien',
    'search.matchCase': 'Groß-/Kleinschreibung beachten',
    'search.wholeWord': 'Ganzes Wort',
    'search.regex': 'Reguläre Ausdrücke verwenden',
    'search.noResults': 'Keine Ergebnisse gefunden',
    'search.searching': 'Suche läuft...',
    
    // Source Control
    'git.title': 'Quellcodeverwaltung',
    'git.commit': 'Commit',
    'git.changes': 'Änderungen',
    'git.stagedChanges': 'Bereitgestellte Änderungen',
    'git.commitMessage': 'Nachricht (Strg+Enter für Commit)',
    
    // Settings
    'settings.title': 'Einstellungen',
    'settings.searchSettings': 'Einstellungen durchsuchen',
    'settings.user': 'Benutzer',
    'settings.workspace': 'Arbeitsbereich',
    'settings.appearance': 'Erscheinungsbild',
    'settings.keyboard': 'Tastenkürzel',
    'settings.features': 'Funktionen',
    'settings.remote': 'Remote',
    'settings.security': 'Sicherheit',
    
    // Common
    'common.close': 'Schließen',
    'common.cancel': 'Abbrechen',
    'common.save': 'Speichern',
    'common.delete': 'Löschen',
    'common.edit': 'Bearbeiten',
    'common.refresh': 'Aktualisieren',
    'common.loading': 'Lädt...',
    'common.error': 'Fehler',
    'common.success': 'Erfolgreich',
    'common.warning': 'Warnung',
    'common.info': 'Info',
    
    // Bottom Panel
    'panel.problems': 'Probleme',
    'panel.aiSuggestions': 'KI-Vorschläge',
    'panel.aiActions': 'KI-Aktionen',
    'panel.output': 'Ausgabe',
    'panel.terminal': 'Terminal',
    'panel.debugTest': 'Debug & Test',
    
    // Language Settings
    'language.title': 'Sprache',
    'language.description': 'Oberflächensprache auswählen',
    'language.restart': 'Anwendung für Sprachänderung neu starten',
    
    // Debug
    'debug.launchProgram': 'Programm starten',
    'debug.attachProcess': 'An Prozess anhängen',
    'debug.launchChrome': 'Chrome starten',
    'debug.variables': 'Variablen',
    'debug.watch': 'Überwachen',
    'debug.callStack': 'Aufrufstapel',
    'debug.breakpoints': 'Haltepunkte',
    'debug.noVariables': 'Keine Variablen anzuzeigen',
    'debug.noWatch': 'Keine Überwachungsausdrücke',
    'debug.notPaused': 'Nicht in einem Thread angehalten',
    'debug.noBreakpoints': 'Keine Haltepunkte gesetzt',
    
    // Accounts
    'accounts.githubDesc': 'Anmelden um Einstellungen zu synchronisieren',
    'accounts.microsoftDesc': 'Auf Azure-Ressourcen zugreifen',
    'accounts.signInGithub': 'Mit GitHub anmelden',
    'accounts.signInMicrosoft': 'Mit Microsoft anmelden',
    
    // Settings descriptions
    'settings.userDesc': 'Benutzereinstellungen die global gelten',
    'settings.workspaceDesc': 'Arbeitsbereichseinstellungen für dieses Projekt',
    'settings.appearanceDesc': 'Theme, Schrift und UI-Anpassung',
    'settings.keyboardDesc': 'Tastenkürzel anpassen',
    'settings.extensionsDesc': 'Installierte Erweiterungen verwalten',
    'settings.featuresDesc': 'Editor-Funktionen aktivieren oder deaktivieren',
    'settings.remoteDesc': 'Remote-Entwicklungseinstellungen',
    'settings.securityDesc': 'Sicherheits- und Datenschutzeinstellungen',
    
    // Common additions
    'common.run': 'Debugging starten'
  },
  
  fr: {
    // Menu Bar
    'menu.file': 'Fichier',
    'menu.edit': 'Édition',
    'menu.selection': 'Sélection',
    'menu.view': 'Affichage',
    'menu.go': 'Aller à',
    'menu.run': 'Exécuter',
    'menu.terminal': 'Terminal',
    'menu.tools': 'Outils',
    'menu.help': 'Aide',
    
    // Activity Bar
    'activity.explorer': 'Explorateur',
    'activity.search': 'Rechercher',
    'activity.sourceControl': 'Contrôle de Source',
    'activity.runDebug': 'Exécuter et Déboguer',
    'activity.extensions': 'Extensions',
    'activity.accounts': 'Comptes',
    'activity.settings': 'Paramètres',
    'activity.workspace': 'Espace de Travail',
    'activity.database': 'Base de Données',
    'activity.apiTesting': 'Tests API',
    'activity.tasks': 'Tâches',
    'activity.docker': 'Docker',
    
    // File Operations
    'file.openProject': 'Ouvrir le Projet...',
    'file.openFile': 'Ouvrir le Fichier...',
    'file.closeFile': 'Fermer le Fichier',
    'file.save': 'Enregistrer',
    'file.exit': 'Quitter',
    
    // Extensions
    'extensions.title': 'Extensions',
    'extensions.search': 'Rechercher des extensions...',
    'extensions.installed': 'Installées',
    'extensions.popular': 'Populaires',
    'extensions.recommended': 'Recommandées',
    'extensions.install': 'Installer',
    'extensions.uninstall': 'Désinstaller',
    'extensions.enable': 'Activer',
    'extensions.disable': 'Désactiver',
    'extensions.noExtensions': 'Aucune extension installée.',
    'extensions.getStarted': 'Cliquez sur "Ajouter Extension" pour commencer.',
    
    // Search
    'search.title': 'Rechercher',
    'search.placeholder': 'Rechercher',
    'search.includeFiles': 'Fichiers à inclure',
    'search.excludeFiles': 'Fichiers à exclure',
    'search.matchCase': 'Respecter la Casse',
    'search.wholeWord': 'Mot Entier',
    'search.regex': 'Utiliser Expression Régulière',
    'search.noResults': 'Aucun résultat trouvé',
    'search.searching': 'Recherche en cours...',
    
    // Source Control
    'git.title': 'Contrôle de Source',
    'git.commit': 'Commit',
    'git.changes': 'Modifications',
    'git.stagedChanges': 'Modifications Préparées',
    'git.commitMessage': 'Message (Ctrl+Entrée pour commit)',
    
    // Settings
    'settings.title': 'Paramètres',
    'settings.searchSettings': 'Rechercher dans les paramètres',
    'settings.user': 'Utilisateur',
    'settings.workspace': 'Espace de Travail',
    'settings.appearance': 'Apparence',
    'settings.keyboard': 'Raccourcis Clavier',
    'settings.features': 'Fonctionnalités',
    'settings.remote': 'Distant',
    'settings.security': 'Sécurité',
    
    // Common
    'common.close': 'Fermer',
    'common.cancel': 'Annuler',
    'common.save': 'Enregistrer',
    'common.delete': 'Supprimer',
    'common.edit': 'Modifier',
    'common.refresh': 'Actualiser',
    'common.loading': 'Chargement...',
    'common.error': 'Erreur',
    'common.success': 'Succès',
    'common.warning': 'Avertissement',
    'common.info': 'Info',
    
    // Bottom Panel
    'panel.problems': 'Problèmes',
    'panel.aiSuggestions': 'Suggestions IA',
    'panel.aiActions': 'Actions IA',
    'panel.output': 'Sortie',
    'panel.terminal': 'Terminal',
    'panel.debugTest': 'Debug & Test',
    
    // Language Settings
    'language.title': 'Langue',
    'language.description': 'Sélectionner la langue de l\'interface',
    'language.restart': 'Redémarrer l\'application pour le changement de langue',
    
    // Debug
    'debug.launchProgram': 'Lancer le Programme',
    'debug.attachProcess': 'Attacher au Processus',
    'debug.launchChrome': 'Lancer Chrome',
    'debug.variables': 'Variables',
    'debug.watch': 'Surveiller',
    'debug.callStack': 'Pile d\'Appels',
    'debug.breakpoints': 'Points d\'Arrêt',
    'debug.noVariables': 'Aucune variable à afficher',
    'debug.noWatch': 'Aucune expression de surveillance',
    'debug.notPaused': 'Pas en pause sur un thread',
    'debug.noBreakpoints': 'Aucun point d\'arrêt défini',
    
    // Accounts
    'accounts.githubDesc': 'Se connecter pour synchroniser les paramètres',
    'accounts.microsoftDesc': 'Accéder aux ressources Azure',
    'accounts.signInGithub': 'Se connecter avec GitHub',
    'accounts.signInMicrosoft': 'Se connecter avec Microsoft',
    
    // Settings descriptions
    'settings.userDesc': 'Paramètres utilisateur qui s\'appliquent globalement',
    'settings.workspaceDesc': 'Paramètres d\'espace de travail pour ce projet',
    'settings.appearanceDesc': 'Thème, police et personnalisation UI',
    'settings.keyboardDesc': 'Personnaliser les raccourcis clavier',
    'settings.extensionsDesc': 'Gérer les extensions installées',
    'settings.featuresDesc': 'Activer ou désactiver les fonctionnalités',
    'settings.remoteDesc': 'Paramètres de développement distant',
    'settings.securityDesc': 'Paramètres de sécurité et confidentialité',
    
    // Common additions
    'common.run': 'Commencer le Débogage'
  },
  
  zh: {
    // Menu Bar
    'menu.file': '文件',
    'menu.edit': '编辑',
    'menu.selection': '选择',
    'menu.view': '查看',
    'menu.go': '转到',
    'menu.run': '运行',
    'menu.terminal': '终端',
    'menu.tools': '工具',
    'menu.help': '帮助',
    
    // Activity Bar
    'activity.explorer': '资源管理器',
    'activity.search': '搜索',
    'activity.sourceControl': '源代码管理',
    'activity.runDebug': '运行和调试',
    'activity.extensions': '扩展',
    'activity.accounts': '账户',
    'activity.settings': '设置',
    'activity.workspace': '工作区',
    'activity.database': '数据库',
    'activity.apiTesting': 'API测试',
    'activity.tasks': '任务',
    'activity.docker': 'Docker',
    
    // File Operations
    'file.openProject': '打开项目...',
    'file.openFile': '打开文件...',
    'file.closeFile': '关闭文件',
    'file.save': '保存',
    'file.exit': '退出',
    
    // Extensions
    'extensions.title': '扩展',
    'extensions.search': '搜索扩展...',
    'extensions.installed': '已安装',
    'extensions.popular': '热门',
    'extensions.recommended': '推荐',
    'extensions.install': '安装',
    'extensions.uninstall': '卸载',
    'extensions.enable': '启用',
    'extensions.disable': '禁用',
    'extensions.noExtensions': '尚未安装扩展。',
    'extensions.getStarted': '点击"添加扩展"开始使用。',
    
    // Search
    'search.title': '搜索',
    'search.placeholder': '搜索',
    'search.includeFiles': '包含的文件',
    'search.excludeFiles': '排除的文件',
    'search.matchCase': '区分大小写',
    'search.wholeWord': '全字匹配',
    'search.regex': '使用正则表达式',
    'search.noResults': '未找到结果',
    'search.searching': '搜索中...',
    
    // Source Control
    'git.title': '源代码管理',
    'git.commit': '提交',
    'git.changes': '更改',
    'git.stagedChanges': '暂存的更改',
    'git.commitMessage': '消息（按Ctrl+Enter提交）',
    
    // Settings
    'settings.title': '设置',
    'settings.searchSettings': '搜索设置',
    'settings.user': '用户',
    'settings.workspace': '工作区',
    'settings.appearance': '外观',
    'settings.keyboard': '键盘快捷键',
    'settings.features': '功能',
    'settings.remote': '远程',
    'settings.security': '安全',
    
    // Common
    'common.close': '关闭',
    'common.cancel': '取消',
    'common.save': '保存',
    'common.delete': '删除',
    'common.edit': '编辑',
    'common.refresh': '刷新',
    'common.loading': '加载中...',
    'common.error': '错误',
    'common.success': '成功',
    'common.warning': '警告',
    'common.info': '信息',
    
    // Bottom Panel
    'panel.problems': '问题',
    'panel.aiSuggestions': 'AI建议',
    'panel.aiActions': 'AI操作',
    'panel.output': '输出',
    'panel.terminal': '终端',
    'panel.debugTest': '调试和测试',
    
    // Language Settings
    'language.title': '语言',
    'language.description': '选择界面语言',
    'language.restart': '重启应用程序以更改语言',
    
    // Debug
    'debug.launchProgram': '启动程序',
    'debug.attachProcess': '附加到进程',
    'debug.launchChrome': '启动Chrome',
    'debug.variables': '变量',
    'debug.watch': '监视',
    'debug.callStack': '调用堆栈',
    'debug.breakpoints': '断点',
    'debug.noVariables': '没有要显示的变量',
    'debug.noWatch': '没有监视表达式',
    'debug.notPaused': '未在任何线程上暂停',
    'debug.noBreakpoints': '未设置断点',
    
    // Accounts
    'accounts.githubDesc': '登录以同步设置',
    'accounts.microsoftDesc': '访问Azure资源',
    'accounts.signInGithub': '使用GitHub登录',
    'accounts.signInMicrosoft': '使用Microsoft登录',
    
    // Settings descriptions
    'settings.userDesc': '全局应用的用户设置',
    'settings.workspaceDesc': '应用于此项目的工作区设置',
    'settings.appearanceDesc': '主题、字体和UI自定义',
    'settings.keyboardDesc': '自定义键盘快捷键',
    'settings.extensionsDesc': '管理已安装的扩展',
    'settings.featuresDesc': '启用或禁用编辑器功能',
    'settings.remoteDesc': '远程开发设置',
    'settings.securityDesc': '安全和隐私设置',
    
    // Common additions
    'common.run': '开始调试'
  },
  
  es: {
    // Menu Bar
    'menu.file': 'Archivo',
    'menu.edit': 'Editar',
    'menu.selection': 'Selección',
    'menu.view': 'Ver',
    'menu.go': 'Ir a',
    'menu.run': 'Ejecutar',
    'menu.terminal': 'Terminal',
    'menu.tools': 'Herramientas',
    'menu.help': 'Ayuda',
    
    // Activity Bar
    'activity.explorer': 'Explorador',
    'activity.search': 'Buscar',
    'activity.sourceControl': 'Control de Código',
    'activity.runDebug': 'Ejecutar y Depurar',
    'activity.extensions': 'Extensiones',
    'activity.accounts': 'Cuentas',
    'activity.settings': 'Configuración',
    'activity.workspace': 'Espacio de Trabajo',
    'activity.database': 'Base de Datos',
    'activity.apiTesting': 'Pruebas API',
    'activity.tasks': 'Tareas',
    'activity.docker': 'Docker',
    
    // File Operations
    'file.openProject': 'Abrir Proyecto...',
    'file.openFile': 'Abrir Archivo...',
    'file.closeFile': 'Cerrar Archivo',
    'file.save': 'Guardar',
    'file.exit': 'Salir',
    
    // Extensions
    'extensions.title': 'Extensiones',
    'extensions.search': 'Buscar extensiones...',
    'extensions.installed': 'Instaladas',
    'extensions.popular': 'Populares',
    'extensions.recommended': 'Recomendadas',
    'extensions.install': 'Instalar',
    'extensions.uninstall': 'Desinstalar',
    'extensions.enable': 'Habilitar',
    'extensions.disable': 'Deshabilitar',
    'extensions.noExtensions': 'No hay extensiones instaladas.',
    'extensions.getStarted': 'Haz clic en "Agregar Extensión" para comenzar.',
    
    // Search
    'search.title': 'Buscar',
    'search.placeholder': 'Buscar',
    'search.includeFiles': 'Archivos a incluir',
    'search.excludeFiles': 'Archivos a excluir',
    'search.matchCase': 'Coincidir Mayúsculas',
    'search.wholeWord': 'Palabra Completa',
    'search.regex': 'Usar Expresión Regular',
    'search.noResults': 'No se encontraron resultados',
    'search.searching': 'Buscando...',
    
    // Source Control
    'git.title': 'Control de Código',
    'git.commit': 'Commit',
    'git.changes': 'Cambios',
    'git.stagedChanges': 'Cambios Preparados',
    'git.commitMessage': 'Mensaje (Ctrl+Enter para commit)',
    
    // Settings
    'settings.title': 'Configuración',
    'settings.searchSettings': 'Buscar configuración',
    'settings.user': 'Usuario',
    'settings.workspace': 'Espacio de Trabajo',
    'settings.appearance': 'Apariencia',
    'settings.keyboard': 'Atajos de Teclado',
    'settings.features': 'Características',
    'settings.remote': 'Remoto',
    'settings.security': 'Seguridad',
    
    // Common
    'common.close': 'Cerrar',
    'common.cancel': 'Cancelar',
    'common.save': 'Guardar',
    'common.delete': 'Eliminar',
    'common.edit': 'Editar',
    'common.refresh': 'Actualizar',
    'common.loading': 'Cargando...',
    'common.error': 'Error',
    'common.success': 'Éxito',
    'common.warning': 'Advertencia',
    'common.info': 'Información',
    
    // Bottom Panel
    'panel.problems': 'Problemas',
    'panel.aiSuggestions': 'Sugerencias IA',
    'panel.aiActions': 'Acciones IA',
    'panel.output': 'Salida',
    'panel.terminal': 'Terminal',
    'panel.debugTest': 'Debug y Test',
    
    // Language Settings
    'language.title': 'Idioma',
    'language.description': 'Seleccionar idioma de la interfaz',
    'language.restart': 'Reiniciar aplicación para cambio de idioma',
    
    // Debug
    'debug.launchProgram': 'Lanzar Programa',
    'debug.attachProcess': 'Adjuntar a Proceso',
    'debug.launchChrome': 'Lanzar Chrome',
    'debug.variables': 'Variables',
    'debug.watch': 'Observar',
    'debug.callStack': 'Pila de Llamadas',
    'debug.breakpoints': 'Puntos de Interrupción',
    'debug.noVariables': 'No hay variables para mostrar',
    'debug.noWatch': 'No hay expresiones de observación',
    'debug.notPaused': 'No pausado en ningún hilo',
    'debug.noBreakpoints': 'No hay puntos de interrupción establecidos',
    
    // Accounts
    'accounts.githubDesc': 'Iniciar sesión para sincronizar configuración',
    'accounts.microsoftDesc': 'Acceder a recursos de Azure',
    'accounts.signInGithub': 'Iniciar Sesión con GitHub',
    'accounts.signInMicrosoft': 'Iniciar Sesión con Microsoft',
    
    // Settings descriptions
    'settings.userDesc': 'Configuración de usuario que se aplica globalmente',
    'settings.workspaceDesc': 'Configuración de espacio de trabajo para este proyecto',
    'settings.appearanceDesc': 'Tema, fuente y personalización de UI',
    'settings.keyboardDesc': 'Personalizar atajos de teclado',
    'settings.extensionsDesc': 'Gestionar extensiones instaladas',
    'settings.featuresDesc': 'Habilitar o deshabilitar características del editor',
    'settings.remoteDesc': 'Configuración de desarrollo remoto',
    'settings.securityDesc': 'Configuración de seguridad y privacidad',
    
    // Common additions
    'common.run': 'Iniciar Depuración'
  },
  
  ar: {
    // Menu Bar
    'menu.file': 'ملف',
    'menu.edit': 'تحرير',
    'menu.selection': 'تحديد',
    'menu.view': 'عرض',
    'menu.go': 'انتقال',
    'menu.run': 'تشغيل',
    'menu.terminal': 'طرفية',
    'menu.tools': 'أدوات',
    'menu.help': 'مساعدة',
    
    // Activity Bar
    'activity.explorer': 'مستكشف',
    'activity.search': 'بحث',
    'activity.sourceControl': 'التحكم في المصدر',
    'activity.runDebug': 'تشغيل وتصحيح',
    'activity.extensions': 'إضافات',
    'activity.accounts': 'حسابات',
    'activity.settings': 'إعدادات',
    'activity.workspace': 'مساحة العمل',
    'activity.database': 'قاعدة البيانات',
    'activity.apiTesting': 'اختبار API',
    'activity.tasks': 'المهام',
    'activity.docker': 'Docker',
    
    // File Operations
    'file.openProject': 'فتح مشروع...',
    'file.openFile': 'فتح ملف...',
    'file.closeFile': 'إغلاق الملف',
    'file.save': 'حفظ',
    'file.exit': 'خروج',
    
    // Extensions
    'extensions.title': 'الإضافات',
    'extensions.search': 'البحث عن إضافات...',
    'extensions.installed': 'مثبتة',
    'extensions.popular': 'شائعة',
    'extensions.recommended': 'موصى بها',
    'extensions.install': 'تثبيت',
    'extensions.uninstall': 'إلغاء التثبيت',
    'extensions.enable': 'تفعيل',
    'extensions.disable': 'تعطيل',
    'extensions.noExtensions': 'لم يتم تثبيت أي إضافات بعد.',
    'extensions.getStarted': 'انقر على "إضافة إضافة" للبدء.',
    
    // Search
    'search.title': 'بحث',
    'search.placeholder': 'بحث',
    'search.includeFiles': 'الملفات المراد تضمينها',
    'search.excludeFiles': 'الملفات المراد استبعادها',
    'search.matchCase': 'مطابقة الحالة',
    'search.wholeWord': 'الكلمة كاملة',
    'search.regex': 'استخدام التعبير النمطي',
    'search.noResults': 'لم يتم العثور على نتائج',
    'search.searching': 'جاري البحث...',
    
    // Source Control
    'git.title': 'التحكم في المصدر',
    'git.commit': 'إرسال',
    'git.changes': 'التغييرات',
    'git.stagedChanges': 'التغييرات المرحلة',
    'git.commitMessage': 'رسالة (اضغط Ctrl+Enter للإرسال)',
    
    // Settings
    'settings.title': 'الإعدادات',
    'settings.searchSettings': 'البحث في الإعدادات',
    'settings.user': 'المستخدم',
    'settings.workspace': 'مساحة العمل',
    'settings.appearance': 'المظهر',
    'settings.keyboard': 'اختصارات لوحة المفاتيح',
    'settings.features': 'الميزات',
    'settings.remote': 'بعيد',
    'settings.security': 'الأمان',
    
    // Common
    'common.close': 'إغلاق',
    'common.cancel': 'إلغاء',
    'common.save': 'حفظ',
    'common.delete': 'حذف',
    'common.edit': 'تحرير',
    'common.refresh': 'تحديث',
    'common.loading': 'جاري التحميل...',
    'common.error': 'خطأ',
    'common.success': 'نجح',
    'common.warning': 'تحذير',
    'common.info': 'معلومات',
    
    // Bottom Panel
    'panel.problems': 'مشاكل',
    'panel.aiSuggestions': 'اقتراحات الذكي',
    'panel.aiActions': 'إجراءات الذكي',
    'panel.output': 'الإخراج',
    'panel.terminal': 'طرفية',
    'panel.debugTest': 'تصحيح واختبار',
    
    // Language Settings
    'language.title': 'اللغة',
    'language.description': 'اختيار لغة الواجهة',
    'language.restart': 'إعادة تشغيل التطبيق لتغيير اللغة',
    
    // Debug
    'debug.launchProgram': 'تشغيل البرنامج',
    'debug.attachProcess': 'إرفاق بالعملية',
    'debug.launchChrome': 'تشغيل Chrome',
    'debug.variables': 'المتغيرات',
    'debug.watch': 'مراقبة',
    'debug.callStack': 'مكدس الاستدعاء',
    'debug.breakpoints': 'نقاط التوقف',
    'debug.noVariables': 'لا توجد متغيرات للعرض',
    'debug.noWatch': 'لا توجد تعبيرات مراقبة',
    'debug.notPaused': 'غير متوقف على أي خيط',
    'debug.noBreakpoints': 'لم يتم تعيين نقاط توقف',
    
    // Accounts
    'accounts.githubDesc': 'تسجيل الدخول لمزامنة الإعدادات',
    'accounts.microsoftDesc': 'الوصول إلى موارد Azure',
    'accounts.signInGithub': 'تسجيل الدخول باستخدام GitHub',
    'accounts.signInMicrosoft': 'تسجيل الدخول باستخدام Microsoft',
    
    // Settings descriptions
    'settings.userDesc': 'إعدادات المستخدم التي تطبق عالمياً',
    'settings.workspaceDesc': 'إعدادات مساحة العمل لهذا المشروع',
    'settings.appearanceDesc': 'السمة والخط وتخصيص الواجهة',
    'settings.keyboardDesc': 'تخصيص اختصارات لوحة المفاتيح',
    'settings.extensionsDesc': 'إدارة الإضافات المثبتة',
    'settings.featuresDesc': 'تفعيل أو تعطيل ميزات المحرر',
    'settings.remoteDesc': 'إعدادات التطوير البعيد',
    'settings.securityDesc': 'إعدادات الأمان والخصوصية',
    
    // Common additions
    'common.run': 'بدء التصحيح'
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [currentLanguage, setCurrentLanguage] = useState<Language>('tr');

  const languages = [
    { code: 'tr' as Language, name: 'Türkçe', flag: '🇹🇷' },
    { code: 'en' as Language, name: 'English', flag: '🇺🇸' },
    { code: 'de' as Language, name: 'Deutsch', flag: '🇩🇪' },
    { code: 'fr' as Language, name: 'Français', flag: '🇫🇷' },
    { code: 'zh' as Language, name: '中文', flag: '🇨🇳' },
    { code: 'es' as Language, name: 'Español', flag: '🇪🇸' },
    { code: 'ar' as Language, name: 'العربية', flag: '🇸🇦' }
  ];

  useEffect(() => {
    const saved = localStorage.getItem('corex-language');
    if (saved && languages.some(lang => lang.code === saved)) {
      setCurrentLanguage(saved as Language);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setCurrentLanguage(lang);
    localStorage.setItem('corex-language', lang);
    
    // Update document direction for RTL languages
    if (lang === 'ar') {
      document.documentElement.dir = 'rtl';
    } else {
      document.documentElement.dir = 'ltr';
    }
  };

  const t = (key: string): string => {
    const currentTranslations = translations[currentLanguage];
    return (currentTranslations as any)?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{
      currentLanguage,
      setLanguage,
      t,
      languages
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}