import { sendToAI } from './core';
import { parseAIResponse } from './parser';
import { getFileExtension } from './utils';

// Enhanced Smart Code Generator
export async function generateSmartCode(
    description: string,
    context: {
        projectType?: string;
        recentFiles?: string[];
        dependencies?: string[];
    }
): Promise<{ code: string; explanation: string; filePath: string }> {
    const enhancedPrompt = `Görev: Akıllı Kod Üretimi
  
  AÇIKLAMA: ${description}
  
  PROJE BAĞLAMI:
  - Proje Tipi: ${context.projectType || 'Bilinmiyor'}
  - Son Dosyalar: ${context.recentFiles?.join(', ') || 'Yok'}
  - Bağımlılıklar: ${context.dependencies?.join(', ') || 'Yok'}
  
  GÖREV:
  1. Verilen açıklamaya göre EKSIKSIZ, ÇALIŞAN kod üret
  2. Best practice'lere uygun ol
  3. TypeScript kullan (tip güvenliği için)
  4. Gerekli import'ları ekle
  5. Açıklayıcı yorumlar yaz
  6. Hata kontrolü ekle
  
  ÇIKTI FORMATI:
  DOSYA: [dosya_yolu]
  \`\`\`typescript
  [TAM KOD BURAYA]
  \`\`\`
  
  AÇIKLAMA:
  [Kodun ne yaptığını açıkla, 2-3 cümle]`;

    try {
        const response = await sendToAI(enhancedPrompt, false);
        const parsed = parseAIResponse(response);

        if (parsed.actions && parsed.actions.length > 0) { // ✅ FIXED: Added null check
            const action = parsed.actions[0];
            return {
                code: action.content,
                explanation: parsed.explanation, // ✅ FIXED: Changed from 'message'
                filePath: action.filePath
            };
        }

        return {
            code: '',
            explanation: response,
            filePath: 'generated.ts'
        };
    } catch (error) {
        console.error('Smart code generation error:', error);
        throw error;
    }
}

export async function generateTests(filePath: string, code: string): Promise<{
    testCode: string;
    coverage: string[];
}> {
    const testPrompt = `Sen bir test uzmanısın. Aşağıdaki kod için KAPSAMLI testler yaz:
  
  DOSYA: ${filePath}
  \`\`\`${getFileExtension(filePath)}
  ${code}
  \`\`\`
  
  GÖREV: Bu kod için testler oluştur:
  1. Unit testler (her fonksiyon için)
  2. Edge case'ler
  3. Error handling testleri
  4. Integration testleri (gerekirse)
  
  Test framework: Jest/Vitest kullan
  ÇIKTI: Tam çalışan test kodu
  
  KAPSAM LİSTESİ:
  - [Test edilen özellik 1]
  - [Test edilen özellik 2]
  - ...`;

    try {
        const response = await sendToAI(testPrompt, false);
        const parsed = parseAIResponse(response);

        const testCode = (parsed.actions && parsed.actions.length > 0) ? parsed.actions[0].content : ''; // ✅ FIXED

        // Extract coverage list
        const coveragePattern = /-\s*(.+)/g;
        const coverage: string[] = [];
        let match;
        while ((match = coveragePattern.exec(response)) !== null) {
            coverage.push(match[1].trim());
        }

        return { testCode, coverage };
    } catch (error) {
        console.error('Test generation error:', error);
        return {
            testCode: '',
            coverage: []
        };
    }
}

export async function fixBugs(filePath: string, code: string, bugDescription?: string): Promise<{
    fixedCode: string;
    explanation: string;
    changesDescription: string[];
}> {
    const bugPrompt = `Sen bir debugging uzmanısın. Aşağıdaki koddaki hatayı bul ve düzelt:
  
  DOSYA: ${filePath}
  \`\`\`${getFileExtension(filePath)}
  ${code}
  \`\`\`
  
  ${bugDescription ? `HATA AÇIKLAMASI: ${bugDescription}` : 'Kodda olası hataları tespit et ve düzelt.'}
  
  GÖREV:
  1. Hatayı bul ve analiz et
  2. Düzeltilmiş kodu yaz (TAM KOD)
  3. Neyi nasıl düzelttiğini açıkla
  
  ÇIKTI FORMATI:
  DÜZELTİLMİŞ KOD:
  \`\`\`${getFileExtension(filePath)}
  [Düzeltilmiş tam kod]
  \`\`\`
  
  AÇIKLAMA:
  [Hatanın ne olduğu ve nasıl düzeltildiği]
  
  DEĞİŞİKLİKLER:
  - [Değişiklik 1]
  - [Değişiklik 2]`;

    try {
        const response = await sendToAI(bugPrompt, false);
        const parsed = parseAIResponse(response);

        const fixedCode = (parsed.actions && parsed.actions.length > 0) ? parsed.actions[0].content : ''; // ✅ FIXED

        // Extract changes
        const changesPattern = /-\s*(.+)/g;
        const changesDescription: string[] = [];
        let match;
        while ((match = changesPattern.exec(response)) !== null) {
            changesDescription.push(match[1].trim());
        }

        return {
            fixedCode,
            explanation: parsed.explanation, // ✅ FIXED: Changed from 'message'
            changesDescription
        };
    } catch (error) {
        console.error('Bug fix error:', error);
        return {
            fixedCode: '',
            explanation: 'Hata düzeltmesi oluşturulamadı.',
            changesDescription: []
        };
    }
}

// Documentation Generator
export async function generateDocumentation(filePath: string, code: string): Promise<{
    documentation: string;
    apiReference?: string;
}> {
    const docPrompt = `Sen bir teknik yazım uzmanısın. Aşağıdaki kod için DETAYLI dokümantasyon oluştur:
  
  DOSYA: ${filePath}
  \`\`\`${getFileExtension(filePath)}
  ${code}
  \`\`\`
  
  GÖREV: Bu kod için kapsamlı dokümantasyon yaz:
  1. Genel bakış (ne yapar?)
  2. Kullanım örnekleri
  3. API referansı (fonksiyonlar, parametreler, dönüş değerleri)
  4. Önemli notlar
  5. İlgili dosyalar/modüller
  
  Markdown formatında yaz.`;

    try {
        const response = await sendToAI(docPrompt, false);

        return {
            documentation: response,
            apiReference: extractAPIReference(response)
        };
    } catch (error) {
        console.error('Documentation generation error:', error);
        return {
            documentation: 'Dokümantasyon oluşturulamadı.',
            apiReference: ''
        };
    }
}

function extractAPIReference(doc: string): string {
    const apiSection = doc.match(/## API.*?(?=##|$)/s);
    return apiSection ? apiSection[0] : '';
}

// Refactoring Suggestions
export async function suggestRefactoring(filePath: string, code: string): Promise<{
    suggestions: Array<{
        type: string;
        description: string;
        before: string;
        after: string;
        benefit: string;
    }>;
    summary: string;
}> {
    const refactorPrompt = `Sen bir refactoring uzmanısın. Aşağıdaki kodu analiz et ve refactoring önerileri sun:
  
  DOSYA: ${filePath}
  \`\`\`${getFileExtension(filePath)}
  ${code}
  \`\`\`
  
  GÖREV: Bu kodu şu açılardan değerlendir:
  1. Code smell'ler
  2. Design pattern kullanımı
  3. SOLID prensipleri
  4. DRY prensibi
  5. Naming conventions
  6. Function/method boyutları
  
  Her öneri için:
  - Tür (extraction, simplification, pattern application, etc.)
  - Açıklama
  - Önce/Sonra kod örnekleri
  - Faydası
  
  ÇIKTI FORMATI:
  ÖNERİ 1:
  TÜR: [refactoring türü]
  AÇIKLAMA: [ne yapılmalı]
  ÖNCE:
  \`\`\`typescript
  [mevcut kod]
  \`\`\`
  SONRA:
  \`\`\`typescript
  [refactor edilmiş kod]
  \`\`\`
  FAYDA: [bu refactoring'in faydası]
  
  ÖZET:
  [Genel refactoring değerlendirmesi]`;

    try {
        const response = await sendToAI(refactorPrompt, false);

        const suggestions: any[] = [];
        const suggestionPattern = /ÖNERİ \d+:\s*TÜR:\s*(.+?)\s*AÇIKLAMA:\s*(.+?)\s*ÖNCE:\s*```[\w]*\s*(.+?)\s*```\s*SONRA:\s*```[\w]*\s*(.+?)\s*```\s*FAYDA:\s*(.+?)(?=ÖNERİ \d+:|ÖZET:|$)/gs;

        let match;
        while ((match = suggestionPattern.exec(response)) !== null) {
            suggestions.push({
                type: match[1].trim(),
                description: match[2].trim(),
                before: match[3].trim(),
                after: match[4].trim(),
                benefit: match[5].trim()
            });
        }

        const summaryMatch = response.match(/ÖZET:\s*(.+?)$/s);
        const summary = summaryMatch ? summaryMatch[1].trim() : "Refactoring analizi tamamlandı.";

        return { suggestions, summary };
    } catch (error) {
        console.error('Refactoring suggestion error:', error);
        return {
            suggestions: [],
            summary: 'Refactoring önerileri oluşturulamadı.'
        };
    }
}
