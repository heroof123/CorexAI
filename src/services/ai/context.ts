import { estimateTokens } from './utils';
// Enhanced conversation context
export interface ConversationContext {
    history: Array<{ role: string; content: string; timestamp: number; tokens?: number }>;
    currentTopic: string | null;
    recentFiles: string[];
    userPreferences: {
        codeStyle: string;
        preferredLanguage: string;
        verbosity: 'concise' | 'detailed' | 'balanced';
    };
    ongoingTask: string | null;
    projectContext: {
        name: string;
        type: string;
        mainLanguages: string[];
    };
    maxContextTokens: number; // Maksimum context token sayısı
    maxOutputTokens: number; // Maksimum output token sayısı
    summary: string | null; // Konuşma özeti
    messagesSinceLastSummary: number; // Son özetten sonraki mesaj sayısı
}

export const conversationContext: ConversationContext = {
    history: [],
    currentTopic: null,
    recentFiles: [],
    userPreferences: {
        codeStyle: 'clean',
        preferredLanguage: 'turkish',
        verbosity: 'balanced'
    },
    ongoingTask: null,
    projectContext: {
        name: '',
        type: 'unknown',
        mainLanguages: []
    },
    maxContextTokens: 32768, // 32K default (GGUF model'den alınacak)
    maxOutputTokens: 8192, // 8K default (kullanıcı değiştirebilir)
    summary: null, // Başlangıçta özet yok
    messagesSinceLastSummary: 0 // Mesaj sayacı
};

// History'yi token bazlı temizle
export function pruneHistory(maxTokens: number): void {
    if (conversationContext.history.length <= 1) return; // System prompt'u koru

    let totalTokens = 0;
    const systemPrompt = conversationContext.history[0]; // İlk mesaj system prompt
    const prunedHistory = [systemPrompt];

    // Token sayılarını hesapla (eğer yoksa)
    conversationContext.history.forEach(msg => {
        if (!msg.tokens) {
            msg.tokens = estimateTokens(msg.content);
        }
    });

    // Sondan başa doğru git (en yeni mesajları koru)
    for (let i = conversationContext.history.length - 1; i >= 1; i--) {
        const msg = conversationContext.history[i];
        const msgTokens = msg.tokens || estimateTokens(msg.content);

        if (totalTokens + msgTokens < maxTokens) {
            prunedHistory.splice(1, 0, msg); // System prompt'tan sonra ekle
            totalTokens += msgTokens;
        } else {
            // Limit doldu, eski mesajları at
            console.log(`🗑️ ${conversationContext.history.length - prunedHistory.length} eski mesaj silindi (token limiti)`);
            break;
        }
    }

    conversationContext.history = prunedHistory;
    console.log(`📊 History: ${prunedHistory.length} mesaj, ~${totalTokens} token`);
}

// Update conversation context based on user message and intent
export function updateConversationContext(message: string, intent: string) {
    // Extract file mentions
    const filePattern = /[\w\-_]+\.(ts|tsx|js|jsx|py|rs|java|cpp|c|go|html|css|json|md)/gi;
    const fileMentions = message.match(filePattern) || [];

    if (fileMentions.length > 0) {
        conversationContext.recentFiles = [
            ...new Set([...fileMentions, ...conversationContext.recentFiles])
        ].slice(0, 5); // Keep only last 5 unique files
    }

    // Detect ongoing task
    if (intent === 'create' || intent === 'edit') {
        conversationContext.ongoingTask = intent;
    } else if (intent === 'chat' && conversationContext.ongoingTask) {
        // Continue task if in middle of something
    } else {
        conversationContext.ongoingTask = null;
    }

    // Update current topic
    if (intent !== 'chat') {
        conversationContext.currentTopic = intent;
    }
}

// Get conversation context
export function getConversationContext(): ConversationContext {
    return conversationContext;
}

// Set user preferences
export function setUserPreferences(preferences: Partial<ConversationContext['userPreferences']>) {
    conversationContext.userPreferences = {
        ...conversationContext.userPreferences,
        ...preferences
    };
}

export function resetConversation() {
    conversationContext.history = [];
    conversationContext.currentTopic = null;
    conversationContext.ongoingTask = null;
    conversationContext.summary = null; // Özeti temizle
    conversationContext.messagesSinceLastSummary = 0; // Sayacı sıfırla
    console.log('🔄 Konuşma sıfırlandı (özet dahil)');
}

// Project context management
export function updateProjectContext(projectPath: string, fileIndex: any[]) {
    const projectName = projectPath.split(/[\\/]/).pop() || 'Unknown';

    // Detect project type
    const hasPackageJson = fileIndex.some(f => f.path.includes('package.json'));
    const hasCargoToml = fileIndex.some(f => f.path.includes('Cargo.toml'));
    const hasPyProject = fileIndex.some(f => f.path.includes('pyproject.toml'));

    let projectType = 'unknown';
    if (hasPackageJson) projectType = 'javascript/typescript';
    else if (hasCargoToml) projectType = 'rust';
    else if (hasPyProject) projectType = 'python';

    // Detect main languages
    const languages = new Set<string>();
    fileIndex.forEach(file => {
        const ext = file.path.split('.').pop()?.toLowerCase();
        if (ext) {
            const langMap: Record<string, string> = {
                'ts': 'TypeScript',
                'tsx': 'TypeScript React',
                'js': 'JavaScript',
                'jsx': 'JavaScript React',
                'rs': 'Rust',
                'py': 'Python',
                'css': 'CSS',
                'html': 'HTML'
            };
            if (langMap[ext]) languages.add(langMap[ext]);
        }
    });

    conversationContext.projectContext = {
        name: projectName,
        type: projectType,
        mainLanguages: Array.from(languages)
    };
}
// Build context for AI with relevant files
export async function buildContext(
    userMessage: string,
    relevantFiles: Array<{ path: string; content: string; score: number }>,
    currentFile?: { path: string; content: string },
    totalIndexedFiles?: number,
    allFiles?: Array<{ path: string; content: string; embedding: number[]; lastModified?: number }>
): Promise<string> {
    // Detect casual conversation
    const isCasualChat = /^(selam|merhaba|hey|hi|hello|nasılsın|nasıl gidiyor|naber|ne yapıyorsun|teşekkür|sağol|thanks|thank you)$/i.test(userMessage.trim()) ||
        /^(günaydın|iyi akşamlar|iyi geceler|hoşça kal|görüşürüz|bye|good morning|good night)$/i.test(userMessage.trim());

    // Detect request type
    const isTranslationRequest = /türkçe (yap|çevir|söyle)|translate to turkish/i.test(userMessage);
    const isCodeRequest = /ekle|yaz|oluştur|değiştir|düzelt|implement|create|add|modify|fix|refactor|update/i.test(userMessage);
    const isProjectExplanation = /proje|açıkla|anlat|mimari|yapı|structure|explain|describe|what is|nedir/i.test(userMessage);

    let context = "";

    // Handle casual conversation
    if (isCasualChat) {
        context += `Sen Corex AI'sın - arkadaş canlısı kod asistanı.

SOHBET MODU:
- Kendini tanıt: "Merhaba! Ben Corex 👋"
- Samimi ol, emoji kullan 😊
- Yardım teklif et

KULLANICI: "${userMessage}"

Doğal ve samimi karşılık ver!
`;
        return context;
    }

    // If this is just a translation request, don't add file context
    if (isTranslationRequest) {
        context += "=== KULLANICI İSTEĞİ ===\n\n";
        context += userMessage;
        context += "\n\nNOT: Kullanıcı önceki cevabını Türkçeye çevirmeni istiyor. Sadece önceki cevabını Türkçe olarak tekrar yaz, yeni analiz yapma.\n";
        return context;
    }

    // Enhanced personality introduction - KISA (Token tasarrufu)
    context += `Sen Corex AI'sın - kod asistanı.

PROJE: ${conversationContext.projectContext.name || 'Bilinmiyor'}
TÜR: ${conversationContext.projectContext.type !== 'unknown' ? conversationContext.projectContext.type : 'Bilinmiyor'}
DOSYA: ${totalIndexedFiles || 0}

`;

    // 🆕 Proje açıklama isteğinde - Detay seviyesi sor
    if (isProjectExplanation && !isCodeRequest && allFiles) {
        // Kullanıcı detay seviyesi belirtmiş mi kontrol et
        const detailLevel = userMessage.toLowerCase().includes('detaylı') || userMessage.toLowerCase().includes('derin') || userMessage.toLowerCase().includes('detailed') ? 'detailed' :
            userMessage.toLowerCase().includes('kısa') || userMessage.toLowerCase().includes('öz') || userMessage.toLowerCase().includes('brief') ? 'brief' :
                'ask'; // Belirtmemişse sor

        // Eğer detay seviyesi belirtilmemişse, kullanıcıya sor
        if (detailLevel === 'ask') {
            context += `Sen Corex AI'sın - kod asistanı.

KULLANICI SORUSU: "${userMessage}"

Bu proje hakkında bilgi vermek istiyorum. Nasıl anlatmamı istersin?

📋 **SEÇENEKLER:**

1️⃣ **KISA VE ÖZ** (3-5 cümle)
   - Proje ne yapar?
   - Hangi teknolojiler kullanılmış?
   - Ana özellikler neler?

2️⃣ **DETAYLI VE DERİN** (Kapsamlı analiz)
   - Tüm dosya yapısı
   - Her modülün açıklaması
   - Kod örnekleri
   - Mimari detayları
   - Bağımlılıklar ve ilişkiler

Lütfen seçim yap: "kısa anlat" veya "detaylı anlat" 😊`;
            return context;
        }

        // Import fonksiyonları
        const { getImportantFiles, getProjectStructureFiles, getFileExtension: getExt } = await import('../contextProvider');

        context += "=== PROJE ANALİZİ ===\n\n";

        if (detailLevel === 'brief') {
            // KISA VE ÖZ - Sadece özet bilgi
            const importantFiles = getImportantFiles(allFiles);

            context += "📋 Önemli Dosyalar:\n";
            importantFiles.slice(0, 5).forEach((file: any) => {
                const fileName = file.path.split(/[\\/]/).pop() || file.path;
                context += `• ${fileName}\n`;
            });
            context += "\n";

            const folders = new Set<string>();
            allFiles.forEach((file: any) => {
                const pathParts = file.path.split(/[\\/]/);
                if (pathParts.length > 1) folders.add(pathParts[0]);
            });

            context += "📂 Ana Klasörler:\n";
            Array.from(folders).slice(0, 8).forEach(folder => {
                const fileCount = allFiles.filter((f: any) => f.path.startsWith(folder)).length;
                context += `• ${folder}/ (${fileCount} dosya)\n`;
            });

            context += `\n📊 Toplam ${totalIndexedFiles} dosya\n\n`;
            context += "=== GÖREV ===\n\n";
            context += "Projeyi KISA ve ÖZ açıkla (3-5 cümle):\n";
            context += "- Ne yapar?\n";
            context += "- Hangi teknolojiler?\n";
            context += "- Ana özellikler?\n";

        } else {
            // DETAYLI - Tüm bilgileri ver
            const importantFiles = getImportantFiles(allFiles);

            context += "📋 Önemli Dosyalar (İçerikli):\n\n";
            importantFiles.forEach((file: any) => {
                const fileName = file.path.split(/[\\/]/).pop() || file.path;
                context += `✅ ${fileName}\n`;

                if (file.content && file.content.length > 0) {
                    context += "```" + getExt(file.path) + "\n";
                    context += file.content.substring(0, 2000); // 2000 karakter
                    if (file.content.length > 2000) {
                        context += "\n... (devamı var)";
                    }
                    context += "\n```\n\n";
                }
            });

            const structureFiles = getProjectStructureFiles(allFiles);
            context += "📁 Ana Yapı Dosyaları:\n";
            structureFiles.slice(0, 20).forEach((file: any) => {
                const fileName = file.path.split(/[\\/]/).pop() || file.path;
                const pathParts = file.path.split(/[\\/]/);
                const folder = pathParts.length > 1 ? pathParts[pathParts.length - 2] : '';
                context += `• ${folder}/${fileName}\n`;
            });
            context += "\n";

            const folders = new Map<string, number>();
            allFiles.forEach((file: any) => {
                const pathParts = file.path.split(/[\\/]/);
                if (pathParts.length > 1) {
                    const folder = pathParts[0];
                    folders.set(folder, (folders.get(folder) || 0) + 1);
                }
            });

            context += "📂 Klasör Yapısı:\n";
            Array.from(folders.entries()).forEach(([folder, count]) => {
                context += `• ${folder}/ (${count} dosya)\n`;
            });

            context += `\n📊 Toplam ${totalIndexedFiles} dosya\n\n`;
            context += "=== GÖREV ===\n\n";
            context += "Projeyi DETAYLI açıkla:\n";
            context += "1. Proje amacı ve ne yaptığı\n";
            context += "2. Kullanılan teknolojiler ve framework'ler\n";
            context += "3. Klasör yapısı ve organizasyon\n";
            context += "4. Ana modüller ve görevleri\n";
            context += "5. Önemli dosyaların açıklaması\n";
            context += "6. Mimari yapı ve tasarım desenleri\n";
            context += "7. Bağımlılıklar ve entegrasyonlar\n";
        }

        return context;
    }

    const { getFileExtension } = await import('./utils');

    // Add relevant files with content
    if (relevantFiles.length > 0) {
        context += "=== İLGİLİ DOSYALAR ===\n\n";

        relevantFiles.slice(0, 3).forEach(file => { // Maksimum 3 dosya
            const fileName = file.path.split(/[\\/]/).pop() || file.path;
            const fullPath = file.path;
            context += `📄 ${fileName} (${fullPath})\n`;
            context += `Similarity: ${(file.score * 100).toFixed(1)}%\n`;

            if (isCodeRequest) {
                context += "```" + getFileExtension(file.path) + "\n";
                // 4000 → 1500 karakter (çok daha az!)
                context += file.content.substring(0, 1500);
                if (file.content.length > 1500) {
                    context += "\n... (devamı var)";
                }
                context += "\n```\n\n";
            }
        });
    }

    // Add current file if open
    if (currentFile && isCodeRequest) {
        const fileName = currentFile.path.split(/[\\/]/).pop() || currentFile.path;
        context += "=== AÇIK DOSYA ===\n\n";
        context += `📄 ${fileName} (${currentFile.path})\n`;
        context += "```" + getFileExtension(currentFile.path) + "\n";
        // 5000 → 2000 karakter (daha az!)
        context += currentFile.content.substring(0, 2000);
        if (currentFile.content.length > 2000) {
            context += "\n... (devamı var)";
        }
        context += "\n```\n\n";
    }

    context += "=== MESAJ ===\n\n";
    context += userMessage;
    context += "\n\n";

    // 🔧 KISA talimat
    context += "💡 Kısa ve öz cevap ver. TÜRKÇE.\n";

    return context;
}
