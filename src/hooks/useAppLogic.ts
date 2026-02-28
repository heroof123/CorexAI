import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useNotifications, notificationHelpers } from "../components/NotificationSystem";
import { useLayout } from "../contexts/LayoutContext";
import { useCore } from "./useCore";
import { useProjectManager } from "./useProjectManager";
import { useFileEditor } from "./useFileEditor";
import { useChatMessages } from "./useChatMessages";
import { useUIState } from "./useUIState";
import { useAIBackgroundAnalysis } from "./useAIBackgroundAnalysis";
import { useKeyboardShortcuts, createShortcut } from "./useKeyboardShortcuts";
import { agentService } from "../services/agentService";
import { voiceService } from "../services/voiceService";
import { WorkflowNotification } from "../types/workflow";
import { cacheManager } from "../services/cache";
import { initializeExtension } from "../extension";
import { FileIndex } from "../types/index";
import { futureImpactAnalyzer } from "../services/futureImpactAnalyzer";
import { codeOracle } from "../services/codeOracle";
import { codeDnaSplicing } from "../services/codeDnaSplicing";
import { quantumCodeSuperposition } from "../services/quantumCodeSuperposition";
import { babelEngine } from "../services/babelEngine";
import { getAutonomyConfig } from "../services/ai/autonomy";
import { legacyWhisperer } from "../services/legacyWhisperer";
import { synestheticCodeView } from "../services/synestheticCodeView";
import { zeroLatencyCompilation } from "../services/zeroLatencyCompilation";
import { blackholeGarbageCollector } from "../services/blackholeGarbageCollector";
import { codeEthicsEnforcer } from "../services/codeEthicsEnforcer";
import { freshEyesMode } from "../services/freshEyesMode";
import { polyglotEngine } from "../services/polyglotEngine";

export function useAppLogic() {
    const [initError, setInitError] = useState<string | null>(null);
    const { user, loading } = useAuth();
    const ui = useUIState();
    const { t } = useLanguage();
    const { addNotification } = useNotifications();
    const {
        showLeftSidebar,
        showRightSidebar,
        showBottomPanel,
        leftSidebarWidth,
        rightSidebarWidth,
        toggleLeftSidebar,
        toggleRightSidebar,
        toggleBottomPanel,
        toggleZenMode,
        setLeftSidebarVisible,
        setLeftSidebarWidth,
        setRightSidebarWidth,
        isZenMode,
    } = useLayout();

    // Continue.dev Core hook
    const {
        coreMessages,
        isStreaming: isCoreStreaming,
        stopGeneration: stopCoreGeneration,
    } = useCore();

    // Shared file index state
    const [fileIndex, setFileIndex] = useState<FileIndex[]>([]);

    // Notification helper
    const notify = (
        type: "success" | "error" | "warning" | "info",
        title: string,
        message: string
    ) => {
        addNotification({ type, title, message, duration: 5000 });
    };

    // ── Project Manager ──────────────────────────────────────────────────────
    const project = useProjectManager({
        onMessage: msg => chat.addMessage(msg),
        onNotification: notify,
        fileIndex,
        setFileIndex,
    });

    // ── Dream Mode Integration ───────────────────────────────────────────────
    useEffect(() => {
        // Just start listening on mount
        import("../services/dreamMode").then(({ dreamModeService }) => {
            if (project.files.length > 0) {
                dreamModeService.setProjectFiles(project.files);
            }
        }).catch(err => console.error("Failed to load Dream Mode:", err));
    }, [project.files]);

    // ── File Editor ──────────────────────────────────────────────────────────
    const editor = useFileEditor({
        projectPath: project.projectPath,
        fileIndex,
        setFileIndex,
        onMessage: msg => chat.addMessage(msg),
        onNotification: notify,
    });

    // ── Chat Messages ────────────────────────────────────────────────────────
    const chat = useChatMessages({
        projectPath: project.projectPath,
        coreMessages,
        isCoreStreaming,
        stopCoreGeneration,
        openFile: editor.openFile,
        addFileToIndex: project.addFileToIndex,
        currentFile: editor.selectedFile,
        fileIndex,
        cursorLine: editor.cursorPosition.line,
        cursorColumn: editor.cursorPosition.column,
        selection: editor.selection,
    });

    // 🆕 Active Model Indicator
    const [activeModelName, setActiveModelName] = useState<string | null>(null);

    useEffect(() => {
        const updateModel = () => {
            const ggufConfig = localStorage.getItem('gguf-active-model');
            if (ggufConfig) {
                try {
                    const parsed = JSON.parse(ggufConfig);
                    setActiveModelName(parsed.modelName || 'Local GGUF');
                } catch (e) {
                    setActiveModelName(null);
                }
            } else {
                setActiveModelName(null);
            }
        };

        updateModel();
        window.addEventListener('storage', updateModel);
        window.addEventListener('gguf-model-loaded', updateModel);
        return () => {
            window.removeEventListener('storage', updateModel);
            window.removeEventListener('gguf-model-loaded', updateModel);
        };
    }, []);

    // 🤖 Connect Autonomous Agent to Chat
    useEffect(() => {
        const callback = (msg: any) => {
            chat.addMessage(msg);
            // Otonom ajan mesaj gönderdiğinde chat panelini otomatik açabiliriz?
            if (!showRightSidebar) toggleRightSidebar();
        };

        agentService.registerChatCallback(callback);
        return () => agentService.registerChatCallback(() => { });
    }, [showRightSidebar, toggleRightSidebar]);

    // 🎙️ Voice Command Handling
    const [isVoiceSupported] = useState(voiceService.isSupported());
    const [voiceStatus, setVoiceStatus] = useState<'listening' | 'idle' | 'processing' | 'error'>('idle');

    useEffect(() => {
        voiceService.onStatus(setVoiceStatus);
    }, []);

    const handleVoiceCommand = (command: string) => {
        console.log("🎤 Voice Command Received:", command);
        switch (command) {
            case 'SAVE':
                editor.saveFile();
                notify("success", "Sesli Komut", "Dosya kaydedildi!");
                break;
            case 'FORMAT':
                notify("info", "Sesli Komut", "Kod formatlanıyor...");
                break;
            case 'TOGGLE_SIDEBAR':
                toggleLeftSidebar();
                break;
            case 'TOGGLE_CHAT':
                toggleRightSidebar();
                break;
            case 'NEW_AGENT':
                chat.sendMessage("/agent");
                break;
        }
    };

    // ── AI Background Analysis (proaktif — dosya açıldığında otomatik) ────────
    const [isAIReady, setIsAIReady] = useState(false);

    useEffect(() => {
        const checkAI = async () => {
            const { loadAIProviders } = await import("../services/ai/aiProvider");
            const providers = await loadAIProviders();
            setIsAIReady(providers.length > 0);
        };
        checkAI();
    }, []);
    const aiAnalysis = useAIBackgroundAnalysis(editor.selectedFile, editor.fileContent, isAIReady);

    // Workflow notification state
    const [notification, setNotification] = useState<WorkflowNotification | null>(null);

    // ── Full Automation / Futuristic Features Integration ────────────────────
    useEffect(() => {
        // Tam Otomasyon Seviye Kontrolü (Seviye 4 veya 5)
        const checkAutonomyMode = () => {
            const config = getAutonomyConfig();
            const isFullAuto = config.level >= 4;

            // Fütüristik Servisleri "Tam Otomasyon" moduna göre aktifleştir
            futureImpactAnalyzer.setEnabled(isFullAuto || true); // Allow manual trigger
            codeOracle.setEnabled(isFullAuto);
            codeDnaSplicing.setEnabled(isFullAuto || true);
            quantumCodeSuperposition.setEnabled(isFullAuto || true);
            babelEngine.setEnabled(isFullAuto || true);
            legacyWhisperer.setEnabled(isFullAuto || true);
            synestheticCodeView.setEnabled(isFullAuto || true);
            zeroLatencyCompilation.setEnabled(isFullAuto || true);
            blackholeGarbageCollector.setEnabled(isFullAuto, (msg) => notify("info", "🗑️ Blackhole GC", msg));

            if (isFullAuto) {
                console.log("🚀 Tam Otomasyon (Full Auto) aktif! Fütüristik ürünler devrede: Code Oracle, Future Impact v.b.");
            }
        };

        checkAutonomyMode();
        // Belirli aralıklarla otomasyon konfigini dinle (localStorage vs)
        window.addEventListener('storage', checkAutonomyMode);
        return () => window.removeEventListener('storage', checkAutonomyMode);
    }, []);

    // Code Oracle & Zero Latency: editor içeriği değiştikçe dinler
    useEffect(() => {
        if (editor.selectedFile && editor.fileContent !== undefined) {
            codeOracle.watchFiles(editor.fileContent, editor.selectedFile, (bgPrediction) => {
                notify("warning", "Code Oracle (Hata Kehaneti) 🔮", bgPrediction);
            });

            // Speculative background compilation (sıfır gecikme derlemeyi tetikle)
            zeroLatencyCompilation.onCodeChange(editor.selectedFile, editor.fileContent);
        }
    }, [editor.fileContent]);

    // ── Initialization ───────────────────────────────────────────────────────
    useEffect(() => {
        const init = async () => {
            try {
                await initializeExtension();
                console.log("✅ Extension initialized");

                // 🆕 RAG Service Initialization (only in Tauri)
                const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
                if (isTauri) {
                    const { ragService } = await import("../services/ai");
                    const { appDataDir, join } = await import("@tauri-apps/api/path");
                    const appData = await appDataDir();
                    const vectorDbPath = await join(appData, "vector_db");
                    await ragService.init(vectorDbPath).catch(e => console.warn("RAG Init failed:", e));
                } else {
                    console.warn("⚠️ Not in Tauri — skipping RAG init & Tauri APIs");
                }
            } catch (err: any) {
                console.error("Initialization failed:", err);
                setInitError(err.message || "Bilinmeyen bir hata oluştu");
            }
        };
        init();
    }, []);

    useEffect(() => {
        const initCache = async () => {
            await cacheManager.loadFromDisk();
        };
        initCache();

        const cleanup = async () => {
            cacheManager.saveToDisk();
            try {
                const { unloadGgufModel } = await import("../services/ai");
                await unloadGgufModel();
            } catch { }
        };

        window.addEventListener("beforeunload", cleanup);
        return () => {
            window.removeEventListener("beforeunload", cleanup);
            cleanup();
        };
    }, []);

    // 🎨 Plugin-driven Theming Engine
    useEffect(() => {
        const handleRegisterTheme = (e: any) => {
            const theme = e.detail;
            if (theme && theme.colors) {
                console.log(`🎨 Applying plugin theme: ${theme.name} `);
                const root = document.documentElement;
                Object.entries(theme.colors).forEach(([key, value]) => {
                    root.style.setProperty(key as string, value as string);
                });
                notify("success", "Tema Değişti", `${theme.name} teması uygulandı.`);
            }
        };

        const handleOpenBrowser = (e: any) => {
            const { url } = e.detail || {};
            ui.setShowBrowserPanel(true);
            if (url) {
                notify("info", "Otonom Test", `Tarayıcı açılıyor: ${url}`);
            }
        };

        window.addEventListener('corex:register-theme', handleRegisterTheme);
        window.addEventListener('corex:open-browser', handleOpenBrowser);
        return () => {
            window.removeEventListener('corex:register-theme', handleRegisterTheme);
            window.removeEventListener('corex:open-browser', handleOpenBrowser);
        };
    }, []);

    // ── Keyboard Shortcuts ───────────────────────────────────────────────────
    const shortcuts = [
        createShortcut("s", editor.saveFile, "Dosya Kaydet", { ctrl: true }),
        createShortcut("o", project.handleOpenProject, "Proje Aç", { ctrl: true }),
        createShortcut("p", () => ui.setShowQuickFileOpen(true), "Hızlı Dosya Aç", { ctrl: true }),
        createShortcut("f", () => ui.setShowFindInFiles(true), "Dosyalarda Ara", {
            ctrl: true,
            shift: true,
        }),
        createShortcut("P", () => ui.setShowCommandPalette(true), "Komut Paleti", {
            ctrl: true,
            shift: true,
        }),
        createShortcut("`", () => ui.setShowTerminal(p => !p), "Terminal", { ctrl: true }),
        createShortcut("b", () => ui.setShowBrowserPanel(p => !p), "Browser Panel", {
            ctrl: true,
            shift: true,
        }),
        createShortcut("b", toggleLeftSidebar, "Activity Bar", { ctrl: true }),
        createShortcut("a", toggleRightSidebar, "AI Sohbet", { ctrl: true, shift: true }),
        createShortcut("j", toggleBottomPanel, "Alt Panel", { ctrl: true }),
        createShortcut("l", () => ui.setShowLayoutPresets(true), "Düzen Presetleri", {
            ctrl: true,
            shift: true,
        }),
        createShortcut(
            "\\",
            () => {
                if (editor.selectedFile && editor.fileContent)
                    ui.openSplitView(editor.selectedFile, editor.fileContent);
            },
            "Bölünmüş Görünüm",
            { ctrl: true }
        ),
        createShortcut("h", () => ui.setShowAdvancedSearch(true), "Gelişmiş Arama", {
            ctrl: true,
            shift: true,
        }),
        createShortcut("e", () => ui.setActiveView("explorer"), "Explorer", {
            ctrl: true,
            shift: true,
        }),
        createShortcut("g", () => ui.setActiveView("source-control"), "Source Control", {
            ctrl: true,
            shift: true,
        }),
        createShortcut("x", () => ui.setActiveView("extensions"), "Extensions", {
            ctrl: true,
            shift: true,
        }),
        createShortcut(",", () => ui.setShowSettingsPanel(true), "Ayarlar", { ctrl: true }),
        createShortcut("k", () => ui.setShowCustomizeLayout(true), "Düzeni Özelleştir", {
            ctrl: true,
            shift: true,
        }),
        createShortcut("d", () => ui.setShowDeveloperTools(true), "Developer Tools", {
            ctrl: true,
            shift: true,
        }),
        createShortcut("s", () => ui.setShowCodeSnippets(true), "Code Snippets", {
            ctrl: true,
            shift: true,
        }),
        createShortcut("t", () => ui.setShowAdvancedTheming(true), "Advanced Theming", {
            ctrl: true,
            shift: true,
        }),
        createShortcut("r", () => ui.setShowRemoteDevelopment(true), "Remote Development", {
            ctrl: true,
            shift: true,
        }),
        createShortcut("i", () => ui.setShowEnhancedAI(true), "Enhanced AI Tools", {
            ctrl: true,
            shift: true,
        }),
        createShortcut("v", () => ui.setShowCodeReview(true), "AI Code Review", {
            ctrl: true,
            shift: true,
        }),
        createShortcut("o", () => ui.setShowSymbolSearch(true), "Sembol Ara", {
            ctrl: true,
            shift: true,
        }),
        createShortcut("U", () => ui.setShowCodeUniverse(true), "Code Universe", {
            ctrl: true,
            shift: true,
        }),
        createShortcut(
            "F5",
            () => {
                if (!showBottomPanel) toggleBottomPanel();
            },
            "Debug Panel",
            {}
        ),
        createShortcut("z", toggleZenMode, "Zen Modu", { ctrl: true, alt: true }),
    ];
    useKeyboardShortcuts(shortcuts, project.hasProject);

    // ESC key to close panels
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                if (showLeftSidebar) setLeftSidebarVisible(false);
                if (showRightSidebar) toggleRightSidebar();
                if (showBottomPanel) toggleBottomPanel();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [
        showLeftSidebar,
        showRightSidebar,
        showBottomPanel,
        setLeftSidebarVisible,
        toggleRightSidebar,
        toggleBottomPanel,
    ]);

    // ── Command Palette commands ─────────────────────────────────────────────
    const commands = [
        {
            id: "save-file",
            title: "Dosya Kaydet",
            description: "Aktif dosyayı kaydet",
            category: "Dosya",
            icon: "💾",
            shortcut: "Ctrl+S",
            action: editor.saveFile,
        },
        {
            id: "open-project",
            title: "Proje Aç",
            description: "Yeni proje klasörü aç",
            category: "Dosya",
            icon: "📁",
            shortcut: "Ctrl+O",
            action: project.handleOpenProject,
        },
        {
            id: "quick-open",
            title: "Hızlı Dosya Aç",
            description: "Dosya adı ile hızlı arama",
            category: "Gezinme",
            icon: "🔍",
            shortcut: "Ctrl+P",
            action: () => ui.setShowQuickFileOpen(true),
        },
        {
            id: "find-in-files",
            title: "Dosyalarda Ara",
            description: "Tüm projede metin ara",
            category: "Arama",
            icon: "🔎",
            shortcut: "Ctrl+Shift+F",
            action: () => ui.setShowFindInFiles(true),
        },
        {
            id: "toggle-terminal",
            title: "Terminal Aç/Kapat",
            description: "Terminal panelini göster/gizle",
            category: "Görünüm",
            icon: "💻",
            shortcut: "Ctrl+`",
            action: () => ui.setShowTerminal(p => !p),
        },
        {
            id: "toggle-browser",
            title: "Browser Panel Aç/Kapat",
            description: "Web test browser'ını göster/gizle",
            category: "Görünüm",
            icon: "🌐",
            shortcut: "Ctrl+Shift+B",
            action: () => ui.setShowBrowserPanel(p => !p),
        },
        {
            id: "toggle-sidebar",
            title: "Activity Bar Aç/Kapat",
            description: "Sol activity bar'ı göster/gizle",
            category: "Görünüm",
            icon: "📂",
            shortcut: "Ctrl+B",
            action: () => ui.setShowActivitySidebar(p => !p),
        },
        {
            id: "toggle-chat",
            title: "AI Sohbet Aç/Kapat",
            description: "Sağ AI sohbet panelini göster/gizle",
            category: "Görünüm",
            icon: "🤖",
            shortcut: "Ctrl+Shift+A",
            action: toggleRightSidebar,
        },
        {
            id: "toggle-bottom-panel",
            title: "Alt Panel Aç/Kapat",
            description: "Problems, Terminal, Debug panelini göster/gizle",
            category: "Görünüm",
            icon: "📊",
            shortcut: "Ctrl+J",
            action: toggleBottomPanel,
        },
        {
            id: "layout-presets",
            title: "Düzen Presetleri",
            description: "Hazır düzen şablonları",
            category: "Görünüm",
            icon: "🎨",
            shortcut: "Ctrl+Shift+L",
            action: () => ui.setShowLayoutPresets(true),
        },
        {
            id: "toggle-zen-mode",
            title: "Zen Modu Aç/Kapat",
            description: "Tüm panelleri gizle ve koda odaklan",
            category: "Görünüm",
            icon: "🧘",
            shortcut: "Ctrl+Alt+Z",
            action: toggleZenMode,
        },
        {
            id: "split-view",
            title: "Bölünmüş Görünüm",
            description: "İki dosyayı yan yana aç",
            category: "Görünüm",
            icon: "📊",
            shortcut: "Ctrl+\\",
            action: () => {
                if (editor.selectedFile && editor.fileContent)
                    ui.openSplitView(editor.selectedFile, editor.fileContent);
                else addNotification(notificationHelpers.warning("Uyarı", "Önce bir dosya açın!"));
            },
        },
        {
            id: "advanced-search",
            title: "Gelişmiş Arama",
            description: "Regex ve filtrelerle arama",
            category: "Arama",
            icon: "🔍",
            shortcut: "Ctrl+Shift+H",
            action: () => ui.setShowAdvancedSearch(true),
        },
        {
            id: "git-panel",
            title: "Git Panel",
            description: "Git status ve commit araçları",
            category: "Git",
            icon: "📊",
            shortcut: "Ctrl+Shift+G",
            action: () => ui.setShowGitPanel(true),
        },
        {
            id: "settings",
            title: "Ayarlar",
            description: "Uygulama ayarları",
            category: "Ayarlar",
            icon: "⚙️",
            shortcut: "Ctrl+,",
            action: () => ui.setShowSettingsPanel(true),
        },
        {
            id: "customize-layout",
            title: "Düzeni Özelleştir",
            description: "Arayüz düzenini özelleştir",
            category: "Görünüm",
            icon: "🎨",
            shortcut: "Ctrl+Shift+K",
            action: () => ui.setShowCustomizeLayout(true),
        },
        {
            id: "developer-tools",
            title: "Developer Tools",
            description: "JSON formatter, Base64, Color picker, Regex tester",
            category: "Araçlar",
            icon: "🔧",
            shortcut: "Ctrl+Shift+D",
            action: () => ui.setShowDeveloperTools(true),
        },
        {
            id: "code-snippets",
            title: "Code Snippets & Templates",
            description: "Kod parçacıkları ve proje şablonları",
            category: "Araçlar",
            icon: "📝",
            shortcut: "Ctrl+Shift+S",
            action: () => ui.setShowCodeSnippets(true),
        },
        {
            id: "advanced-theming",
            title: "Advanced Theming",
            description: "Gelişmiş tema editörü ve özelleştirme",
            category: "Görünüm",
            icon: "🎨",
            shortcut: "Ctrl+Shift+T",
            action: () => ui.setShowAdvancedTheming(true),
        },
        {
            id: "remote-development",
            title: "Remote Development",
            description: "SSH, FTP, SFTP ve Docker bağlantıları",
            category: "Araçlar",
            icon: "🌐",
            shortcut: "Ctrl+Shift+R",
            action: () => ui.setShowRemoteDevelopment(true),
        },
        {
            id: "enhanced-ai",
            title: "Enhanced AI Tools",
            description: "Gelişmiş AI araçları: Code Review, Docs, Tests, Security",
            category: "AI",
            icon: "🤖",
            shortcut: "Ctrl+Shift+I",
            action: () => ui.setShowEnhancedAI(true),
        },
        {
            id: "code-review",
            title: "AI Code Review",
            description: "Otomatik kod inceleme ve kalite analizi",
            category: "AI",
            icon: "🔍",
            shortcut: "Ctrl+Shift+V",
            action: () => ui.setShowCodeReview(true),
        },
        {
            id: "generate-tests",
            title: "AI: Generate Tests",
            description: "Aktif dosya için otomatik unit testleri oluştur",
            category: "AI",
            icon: "🧪",
            shortcut: "Ctrl+Shift+U",
            action: async () => {
                if (!editor.selectedFile) {
                    notify("error", "Hata", "Önce bir dosya açmalısınız!");
                    return;
                }

                notify("info", "Test Oluşturuluyor", "AI kodunuzu analiz ediyor ve testleri yazıyor...");

                try {
                    const { testGenerationService } = await import("../services/testGenerationService");
                    const framework = await testGenerationService.detectFramework(project.projectPath);
                    const testCode = await testGenerationService.generateTests({
                        filePath: editor.selectedFile,
                        sourceCode: editor.fileContent,
                        framework
                    });

                    const testPath = await testGenerationService.createTestFile(editor.selectedFile, testCode);
                    notify("success", "Test Tamamlandı", `${testPath} başarıyla oluşturuldu.`);

                    await project.loadOrIndexProject(project.projectPath);
                } catch (err: any) {
                    notify("error", "Test Hatası", err.message || "Test oluşturulamadı.");
                }
            },
        },
        {
            id: "future-impact-analyzer",
            title: "🔮 Future Impact Analyzer (Gelecek Etki)",
            description: "Şu anki kodun 2 yıllık gelecekteki teknik borç tahmini",
            category: "Futuristic",
            icon: "🔭",
            shortcut: "Ctrl+Shift+F1",
            action: async () => {
                if (!editor.selectedFile) return notify("warning", "Uyarı", "Dosya açık değil.");
                futureImpactAnalyzer.setEnabled(true);
                notify("info", "Analiz Başladı", "Gelecek etki analizi (Future Impact Analyzer) çalışıyor...");
                const report = await futureImpactAnalyzer.analyzeFile(editor.selectedFile, editor.fileContent || "");
                if (report) {
                    notify("success", "Gelecek Etki (Maliyet: " + report.maintenanceCostHours + " saat)", report.suggestion);
                } else {
                    notify("error", "Hata", "Analiz başarısız oldu.");
                }
            }
        },
        {
            id: "babel-engine",
            title: "🌍 Babel Engine (Evrensel Çevirmen)",
            description: "Dilden bağımsız, bozuk komutları tam fonksiyonel koda çevir.",
            category: "Futuristic",
            icon: "🗣️",
            shortcut: "Ctrl+Shift+F2",
            action: async () => {
                const intent = window.prompt("Babel Engine'a doğal dille veya kaba sözlerle ne istediğinizi yazın:");
                if (!intent) return;
                notify("info", "Babel Çevirisi", "Niyetiniz koda çevriliyor...");
                babelEngine.setEnabled(true);
                const code = await babelEngine.translateIntentToCode(intent, project.projectPath);
                if (code && editor.selectedFile) {
                    // Chat paneline veya editora ekleyebiliriz. Burada basitçe clipbloard'a atalım veya notify edelim.
                    navigator.clipboard.writeText(code);
                    notify("success", "Koda Çevrildi!", "Babel Engine kodu oluşturdu ve Pano'ya kopyaladı.");
                }
            }
        },
        {
            id: "quantum-superposition",
            title: "🌀 Quantum Code Superposition (Süperpozisyon)",
            description: "Fonksiyonun aynı anda 3 paralel varyasyonunu(evren) oluştur",
            category: "Futuristic",
            icon: "⚛️",
            shortcut: "Ctrl+Shift+F3",
            action: async () => {
                const task = window.prompt("Hangi fonksiyonelin Quantum süperpozisyon varyasyonlarını istiyorsunuz?");
                if (!task) return;

                notify("info", "Quantum Ayrılma", "3 farklı varyasyon hesaplanıyor (Süperpozisyon)...");
                quantumCodeSuperposition.setEnabled(true);
                const variations = await quantumCodeSuperposition.enterSuperposition(task, editor.selectedFile || "", editor.fileContent || "");
                if (variations) {
                    notify("success", "Hazır", "Quantum varyasyonları konsola (ve panoya) yazıldı.");
                    console.log("⚛️ QUANTUM VARIATIONS:", variations);
                    navigator.clipboard.writeText(variations.join("\n\n"));
                }
            }
        },
        {
            id: "code-dna-splicing",
            title: "🧬 Code DNA Splicing (Gen Melezleme)",
            description: "Aktif dosyayı Gen Bankasma bağla ve melez özellik oluştur",
            category: "Futuristic",
            icon: "🧪",
            shortcut: "Ctrl+Shift+F4",
            action: async () => {
                const action = window.prompt("İşlem seçin: 1) Gen Kaydet  2) Melez Birleştirme (Splicing)");
                codeDnaSplicing.setEnabled(true);
                if (action === "1") {
                    const res = codeDnaSplicing.extractGene(editor.selectedFile || "", editor.fileContent || "", "Gen-" + Date.now());
                    notify("success", "Gen Bankası", res);
                } else if (action === "2") {
                    const intent = window.prompt("Genleri birleştirerek ne yapmak istiyorsun?");
                    if (intent) {
                        notify("info", "Splicing", "Genler birleştiriliyor...");
                        const code = await codeDnaSplicing.spliceProjectGenes(intent);
                        if (code) {
                            navigator.clipboard.writeText(code);
                            notify("success", "Melezleme Tamam", "Oluşturulan karma kod panoya kopyalandı.");
                        }
                    }
                }
            }
        },
        {
            id: "legacy-whisperer",
            title: "🏛️ Legacy Whisperer (Eski Kod Arkeoloğu)",
            description: "20-30 yıllık COBOL, Fortran, Delphi kodu analiz edip modern mimariye (TS/Rust vs) dönüştür",
            category: "Futuristic",
            icon: "📜",
            shortcut: "Ctrl+Shift+F5",
            action: async () => {
                if (!editor.selectedFile) return notify("warning", "Uyarı", "Eski kod olan bir dosyayı açık tutun.");
                legacyWhisperer.setEnabled(true);
                notify("info", "Kod Arkeolojisi Başladı", "Eski kodun niyeti ve yazar mektubu çözülüyor...");
                const report = await legacyWhisperer.decryptLegacyCode(editor.fileContent || "");
                if (report) {
                    console.log("LEGACY REPORT:", report);
                    notify("success", "Arkeoloji Tamam!", `Dil: ${report.originalLanguage}, Dönem: ${report.estimatedEra}`);
                    // Orijinal yazar mektubunu ekranda göstermek idealdir ama prompt ya da pano üzerinden verebiliriz.
                    const msg = `📜 Eski Geliştiriciden Mektup:\n\n${report.authorsLetter}\n\n[Modern Dönüşüm panoya eklendi]`;
                    notify("info", "Yazar Mektubu", msg.substring(0, 100) + "...");
                    navigator.clipboard.writeText(report.modernConversionCode);
                } else {
                    notify("error", "Hata", "Eski kod okunamadı.");
                }
            }
        },
        {
            id: "legacy-whisperer-simulate",
            title: "⏳ Legacy Whisperer (Dönem Simülasyonu)",
            description: "Şu anki kod parçasını ('90s', '80s' gibi) eski bir dönemin RAM/CPU kısıtlamalarında simüle et",
            category: "Futuristic",
            icon: "🕰️",
            shortcut: "Ctrl+Shift+F7",
            action: async () => {
                const era = window.prompt("Hangi dönemi/yılı simüle edelim? (Örn: '1998 Pentium', '64MB RAM Late 90s')");
                if (!era || !editor.fileContent) return;

                notify("info", "Zaman Makinesi Devrede", `${era} şartları simüle ediliyor...`);
                legacyWhisperer.setEnabled(true);
                const simulation = await legacyWhisperer.simulateEraEnvironment(editor.fileContent, era);
                if (simulation) {
                    notify("warning", "Simülasyon Çıktısı 💾", simulation);
                }
            }
        },
        {
            id: "synesthetic-code-view",
            title: "🌈 Synesthetic Code View (Ortak Duyu Kod Görünümü)",
            description: "Kodu görsel ve dokunsal(titreşim) sezgilere çevirip semantik akışı hissettirir",
            category: "Futuristic",
            icon: "🖐️",
            shortcut: "Ctrl+Shift+F6",
            action: async () => {
                if (!editor.selectedFile) return notify("warning", "Uyarı", "Dosya açık değil.");
                synestheticCodeView.setEnabled(true);
                notify("info", "Hissiyat Analizi", "Kodun duyu profili çıkarılıyor...");
                const result = await synestheticCodeView.analyzeVibes(editor.fileContent || "");
                if (result && result.lineRanges.length > 0) {
                    notify("success", "Duyu Eşleştirildi", `${result.lineRanges.length} farklı kod akımı algılandı.`);
                    console.log("Synesthetic Vibe Map:", result.lineRanges);
                    // Deneme amaçlı ilk bloğun titreşimini çalıştır:
                    synestheticCodeView.playHapticForType(result.lineRanges[0].type);
                }
            }
        },
        {
            id: "polyglot-engine",
            title: "🌍 Polyglot Engine (Çoklu Dil Çevirici)",
            description: "Projeyi/mimariyi tek tuşla başka dile (Node -> Rust, Go) çevir",
            category: "Futuristic",
            icon: "🔤",
            shortcut: "Ctrl+Shift+F8",
            action: async () => {
                const targetLang = window.prompt("Hangi dile çevirmek istiyorsunuz? (Örn: Rust, Go)");
                if (!targetLang) return;
                notify("info", "Polyglot Aktif", "Proje " + targetLang + " mimarisine dönüştürülüyor...");
                const result = await polyglotEngine.translateArchitecture(editor.fileContent || "", "Mevcut", targetLang);
                if (result) {
                    navigator.clipboard.writeText(result);
                    notify("success", "Dönüşüm Tamam", "Sonuç panoya kopyalandı.");
                }
            }
        },
        {
            id: "fresh-eyes-mode",
            title: "🕶️ Fresh Eyes Mode (Göz Tazeleyici)",
            description: "Geliştirici körlüğünü kırmak için kodu şaşırtıcı formata/diyagrama çevirir",
            category: "Futuristic",
            icon: "👁️",
            shortcut: "Ctrl+Shift+F9",
            action: async () => {
                if (!editor.selectedFile) return notify("warning", "Uyarı", "Dosya açın.");
                notify("info", "Fresh Eyes", "Körlüğünüzü kırmak için kod yabancılaştırılıyor...");
                const result = await freshEyesMode.alienateCode(editor.fileContent || "");
                if (result) {
                    navigator.clipboard.writeText(result);
                    notify("success", "Şok Etkisi Yaratıldı", "Sonuç panoya alındı, şuna bir bakın.");
                }
            }
        },
        {
            id: "blackhole-gc",
            title: "🧲 Blackhole GC (Manuel Tarama)",
            description: "Kullanılmayan değişken/fonksiyon/importları göster (Otomasyon dışı manuel)",
            category: "Futuristic",
            icon: "🕳️",
            shortcut: "Ctrl+Shift+F10",
            action: async () => {
                if (!editor.selectedFile) return notify("warning", "Uyarı", "Dosya seçin.");
                notify("info", "Tarama", "Ölü kod tespiti yapılıyor...");
                const result = await blackholeGarbageCollector.scanForDeadCode(editor.fileContent || "");
                if (result) {
                    navigator.clipboard.writeText(result);
                    notify("success", "Çıktı Panoda", "Silinebilir ölü bloklar tespit edildi.");
                }
            }
        },
        {
            id: "code-ethics-check",
            title: "🛑 Code Ethics Enforcer",
            description: "Koda dark pattern veya zararlı eklentiler yazılmasını kontrol eder",
            category: "Futuristic",
            icon: "⚖️",
            shortcut: "Ctrl+Shift+F11",
            action: async () => {
                const intent = window.prompt("Uygulamakta endişe ettiğiniz kodu yazın: (örn: iptal butonunu gri ve tıklanamaz yap)");
                if (!intent) return;
                const violation = await codeEthicsEnforcer.checkIntent(intent);
                if (violation) {
                    const accept = window.confirm("🛑 Etik İhlal Tespit:\n" + violation + "\n\nBu Local bir ortam olduğundan sorumluluk bildirimi: Kabul ederseniz engel kalkar.");
                    if (accept) {
                        codeEthicsEnforcer.acceptDisclaimer();
                        notify("warning", "İhlal İzni Verildi", "Sorumluluk kullanıcıda.");
                    } else {
                        notify("error", "İptal", "Etik kurallar devrede kaldı.");
                    }
                } else {
                    notify("success", "Güvenli (SAFE)", "Bu istek kullanıcı dostudur.");
                }
            }
        }
    ];

    return {
        initError,
        user,
        loading,
        ui,
        t,
        notify,
        layout: {
            showLeftSidebar,
            showRightSidebar,
            showBottomPanel,
            leftSidebarWidth,
            rightSidebarWidth,
            toggleLeftSidebar,
            toggleRightSidebar,
            toggleBottomPanel,
            toggleZenMode,
            setLeftSidebarVisible,
            setLeftSidebarWidth,
            setRightSidebarWidth,
            isZenMode,
        },
        fileIndex,
        setFileIndex,
        project,
        editor,
        chat,
        voice: {
            isVoiceSupported,
            voiceStatus,
            setVoiceStatus,
            handleVoiceCommand
        },
        aiAnalysis,
        notification,
        setNotification,
        commands,
        activeModelName, // Added activeModelName to the return object
        shortcuts
    };
}
