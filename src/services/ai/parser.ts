import { generateDefaultPath } from './utils'; import { type CodeAction, type AIResponse } from './types';

export function parseAIResponse(response: string): AIResponse {
    const actions: CodeAction[] = [];
    let cleanText = response;

    console.log("🔍 AI Response parse ediliyor:", response.substring(0, 200) + "...");

    // Match code blocks with optional file path: ```language:path or just ```language
    const codeBlockRegex = /```(\w+)(?::([^\n]+))?\n([\s\S]+?)```/g;
    let match;

    while ((match = codeBlockRegex.exec(response)) !== null) {
        const language = match[1] || 'text';
        const explicitPath = match[2]?.trim(); // File path from ```typescript:src/test.ts
        const code = match[3].trim();

        // Skip single-line code blocks
        const lineCount = code.split('\n').length;
        if (lineCount === 1) {
            console.log(`⏭️ Tek satırlık kod bloğu atlandı: ${code.substring(0, 50)}...`);
            continue;
        }

        // Use explicit path if provided, otherwise try to extract from context
        let filePath = explicitPath;

        if (!filePath) {
            // Attempt to extract file path from context before the code block
            const beforeBlock = response.substring(0, match.index);
            const pathMatch = beforeBlock.match(/(?:dosya:|file:|path:|create|oluştur|update|düzenle|edit)[\s:]*([\w\/\-_.]+\.\w+)/i);
            filePath = pathMatch ? pathMatch[1] : generateDefaultPath(language);
        }

        // Determine action type from context
        const actionContext = response.substring(Math.max(0, match.index - 200), match.index).toLowerCase();
        let actionType: 'create' | 'modify' | 'delete' = 'create';

        if (actionContext.includes('oluştur') || actionContext.includes('create') || actionContext.includes('yeni')) {
            actionType = 'create';
        } else if (actionContext.includes('düzenle') || actionContext.includes('update') || actionContext.includes('değiştir') || actionContext.includes('edit') || actionContext.includes('modify')) {
            actionType = 'modify';
        } else if (actionContext.includes('sil') || actionContext.includes('delete') || actionContext.includes('kaldır')) {
            actionType = 'delete';
        }

        // 🆕 Confidence Scoring (Heuristic for now)
        let confidence = 95; // Default high
        const uncertaintyKeywords = ['maybe', 'not sure', 'might', 'probably', 'belki', 'emin değilim', 'olabilir', 'deneyelim', 'valla'];
        uncertaintyKeywords.forEach(kw => {
            if (response.toLowerCase().includes(kw)) confidence -= 15;
        });
        if (code.length < 20) confidence -= 10; // Very short snippets are suspicious

        actions.push({
            id: `action-${Date.now()}-${actions.length}`,
            type: actionType,
            filePath,
            content: code,
            lineNumber: match.index,
            confidence: Math.max(10, confidence)
        });

        // Remove the code block from text to get clean explanation
        cleanText = cleanText.replace(match[0], `[Kod bloğu: ${filePath}]`);
    }

    console.log(`✅ ${actions.length} adet kod bloğu bulundu`);

    const overallConfidence = actions.length > 0
        ? actions.reduce((acc, curr) => acc + (curr.confidence || 100), 0) / actions.length
        : 100;

    return {
        explanation: cleanText.trim(),
        actions,
        hasCode: actions.length > 0,
        confidence: Math.round(overallConfidence)
    };
}
