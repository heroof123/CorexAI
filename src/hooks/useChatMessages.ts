// hooks/useChatMessages.ts
// Chat mesajları, streaming handler ve kod bloğu işleme sorumluluklarını taşır

import { useState, useRef, useCallback, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
    resetConversation,
    getConversationContext,
    getModelIdForRole,
    callAI,
    parseToolCalls,
    executeTool,
    getToolsPrompt,
    requiresApproval,
    getAutonomyConfig
} from "../services/ai";
import { smartContextBuilder } from "../services/smartContextBuilder";
import { createEmbedding } from "../services/embedding";
import { saveConversation, getConversation } from "../services/db";
import { Message, CodeAction, FileIndex } from "../types/index";
import { CoreMessage } from "../core/protocol";

// Uzantı → dil eşleştirme tablosu
const EXTENSION_MAP: Record<string, string> = {
    html: "html", css: "css", javascript: "js", js: "js",
    typescript: "ts", ts: "ts", tsx: "tsx", jsx: "jsx",
    python: "py", py: "py", rust: "rs", rs: "rs",
    go: "go", java: "java", cpp: "cpp", c: "c",
    json: "json", xml: "xml", yaml: "yaml", yml: "yml",
    md: "md", markdown: "md", txt: "txt",
};

function generateMessageId(prefix = "msg"): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

function extractCodeBlocks(text: string): Array<{ language: string; code: string; filename?: string }> {
    const codeBlocks: Array<{ language: string; code: string; filename?: string }> = [];

    // Split text by lines, handling both \r\n and \n
    const lines = text.split(/\r?\n/);

    let isInsideBlock = false;
    let currentLanguage = "";
    let currentFilename: string | undefined = undefined;
    let currentCode: string[] = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (line.trim().startsWith('```')) {
            if (!isInsideBlock) {
                // Starting a new block
                isInsideBlock = true;
                currentCode = [];

                // Parse the language line
                const langLine = line.trim().substring(3).trim();
                let language = "txt";
                let filename: string | undefined = undefined;

                if (langLine) {
                    if (langLine.includes(":")) {
                        const parts = langLine.split(":");
                        language = parts[0].trim();
                        filename = parts.slice(1).join(":").trim();
                    } else if (langLine.includes(" ")) {
                        const parts = langLine.split(" ");
                        language = parts[0].trim();
                        filename = parts.slice(1).join(" ").trim();
                    } else {
                        language = langLine;
                    }
                }

                currentLanguage = language;
                currentFilename = filename;
            } else {
                // Ending the current block
                isInsideBlock = false;
                if (currentCode.length > 0) {
                    codeBlocks.push({
                        language: currentLanguage,
                        code: currentCode.join('\n').trim(),
                        filename: currentFilename
                    });
                }
            }
        } else if (isInsideBlock) {
            currentCode.push(line);
        }
    }

    return codeBlocks;
}

interface UseChatMessagesOptions {
    projectPath: string;
    coreMessages: CoreMessage[];
    isCoreStreaming: boolean;
    stopCoreGeneration: () => void;
    openFile: (path: string) => Promise<void>;
    addFileToIndex: (path: string, content: string) => Promise<void>;
    currentFile?: string;
    fileIndex: FileIndex[];
    cursorLine?: number;
    cursorColumn?: number;
    selection?: string;
}

export function useChatMessages({
    projectPath,
    coreMessages,
    isCoreStreaming,
    stopCoreGeneration,
    openFile,
    addFileToIndex,
    currentFile,
    fileIndex,
    cursorLine,
    cursorColumn,
    selection,
}: UseChatMessagesOptions) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [pendingActions, setPendingActions] = useState<CodeAction[]>([]);
    const [currentBranch, setCurrentBranch] = useState<string>("main");
    const [isMentorMode, setIsMentorMode] = useState(false);
    const [toolApprovalRequest, setToolApprovalRequest] = useState<{
        toolName: string;
        parameters: Record<string, unknown>;
        resolve: (approved: boolean) => void;
    } | null>(null);

    // 🆕 Ortak cevap işleme fonksiyonu (hem streaming hem sendMessage için)
    const processFinalResponse = useCallback(async (fullResponse: string, messageId: string) => {
        const codeBlocks = extractCodeBlocks(fullResponse);
        const assistantMsgId = messageId.startsWith('assistant-') ? messageId : `assistant-${messageId}`;

        if (codeBlocks.length > 0) {
            let cleanResponse = fullResponse;
            const newActions: CodeAction[] = [];

            codeBlocks.forEach((block) => {
                let filename = block.filename;
                let isModification = false;

                if (!filename && currentFile) {
                    filename = currentFile.split(/[\\\/]/).pop();
                    isModification = true;
                }

                if (!filename) {
                    const ext = EXTENSION_MAP[block.language.toLowerCase()] || "txt";
                    filename = `uncategorized_snippet_${Date.now()}.${ext}`;
                }

                let filepath = (isModification && currentFile) ? currentFile : (projectPath ? `${projectPath}/${filename}` : filename);

                // Ensure project path is included if it's a relative path
                if (projectPath && !filepath.includes(projectPath) && !filepath.includes(":") && !filepath.startsWith("/")) {
                    filepath = `${projectPath}/${filename}`;
                }

                // EGER AI KLASOR YAPISI VERDIYSE (örn: src/components/Header.tsx), filepath icinde projectPath ciftlenmesin
                if (projectPath && filename.includes("/")) {
                    filepath = `${projectPath}/${filename.replace(/^\/+/, "")}`;
                }

                let isPatch = false;
                let searchContent = "";
                let replaceContent = "";

                if (block.code.includes("<<<SEARCH") && block.code.includes(">>>REPLACE")) {
                    const searchMatch = block.code.match(/<<<SEARCH\n([\s\S]*?)\n===/);
                    const replaceMatch = block.code.match(/===\n([\s\S]*?)\n>>>REPLACE/);

                    if (searchMatch && replaceMatch) {
                        isPatch = true;
                        searchContent = searchMatch[1];
                        replaceContent = replaceMatch[1];
                    }
                }

                const replacement = `\n📄 **${isPatch ? 'Kısmi yama uygulanıyor' : (isModification ? 'Dosya güncelleniyor' : 'Yeni dosya oluşturuluyor')}:** \`${filename}\` (${block.language}) 🚀\n`;
                cleanResponse = cleanResponse.replace(/```[\s\S]*?```/, replacement);

                const actionOpts: CodeAction = {
                    id: `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    type: isPatch ? 'patch' : (isModification ? 'modify' : 'create'),
                    filePath: filepath,
                    content: block.code,
                    description: isPatch ? `${filename} kısmi güncellendi` : (isModification ? `${filename} güncellendi` : `${filename} oluşturuldu`)
                };

                if (isPatch) {
                    actionOpts.patchData = { search: searchContent, replace: replaceContent };
                }

                newActions.push(actionOpts);
            });

            setMessages((prev) =>
                prev.map((msg) =>
                    msg.id === assistantMsgId ? { ...msg, content: cleanResponse.trim() } : msg
                )
            );

            // AUTO-APPLY
            for (const action of newActions) {
                try {
                    const filename = action.filePath.split(/[\\\/]/).pop() || '';

                    if (action.type === 'patch' && action.patchData) {
                        const originalContent = await invoke<string>("read_file_content", { path: action.filePath });

                        if (originalContent.includes(action.patchData.search)) {
                            const newFileContent = originalContent.replace(action.patchData.search, action.patchData.replace);
                            await invoke("write_file", { path: action.filePath, content: newFileContent });
                            await openFile(action.filePath);
                            await addFileToIndex(action.filePath, newFileContent);

                            setMessages(prev => [...prev, {
                                id: `auto-apply-success-${Date.now()}-${Math.random()}`,
                                role: "system",
                                content: `✅ **${filename}** dosyasına kısmi yama (patch) uygulandı ve ana ekranda açıldı!`,
                                timestamp: Date.now()
                            }]);
                        } else {
                            throw new Error(`Arama metni dosyada tam olarak bulunamadı.`);
                        }
                    } else {
                        // YAPISAL MIMO (ARCHITECT) DEGISIKLIGI:
                        // write_file yerine create_file cagiriyoruz ki Tauri arkada otomatik olarak
                        // fs::create_dir_all(parent) calistirip klasorleri kendisi uretsin.
                        await invoke("create_file", { path: action.filePath, content: action.content });
                        await openFile(action.filePath);
                        await addFileToIndex(action.filePath, action.content);

                        setMessages(prev => [...prev, {
                            id: `auto-apply-success-${Date.now()}-${Math.random()}`,
                            role: "system",
                            content: action.type === 'modify'
                                ? `✅ **${filename}** dosyası tamamen güncellendi ve ana ekranda açıldı!`
                                : `✅ **${filename}** oluşturuldu ve ana ekranda açıldı!`,
                            timestamp: Date.now()
                        }]);
                    }
                } catch (error) {
                    setMessages(prev => [...prev, {
                        id: `auto-apply-error-${Date.now()}-${Math.random()}`,
                        role: "system",
                        content: `❌ **Oto-Uygulama Hatası (${action.filePath}):** ${error}`,
                        timestamp: Date.now()
                    }]);
                }
            }
        } else {
            // No code blocks, just set the full content
            setMessages((prev) =>
                prev.map((msg) =>
                    msg.id === assistantMsgId ? { ...msg, content: fullResponse } : msg
                )
            );
        }
    }, [currentFile, projectPath, openFile, addFileToIndex]);

    // Streaming throttle refs
    const processedMessagesRef = useRef<Set<string>>(new Set());
    const pendingTokenUpdateRef = useRef<{ content: string; requestId: string } | null>(null);
    const tokenUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Konuşmayı yükle (proje değiştiğinde veya dal değiştiğinde)
    useEffect(() => {
        const loadConversation = async () => {
            const savedMessages = await getConversation(`${projectPath}_${currentBranch}`);
            if (savedMessages && savedMessages.length > 0) {
                setMessages(savedMessages);
            } else if (currentBranch === "main") {
                // Eski kayıtlar için geriye dönük uyumluluk
                const oldMessages = await getConversation(projectPath);
                if (oldMessages && oldMessages.length > 0) {
                    setMessages(oldMessages);
                } else {
                    setMessages([]);
                }
            } else {
                setMessages([]);
            }
        };
        if (projectPath) loadConversation();
    }, [projectPath, currentBranch]);

    // Konuşmayı kaydet (mesajlar değiştiğinde)
    useEffect(() => {
        if (projectPath && messages.length > 0) {
            saveConversation(`${projectPath}_${currentBranch}`, messages);
        }
    }, [messages, projectPath, currentBranch]);


    // Core mesajlarını işle (streaming handler)
    useEffect(() => {
        if (coreMessages.length === 0) return;
        const latestMessage = coreMessages[coreMessages.length - 1];
        if (!latestMessage || !latestMessage.messageId) return;

        // Token throttling
        if (latestMessage.messageType === "streaming/token") {
            const data = (latestMessage as any).data as { requestId: string; accumulated: string };
            pendingTokenUpdateRef.current = { content: data.accumulated, requestId: data.requestId };
            if (tokenUpdateTimeoutRef.current) clearTimeout(tokenUpdateTimeoutRef.current);
            tokenUpdateTimeoutRef.current = setTimeout(() => {
                if (!pendingTokenUpdateRef.current) return;
                const { content, requestId } = pendingTokenUpdateRef.current;
                setMessages((prev) =>
                    prev.map((msg) => (msg.id === `assistant-${requestId}` ? { ...msg, content } : msg))
                );
                pendingTokenUpdateRef.current = null;
            }, 150);
            return;
        }

        if (processedMessagesRef.current.has(latestMessage.messageId)) return;
        processedMessagesRef.current.add(latestMessage.messageId);

        switch (latestMessage.messageType) {
            case "streaming/start": {
                const requestId = ("data" in latestMessage) ? (latestMessage.data as any).requestId : "";
                const assistantMessageId = `assistant-${requestId}`;
                setMessages((prev) => {
                    if (prev.some((msg) => msg.id === assistantMessageId)) return prev;
                    return [...prev, { id: assistantMessageId, role: "assistant", content: "", timestamp: Date.now() }];
                });
                break;
            }
            case "streaming/complete": {
                if (tokenUpdateTimeoutRef.current) {
                    clearTimeout(tokenUpdateTimeoutRef.current);
                    pendingTokenUpdateRef.current = null;
                }

                const fullResponse = ("data" in latestMessage) ? (latestMessage.data as any).fullResponse : "";
                const requestId = ("data" in latestMessage) ? (latestMessage.data as any).requestId : "";

                processFinalResponse(fullResponse, requestId);
                break;
            }
            case "streaming/error":
            case "error": {
                const error = ("data" in latestMessage) ? (latestMessage.data as any).error : "Unknown error";
                setMessages((prev) => [
                    ...prev,
                    { id: generateMessageId("error"), role: "system", content: `❌ Hata: ${error}`, timestamp: Date.now() },
                ]);
                setIsLoading(false);
                break;
            }
        }

        return () => {
            if (tokenUpdateTimeoutRef.current) clearTimeout(tokenUpdateTimeoutRef.current);
        };
    }, [coreMessages, currentFile, projectPath, openFile, addFileToIndex]);

    const addMessage = useCallback((msg: Omit<Message, "id">) => {
        setMessages((prev) => [...prev, { ...msg, id: generateMessageId(msg.role) }]);
    }, []);

    const sendMessage = useCallback(
        async (userMessage: string) => {
            if (!userMessage.trim() || isLoading) return;

            // 1. UI update (Optimistic)
            const userMsg: Message = {
                id: generateMessageId("user"),
                role: "user",
                content: userMessage,
                timestamp: Date.now()
            };
            setMessages((prev) => [...prev, userMsg]);
            setIsLoading(true);

            // 🚀 INTERCEPT FUTURISTIC COMMANDS 🚀
            if (userMessage.trim().toLowerCase().startsWith("/branch")) {
                const parts = userMessage.trim().split(/\s+/);
                const action = parts[1]?.toLowerCase();
                const branchName = parts[2];
                setMessages(prev => prev.slice(0, -1)); // remove optimistic user msg
                setIsLoading(false);

                if (action === "new" && branchName) {
                    // Mevcut durumu şu anki dala yazıp yenisini seçiyoruz
                    saveConversation(`${projectPath}_${currentBranch}`, messages);
                    setCurrentBranch(branchName);
                    saveConversation(`${projectPath}_${branchName}`, messages);
                    setMessages((prev) => [...prev, {
                        id: generateMessageId("system"),
                        role: "system",
                        content: `🌿 Yeni dal (branch) oluşturuldu ve mevcut konuşma buraya kopyalandı: **${branchName}**`,
                        timestamp: Date.now()
                    }]);
                } else if (action === "checkout" && branchName) {
                    saveConversation(`${projectPath}_${currentBranch}`, messages);
                    setCurrentBranch(branchName);
                } else if (action === "status") {
                    setMessages((prev) => [...prev, {
                        id: generateMessageId("system"),
                        role: "system",
                        content: `🌿 Şu anda aktif olan dal: **${currentBranch}**\nYeni bir dal açmak için: \`/branch new <isim>\`\nBaşka bir dala geçmek için: \`/branch checkout <isim>\``,
                        timestamp: Date.now()
                    }]);
                } else {
                    setMessages((prev) => [...prev, {
                        id: generateMessageId("system"),
                        role: "system",
                        content: `❌ Hatalı kullanım. Lütfen \`/branch new <isim>\` veya \`/branch checkout <isim>\` veya \`/branch status\` kullanın.`,
                        timestamp: Date.now()
                    }]);
                }
                return;
            }

            if (userMessage.trim().toLowerCase().startsWith("/whatif")) {
                const query = userMessage.trim().replace(/^\/whatif\s*/i, "");

                const assistantMsgId = generateMessageId("assistant");
                setMessages((prev) => [...prev, { id: assistantMsgId, role: "assistant", content: "🧪 Paralel evren simülasyonu başlatılıyor...", timestamp: Date.now() }]);

                try {
                    const { WhatIfSandboxService } = await import("../services/whatIfSandbox");
                    const response = await WhatIfSandboxService.simulateScenario(query, fileIndex);
                    setMessages((prev) => prev.map(msg => msg.id === assistantMsgId ? { ...msg, content: response } : msg));
                } catch (e) {
                    setMessages((prev) => prev.map(msg => msg.id === assistantMsgId ? { ...msg, content: `❌ Hata: ${e}` } : msg));
                }
                setIsLoading(false);
                return;
            }

            if (userMessage.trim().toLowerCase().startsWith("/singularity")) {
                const query = userMessage.trim().replace(/^\/singularity\s*/i, "");

                const assistantMsgId = generateMessageId("assistant");
                setMessages((prev) => [...prev, { id: assistantMsgId, role: "assistant", content: "👑 The Singularity uyanıyor... Kendi kodumu analiz ediyorum, lütfen bekle...", timestamp: Date.now() }]);

                try {
                    const { SingularityService } = await import("../services/singularity");
                    const response = await SingularityService.selfModify(query, fileIndex);
                    setMessages((prev) => prev.map(msg => msg.id === assistantMsgId ? { ...msg, content: response } : msg));
                } catch (e) {
                    setMessages((prev) => prev.map(msg => msg.id === assistantMsgId ? { ...msg, content: `❌ Hata: ${e}` } : msg));
                }
                setIsLoading(false);
                return;
            }

            // 2. Semantic Context Retrieval (Hybrid)
            let contextText = "";
            let projectMapText = "";
            let focusText = "";

            try {
                // 1. AI Knowledge Base (Project Rules) & STRICT ARCHITECTURE ENFORCEMENT
                let projectRules = `\n--- CRITICAL SYSTEM INSTRUCTIONS (ARCHITECT MODE) ---\n1. ASLA SADECE KOD VEYA HTML DÖNDÜRME. \n2. Kod bloklarının dil tanımının yanına MUTLAKA mutlak relative path ekle. Örnek: \`\`\`tsx:src/components/MyComponent.tsx\`\`\` veya \`\`\`html:public/index.html\`\`\`\n3. Yeni bir özellik istendiğinde, onu projenin klasör yapısına uygun yerleştir. Asla ana dizine rastgele dosya atma.\n-------------------------------------------\n`;
                const rulesFile = fileIndex.find(f =>
                    f.path.toLowerCase().endsWith('.corexrules') ||
                    f.path.toLowerCase().endsWith('corex.md')
                );
                if (rulesFile) {
                    projectRules += `\n--- PERMANENT PROJECT RULES (.corexrules) ---\n${rulesFile.content}\n-------------------------------------------\n`;
                }

                // 2. Global Project Map
                const context = getConversationContext();
                projectMapText = `\n--- GLOBAL PROJECT MAP ---\nProject: ${context.projectContext.name || 'Corex Project'}\nType: ${context.projectContext.type}\nLanguages: ${context.projectContext.mainLanguages.join(", ")}\nRoot: ${projectPath}\n${projectRules}-------------------------\n`;

                // 3. Current Focus (Cursor & Selection)
                if (currentFile) {
                    focusText = `\n--- USER FOCUS ---\nActive File: ${currentFile}\n`;
                    if (cursorLine !== undefined) {
                        focusText += `Cursor Position: Line ${cursorLine}, Column ${cursorColumn || 1}\n`;
                    }
                    if (selection) {
                        focusText += `Selected Text:\n\`\`\`\n${selection}\n\`\`\`\n`;
                    }
                    focusText += `------------------\n`;
                }

                // 4. Calculate Embedding for Query
                const queryEmbedding = await createEmbedding(userMessage);

                // Build Smart Context
                const contextFiles = await smartContextBuilder.buildContext(
                    userMessage,
                    queryEmbedding,
                    fileIndex,
                    currentFile,
                    { maxFiles: 5, maxTokens: 12000 }
                );

                if (contextFiles && contextFiles.length > 0) {
                    contextText = "\n\n--- SEMANTIC CONTEXT (Relevant Files & Symbols) ---\n" +
                        contextFiles.map((file: any) =>
                            `File: ${file.path} (Reason: ${file.reason})\n\`\`\`${file.path.split('.').pop()}\n${file.content}\n\`\`\``
                        ).join("\n\n") + "\n--------------------------------------------------\n";
                    console.log("Adding Smart context:", contextFiles.length, "relevant chunks/files");
                }
            } catch (e) {
                console.error("Smart Context search failed:", e);
            }

            // 3. Prepare AI Prompt
            const toolsPrompt = await getToolsPrompt();
            const fullPrompt = `${projectMapText}${focusText}${contextText}\n\n${toolsPrompt}\n\nUser Message: ${userMessage}`;
            const modelId = getModelIdForRole();
            const conversationHistory = messages.map(m => ({ role: m.role, content: m.content }));

            // 4. Placeholder for Assistant Response
            const msgId = generateMessageId("assistant");
            setMessages((prev) => [...prev, { id: msgId, role: "assistant", content: "", timestamp: Date.now() }]);

            try {
                let accumulatedResponse = "";
                await callAI(fullPrompt, modelId, conversationHistory, (token: string) => {
                    accumulatedResponse += token;
                    setMessages((prev) =>
                        prev.map((msg) => (msg.id === msgId ? { ...msg, content: accumulatedResponse } : msg))
                    );
                }, isMentorMode);

                // 🔧 TOOL SYSTEM - Parse and execute tools
                const toolCallsOpt = parseToolCalls(accumulatedResponse);
                let toolCall = toolCallsOpt.length > 0 ? toolCallsOpt[0] : null;
                let toolIterations = 0;
                const maxToolIterations = 5;

                while (toolCall && toolIterations < maxToolIterations) {
                    toolIterations++;
                    const currentToolCall = toolCall;

                    // Check autonomy/approval
                    const autonomyConfig = getAutonomyConfig();
                    const needsApproval = requiresApproval(currentToolCall.toolName, currentToolCall.parameters, autonomyConfig);

                    if (needsApproval) {
                        // Request approval via UI
                        const approved = await new Promise<boolean>((resolve) => {
                            setToolApprovalRequest({
                                toolName: currentToolCall.toolName,
                                parameters: currentToolCall.parameters as any,
                                resolve
                            });
                        });
                        setToolApprovalRequest(null);

                        if (!approved) {
                            // Add rejection to history and AI
                            const rejectionMsg: Message = {
                                id: generateMessageId("system"),
                                role: "system",
                                content: `🚫 **Tool reddedildi:** \`${currentToolCall.toolName}\``,
                                timestamp: Date.now()
                            };
                            setMessages(prev => [...prev, rejectionMsg]);
                            break; // Stop loop if rejected
                        }
                    }

                    // Execute Tool
                    const toolExecutionId = generateMessageId("tool-exec");
                    setMessages(prev => [...prev, {
                        id: toolExecutionId,
                        role: "system",
                        content: `🔧 **Tool çalıştırılıyor:** \`${currentToolCall.toolName}\`...`,
                        toolExecution: {
                            toolName: currentToolCall.toolName,
                            status: 'running',
                            startTime: Date.now()
                        },
                        timestamp: Date.now()
                    }]);

                    const toolResult = await executeTool(currentToolCall.toolName, currentToolCall.parameters);

                    // Update tool execution status
                    setMessages(prev => prev.map(msg =>
                        msg.id === toolExecutionId
                            ? {
                                ...msg,
                                content: toolResult.success
                                    ? `✅ **Tool tamamlandı:** \`${currentToolCall.toolName}\``
                                    : `❌ **Tool hatası:** \`${currentToolCall.toolName}\` - ${toolResult.error}`,
                                toolExecution: {
                                    ...msg.toolExecution!,
                                    status: toolResult.success ? 'completed' : 'failed',
                                    endTime: Date.now(),
                                    result: toolResult
                                }
                            }
                            : msg
                    ));

                    // Feed result back to AI
                    const resultPrompt = `🔧 Tool Result (${currentToolCall.toolName}):\n${JSON.stringify(toolResult, null, 2)}\n\nLütfen devam et.`;
                    const currentHistory = [...conversationHistory, { role: 'assistant', content: accumulatedResponse }, { role: 'user', content: resultPrompt }];

                    accumulatedResponse = "";
                    const nextMsgId = generateMessageId("assistant");
                    setMessages(prev => [...prev, { id: nextMsgId, role: "assistant", content: "", timestamp: Date.now() }]);

                    await callAI(resultPrompt, modelId, currentHistory, (token: string) => {
                        accumulatedResponse += token;
                        setMessages((prev) =>
                            prev.map((msg) => (msg.id === nextMsgId ? { ...msg, content: accumulatedResponse } : msg))
                        );
                    }, isMentorMode);

                    const nextToolCalls = parseToolCalls(accumulatedResponse);
                    toolCall = nextToolCalls.length > 0 ? nextToolCalls[0] : null;
                }

                // 🔥 Completion processing for final response
                processFinalResponse(accumulatedResponse, msgId);

            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "Unknown error";
                setMessages((prev) => [...prev, { id: generateMessageId("error"), role: "system", content: `❌ AI Error: ${errorMessage}`, timestamp: Date.now() }]);
            } finally {
                setIsLoading(false);
            }
        },
        [isLoading, coreMessages]
    );

    const handleStopGeneration = useCallback(() => {
        stopCoreGeneration();
        setIsLoading(false);
    }, [stopCoreGeneration]);

    const handleRegenerateResponse = useCallback(() => {
        const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
        if (lastUserMessage) {
            setMessages((prev) => {
                const lastAssistantIndex = [...prev].reverse().findIndex((m) => m.role === "assistant");
                if (lastAssistantIndex === -1) return prev;
                const actualIndex = prev.length - 1 - lastAssistantIndex;
                return prev.filter((_, i) => i !== actualIndex);
            });
            sendMessage(lastUserMessage.content);
        }
    }, [messages, sendMessage]);
    // Added processFinalResponse to the dependency array of the main effect
    // To avoid circular dependency with sendMessage, we separate them carefully.

    const handleNewSession = useCallback(() => {
        const confirmMessage = `Yeni oturum başlatılsın mı?\n\n• ${messages.length} mesaj temizlenecek\n• Sohbet geçmişi silinecek\n• Proje dosyaları korunacak\n\nDevam edilsin mi?`;
        if (window.confirm(confirmMessage)) {
            resetConversation();
            setPendingActions([]);
            setMessages([
                {
                    id: generateMessageId("new-session"),
                    role: "system",
                    content: `🔄 Yeni oturum başlatıldı!\n\n✅ Sohbet geçmişi temizlendi\n✅ Context sıfırlandı\n✅ Proje dosyaları korundu\n\nYeni sorular sorabilirsin! 🚀`,
                    timestamp: Date.now(),
                },
            ]);
        }
    }, [messages.length]);

    const getProjectContext = useCallback(() => {
        return getConversationContext().projectContext;
    }, []);

    // 🤖 Autonomous Heal Listener
    useEffect(() => {
        const handleAutoHeal = (e: any) => {
            const { error } = e.detail;
            sendMessage(`🤖 **OTONOM İYİLEŞTİRME BAŞLATILDI**\n\nTespit edilen hata:\n\`\`\`\n${error}\n\`\`\`\n\nLütfen bu hatayı analiz et ve gerekli araçları kullanarak çöz.`);
        };
        window.addEventListener('corex-autofix-start', handleAutoHeal);
        return () => window.removeEventListener('corex-autofix-start', handleAutoHeal);
    }, [sendMessage]);

    return {
        messages,
        isLoading,
        pendingActions,
        isMentorMode,
        setIsMentorMode,
        toolApprovalRequest,
        isCoreStreaming,
        setMessages,
        setPendingActions,
        setToolApprovalRequest,
        addMessage,
        sendMessage,
        handleStopGeneration,
        handleRegenerateResponse,
        handleNewSession,
        getProjectContext,
        currentBranch, // Added for potential UI exposure
    };
}

