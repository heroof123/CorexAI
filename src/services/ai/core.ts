import { storage } from '../storage';
import { selectPromptMode, type AutonomyMeta } from '../../prompts/corex_system_prompt';
import { getModelIdForRole } from './models';
import { analyzeUserIntent, generateSummary } from './analysis';
import { conversationContext, pruneHistory, updateConversationContext } from './context';
import { estimateTokens } from './utils';

/**
 * AI'ya mesaj gönderen ana fonksiyon.
 * Tool kullanımı, RAG ve geçmiş yönetimini koordine eder.
 */
export async function sendToAI(
    message: string,
    resetHistory: boolean = false,
    onToolExecution?: (toolName: string, status: 'running' | 'completed' | 'failed', result?: any, error?: string) => void,
    onToolApprovalRequest?: (toolName: string, parameters: any) => Promise<boolean>
): Promise<string> {
    // Prevent concurrent calls
    if ((sendToAI as any).isProcessing) {
        console.warn("⚠️ AI çağrısı zaten işleniyor, yeni çağrı reddedildi");
        throw new Error("AI çağrısı zaten işleniyor. Lütfen bekleyin.");
    }

    (sendToAI as any).isProcessing = true;

    try {
        if (resetHistory) {
            conversationContext.history = [];
        }

        // 🆕 GGUF model config'inden context ve output limitlerini al
        const config = await storage.getSettings<any>('gguf-active-model');
        if (config) {
            conversationContext.maxContextTokens = config.contextLength || 32768;
            console.log(`📏 Context limit güncellendi: ${conversationContext.maxContextTokens}`);
        }

        // 🆕 Output mode'u localStorage'dan al
        const outputMode = await storage.getSettings<string>('ai-output-mode') || 'normal';
        conversationContext.maxOutputTokens =
            outputMode === 'brief' ? 2048 :
                outputMode === 'detailed' ? 16384 : 8192;

        console.log(`📤 Output limit: ${conversationContext.maxOutputTokens} (${outputMode})`);


        // Analyze user intent and update context
        const userIntent = analyzeUserIntent(message);
        updateConversationContext(message, userIntent);

        // Get tools prompt dynamically (includes MCP tools)
        const { getToolsPrompt } = await import('./aiTools');
        const toolsPrompt = await getToolsPrompt();

        // 🧠 CorexA Ultimate System Prompt — autonomy + verbosity + proje bağlamıyla
        const { getAutonomyConfig: getAutonomyCfg } = await import('./autonomy');
        const autonomyConfig = getAutonomyCfg();
        const corexMeta: AutonomyMeta = {
            level: autonomyConfig.level as 1 | 2 | 3 | 4 | 5,
            verbosity: outputMode === 'brief' ? 'concise' : outputMode === 'detailed' ? 'detailed' : 'balanced',
            modelName: getModelIdForRole(),
            projectPath: conversationContext.projectContext?.name || undefined,
            currentFile: conversationContext.recentFiles?.[0] || undefined,
        };
        const systemPrompt = selectPromptMode(message, toolsPrompt, corexMeta);
        console.log('🧠 CorexA System Prompt seçildi (level:', corexMeta.level, '| verbosity:', corexMeta.verbosity, ')');

        // Add system prompt if this is the first message
        if (conversationContext.history.length === 0) {
            conversationContext.history.push({
                role: "system",
                content: systemPrompt,
                timestamp: Date.now(),
                tokens: estimateTokens(systemPrompt)
            });
        }

        // Add user message to history
        const userTokens = estimateTokens(message);
        conversationContext.history.push({
            role: "user",
            content: message,
            timestamp: Date.now(),
            tokens: userTokens
        });

        // 🆕 Mesaj sayacını artır
        conversationContext.messagesSinceLastSummary++;

        // 🆕 Her 10 mesajda bir özet oluştur
        if (conversationContext.messagesSinceLastSummary >= 10) {
            console.log('📝 10 mesaj geçti, özet oluşturuluyor...');

            const summary = await generateSummary(conversationContext.history);

            if (summary) {
                conversationContext.summary = summary;
                conversationContext.messagesSinceLastSummary = 0;

                console.log('✅ Özet kaydedildi:', summary.substring(0, 100) + '...');
            }
        }

        // 🆕 History'yi temizle (context'in %40'ı history için)
        const maxHistoryTokens = Math.floor(conversationContext.maxContextTokens * 0.4);
        pruneHistory(maxHistoryTokens);

        // 🆕 Dinamik AI provider kullan - conversation history ile
        const { callAI } = await import('./aiProvider');
        const modelId = getModelIdForRole();

        // 🆕 Özet varsa history'nin başına ekle (system prompt'tan sonra)
        let historyWithSummary = [...conversationContext.history];
        if (conversationContext.summary) {
            const summaryMessage = {
                role: 'system',
                content: `📝 Önceki Konuşma Özeti:\n${conversationContext.summary}\n\n---\n`,
                timestamp: Date.now(),
                tokens: estimateTokens(conversationContext.summary)
            };

            // System prompt'tan sonra, diğer mesajlardan önce ekle
            historyWithSummary.splice(1, 0, summaryMessage);
            console.log('📌 Özet history\'ye eklendi');
        }

        // 🧠 RAG (Vektörel Kod Hafızası) Entegrasyonu
        try {
            const { ragService } = await import('./ragService');
            // Kullanıcının mesajındaki niyetine göre ilk 4 semantik parçayı bul
            const vectorResults = await ragService.search(message, 4);

            if (vectorResults && vectorResults.length > 0) {
                console.log(`🔍 RAG: ${vectorResults.length} adet kod bağlamı hafızadan çekildi.`);

                let ragContextText = "🧠 PROJE HAFIZASI (Vektörel Arama Sonuçları):\n\nBu bağlam sana projenin kod tabanından getirilmiştir. Lütfen yanıt verirken aşağıdaki dosyaların varlığını ve içeriğini bilerek hareket et:\n\n";

                vectorResults.forEach(res => {
                    // Token şişmemesi için her dosyanın max 1500 karakterini al
                    ragContextText += `--- DOSYA: ${res.file_path} ---\n\`\`\`\n${res.content.substring(0, 1500)}\n\`\`\`\n\n`;
                });

                // Bu veriyi hafızayı şişirmemek için ASIL HISTORY dizisine DEĞİL, sadece bu anlık isteğe giden historyWithSummary kopyasına ekliyoruz.
                const ragMessage = {
                    role: "system",
                    content: ragContextText,
                    timestamp: Date.now(),
                    tokens: estimateTokens(ragContextText)
                };

                // Kullanıcı mesajından (en son mesaj) hemen önce araya yerleştir
                const userMsgIndex = historyWithSummary.length - 1;
                historyWithSummary.splice(userMsgIndex, 0, ragMessage);
            }
        } catch (ragError) {
            console.warn("⚠️ RAG araması yapılamadı (Vektör DB henüz hazır olmayabilir):", ragError);
        }

        // Prepare conversation history for AI (only role and content)
        const historyForAI = historyWithSummary.map(msg => ({
            role: msg.role,
            content: msg.content
        }));

        console.log('📤 AI\'ye gönderilen history:', historyForAI.length, 'mesaj');
        console.log('📊 Tahmini history token:', conversationContext.history.reduce((sum, msg) => sum + (msg.tokens || 0), 0));

        // Add timeout to prevent hanging (5 minutes for GGUF models)
        const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('AI çağrısı zaman aşımına uğradı (300 saniye)')), 300000);
        });

        let response = await Promise.race([
            callAI(message, modelId, historyForAI), // 🔥 History ile gönder
            timeoutPromise
        ]);

        // 🔧 TOOL SYSTEM - Parse and execute tools
        const { parseToolCalls, executeTool } = await import('./aiTools');
        const { requiresApproval } = await import('./autonomy');

        let toolCalls = parseToolCalls(response);
        let toolIterations = 0;
        const maxToolIterations = 5; // Sonsuz döngü önleme

        while (toolCalls.length > 0 && toolIterations < maxToolIterations) {
            toolIterations++;
            console.log(`🔧 Çoklu Tool Çağrısı tespit edildi (${toolIterations}/${maxToolIterations}): ${toolCalls.map(t => t.toolName).join(', ')}`);

            const sessionResults: string[] = [];
            for (const toolCall of toolCalls) {
                // 🎚️ AUTONOMY CHECK - Onay gerekli mi? (corexMeta.level zaten yukarıda tanımlı)
                const config = autonomyConfig;
                const needsApproval = requiresApproval(toolCall.toolName, toolCall.parameters, config);

                let executionResult: any = null;
                let isApproved = true;

                if (needsApproval && onToolApprovalRequest) {
                    console.log('🔐 Tool onay gerektiriyor:', toolCall.toolName);
                    const approved = await onToolApprovalRequest(toolCall.toolName, toolCall.parameters);

                    if (!approved) {
                        console.log('❌ Tool reddedildi:', toolCall.toolName);
                        isApproved = false;
                        executionResult = { success: false, error: 'User rejected the tool execution.' };
                    } else {
                        console.log('✅ Tool onaylandı:', toolCall.toolName);
                    }
                } else {
                    console.log('🚀 Tool otomatik çalıştırılıyor:', toolCall.toolName);
                }

                if (isApproved) {
                    if (onToolExecution) onToolExecution(toolCall.toolName, 'running');

                    executionResult = await executeTool(toolCall.toolName, toolCall.parameters);
                    console.log(`🔧 Tool sonucu (${toolCall.toolName}):`, executionResult);

                    if (onToolExecution) {
                        if (executionResult.success) {
                            onToolExecution(toolCall.toolName, 'completed', executionResult);
                        } else {
                            onToolExecution(toolCall.toolName, 'failed', executionResult, executionResult.error);
                        }
                    }
                }

                sessionResults.push(`🔧 Tool Result (${toolCall.toolName}):\n${JSON.stringify(executionResult, null, 2)}`);
            }

            // Tüm tool sonuçlarını tek mesaj olarak history'ye ekle
            const combinedToolResultMessage = sessionResults.join('\n\n');
            conversationContext.history.push({
                role: "user",
                content: combinedToolResultMessage,
                timestamp: Date.now(),
                tokens: estimateTokens(combinedToolResultMessage)
            });

            conversationContext.messagesSinceLastSummary++;

            // AI'ya tüm tool sonuçlarını gönder ve devam et
            const continuePrompt = "Araçlar(Tools) çalıştırıldı. Sonuçları yukarıda görebilirsin. Duruma göre adım adım ilerlemeye devam et.";
            const historyForAI2 = conversationContext.history.map(msg => ({
                role: msg.role,
                content: msg.content
            }));

            response = await Promise.race([
                callAI(continuePrompt, modelId, historyForAI2),
                timeoutPromise
            ]);

            // Yeni response'da başka tool var mı kontrol et
            toolCalls = parseToolCalls(response);
        }

        if (toolIterations >= maxToolIterations) {
            console.warn('⚠️ Maksimum tool iterasyonu aşıldı');
            response += '\n\n⚠️ (Maksimum tool çağrısı limitine ulaşıldı)';
        }

        // Add AI response to history
        const responseTokens = estimateTokens(response);
        conversationContext.history.push({
            role: "assistant",
            content: response,
            timestamp: Date.now(),
            tokens: responseTokens
        });

        // 🆕 AI cevabı da sayılır
        conversationContext.messagesSinceLastSummary++;

        // 🆕 Response çok uzunsa uyar
        if (responseTokens > conversationContext.maxOutputTokens * 0.9) {
            console.warn(`⚠️ Cevap çok uzun: ${responseTokens} token (limit: ${conversationContext.maxOutputTokens})`);
        }

        return response;
    } catch (error) {
        console.error('❌ AI hatası:', error);

        // Aktif model bulunamadıysa kullanıcıya bildir
        if (error instanceof Error && error.message.includes('Model bulunamadı')) {
            throw new Error('❌ Aktif AI modeli bulunamadı. Lütfen AI ayarlarından bir model aktif edin.');
        }

        // Bağlantı hatası varsa kullanıcıya bildir
        if (error instanceof Error && (error.message.includes('fetch') || error.message.includes('network'))) {
            throw new Error('❌ AI sunucusuna bağlanılamadı. LM Studio veya AI sağlayıcınızın çalıştığından emin olun.');
        }

        // Timeout hatası
        if (error instanceof Error && error.message.includes('zaman aşımı')) {
            throw new Error('❌ AI yanıt verme süresi aşıldı. Lütfen tekrar deneyin.');
        }

        // Diğer hatalar için genel mesaj
        throw new Error(`❌ AI hatası: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
    } finally {
        (sendToAI as any).isProcessing = false;
    }
}

// Static property initialization
(sendToAI as any).isProcessing = false;

// ⚖️ MODEL KARŞILAŞTIRMA MODU
export async function compareModels(
    message: string,
    modelId1: string,
    modelId2: string,
    onToken1?: (token: string, metrics?: { speed: number }) => void,
    onToken2?: (token: string, metrics?: { speed: number }) => void
): Promise<{ response1: string; response2: string; metrics1: any; metrics2: any }> {
    console.log(`⚖️ Karşılaştırma başlatılıyor: ${modelId1} vs ${modelId2}`);

    const { callAI } = await import('./aiProvider');

    // Ortak history hazırla
    const historyForAI = conversationContext.history.map(msg => ({
        role: msg.role,
        content: msg.content
    }));

    const start1 = Date.now();
    let tokens1 = 0;
    const promise1 = callAI(message, modelId1, historyForAI, (token: string) => {
        tokens1++;
        const elapsed = (Date.now() - start1) / 1000;
        const speed = elapsed > 0 ? tokens1 / elapsed : 0;
        if (onToken1) onToken1(token, { speed });
    });

    const start2 = Date.now();
    let tokens2 = 0;
    const promise2 = callAI(message, modelId2, historyForAI, (token: string) => {
        tokens2++;
        const elapsed = (Date.now() - start2) / 1000;
        const speed = elapsed > 0 ? tokens2 / elapsed : 0;
        if (onToken2) onToken2(token, { speed });
    });

    const [res1, res2] = await Promise.all([promise1, promise2]);

    const end1 = Date.now();
    const end2 = Date.now();

    const metrics1 = {
        duration: (end1 - start1) / 1000,
        tokens: tokens1,
        speed: tokens1 / ((end1 - start1) / 1000)
    };

    const metrics2 = {
        duration: (end2 - start2) / 1000,
        tokens: tokens2,
        speed: tokens2 / ((end2 - start2) / 1000)
    };

    return {
        response1: res1,
        response2: res2,
        metrics1,
        metrics2
    };
}
