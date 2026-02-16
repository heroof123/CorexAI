import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LayoutProvider } from "./contexts/LayoutContext";
import { createEmbedding } from "./services/embedding";
import { sendToAI, resetConversation, updateProjectContext, getConversationContext } from "./services/ai";
import { saveProjectIndex, getProjectIndex, saveConversation, getConversation } from "./services/db";
import { FileIndex, Message, CodeAction } from "./types/index";
import { WorkflowNotification } from "./types/workflow";
import { addRecentProject, getProjectTypeFromFiles } from "./services/recentProjects";
import { incrementalIndexer } from "./services/incrementalIndexer";
import { cacheManager } from "./services/cache";
import { dependencyAnalyzer } from "./services/dependencyAnalyzer";
import { smartContextBuilder } from "./services/smartContextBuilder";

// 🚀 Continue.dev Architecture
import { initializeExtension } from "./extension";
import { useCore } from "./hooks/useCore";

// 🚀 LAZY LOAD: Heavy components (code splitting)
import { lazy, Suspense } from "react";
import LoadingSpinner from "./components/LoadingSpinner";

// Core components (always needed)
import WelcomeScreen from "./components/WelcomeScreen";
import ChatPanel from "./components/chatpanel";
import NotificationToast from "./components/notificationToast";
import ActivityBar from "./components/ActivityBar";
import StatusBar from "./components/StatusBar";
import ToastContainer from "./components/ToastContainer";
import { NotificationProvider, useNotifications, StatusIndicator, notificationHelpers } from "./components/NotificationSystem";

// Lazy loaded components (loaded on demand)
const Dashboard = lazy(() => import("./components/Dashboard"));
const TerminalPanel = lazy(() => import("./components/TerminalPanel"));
const BrowserPanel = lazy(() => import("./components/BrowserPanel"));
const CommandPalette = lazy(() => import("./components/CommandPalette"));
const QuickFileOpen = lazy(() => import("./components/QuickFileOpen"));
const FindInFiles = lazy(() => import("./components/FindInFiles"));
const BottomPanel = lazy(() => import("./components/BottomPanel"));
const SplitView = lazy(() => import("./components/SplitView"));
const LayoutPresets = lazy(() => import("./components/LayoutPresets"));
const AdvancedSearch = lazy(() => import("./components/AdvancedSearch"));
const EnhancedEditor = lazy(() => import("./components/EnhancedEditor"));
const EnhancedAIPanel = lazy(() => import("./components/EnhancedAIPanel"));
const CodeReviewPanel = lazy(() => import("./components/CodeReviewPanel"));
const GitPanel = lazy(() => import("./components/GitPanel"));
const SettingsPanel = lazy(() => import("./components/SettingsPanel"));
const CustomizeLayout = lazy(() => import("./components/CustomizeLayout"));
const DeveloperTools = lazy(() => import("./components/DeveloperTools"));
const CodeSnippets = lazy(() => import("./components/CodeSnippets"));
const CodeAnalysis = lazy(() => import("./components/CodeAnalysis"));
const AdvancedTheming = lazy(() => import("./components/AdvancedTheming"));
const RemoteDevelopment = lazy(() => import("./components/RemoteDevelopment"));
const SidePanel = lazy(() => import("./components/SidePanel"));
const AISettings = lazy(() => import("./components/AISettings"));
import { useLayout } from "./contexts/LayoutContext";
import { useKeyboardShortcuts, createShortcut } from "./hooks/useKeyboardShortcuts";
import { LanguageProvider, useLanguage } from "./contexts/LanguageContext";

function AppContent() {
  // 🚀 Continue.dev Architecture - Core Hook
  const { 
    coreMessages, 
    isStreaming: isCoreStreaming,
    // currentRequestId, // TODO: Track active requests
    sendChatRequest,
    stopGeneration: stopCoreGeneration,
    // clearMessages: clearCoreMessages // TODO: Add clear button
  } = useCore();
  
  // Language context
  const { t } = useLanguage();

  // Notifications
  const { addNotification } = useNotifications();

  // Utility function for unique message IDs
  const generateMessageId = (prefix: string = 'msg') => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `${prefix}-${timestamp}-${random}`;
  };

  // 🆕 Kod bloklarını çıkar (markdown code blocks)
  const extractCodeBlocks = (text: string): Array<{ language: string; code: string; filename?: string }> => {
    const codeBlocks: Array<{ language: string; code: string; filename?: string }> = [];
    
    // Markdown kod bloklarını bul: ```language\ncode\n```
    const codeBlockRegex = /```(\w+)(?:\s+(.+?))?\n([\s\S]*?)```/g;
    let match;
    
    while ((match = codeBlockRegex.exec(text)) !== null) {
      const language = match[1] || 'txt';
      const filename = match[2]?.trim(); // Opsiyonel dosya adı
      const code = match[3].trim();
      
      // Boş kod bloklarını atla
      if (code.length === 0) continue;
      
      codeBlocks.push({
        language,
        code,
        filename
      });
    }
    
    return codeBlocks;
  };

  // 🆕 Kod bloklarından otomatik dosya oluştur
  const createFilesFromCodeBlocks = async (codeBlocks: Array<{ language: string; code: string; filename?: string }>) => {
    for (const block of codeBlocks) {
      // Dosya uzantısı map'i
      const extensionMap: Record<string, string> = {
        'html': 'html',
        'css': 'css',
        'javascript': 'js',
        'js': 'js',
        'typescript': 'ts',
        'ts': 'ts',
        'tsx': 'tsx',
        'jsx': 'jsx',
        'python': 'py',
        'py': 'py',
        'rust': 'rs',
        'rs': 'rs',
        'go': 'go',
        'java': 'java',
        'cpp': 'cpp',
        'c': 'c',
        'json': 'json',
        'xml': 'xml',
        'yaml': 'yaml',
        'yml': 'yml',
        'md': 'md',
        'markdown': 'md',
        'txt': 'txt',
      };
      
      // Dosya adını temizle - Windows için geçersiz karakterleri kaldır
      let filename = block.filename;
      
      if (!filename) {
        // Dosya adı yoksa, dil bazlı varsayılan ad oluştur
        const ext = extensionMap[block.language.toLowerCase()] || 'txt';
        filename = `generated_${Date.now()}.${ext}`;
      } else {
        // Dosya adı varsa, uzantı kontrolü yap
        const hasExtension = /\.\w+$/.test(filename);
        if (!hasExtension) {
          // Uzantı yoksa ekle
          const ext = extensionMap[block.language.toLowerCase()] || 'txt';
          filename = `${filename}.${ext}`;
        }
      }
      
      // Geçersiz karakterleri temizle: < > : " / \ | ? *
      filename = filename.replace(/[<>:"/\\|?*]/g, '_');
      
      // Boşlukları alt çizgi yap
      filename = filename.replace(/\s+/g, '_');
      
      // Eğer dosya adı hala geçersizse, varsayılan ad ver
      if (!filename || filename.startsWith('.') || filename === '_') {
        const ext = extensionMap[block.language.toLowerCase()] || 'txt';
        filename = `generated_${Date.now()}.${ext}`;
      }
      
      const filepath = projectPath ? `${projectPath}/${filename}` : filename;
      
      try {
        // Dosyayı oluştur
        await invoke("write_file", { path: filepath, content: block.code });
        console.log(`✅ Dosya oluşturuldu: ${filename}`);
        
        // Dosyayı aç
        await openFile(filepath);
        
        // Index'e ekle (embedding arka planda)
        setTimeout(async () => {
          try {
            const embedding = await createEmbedding(block.code);
            setFileIndex(prev => {
              const existing = prev.find(f => f.path === filepath);
              if (existing) {
                return prev.map(f => f.path === filepath ? { ...f, embedding } : f);
              }
              return [...prev, {
                path: filepath,
                content: block.code.substring(0, 10000),
                embedding,
                lastModified: Date.now()
              }];
            });
          } catch (err) {
            console.error('Embedding hatası:', err);
          }
        }, 100);
        
        // Bilgi mesajı
        setMessages(prev => [...prev, {
          id: generateMessageId('file-created'),
          role: "system",
          content: `✅ ${filename} oluşturuldu ve açıldı`,
          timestamp: Date.now()
        }]);
        
      } catch (error) {
        console.error(`❌ Dosya oluşturma hatası:`, error);
        setMessages(prev => [...prev, {
          id: generateMessageId('file-error'),
          role: "system",
          content: `❌ ${filename} oluşturulamadı: ${error}`,
          timestamp: Date.now()
        }]);
      }
    }
  };

  // Layout context
  const {
    showRightSidebar,
    showBottomPanel,
    leftSidebarWidth,
    rightSidebarWidth,
    toggleRightSidebar,
    toggleBottomPanel,
    setLeftSidebarWidth,
    setRightSidebarWidth
  } = useLayout();

  // Activity Bar state
  const [activeView, setActiveView] = useState('explorer');
  const [showActivitySidebar, setShowActivitySidebar] = useState(true);

  // App state
  const [hasProject, setHasProject] = useState(false);
  // 🔧 Roller kaldırıldı - Tek model kullanılıyor
  
  // Project state
  const [projectPath, setProjectPath] = useState("");
  const [files, setFiles] = useState<string[]>([]);
  const [fileIndex, setFileIndex] = useState<FileIndex[]>([]);
  
  // Editor state
  const [selectedFile, setSelectedFile] = useState("");
  const [fileContent, setFileContent] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [openTabs, setOpenTabs] = useState<Array<{ path: string; content: string }>>([]);
  
  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [toolApprovalRequest, setToolApprovalRequest] = useState<{
    toolName: string;
    parameters: Record<string, unknown>;
    resolve: (approved: boolean) => void;
  } | null>(null);
  
  // Indexing state
  const [isIndexing, setIsIndexing] = useState(false);
  const [indexProgress, setIndexProgress] = useState({ current: 0, total: 0 });
  
  // Code actions state
  const [pendingActions, setPendingActions] = useState<CodeAction[]>([]);
  
  // Workflow state
  const [notification, setNotification] = useState<WorkflowNotification | null>(null);

  // 🤖 Proje analizi fonksiyonu - SADE VE ANLAŞILIR
  const analyzeProjectStructure = async (indexed: FileIndex[], projectPath: string): Promise<string> => {
    try {
      // Proje türünü belirle
      const hasPackageJson = indexed.some(f => f.path.endsWith('package.json'));
      const hasCargoToml = indexed.some(f => f.path.endsWith('Cargo.toml'));
      const hasPyprojectToml = indexed.some(f => f.path.endsWith('pyproject.toml'));
      const hasRequirementsTxt = indexed.some(f => f.path.endsWith('requirements.txt'));
      
      let projectType = "Bilinmeyen";
      const features: string[] = [];
      let purpose = "";
      
      if (hasPackageJson) {
        const packageJson = indexed.find(f => f.path.endsWith('package.json'));
        if (packageJson) {
          try {
            const pkg = JSON.parse(packageJson.content);
            
            // Proje türü
            if (pkg.dependencies?.react || pkg.devDependencies?.react) {
              projectType = "React";
              if (pkg.dependencies?.['@tauri-apps/api']) {
                features.push("Tauri (masaüstü uygulama)");
              }
              if (pkg.dependencies?.['react-native'] || pkg.dependencies?.expo) {
                features.push("React Native (mobil uygulama)");
              }
            } else if (pkg.dependencies?.vue) {
              projectType = "Vue.js";
            } else if (pkg.dependencies?.angular) {
              projectType = "Angular";
            } else if (pkg.dependencies?.express) {
              projectType = "Node.js/Express";
              purpose = "Backend API sunucusu";
            } else if (pkg.dependencies?.next) {
              projectType = "Next.js";
              purpose = "Full-stack web uygulaması";
            } else {
              projectType = "Node.js";
            }
            
            // Özellikler
            if (pkg.dependencies?.typescript || pkg.devDependencies?.typescript) {
              features.push("TypeScript");
            }
            if (pkg.dependencies?.tailwindcss) {
              features.push("Tailwind CSS");
            }
            if (pkg.dependencies?.prisma || pkg.dependencies?.['@prisma/client']) {
              features.push("Prisma (veritabanı)");
            }
            
          } catch (e) {
            projectType = "JavaScript/Node.js";
          }
        }
      } else if (hasCargoToml) {
        projectType = "Rust";
        purpose = "Sistem programlama";
      } else if (hasPyprojectToml || hasRequirementsTxt) {
        projectType = "Python";
      }
      
      const projectName = projectPath.split(/[\\/]/).pop() || "Proje";
      
      // 🎯 SADE PROMPT - AI'ya sadece özet bilgi ver
      const prompt = `Yeni bir proje açıldı. Kullanıcıya KISA ve SADE bir şekilde açıkla:

Proje Adı: ${projectName}
Proje Türü: ${projectType}
${purpose ? `Amaç: ${purpose}` : ''}
${features.length > 0 ? `Özellikler: ${features.join(', ')}` : ''}
Dosya Sayısı: ${indexed.length}

KURALLAR:
1. Sadece 3-4 cümle yaz
2. Proje türünü ve amacını söyle
3. Önemli özellikleri listele (3-5 madde)
4. DETAYA GİRME! Dosya listesi, kod örnekleri VERME!
5. Samimi ve anlaşılır dil kullan

Örnek format:
"Merhaba! 👋 Bu bir [TÜR] projesi. [AMAÇ].

**Özellikler:**
- [Özellik 1]
- [Özellik 2]
- [Özellik 3]

Ne yapmak istersin? 😊"`;

      // AI'ya gönder
      const aiResponse = await sendToAI(prompt);
      return aiResponse;
      
    } catch (error) {
      return `Merhaba! 👋 Projen yüklendi. ${indexed.length} dosya hazır. Ne yapmak istersin? 😊`;
    }
  };

  // 🚀 Handle Core messages (Continue.dev architecture)
  // Track processed messages to avoid duplicates
  const processedMessagesRef = useRef<Set<string>>(new Set());
  
  useEffect(() => {
    if (coreMessages.length === 0) return;
    
    const latestMessage = coreMessages[coreMessages.length - 1];
    
    // Skip if already processed (except streaming/token which updates content)
    if (latestMessage.messageType !== 'streaming/token' && 
        processedMessagesRef.current.has(latestMessage.messageId)) {
      return;
    }
    
    // Mark as processed
    if (latestMessage.messageType !== 'streaming/token') {
      processedMessagesRef.current.add(latestMessage.messageId);
    }
    
    console.log(`📨 App: Handling Core message: ${latestMessage.messageType}`);
    
    switch (latestMessage.messageType) {
      case 'streaming/start':
        console.log('🌊 Streaming started');
        // Boş assistant mesajı oluştur (sadece bu requestId için yoksa)
        const assistantMessageId = `assistant-${latestMessage.data.requestId}`;
        setMessages(prev => {
          // Bu ID'ye sahip mesaj zaten varsa ekleme
          if (prev.some(msg => msg.id === assistantMessageId)) {
            console.log('⚠️ Message already exists, skipping:', assistantMessageId);
            return prev;
          }
          return [...prev, {
            id: assistantMessageId,
            role: "assistant",
            content: "",
            timestamp: Date.now()
          }];
        });
        break;
        
      case 'streaming/token':
        // Token geldi, mesajı güncelle
        // 🆕 Kod bloklarını TAMAMEN gizle - hiç gösterme
        const tokenContent = latestMessage.data.accumulated;
        
        // Kod bloğu var mı kontrol et
        const hasCodeBlock = /```/.test(tokenContent);
        
        let displayContent = tokenContent;
        if (hasCodeBlock) {
          // Kod bloğu varsa, sadece kod öncesi metni göster
          const beforeCode = tokenContent.split('```')[0];
          displayContent = beforeCode + '\n\n⏳ Kod yazılıyor...';
        }
        
        // 🔥 PERFORMANS: Sadece son mesajı güncelle, diğerlerine dokunma
        setMessages(prev => {
          const lastIndex = prev.length - 1;
          if (lastIndex < 0) return prev;
          
          const lastMsg = prev[lastIndex];
          if (lastMsg.id !== `assistant-${latestMessage.data.requestId}`) return prev;
          
          // Sadece son mesajı güncelle
          const newMessages = [...prev];
          newMessages[lastIndex] = { ...lastMsg, content: displayContent };
          return newMessages;
        });
        break;
        
      case 'streaming/complete':
        console.log('✅ Streaming complete');
        
        // 🆕 Kod bloklarını analiz et ve otomatik dosya oluştur
        const codeBlocks = extractCodeBlocks(latestMessage.data.fullResponse);
        
        if (codeBlocks.length > 0) {
          console.log(`📝 ${codeBlocks.length} kod bloğu bulundu, dosyalar oluşturuluyor...`);
          
          // Kodları chat'ten tamamen temizle - sadece açıklama kalsın
          let cleanResponse = latestMessage.data.fullResponse;
          
          // Her kod bloğunu dosya bilgisiyle değiştir
          codeBlocks.forEach((block, index) => {
            const filename = block.filename || `file-${index + 1}.${block.language}`;
            const replacement = `\n📄 **Dosya oluşturuldu:** \`${filename}\` (${block.language})\n`;
            
            // İlk kod bloğunu bul ve değiştir
            const codeBlockRegex = /```[\s\S]*?```/;
            cleanResponse = cleanResponse.replace(codeBlockRegex, replacement);
          });
          
          cleanResponse = cleanResponse.trim();
          
          // Final mesajı güncelle (kod blokları olmadan, sadece dosya bilgileri)
          setMessages(prev => prev.map(msg => 
            msg.id === `assistant-${latestMessage.data.requestId}`
              ? { ...msg, content: cleanResponse }
              : msg
          ));
          
          // Dosyaları otomatik oluştur (async)
          createFilesFromCodeBlocks(codeBlocks);
          
        } else {
          // Kod bloğu yoksa normal mesaj
          setMessages(prev => prev.map(msg => 
            msg.id === `assistant-${latestMessage.data.requestId}`
              ? { ...msg, content: latestMessage.data.fullResponse }
              : msg
          ));
        }
        
        setIsLoading(false);
        break;
        
      case 'streaming/error':
        console.error('❌ Streaming error:', latestMessage.data.error);
        setMessages(prev => [...prev, {
          id: generateMessageId('error'),
          role: "system",
          content: `❌ AI Hatası: ${latestMessage.data.error}`,
          timestamp: Date.now()
        }]);
        setIsLoading(false);
        break;
        
      case 'error':
        console.error('❌ Core error:', latestMessage.data.error);
        setMessages(prev => [...prev, {
          id: generateMessageId('error'),
          role: "system",
          content: `❌ Hata: ${latestMessage.data.error}`,
          timestamp: Date.now()
        }]);
        break;
    }
  }, [coreMessages]);

  // 🚀 Initialize Continue.dev Extension (uygulama başlangıcında)
  useEffect(() => {
    const initExtension = async () => {
      try {
        console.log('🚀 Initializing Continue.dev Extension...');
        await initializeExtension();
        console.log('✅ Continue.dev Extension initialized');
      } catch (error) {
        console.error('❌ Failed to initialize Extension:', error);
      }
    };
    initExtension();
  }, []);

  // 🚀 Cache'i yükle (uygulama başlangıcında)
  useEffect(() => {
    const initCache = async () => {
      await cacheManager.loadFromDisk();
      console.log("📂 Cache yüklendi:", cacheManager.getCacheStats());
    };
    initCache();
    
    // Uygulama kapanırken cleanup
    const cleanup = async () => {
      // Cache'i kaydet
      cacheManager.saveToDisk();
      
      // GGUF model'i unload et
      try {
        const { unloadGgufModel } = await import('./services/ggufProvider');
        await unloadGgufModel();
        console.log("✅ GGUF model unloaded on exit");
      } catch (error) {
        console.log("ℹ️ No GGUF model to unload");
      }
    };
    
    window.addEventListener('beforeunload', cleanup);
    return () => {
      window.removeEventListener('beforeunload', cleanup);
      cleanup(); // Component unmount'ta da cleanup yap
    };
  }, []);

  // Load conversation when project changes
  useEffect(() => {
    const loadConversation = async () => {
      const savedMessages = await getConversation(projectPath);
      if (savedMessages && savedMessages.length > 0) {
        setMessages(savedMessages);
      }
    };
    
    if (projectPath) {
      loadConversation();
    }
  }, [projectPath]);

  // Save conversation when messages change
  useEffect(() => {
    if (projectPath && messages.length > 0) {
      saveConversation(projectPath, messages);
    }
  }, [messages, projectPath]);

  const handleProjectSelect = async (path: string) => {
    console.log('🔵 Proje seçildi:', path);
    setProjectPath(path);
    resetConversation();
    setHasProject(true); // Set this first so UI updates
    console.log('✅ hasProject = true, UI güncellenmeli');
    
    // Load project files
    console.log('📂 Proje dosyaları yükleniyor...');
    await loadOrIndexProject(path);
    console.log('✅ Proje dosyaları yüklendi');
    
    // Add to recent projects (after files are loaded)
    const projectType = getProjectTypeFromFiles(files);
    await addRecentProject(path, files.length, projectType);
    console.log('✅ Recent projects güncellendi');
  };

  const loadOrIndexProject = async (path: string) => {
    try {
      const cachedIndex = await getProjectIndex(path);
      
      if (cachedIndex && cachedIndex.files.length > 0) {
        console.log("📦 Cache'den yüklendi:", cachedIndex.files.length, "dosya");
        setFiles(cachedIndex.files.map(f => f.path));
        setFileIndex(cachedIndex.files);
        
        // 🤖 Cache'den yüklenen projeler için de analiz yap
        const projectAnalysis = await analyzeProjectStructure(cachedIndex.files, path);
        
        setMessages([{
          id: generateMessageId(`system-cache-${Date.now()}`), // More unique key
          role: "system",
          content: `✅ Proje cache'den yüklendi! ${cachedIndex.files.length} dosya indekslendi.`,
          timestamp: Date.now()
        }, {
          id: generateMessageId(`assistant-analysis-${Date.now()}`), // More unique key
          role: "assistant",
          content: projectAnalysis,
          timestamp: Date.now()
        }]);
        
        return;
      }
      
      await scanAndIndexProject(path);
    } catch (err) {
      console.error("Load/index error:", err);
      alert("Proje yükleme hatası: " + err);
    }
  };

  const scanAndIndexProject = async (path: string) => {
    try {
      setIsIndexing(true);
      
      console.log("🚀 Incremental indexing başlatılıyor...");
      
      // Incremental indexer kullan
      const result = await incrementalIndexer.indexProject(
        path,
        fileIndex, // Mevcut index'i gönder
        (current, total, file) => {
          setIndexProgress({ current, total });
          console.log(`📊 ${current}/${total}: ${file}`);
        }
      );
      
      setFiles(result.indexed.map(f => f.path));
      setFileIndex(result.indexed);
      
      // 🔧 Empty project handling
      if (result.indexed.length === 0) {
        setMessages([{
          id: generateMessageId(`empty-project-${Date.now()}`),
          role: "system",
          content: `📁 Proje boş veya dosya bulunamadı.\n\nYeni dosyalar ekleyebilir veya mevcut dosyaları kontrol edebilirsiniz.`,
          timestamp: Date.now()
        }]);
        setIsIndexing(false);
        return;
      }
      
      // 🔗 Bağımlılık analizi yap
      console.log("🔗 Bağımlılık analizi yapılıyor...");
      dependencyAnalyzer.buildGraph(result.indexed);
      const criticalFiles = dependencyAnalyzer.getCriticalFiles(5);
      console.log("📊 Kritik dosyalar:", criticalFiles);
      
      // Update AI conversation context with project info
      updateProjectContext(path, result.indexed);
      
      await saveProjectIndex({
        projectPath: path,
        files: result.indexed,
        lastIndexed: Date.now(),
        version: "1.0"
      });
      
      console.log(`🎉 Indexing tamamlandı!
        - Toplam: ${result.indexed.length} dosya
        - Eklenen: ${result.added}
        - Güncellenen: ${result.updated}
        - Atlanan: ${result.skipped}
        - Süre: ${(result.duration / 1000).toFixed(2)}s
      `);
      
      // 🤖 OTOMATIK AI ANALİZİ - Proje açıldığında AI'ya projeyi anlat
      const projectAnalysis = await analyzeProjectStructure(result.indexed, path);
      
      setMessages([{
        id: generateMessageId(`system-indexed-${Date.now()}`), // More unique key
        role: "system",
        content: `✅ Proje indekslendi! ${result.indexed.length} dosya hazır.`,
        timestamp: Date.now()
      }, {
        id: generateMessageId(`assistant-analysis-${Date.now()}`), // More unique key
        role: "assistant", 
        content: projectAnalysis,
        timestamp: Date.now()
      }]);
      
    } catch (err) {
      console.error("İndeksleme hatası:", err);
      alert("İndeksleme hatası: " + err);
    } finally {
      setIsIndexing(false);
    }
  };

  const openFile = async (filePath: string) => {
    if (hasUnsavedChanges) {
      const confirm = window.confirm("Kaydedilmemiş değişiklikler var. Devam edilsin mi?");
      if (!confirm) return;
    }

    try {
      // Check if file is already open in tabs
      const existingTab = openTabs.find(tab => tab.path === filePath);
      
      if (existingTab) {
        setSelectedFile(filePath);
        setFileContent(existingTab.content);
        setHasUnsavedChanges(false);
        return;
      }

      const content = await invoke<string>("read_file", { path: filePath });
      
      // 🔧 Large file warning (>5MB)
      const fileSizeBytes = new Blob([content]).size;
      const fileSizeMB = fileSizeBytes / (1024 * 1024);
      
      if (fileSizeMB > 5) {
        const confirm = window.confirm(
          `⚠️ Bu dosya çok büyük (${fileSizeMB.toFixed(2)} MB).\n\n` +
          `Açmak performans sorunlarına neden olabilir.\n` +
          `Devam edilsin mi?`
        );
        if (!confirm) return;
        
        addNotification(notificationHelpers.warning(
          'Büyük Dosya',
          `${filePath.split(/[\\/]/).pop()} - ${fileSizeMB.toFixed(2)} MB`
        ));
      }
      
      setSelectedFile(filePath);
      setFileContent(content);
      setHasUnsavedChanges(false);
      
      // 📊 Track file open
      smartContextBuilder.trackFileOpen(filePath);
      
      // Add to open tabs
      setOpenTabs(prev => [...prev, { path: filePath, content }]);
    } catch (err) {
      console.error("Dosya okuma hatası:", err);
      addNotification(notificationHelpers.error('Dosya Hatası', `${filePath.split(/[\\/]/).pop()} okunamadı`));
    }
  };

  const closeTab = (filePath: string) => {
    if (selectedFile === filePath && openTabs.length > 1) {
      const currentIndex = openTabs.findIndex(tab => tab.path === filePath);
      const nextTab = currentIndex > 0 
        ? openTabs[currentIndex - 1] 
        : openTabs[currentIndex + 1];
      
      setSelectedFile(nextTab.path);
      setFileContent(nextTab.content);
    } else if (selectedFile === filePath) {
      setSelectedFile("");
      setFileContent("");
    }
    
    // 📊 Track file close
    smartContextBuilder.trackFileClose(filePath);
    
    setOpenTabs(prev => prev.filter(tab => tab.path !== filePath));
    setHasUnsavedChanges(false);
  };

  const saveFile = async () => {
    if (!selectedFile) return;
    
    try {
      await invoke("write_file", { path: selectedFile, content: fileContent });
      
      // 📊 Track file edit
      smartContextBuilder.trackFileEdit(selectedFile);
      
      // Update tab content
      setOpenTabs(prev => prev.map(tab => 
        tab.path === selectedFile ? { ...tab, content: fileContent } : tab
      ));
      
      const idx = fileIndex.findIndex(f => f.path === selectedFile);
      if (idx !== -1) {
        const embedding = await createEmbedding(fileContent);
        const newIndex = [...fileIndex];
        newIndex[idx] = { 
          path: selectedFile, 
          content: fileContent, 
          embedding,
          lastModified: Date.now()
        };
        setFileIndex(newIndex);
        
        await saveProjectIndex({
          projectPath,
          files: newIndex,
          lastIndexed: Date.now(),
          version: "1.0"
        });
      }
      
      setHasUnsavedChanges(false);
      
      setMessages(prev => [...prev, {
        id: generateMessageId(`saved-${Date.now()}`), // More unique key
        role: "system",
        content: `✅ Kaydedildi: ${selectedFile}`,
        timestamp: Date.now()
      }]);
      
    } catch (err) {
      console.error("Dosya yazma hatası:", err);
      alert("❌ Dosya kaydedilemedi: " + err);
    }
  };

  const handleEditorChange = (value: string) => {
    setFileContent(value);
    setHasUnsavedChanges(true);
    
    // Update tab content
    setOpenTabs(prev => prev.map(tab => 
      tab.path === selectedFile ? { ...tab, content: value } : tab
    ));
  };

  const sendMessage = async (userMessage: string) => {
    if (!userMessage.trim()) return;

    if (isLoading) {
      console.warn("⚠️ Zaten bir istek işleniyor");
      return;
    }

    // Kullanıcı mesajını ekle
    const newUserMessage: Message = {
      id: generateMessageId(`user-${Date.now()}`),
      role: "user",
      content: userMessage,
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      // Proje yoksa uyar
      if (fileIndex.length === 0) {
        const warningMessage: Message = {
          id: generateMessageId(`no-project-${Date.now()}`),
          role: "system",
          content: "⚠️ Henüz proje indekslenmedi. Lütfen önce bir proje açın veya genel sorular sorabilirsiniz.",
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, warningMessage]);
        setIsLoading(false);
        return;
      }

      // 🚀 Continue.dev Architecture: Send to Core through Extension
      console.log("📤 Sending message to Core (Continue.dev architecture)...");
      await sendChatRequest(userMessage);
      
      // Core will handle streaming and send back messages
      // useEffect will handle the Core messages and update UI
      
    } catch (err) {
      console.error("AI Hatası:", err);
      
      let errorMessage = "❌ AI Hatası: ";
      
      if (err instanceof Error) {
        if (err.message.includes('Aktif AI modeli bulunamadı')) {
          errorMessage += "Aktif AI modeli bulunamadı. Lütfen AI ayarlarından bir model aktif edin.";
        } else if (err.message.includes('AI sunucusuna bağlanılamadı')) {
          errorMessage += "AI sunucusuna bağlanılamadı. LM Studio veya AI sağlayıcınızın çalıştığından emin olun.";
        } else {
          errorMessage += err.message;
        }
      } else {
        errorMessage += "Bilinmeyen hata oluştu.";
      }
      
      const errorMsg: Message = {
        id: generateMessageId(`error-${Date.now()}`),
        role: "system",
        content: errorMessage,
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // 🆕 Stop generation handler
  const handleStopGeneration = () => {
    console.log('🛑 Stopping generation...');
    stopCoreGeneration();
    setIsLoading(false);
  };

  // 🆕 Regenerate response handler
  const handleRegenerateResponse = () => {
    console.log('🔄 Regenerating response...');
    
    // Son kullanıcı mesajını bul
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    
    if (lastUserMessage) {
      // Son assistant mesajını sil
      setMessages(prev => {
        const lastAssistantIndex = [...prev].reverse().findIndex(m => m.role === 'assistant');
        if (lastAssistantIndex === -1) return prev;
        
        const actualIndex = prev.length - 1 - lastAssistantIndex;
        return prev.filter((_, i) => i !== actualIndex);
      });
      
      // Mesajı yeniden gönder
      sendMessage(lastUserMessage.content);
    }
  };

  const handleAcceptAction = async (actionId: string) => {
    const action = pendingActions.find(a => a.id === actionId);
    if (!action) return;

    try {
      let actualFilePath = action.filePath;
      
      // Eğer dosya adı sadece filename ise (path yok), proje klasörüne ekle
      if (!action.filePath.includes('\\') && !action.filePath.includes('/')) {
        actualFilePath = `${projectPath}\\${action.filePath}`;
        console.log(`📝 Dosya path'i düzeltildi: ${actualFilePath}`);
      }
      
      const fileInIndex = fileIndex.find(f => {
        const fileName = f.path.split(/[\\/]/).pop();
        const actionFileName = action.filePath.split(/[\\/]/).pop();
        return fileName === actionFileName || f.path.includes(action.filePath) || f.path.endsWith(action.filePath);
      });
      
      if (fileInIndex) {
        actualFilePath = fileInIndex.path;
        console.log(`📂 Dosya index'te bulundu: ${actualFilePath}`);
      } else {
        console.log(`📝 Yeni dosya oluşturulacak: ${actualFilePath}`);
      }
      
      // Dosyaya yaz veya oluştur
      try {
        await invoke("write_file", { path: actualFilePath, content: action.content });
        console.log(`✅ Dosya yazıldı: ${actualFilePath}`);
      } catch (writeError) {
        console.log(`📝 Dosya bulunamadı, oluşturuluyor: ${actualFilePath}`);
        await invoke("create_file", { path: actualFilePath, content: action.content });
        console.log(`✅ Dosya oluşturuldu: ${actualFilePath}`);
      }
      
      // 🔧 Index'i güncelle (embedding arka planda)
      const idx = fileIndex.findIndex(f => f.path === actualFilePath);
      const newIndex = [...fileIndex];
      
      if (idx !== -1) {
        newIndex[idx] = {
          ...newIndex[idx],
          content: action.content.substring(0, 10000),
          lastModified: Date.now()
        };
      } else {
        newIndex.push({
          path: actualFilePath,
          content: action.content.substring(0, 10000),
          embedding: new Array(384).fill(0), // Geçici
          lastModified: Date.now()
        });
      }
      
      setFileIndex(newIndex);
      setPendingActions(prev => prev.filter(a => a.id !== actionId));
      
      // Dosyayı aç
      await openFile(actualFilePath);
      
      setMessages(prev => [...prev, {
        id: generateMessageId(`changes-applied-${Date.now()}`),
        role: "system",
        content: `✅ Değişiklikler uygulandı: ${actualFilePath.split(/[\\/]/).pop()}`,
        timestamp: Date.now()
      }]);
      
      // 🔧 Embedding ve index kaydetme arka planda
      setTimeout(async () => {
        try {
          const embedding = await createEmbedding(action.content);
          const updatedIndex = [...newIndex];
          const updateIdx = updatedIndex.findIndex(f => f.path === actualFilePath);
          
          if (updateIdx !== -1) {
            updatedIndex[updateIdx].embedding = embedding;
          }
          
          setFileIndex(updatedIndex);
          
          await saveProjectIndex({
            projectPath,
            files: updatedIndex,
            lastIndexed: Date.now(),
            version: "1.0"
          });
          
          console.log(`✅ Embedding tamamlandı: ${actualFilePath.split(/[\\/]/).pop()}`);
        } catch (err) {
          console.error('Embedding hatası:', err);
        }
      }, 1000);
      
    } catch (err) {
      console.error("Uygulama hatası:", err);
      setMessages(prev => [...prev, {
        id: generateMessageId(`changes-failed-${Date.now()}`),
        role: "system",
        content: `❌ Değişiklikler uygulanamadı: ${err}`,
        timestamp: Date.now()
      }]);
      setPendingActions(prev => prev.filter(a => a.id !== actionId));
    }
  };

  // 🆕 Tüm AI aksiyonlarını otomatik uygula - RESTART ÖNLEME
  const handleAcceptAllActions = async () => {
    if (pendingActions.length === 0) return;
    
    const filesToOpen: string[] = [];
    const updatedIndex = [...fileIndex];
    
    // 🔧 1. Önce tüm dosyaları yaz (embedding olmadan)
    for (const action of pendingActions) {
      try {
        let actualFilePath = action.filePath;
        
        const fileInIndex = fileIndex.find(f => {
          const fileName = f.path.split(/[\\/]/).pop();
          const actionFileName = action.filePath.split(/[\\/]/).pop();
          return fileName === actionFileName || f.path.includes(action.filePath) || f.path.endsWith(action.filePath);
        });
        
        if (fileInIndex) {
          actualFilePath = fileInIndex.path;
        }
        
        // Dosyaya yaz
        try {
          await invoke("write_file", { path: actualFilePath, content: action.content });
        } catch (writeError) {
          console.log(`Dosya bulunamadı, oluşturuluyor: ${actualFilePath}`);
          await invoke("create_file", { path: actualFilePath, content: action.content });
        }
        
        filesToOpen.push(actualFilePath);
        
        // 🔧 Index'i güncelle (embedding olmadan - hızlı)
        const idx = updatedIndex.findIndex(f => f.path === actualFilePath);
        if (idx !== -1) {
          updatedIndex[idx] = {
            ...updatedIndex[idx],
            content: action.content.substring(0, 10000), // İlk 10KB
            lastModified: Date.now()
          };
        } else {
          // Yeni dosya - embedding olmadan ekle (sonra arka planda yapılacak)
          updatedIndex.push({
            path: actualFilePath,
            content: action.content.substring(0, 10000),
            embedding: new Array(384).fill(0), // Geçici boş embedding
            lastModified: Date.now()
          });
        }
        
      } catch (err) {
        console.error(`Dosya yazma hatası (${action.filePath}):`, err);
      }
    }
    
    // 🔧 2. Index'i güncelle (restart önleme)
    setFileIndex(updatedIndex);
    
    // 🔧 3. Sadece ilk dosyayı aç (tümünü açma - restart nedeni!)
    if (filesToOpen.length > 0) {
      await openFile(filesToOpen[0]);
    }
    
    // 🔧 4. Index'i kaydet (arka planda)
    setTimeout(async () => {
      await saveProjectIndex({
        projectPath,
        files: updatedIndex,
        lastIndexed: Date.now(),
        version: "1.0"
      });
      console.log('✅ Index kaydedildi (arka plan)');
    }, 1000);
    
    // 🔧 5. Embedding'leri arka planda oluştur (restart önleme)
    setTimeout(async () => {
      console.log('🧩 Embeddingler arka planda oluşturuluyor...');
      for (const filePath of filesToOpen) {
        try {
          const fileData = updatedIndex.find(f => f.path === filePath);
          if (fileData && fileData.embedding.every(v => v === 0)) {
            const embedding = await createEmbedding(fileData.content);
            const idx = updatedIndex.findIndex(f => f.path === filePath);
            if (idx !== -1) {
              updatedIndex[idx].embedding = embedding;
            }
          }
        } catch (err) {
          console.error(`Embedding hatası (${filePath}):`, err);
        }
      }
      
      // Güncel index'i kaydet
      setFileIndex([...updatedIndex]);
      await saveProjectIndex({
        projectPath,
        files: updatedIndex,
        lastIndexed: Date.now(),
        version: "1.0"
      });
      console.log('✅ Embeddingler tamamlandı');
    }, 2000);
    
    setPendingActions([]);
    
    setMessages(prev => [...prev, {
      id: generateMessageId(`all-applied-${Date.now()}`),
      role: "system",
      content: `✅ ${filesToOpen.length} dosya güncellendi! İlk dosya açıldı: ${filesToOpen[0]?.split(/[\\/]/).pop()}`,
      timestamp: Date.now()
    }]);
  };

  const handleRejectAction = (actionId: string) => {
    setPendingActions(prev => prev.filter(a => a.id !== actionId));
    
    setMessages(prev => [...prev, {
      id: generateMessageId(`rejected-${Date.now()}`), // More unique key
      role: "system",
      content: "❌ Değişiklikler reddedildi",
      timestamp: Date.now()
    }]);
  };

  // 🆕 Yeni oturum başlat - Context dolmasını önle
  const handleNewSession = () => {
    const confirmMessage = `Yeni oturum başlatılsın mı?\n\n• ${messages.length} mesaj temizlenecek\n• Sohbet geçmişi silinecek\n• Proje dosyaları korunacak\n\nDevam edilsin mi?`;
    
    if (window.confirm(confirmMessage)) {
      // Conversation'ı sıfırla
      resetConversation();
      
      // Mesajları temizle
      setMessages([]);
      
      // Pending actions'ları temizle
      setPendingActions([]);
      
      // Başarı mesajı ekle
      setMessages([{
        id: generateMessageId(`new-session-${Date.now()}`),
        role: "system",
        content: `🔄 Yeni oturum başlatıldı!\n\n✅ Sohbet geçmişi temizlendi\n✅ Context sıfırlandı\n✅ Proje dosyaları korundu\n\nYeni sorular sorabilirsin! 🚀`,
        timestamp: Date.now()
      }]);
      
      console.log('🔄 Yeni oturum başlatıldı - conversation reset edildi');
    }
  };

  const handleOpenTerminal = () => {
    setShowTerminal(true);
  };

  const handleCloseTerminal = () => {
    setShowTerminal(false);
  };

  // File Menu Handlers
  const handleOpenProject = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
      });
      if (typeof selected === "string") {
        await handleProjectSelect(selected);
      }
    } catch (error) {
      console.error("Proje açma hatası:", error);
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (errorMessage.includes('not available') || errorMessage.includes('undefined')) {
        alert("⚠️ Tauri API'sine erişilemiyor.\n\nLütfen uygulamayı yeniden başlatın:\nnpm run tauri:dev");
      } else {
        alert("Proje açılamadı: " + errorMessage);
      }
    }
  };

  const handleOpenFile = async () => {
    const selected = await open({
      multiple: false,
      filters: [{
        name: "Code Files",
        extensions: ["ts", "tsx", "js", "jsx", "rs", "py", "json", "md", "txt", "css", "html"]
      }]
    });
    if (typeof selected === "string") {
      await openFile(selected);
    }
  };

  const handleCloseFile = () => {
    if (selectedFile) {
      if (hasUnsavedChanges) {
        const confirm = window.confirm("Kaydedilmemiş değişiklikler var. Yine de kapatılsın mı?");
        if (!confirm) return;
      }
      closeTab(selectedFile);
    }
  };

  // Edit Menu Handlers
  const handleCopy = () => {
    if (selectedFile && fileContent) {
      navigator.clipboard.writeText(fileContent).then(() => {
        setMessages(prev => [...prev, {
          id: generateMessageId(`copy-${Date.now()}`),
          role: "system",
          content: "✅ Dosya içeriği kopyalandı",
          timestamp: Date.now()
        }]);
      });
    }
  };

  const handleFind = () => {
    // Monaco editor'da find widget'ı açılacak (Ctrl+F zaten çalışıyor)
    setMessages(prev => [...prev, {
      id: generateMessageId(`find-${Date.now()}`),
      role: "system",
      content: "💡 Bul: Ctrl+F kullanın",
      timestamp: Date.now()
    }]);
  };

  // Selection Menu Handlers
  const handleSelectAll = () => {
    // Monaco editor'da select all (Ctrl+A zaten çalışıyor)
    setMessages(prev => [...prev, {
      id: generateMessageId(`select-all-${Date.now()}`),
      role: "system",
      content: "💡 Tümünü Seç: Ctrl+A kullanın",
      timestamp: Date.now()
    }]);
  };

  // View Menu Handlers
  const [showTerminal, setShowTerminal] = useState(false);
  const [showBrowserPanel, setShowBrowserPanel] = useState(false);

  // New feature states
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showQuickFileOpen, setShowQuickFileOpen] = useState(false);
  const [showFindInFiles, setShowFindInFiles] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [showLayoutPresets, setShowLayoutPresets] = useState(false);
  const [showSplitView, setSplitView] = useState(false);
  const [showGitPanel, setShowGitPanel] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [showAISettings, setShowAISettings] = useState(false);
  const [showCustomizeLayout, setShowCustomizeLayout] = useState(false);
  const [showDeveloperTools, setShowDeveloperTools] = useState(false);
  const [showCodeSnippets, setShowCodeSnippets] = useState(false);
  const [showCodeAnalysis, setShowCodeAnalysis] = useState(false);
  const [showAdvancedTheming, setShowAdvancedTheming] = useState(false);
  const [showRemoteDevelopment, setShowRemoteDevelopment] = useState(false);
  const [showEnhancedAI, setShowEnhancedAI] = useState(false);
  const [showCodeReview, setShowCodeReview] = useState(false);
  const [splitFiles, setSplitFiles] = useState<{
    left: { path: string; content: string };
    right: { path: string; content: string };
  } | null>(null);
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });

  // 🎧 Event listener for opening AI Settings from WelcomeScreen
  useEffect(() => {
    const handleOpenAISettings = () => {
      setShowAISettings(true);
    };

    window.addEventListener('open-ai-settings', handleOpenAISettings);
    
    return () => {
      window.removeEventListener('open-ai-settings', handleOpenAISettings);
    };
  }, []);

  // Define commands for Command Palette
  const commands = [
    {
      id: 'save-file',
      title: 'Dosya Kaydet',
      description: 'Aktif dosyayı kaydet',
      category: 'Dosya',
      icon: '💾',
      shortcut: 'Ctrl+S',
      action: saveFile
    },
    {
      id: 'open-project',
      title: 'Proje Aç',
      description: 'Yeni proje klasörü aç',
      category: 'Dosya',
      icon: '📁',
      shortcut: 'Ctrl+O',
      action: handleOpenProject
    },
    {
      id: 'quick-open',
      title: 'Hızlı Dosya Aç',
      description: 'Dosya adı ile hızlı arama',
      category: 'Gezinme',
      icon: '🔍',
      shortcut: 'Ctrl+P',
      action: () => setShowQuickFileOpen(true)
    },
    {
      id: 'find-in-files',
      title: 'Dosyalarda Ara',
      description: 'Tüm projede metin ara',
      category: 'Arama',
      icon: '🔎',
      shortcut: 'Ctrl+Shift+F',
      action: () => setShowFindInFiles(true)
    },
    {
      id: 'toggle-terminal',
      title: 'Terminal Aç/Kapat',
      description: 'Terminal panelini göster/gizle',
      category: 'Görünüm',
      icon: '💻',
      shortcut: 'Ctrl+`',
      action: () => setShowTerminal(prev => !prev)
    },
    {
      id: 'toggle-browser',
      title: 'Browser Panel Aç/Kapat',
      description: 'Web geliştirme test browser\'ını göster/gizle',
      category: 'Görünüm',
      icon: '🌐',
      shortcut: 'Ctrl+Shift+B',
      action: () => setShowBrowserPanel(prev => !prev)
    },
    {
      id: 'toggle-sidebar',
      title: 'Activity Bar Aç/Kapat',
      description: 'Sol activity bar\'ı göster/gizle',
      category: 'Görünüm',
      icon: '📂',
      shortcut: 'Ctrl+B',
      action: () => setShowActivitySidebar(prev => !prev)
    },
    {
      id: 'toggle-chat',
      title: 'AI Sohbet Aç/Kapat',
      description: 'Sağ AI sohbet panelini göster/gizle',
      category: 'Görünüm',
      icon: '🤖',
      shortcut: 'Ctrl+Shift+A',
      action: toggleRightSidebar
    },
    {
      id: 'toggle-bottom-panel',
      title: 'Alt Panel Aç/Kapat',
      description: 'Problems, Terminal, Debug panelini göster/gizle',
      category: 'Görünüm',
      icon: '📊',
      shortcut: 'Ctrl+J',
      action: toggleBottomPanel
    },
    {
      id: 'new-file',
      title: 'Yeni Dosya',
      description: 'Yeni boş dosya oluştur',
      category: 'Dosya',
      icon: '📄',
      shortcut: 'Ctrl+N',
      action: () => {
        // TODO: Implement new file creation
        alert('Yeni dosya özelliği yakında eklenecek!');
      }
    },
    {
      id: 'layout-presets',
      title: 'Düzen Presetleri',
      description: 'Hazır düzen şablonları',
      category: 'Görünüm',
      icon: '🎨',
      shortcut: 'Ctrl+Shift+L',
      action: () => setShowLayoutPresets(true)
    },
    {
      id: 'split-view',
      title: 'Bölünmüş Görünüm',
      description: 'İki dosyayı yan yana aç',
      category: 'Görünüm',
      icon: '📊',
      shortcut: 'Ctrl+\\',
      action: () => {
        if (selectedFile && fileContent) {
          setSplitFiles({
            left: { path: selectedFile, content: fileContent },
            right: { path: selectedFile, content: fileContent }
          });
          setSplitView(true);
        } else {
          addNotification(notificationHelpers.warning('Uyarı', 'Önce bir dosya açın!'));
        }
      }
    },
    {
      id: 'advanced-search',
      title: 'Gelişmiş Arama',
      description: 'Regex ve filtrelerle arama',
      category: 'Arama',
      icon: '🔍',
      shortcut: 'Ctrl+Shift+H',
      action: () => setShowAdvancedSearch(true)
    },
    {
      id: 'debug-panel',
      title: 'Debug & Test',
      description: 'Alt panelde debug ve test araçlarını aç',
      category: 'Debug',
      icon: '🔧',
      shortcut: 'F5',
      action: () => {
        if (!showBottomPanel) toggleBottomPanel();
        // Alt paneli aç ve debug sekmesine yönlendir
      }
    },
    {
      id: 'git-panel',
      title: 'Git Panel',
      description: 'Git status ve commit araçları',
      category: 'Git',
      icon: '📊',
      shortcut: 'Ctrl+Shift+G',
      action: () => setShowGitPanel(true)
    },
    {
      id: 'settings',
      title: 'Ayarlar',
      description: 'Uygulama ayarları',
      category: 'Ayarlar',
      icon: '⚙️',
      shortcut: 'Ctrl+,',
      action: () => setShowSettingsPanel(true)
    },
    {
      id: 'customize-layout',
      title: 'Düzeni Özelleştir',
      description: 'Arayüz düzenini özelleştir',
      category: 'Görünüm',
      icon: '🎨',
      shortcut: 'Ctrl+Shift+K',
      action: () => setShowCustomizeLayout(true)
    },
    {
      id: 'developer-tools',
      title: 'Developer Tools',
      description: 'JSON formatter, Base64, Color picker, Regex tester, Hash generator',
      category: 'Araçlar',
      icon: '🔧',
      shortcut: 'Ctrl+Shift+D',
      action: () => setShowDeveloperTools(true)
    },
    {
      id: 'code-snippets',
      title: 'Code Snippets & Templates',
      description: 'Kod parçacıkları ve proje şablonları',
      category: 'Araçlar',
      icon: '📝',
      shortcut: 'Ctrl+Shift+S',
      action: () => setShowCodeSnippets(true)
    },
    {
      id: 'code-analysis',
      title: 'Code Analysis',
      description: 'Kod kalitesi analizi ve öneriler',
      category: 'Araçlar',
      icon: '🔍',
      shortcut: 'Ctrl+Shift+Q',
      action: () => setShowCodeAnalysis(true)
    },
    {
      id: 'advanced-theming',
      title: 'Advanced Theming',
      description: 'Gelişmiş tema editörü ve özelleştirme',
      category: 'Görünüm',
      icon: '🎨',
      shortcut: 'Ctrl+Shift+T',
      action: () => setShowAdvancedTheming(true)
    },
    {
      id: 'remote-development',
      title: 'Remote Development',
      description: 'SSH, FTP, SFTP ve Docker bağlantıları',
      category: 'Araçlar',
      icon: '🌐',
      shortcut: 'Ctrl+Shift+R',
      action: () => setShowRemoteDevelopment(true)
    },
    {
      id: 'enhanced-ai',
      title: 'Enhanced AI Tools',
      description: 'Gelişmiş AI araçları: Code Review, Docs, Tests, Security',
      category: 'AI',
      icon: '🤖',
      shortcut: 'Ctrl+Shift+I',
      action: () => setShowEnhancedAI(true)
    },
    {
      id: 'code-review',
      title: 'AI Code Review',
      description: 'Otomatik kod inceleme ve kalite analizi',
      category: 'AI',
      icon: '🔍',
      shortcut: 'Ctrl+Shift+V',
      action: () => setShowCodeReview(true)
    }
  ];

  // Define keyboard shortcuts
  const shortcuts = [
    createShortcut('s', saveFile, 'Dosya Kaydet', { ctrl: true }),
    createShortcut('o', handleOpenProject, 'Proje Aç', { ctrl: true }),
    createShortcut('p', () => setShowQuickFileOpen(true), 'Hızlı Dosya Aç', { ctrl: true }),
    createShortcut('f', () => setShowFindInFiles(true), 'Dosyalarda Ara', { ctrl: true, shift: true }),
    createShortcut('P', () => setShowCommandPalette(true), 'Komut Paleti', { ctrl: true, shift: true }),
    createShortcut('`', () => setShowTerminal(prev => !prev), 'Terminal', { ctrl: true }),
    createShortcut('b', () => setShowBrowserPanel(prev => !prev), 'Browser Panel', { ctrl: true, shift: true }),
    createShortcut('b', () => setShowActivitySidebar(prev => !prev), 'Activity Bar', { ctrl: true }),
    createShortcut('a', toggleRightSidebar, 'AI Sohbet', { ctrl: true, shift: true }),
    createShortcut('j', toggleBottomPanel, 'Alt Panel', { ctrl: true }),
    createShortcut('l', () => setShowLayoutPresets(true), 'Düzen Presetleri', { ctrl: true, shift: true }),
    createShortcut('\\', () => {
      if (selectedFile && fileContent) {
        setSplitFiles({
          left: { path: selectedFile, content: fileContent },
          right: { path: selectedFile, content: fileContent }
        });
        setSplitView(true);
      }
    }, 'Bölünmüş Görünüm', { ctrl: true }),
    createShortcut('h', () => setShowAdvancedSearch(true), 'Gelişmiş Arama', { ctrl: true, shift: true }),
    createShortcut('e', () => setActiveView('explorer'), 'Explorer', { ctrl: true, shift: true }),
    createShortcut('f', () => setActiveView('search'), 'Search', { ctrl: true, shift: true }),
    createShortcut('g', () => setActiveView('source-control'), 'Source Control', { ctrl: true, shift: true }),
    createShortcut('d', () => setActiveView('run-debug'), 'Run and Debug', { ctrl: true, shift: true }),
    createShortcut('x', () => setActiveView('extensions'), 'Extensions', { ctrl: true, shift: true }),
    createShortcut(',', () => setShowSettingsPanel(true), 'Ayarlar', { ctrl: true }),
    createShortcut('k', () => setShowCustomizeLayout(true), 'Düzeni Özelleştir', { ctrl: true, shift: true }),
    createShortcut('d', () => setShowDeveloperTools(true), 'Developer Tools', { ctrl: true, shift: true }),
    createShortcut('s', () => setShowCodeSnippets(true), 'Code Snippets', { ctrl: true, shift: true }),
    createShortcut('q', () => setShowCodeAnalysis(true), 'Code Analysis', { ctrl: true, shift: true }),
    createShortcut('t', () => setShowAdvancedTheming(true), 'Advanced Theming', { ctrl: true, shift: true }),
    createShortcut('r', () => setShowRemoteDevelopment(true), 'Remote Development', { ctrl: true, shift: true }),
    createShortcut('i', () => setShowEnhancedAI(true), 'Enhanced AI Tools', { ctrl: true, shift: true }),
    createShortcut('v', () => setShowCodeReview(true), 'AI Code Review', { ctrl: true, shift: true }),
    createShortcut('F5', () => {
      if (!showBottomPanel) toggleBottomPanel();
    }, 'Debug Panel', {}),
  ];

  // Enable keyboard shortcuts
  useKeyboardShortcuts(shortcuts, hasProject);

  // Go Menu Handlers
  const handleGoToFile = () => {
    setMessages(prev => [...prev, {
      id: generateMessageId(`goto-file-${Date.now()}`),
      role: "system",
      content: "💡 Dosyaya Git: Ctrl+P kullanın",
      timestamp: Date.now()
    }]);
  };

  const handleGoToLine = () => {
    setMessages(prev => [...prev, {
      id: generateMessageId(`goto-line-${Date.now()}`),
      role: "system",
      content: "💡 Satıra Git: Ctrl+G kullanın",
      timestamp: Date.now()
    }]);
  };

  // Run Menu Handlers
  const handleRunProject = async () => {
    if (!projectPath) {
      setMessages(prev => [...prev, {
        id: generateMessageId(`no-project-${Date.now()}`),
        role: "system",
        content: "⚠️ Önce bir proje açın",
        timestamp: Date.now()
      }]);
      return;
    }

    try {
      setMessages(prev => [...prev, {
        id: generateMessageId(`run-start-${Date.now()}`),
        role: "system",
        content: "🚀 Proje çalıştırılıyor...",
        timestamp: Date.now()
      }]);

      // Terminal'de projeyi çalıştır
      await invoke("open_terminal", { path: projectPath || null });
      setMessages(prev => [...prev, {
        id: generateMessageId(`terminal-opened-${Date.now()}`),
        role: "system",
        content: `✅ Terminal açıldı - Proje çalıştırmak için: npm run dev (veya npm start)`,
        timestamp: Date.now()
      }]);
    } catch (err) {
      console.error("Proje çalıştırma hatası:", err);
      setMessages(prev => [...prev, {
        id: generateMessageId(`run-error-${Date.now()}`),
        role: "system",
        content: `❌ Hata: ${err}`,
        timestamp: Date.now()
      }]);
    }
  };

  // Help Menu Handlers
  const handleAbout = () => {
    alert(`Corex v0.1.0\n\nYapay zeka destekli kod editörü\n\nTauri + React + TypeScript ile geliştirilmiştir.`);
  };

  const handleDocumentation = () => {
    setMessages(prev => [...prev, {
      id: generateMessageId(`docs-${Date.now()}`),
      role: "system",
      content: "📚 Dokümantasyon: README.md dosyasını açın veya proje klasöründeki docs/ klasörüne bakın.",
      timestamp: Date.now()
    }]);
  };

  // Window control functions
  const handleMinimize = async () => {
    try {
      await invoke('minimize_window');
    } catch (error) {
      console.error('Minimize error:', error);
    }
  };

  const handleMaximize = async () => {
    try {
      await invoke('maximize_window');
    } catch (error) {
      console.error('Maximize error:', error);
    }
  };

  const handleClose = async () => {
    try {
      await invoke('close_window');
    } catch (error) {
      console.error('Close error:', error);
    }
  };

  // Show welcome screen if no project
  if (!hasProject) {
    return (
      <WelcomeScreen 
        onProjectSelect={handleProjectSelect} 
        onCreateProject={async (template: string, name: string, path: string) => {
          console.log('🚀 Yeni proje oluşturuluyor:', { template, name, path });
          
          // Proje klasörünü oluştur
          const projectPath = `${path}\\${name}`;
          
          try {
            await invoke('create_directory', { path: projectPath });
            
            // Basit bir package.json oluştur
            const packageJson = {
              name,
              version: "1.0.0",
              description: `${template} project`,
              main: "index.js",
              scripts: {
                start: "echo 'Start your project here'"
              }
            };
            
            await invoke('write_file', {
              path: `${projectPath}\\package.json`,
              content: JSON.stringify(packageJson, null, 2)
            });
            
            // README oluştur
            await invoke('write_file', {
              path: `${projectPath}\\README.md`,
              content: `# ${name}\n\n${template} project created with Corex IDE.`
            });
            
            // Projeyi aç
            handleProjectSelect(projectPath);
          } catch (error) {
            console.error('Proje oluşturma hatası:', error);
            alert('Proje oluşturulamadı: ' + error);
          }
        }}
      />
    );
  }

  return (
    <div className="h-screen bg-[#1e1e1e] text-neutral-100 flex flex-col relative">
      {/* Terminal Panel - Overlay */}
      {showTerminal && (
        <Suspense fallback={<LoadingSpinner size="md" text="Terminal yükleniyor..." />}>
          <TerminalPanel
            projectPath={projectPath}
            isVisible={showTerminal}
            onClose={handleCloseTerminal}
          />
        </Suspense>
      )}
      
      {/* Browser Panel - Overlay */}
      {showBrowserPanel && (
        <Suspense fallback={<LoadingSpinner size="md" text="Browser yükleniyor..." />}>
          <BrowserPanel
            isVisible={showBrowserPanel}
            onClose={() => setShowBrowserPanel(false)}
            initialUrl="http://localhost:3000"
          />
        </Suspense>
      )}
      
      {!showTerminal && (
        <>
      {/* MENU BAR WITH WINDOW CONTROLS */}
      <div 
        className="h-6 border-b border-neutral-800 px-3 flex items-center justify-between bg-[#181818] flex-shrink-0 text-xs select-none"
        style={{ 
          WebkitAppRegion: 'drag',
          appRegion: 'drag'
        } as React.CSSProperties}
      >
        <div 
          className="flex items-center gap-4"
          style={{ 
            WebkitAppRegion: 'no-drag',
            appRegion: 'no-drag'
          } as React.CSSProperties}
        >
          <div className="relative group">
            <button className="hover:bg-neutral-800 px-2 py-0.5 rounded transition-colors cursor-pointer">{t('menu.file')}</button>
            <div className="absolute top-full left-0 mt-1 w-48 bg-[#252525] border border-neutral-700 rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              <button onClick={handleOpenProject} className="block w-full text-left px-3 py-2 hover:bg-neutral-700 text-xs">{t('file.openProject')}</button>
              <button onClick={handleOpenFile} className="block w-full text-left px-3 py-2 hover:bg-neutral-700 text-xs">{t('file.openFile')}</button>
              <button onClick={handleCloseFile} className="block w-full text-left px-3 py-2 hover:bg-neutral-700 text-xs">{t('file.closeFile')}</button>
              <div className="border-t border-neutral-700 my-1"></div>
              <button onClick={() => { setHasProject(false); resetConversation(); }} className="block w-full text-left px-3 py-2 hover:bg-neutral-700 text-xs">{t('file.exit')}</button>
            </div>
          </div>
          <div className="relative group">
            <button className="hover:bg-neutral-800 px-2 py-0.5 rounded transition-colors cursor-pointer">{t('menu.edit')}</button>
            <div className="absolute top-full left-0 mt-1 w-48 bg-[#252525] border border-neutral-700 rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              <button onClick={handleCopy} className="block w-full text-left px-3 py-2 hover:bg-neutral-700 text-xs">Copy</button>
              <button onClick={handleFind} className="block w-full text-left px-3 py-2 hover:bg-neutral-700 text-xs">Find...</button>
              <button onClick={() => { if (selectedFile) saveFile(); }} className="block w-full text-left px-3 py-2 hover:bg-neutral-700 text-xs">{t('file.save')} (Ctrl+S)</button>
            </div>
          </div>
          <button onClick={handleSelectAll} className="hover:bg-neutral-800 px-2 py-0.5 rounded transition-colors cursor-pointer">{t('menu.selection')}</button>
          <div className="relative group">
            <button className="hover:bg-neutral-800 px-2 py-0.5 rounded transition-colors cursor-pointer">{t('menu.view')}</button>
            <div className="absolute top-full left-0 mt-1 w-48 bg-[#252525] border border-neutral-700 rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              <button onClick={() => setActiveView('explorer')} className="block w-full text-left px-3 py-2 hover:bg-neutral-700 text-xs">📁 {t('activity.explorer')}</button>
              <button onClick={() => setActiveView('search')} className="block w-full text-left px-3 py-2 hover:bg-neutral-700 text-xs">🔍 {t('activity.search')}</button>
              <button onClick={() => setActiveView('source-control')} className="block w-full text-left px-3 py-2 hover:bg-neutral-700 text-xs">🌿 {t('activity.sourceControl')}</button>
              <button onClick={() => setActiveView('extensions')} className="block w-full text-left px-3 py-2 hover:bg-neutral-700 text-xs">🧩 {t('activity.extensions')}</button>
              <div className="border-t border-neutral-700 my-1"></div>
              <button onClick={toggleRightSidebar} className="block w-full text-left px-3 py-2 hover:bg-neutral-700 text-xs">{showRightSidebar ? "Hide" : "Show"} AI Chat</button>
              <button onClick={() => setShowBrowserPanel(prev => !prev)} className="block w-full text-left px-3 py-2 hover:bg-neutral-700 text-xs">🌐 {showBrowserPanel ? "Hide" : "Show"} Browser Panel</button>
              <button onClick={() => setShowCustomizeLayout(true)} className="block w-full text-left px-3 py-2 hover:bg-neutral-700 text-xs">Customize Layout...</button>
            </div>
          </div>
          <div className="relative group">
            <button className="hover:bg-neutral-800 px-2 py-0.5 rounded transition-colors cursor-pointer">{t('menu.tools')}</button>
            <div className="absolute top-full left-0 mt-1 w-56 bg-[#252525] border border-neutral-700 rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              <button onClick={() => setShowDeveloperTools(true)} className="block w-full text-left px-3 py-2 hover:bg-neutral-700 text-xs">🔧 Developer Tools</button>
              <button onClick={() => setShowCodeSnippets(true)} className="block w-full text-left px-3 py-2 hover:bg-neutral-700 text-xs">📝 Code Snippets & Templates</button>
              <button onClick={() => setShowCodeAnalysis(true)} className="block w-full text-left px-3 py-2 hover:bg-neutral-700 text-xs">🔍 Code Analysis</button>
              <div className="border-t border-neutral-700 my-1"></div>
              <button onClick={() => setShowEnhancedAI(true)} className="block w-full text-left px-3 py-2 hover:bg-neutral-700 text-xs">🤖 Enhanced AI Tools</button>
              <button onClick={() => setShowCodeReview(true)} className="block w-full text-left px-3 py-2 hover:bg-neutral-700 text-xs">🔍 AI Code Review</button>
              <div className="border-t border-neutral-700 my-1"></div>
              <button onClick={() => setShowAdvancedTheming(true)} className="block w-full text-left px-3 py-2 hover:bg-neutral-700 text-xs">🎨 Advanced Theming</button>
              <button onClick={() => setShowRemoteDevelopment(true)} className="block w-full text-left px-3 py-2 hover:bg-neutral-700 text-xs">🌐 Remote Development</button>
            </div>
          </div>
          <div className="relative group">
            <button className="hover:bg-neutral-800 px-2 py-0.5 rounded transition-colors cursor-pointer">{t('menu.go')}</button>
            <div className="absolute top-full left-0 mt-1 w-48 bg-[#252525] border border-neutral-700 rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              <button onClick={handleGoToFile} className="block w-full text-left px-3 py-2 hover:bg-neutral-700 text-xs">Go to File... (Ctrl+P)</button>
              <button onClick={handleGoToLine} className="block w-full text-left px-3 py-2 hover:bg-neutral-700 text-xs">Go to Line... (Ctrl+G)</button>
            </div>
          </div>
          <button onClick={handleRunProject} className="hover:bg-neutral-800 px-2 py-0.5 rounded transition-colors cursor-pointer">{t('menu.run')}</button>
          <button 
            onClick={handleOpenTerminal}
            className="hover:bg-neutral-800 px-2 py-0.5 rounded transition-colors cursor-pointer"
          >
            {t('menu.terminal')}
          </button>
          <div className="relative group">
            <button className="hover:bg-neutral-800 px-2 py-0.5 rounded transition-colors cursor-pointer">{t('menu.help')}</button>
            <div className="absolute top-full right-0 mt-1 w-48 bg-[#252525] border border-neutral-700 rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              <button onClick={handleDocumentation} className="block w-full text-left px-3 py-2 hover:bg-neutral-700 text-xs">Documentation</button>
              <button onClick={handleAbout} className="block w-full text-left px-3 py-2 hover:bg-neutral-700 text-xs">About</button>
            </div>
          </div>
        </div>
        
        {/* Window Controls */}
        <div 
          className="flex items-center"
          style={{ 
            WebkitAppRegion: 'no-drag',
            appRegion: 'no-drag'
          } as React.CSSProperties}
        >
          <button 
            className="w-8 h-6 flex items-center justify-center hover:bg-neutral-700 transition-colors"
            onClick={handleMinimize}
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 16 16">
              <path d="M4 8a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 4 8z"/>
            </svg>
          </button>
          <button 
            className="w-8 h-6 flex items-center justify-center hover:bg-neutral-700 transition-colors"
            onClick={handleMaximize}
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 16 16">
              <path d="M2.5 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2h-11zM1 2a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2z"/>
            </svg>
          </button>
          <button 
            className="w-8 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
            onClick={handleClose}
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 16 16">
              <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* MAIN HEADER BAR */}
      <div className="h-10 border-b border-neutral-800 px-4 flex items-center justify-between bg-[#181818] flex-shrink-0">
        <div className="flex items-center gap-4">
          {projectPath && (
            <div className="flex items-center gap-2 text-xs text-neutral-500">
              <span>📁</span>
              <span>{projectPath.split(/[\\/]/).pop()}</span>
              <span>•</span>
              <span>{fileIndex.length} dosya</span>
            </div>
          )}
          
          {isIndexing && (
            <div className="flex items-center gap-2 text-xs text-yellow-500">
              <div className="animate-spin">⚙️</div>
              <span>İndeksleniyor... {indexProgress.current}/{indexProgress.total}</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowGitPanel(true)}
            className="px-3 py-1.5 rounded-md bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 transition-all text-xs font-medium text-neutral-300 flex items-center gap-2"
            title="Git Panel (Ctrl+Shift+G)"
          >
            <span>📊</span>
            Git
          </button>
          
          <button
            onClick={() => {
              setHasProject(false);
              resetConversation();
            }}
            className="px-3 py-1.5 rounded-md bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 transition-all text-xs font-medium text-neutral-300 flex items-center gap-2"
            title="Proje Değiştir"
          >
            <span>🚀</span>
            Proje Değiştir
          </button>
          
          <StatusIndicator />
          
          <button
            onClick={toggleBottomPanel}
            className="px-3 py-1.5 rounded-md bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 transition-all text-xs font-medium text-neutral-300 flex items-center gap-2"
            title="Alt Panel (Ctrl+J)"
          >
            <span>📊</span>
            {showBottomPanel ? 'Alt Panel Gizle' : 'Alt Panel Göster'}
          </button>
          
          {/* 🔧 ModelSelector kaldırıldı - Tek model kullanılıyor */}
          <button
            onClick={() => setShowAISettings(true)}
            className="px-3 py-1.5 bg-neutral-700 hover:bg-neutral-600 rounded text-xs transition-colors"
            title="AI Ayarları"
          >
            ⚙️ AI Ayarları
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* ACTIVITY BAR */}
        <ActivityBar
          activeView={activeView}
          onViewChange={(view) => {
            setActiveView(view);
            if (view && !showActivitySidebar) {
              setShowActivitySidebar(true);
            } else if (!view) {
              setShowActivitySidebar(false);
            }
          }}
          onSettingsClick={() => setShowSettingsPanel(true)}
        />

        {/* SIDE PANEL */}
        <Suspense fallback={<div className="w-64 bg-[#181818] border-r border-neutral-800 flex items-center justify-center"><LoadingSpinner size="sm" /></div>}>
          <SidePanel
            activeView={activeView}
            isVisible={showActivitySidebar}
            width={leftSidebarWidth}
            onWidthChange={setLeftSidebarWidth}
            projectPath={projectPath}
            files={files}
            selectedFile={selectedFile}
            onFileSelect={openFile}
            onFileCreate={(filePath) => {
              addNotification(notificationHelpers.success('Dosya Oluşturuldu', filePath));
              loadOrIndexProject(projectPath);
            }}
            onFileDelete={(filePath) => {
              addNotification(notificationHelpers.success('Dosya Silindi', filePath));
              loadOrIndexProject(projectPath);
            }}
            onFileRename={(oldPath, newPath) => {
              addNotification(notificationHelpers.success('Dosya Yeniden Adlandırıldı', `${oldPath} → ${newPath}`));
              loadOrIndexProject(projectPath);
            }}
            onRefresh={() => {
              loadOrIndexProject(projectPath);
              addNotification(notificationHelpers.success('Yenilendi', 'Proje dosyaları güncellendi'));
            }}
            onWorkspaceSelect={handleProjectSelect}
          />
        </Suspense>

        {/* CENTER - Code Editor */}
        <div className="flex-1 flex flex-col bg-[#1e1e1e] min-w-0 h-full">
          {/* Main Content Area */}
          <div className={`flex-1 min-h-0 ${showBottomPanel ? '' : 'h-full'}`}>
            {showSplitView && splitFiles ? (
              <Suspense fallback={<LoadingSpinner size="lg" text="Split View yükleniyor..." fullScreen />}>
                <SplitView
                  leftFile={splitFiles.left}
                  rightFile={splitFiles.right}
                  onLeftChange={(content) => {
                    setSplitFiles(prev => prev ? { ...prev, left: { ...prev.left, content } } : null);
                  }}
                  onRightChange={(content) => {
                    setSplitFiles(prev => prev ? { ...prev, right: { ...prev.right, content } } : null);
                  }}
                  onSave={(side) => {
                    // TODO: Implement split view save
                    alert(`${side} dosya kaydedildi!`);
                  }}
                  onClose={() => {
                    setSplitView(false);
                    setSplitFiles(null);
                  }}
                />
              </Suspense>
            ) : selectedFile ? (
              <Suspense fallback={<LoadingSpinner size="lg" text="Editor yükleniyor..." fullScreen />}>
                <EnhancedEditor
                  filePath={selectedFile}
                  content={fileContent}
                  onChange={handleEditorChange}
                  onSave={saveFile}
                  onCursorPositionChange={(line, column) => setCursorPosition({ line, column })}
                />
              </Suspense>
            ) : (
              <Suspense fallback={<LoadingSpinner size="lg" text="Dashboard yükleniyor..." fullScreen />}>
                <Dashboard />
              </Suspense>
            )}
          </div>
          
          {/* Status Bar */}
          <StatusBar
            projectPath={projectPath}
            selectedFile={selectedFile}
            fileContent={fileContent}
            cursorPosition={cursorPosition}
            hasUnsavedChanges={hasUnsavedChanges}
          />
          
          {/* Bottom Panel */}
          <Suspense fallback={null}>
            <BottomPanel
              isVisible={showBottomPanel}
              onToggle={toggleBottomPanel}
              pendingActions={pendingActions}
              onAcceptAction={handleAcceptAction}
              onRejectAction={handleRejectAction}
              onAcceptAllActions={handleAcceptAllActions} // 🆕
              fileIndex={fileIndex}
              projectPath={projectPath}
              currentFile={selectedFile}
              onSuggestionClick={(action) => sendMessage(action)}
              onBreakpointToggle={(filePath, lineNumber) => {
                addNotification(notificationHelpers.info('Breakpoint', `${filePath}:${lineNumber}`));
              }}
            />
          </Suspense>
          
          {/* Version Indicator - Below Bottom Panel */}
          <div className="h-5 bg-[var(--color-background)] border-t border-[var(--color-border)] flex items-center justify-end px-3 flex-shrink-0">
            <span className="text-xs font-medium" style={{ 
              color: 'var(--color-textSecondary)',
              background: 'var(--color-surface)',
              padding: '2px 6px',
              borderRadius: '3px',
              border: '1px solid var(--color-border)'
            }}>Corex v0.1.0</span>
          </div>
        </div>

        {/* RIGHT SIDEBAR - AI Chat */}
        {showRightSidebar && (
          <div 
            className="h-full border-l border-neutral-800 bg-[#181818] flex-shrink-0 overflow-hidden flex"
            style={{ width: `${rightSidebarWidth}px` }}
          >
            {/* Resize Handle */}
            <div 
              className="w-1 bg-neutral-700 hover:bg-blue-500 cursor-ew-resize transition-colors flex-shrink-0"
              onMouseDown={(e) => {
                e.preventDefault();
                const startX = e.clientX;
                const startWidth = rightSidebarWidth;
                
                const handleMouseMove = (moveEvent: MouseEvent) => {
                  const newWidth = startWidth - (moveEvent.clientX - startX);
                  const clampedWidth = Math.max(200, Math.min(600, newWidth));
                  setRightSidebarWidth(clampedWidth);
                };
                
                const handleMouseUp = () => {
                  document.removeEventListener('mousemove', handleMouseMove);
                  document.removeEventListener('mouseup', handleMouseUp);
                };
                
                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
              }}
            />
            
            {/* AI Chat Panel */}
            <div className="flex-1 overflow-hidden">
              <ChatPanel
                messages={messages}
                isLoading={isLoading}
                onSendMessage={sendMessage}
                pendingActions={pendingActions}
                onAcceptAction={handleAcceptAction}
                onRejectAction={handleRejectAction}
                onAcceptAllActions={handleAcceptAllActions}
                onNewSession={handleNewSession}
                isIndexing={isIndexing}
                currentFile={selectedFile}
                projectContext={getConversationContext().projectContext}
                onStopGeneration={handleStopGeneration}
                onRegenerateResponse={handleRegenerateResponse}
                isStreaming={isCoreStreaming}
              />
            </div>
          </div>
        )}
      </div>
      
      </>
      )}
      
      {/* Notification Toast */}
      <NotificationToast
        notification={notification}
        onClose={() => setNotification(null)}
      />

      {/* Command Palette */}
      <Suspense fallback={null}>
        <CommandPalette
          isOpen={showCommandPalette}
          onClose={() => setShowCommandPalette(false)}
          commands={commands}
        />
      </Suspense>

      {/* Quick File Open */}
      <Suspense fallback={null}>
        <QuickFileOpen
          isOpen={showQuickFileOpen}
          onClose={() => setShowQuickFileOpen(false)}
          files={files}
          onFileSelect={openFile}
        />
      </Suspense>

      {/* Find in Files */}
      <Suspense fallback={null}>
        <FindInFiles
          isOpen={showFindInFiles}
          onClose={() => setShowFindInFiles(false)}
          fileIndex={fileIndex}
          onFileSelect={(filePath) => {
            openFile(filePath);
          }}
        />
      </Suspense>

      {/* Layout Presets */}
      <Suspense fallback={null}>
        <LayoutPresets
          isOpen={showLayoutPresets}
          onClose={() => setShowLayoutPresets(false)}
        />
      </Suspense>

      {/* Advanced Search */}
      <Suspense fallback={null}>
        <AdvancedSearch
          isOpen={showAdvancedSearch}
          onClose={() => setShowAdvancedSearch(false)}
          fileIndex={fileIndex}
          onFileSelect={(filePath) => {
            openFile(filePath);
          }}
        />
      </Suspense>

      {/* Git Panel */}
      {showGitPanel && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowGitPanel(false)} />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div 
              className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <Suspense fallback={<LoadingSpinner size="lg" text="Git Panel yükleniyor..." />}>
                <GitPanel
                  projectPath={projectPath}
                  onFileSelect={openFile}
                  onClose={() => setShowGitPanel(false)}
                />
              </Suspense>
            </div>
          </div>
        </>
      )}

      {/* Settings Panel */}
      <Suspense fallback={null}>
        <SettingsPanel
          isOpen={showSettingsPanel}
          onClose={() => setShowSettingsPanel(false)}
          onShowLayoutPresets={() => setShowLayoutPresets(true)}
        />
      </Suspense>

      {/* Customize Layout */}
      <Suspense fallback={null}>
        <CustomizeLayout
          isOpen={showCustomizeLayout}
          onClose={() => setShowCustomizeLayout(false)}
        />
      </Suspense>

      {/* Developer Tools */}
      <Suspense fallback={null}>
        <DeveloperTools
          isOpen={showDeveloperTools}
          onClose={() => setShowDeveloperTools(false)}
        />
      </Suspense>

      {/* Code Snippets & Templates */}
      <Suspense fallback={null}>
        <CodeSnippets
          isOpen={showCodeSnippets}
          onClose={() => setShowCodeSnippets(false)}
          onInsertSnippet={(code) => {
            if (selectedFile) {
              // Insert snippet at cursor position
              const newContent = fileContent + '\n' + code;
              handleEditorChange(newContent);
              addNotification(notificationHelpers.success('Snippet Eklendi', 'Kod parçacığı editöre eklendi'));
            } else {
              addNotification(notificationHelpers.warning('Uyarı', 'Önce bir dosya açın!'));
            }
          }}
          onCreateProject={(template) => {
            // TODO: Implement project creation from template
            addNotification(notificationHelpers.info('Proje Şablonu', `${template.name} şablonu seçildi. Bu özellik yakında eklenecek!`));
          }}
        />
      </Suspense>

      {/* Code Analysis */}
      <Suspense fallback={null}>
        <CodeAnalysis
          isOpen={showCodeAnalysis}
          onClose={() => setShowCodeAnalysis(false)}
          fileIndex={fileIndex}
          currentFile={selectedFile}
          onNavigateToIssue={(file, line) => {
            // Navigate to specific file and line
            if (file !== selectedFile) {
              openFile(file);
            }
            // TODO: Navigate to specific line in editor
            addNotification(notificationHelpers.info('Navigasyon', `${file.split('/').pop()}:${line} satırına gidiliyor`));
          }}
        />
      </Suspense>

      {/* Advanced Theming */}
      <Suspense fallback={null}>
        <AdvancedTheming
          isOpen={showAdvancedTheming}
          onClose={() => setShowAdvancedTheming(false)}
        />
      </Suspense>

      {/* Remote Development */}
      <Suspense fallback={null}>
        <RemoteDevelopment
          isOpen={showRemoteDevelopment}
          onClose={() => setShowRemoteDevelopment(false)}
          onOpenRemoteFile={(connection, filePath) => {
            // TODO: Implement remote file opening
            addNotification(notificationHelpers.info('Remote File', `Opening ${filePath} from ${connection.name}`));
          }}
        />
      </Suspense>

      {/* Enhanced AI Panel */}
      {showEnhancedAI && (
        <Suspense fallback={<LoadingSpinner size="lg" text="AI Panel yükleniyor..." />}>
          <EnhancedAIPanel
            selectedFile={selectedFile}
            fileContent={fileContent}
            onClose={() => setShowEnhancedAI(false)}
          />
        </Suspense>
      )}

      {/* Code Review Panel */}
      {showCodeReview && (
        <Suspense fallback={<LoadingSpinner size="lg" text="Code Review yükleniyor..." />}>
          <CodeReviewPanel
            filePath={selectedFile}
            content={fileContent}
            isVisible={showCodeReview}
            onClose={() => setShowCodeReview(false)}
          />
        </Suspense>
      )}

      {/* AI Settings Panel */}
      <Suspense fallback={null}>
        <AISettings
          isVisible={showAISettings}
          onClose={() => setShowAISettings(false)}
          onProviderChange={(providers) => {
            // AI providers değiştiğinde ModelSelector'ı güncelle
            console.log('AI providers updated:', providers);
          }}
        />
      </Suspense>

      {/* Tool Approval Dialog */}
      {toolApprovalRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
          <div className="bg-[#1e1e1e] border border-neutral-700 rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-1">Tool Onayı Gerekiyor</h3>
                <p className="text-sm text-neutral-400">AI bir tool çalıştırmak istiyor</p>
              </div>
            </div>

            <div className="bg-[#252525] rounded-lg p-4 mb-4 border border-neutral-800">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-mono text-purple-400">🔧 {toolApprovalRequest.toolName}</span>
              </div>
              <div className="text-xs text-neutral-300">
                <div className="font-semibold mb-1">Parametreler:</div>
                <pre className="bg-black/30 p-2 rounded overflow-x-auto text-[10px]">
                  {JSON.stringify(toolApprovalRequest.parameters, null, 2)}
                </pre>
              </div>
              
              {/* Dangerous command warning */}
              {toolApprovalRequest.toolName === 'run_terminal' && (
                <div className="mt-2 p-2 bg-red-500/10 border border-red-500/30 rounded text-xs text-red-400">
                  ⚠️ Terminal komutu çalıştırılacak. Dikkatli olun!
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  toolApprovalRequest.resolve(false);
                  setToolApprovalRequest(null);
                }}
                className="flex-1 px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg transition-colors text-sm font-medium"
              >
                ❌ Reddet
              </button>
              <button
                onClick={() => {
                  toolApprovalRequest.resolve(true);
                  setToolApprovalRequest(null);
                }}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                ✅ Onayla
              </button>
            </div>

            <div className="mt-3 text-xs text-neutral-500 text-center">
              Autonomy ayarlarını değiştirmek için AI Settings&apos;e gidin
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function App() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <LayoutProvider>
          <NotificationProvider>
            <AppContent />
            <ToastContainer />
          </NotificationProvider>
        </LayoutProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}

export default App;