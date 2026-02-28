import { sendToAI } from './core';
import { getFileExtension } from './utils';

// ============================================================
// PANEL ADAPTER FUNCTIONS — EnhancedAIPanel için doğru format
// ============================================================

/**
 * EnhancedAIPanel → Documentation sekmesi adapter.
 * AI'dan readme, apiDocs, comments formatında döner.
 */
export async function generateDocumentationForPanel(
    filePath: string,
    code: string
): Promise<{ readme: string; apiDocs: string; comments: string }> {
    const ext = getFileExtension(filePath);
    const fileName = filePath.split(/[/\\]/).pop() || filePath;

    const prompt = `Sen bir teknik yazar ve kıdemli yazılım mühendisisin.
  Aşağıdaki kodu üç bölümde belgele. TÜRKÇE yaz.
  
  DOSYA: ${fileName}
  \`\`\`${ext}
  ${code.substring(0, 6000)}
  \`\`\`
  
  === README BÖLÜMÜ ===
  Bu dosya/modül için README yaz (ne yapar, nasıl kullanılır, örnek).
  
  === API REFERANS BÖLÜMÜ ===
  Her export edilen fonksiyon/class/interface için:
  - İmza, parametreler, dönüş değeri, kısa açıklama.
  
  === KOD YORUMU BÖLÜMÜ ===
  Önemli satırlar için JSDoc/yorum önerileri. Format:
  // Satır X: [yorum önerisi]`;

    try {
        const response = await sendToAI(prompt, false);
        const readmeMatch = response.split(/=== README BÖLÜMÜ ===/i)[1]?.split(/=== API REFERANS BÖLÜMÜ ===/i)[0];
        const apiMatch = response.split(/=== API REFERANS BÖLÜMÜ ===/i)[1]?.split(/=== KOD YORUMU BÖLÜMÜ ===/i)[0];
        const commentsMatch = response.split(/=== KOD YORUMU BÖLÜMÜ ===/i)[1];
        return {
            readme: readmeMatch?.trim() || response.substring(0, 1000),
            apiDocs: apiMatch?.trim() || 'API referansı üretilemedi.',
            comments: commentsMatch?.trim() || 'Yorumlar üretilemedi.'
        };
    } catch (error) {
        console.error('Panel documentation error:', error);
        return { readme: 'Dokümantasyon oluşturulamadı: ' + String(error), apiDocs: '', comments: '' };
    }
}

/**
 * EnhancedAIPanel → Test Generator sekmesi adapter.
 * AI'dan unitTests, integrationTests, testPlan formatında döner.
 */
export async function generateTestsForPanel(
    filePath: string,
    code: string
): Promise<{ unitTests: string; integrationTests: string; testPlan: string }> {
    const ext = getFileExtension(filePath);
    const fileName = filePath.split(/[/\\]/).pop() || filePath;

    const prompt = `Sen bir test mühendisisin. Aşağıdaki kod için kapsamlı testler yaz.
  Framework: Jest/Vitest. TÜRKÇE açıklama, kod İngilizce.
  
  DOSYA: ${fileName}
  \`\`\`${ext}
  ${code.substring(0, 5000)}
  \`\`\`
  
  === UNIT TEST KODU ===
  Her fonksiyon için ayrı test. Tam çalışan kod:
  
  \`\`\`typescript
  // unit testler buraya
  \`\`\`
  
  === INTEGRATION TEST KODU ===
  Modüller arası etkileşim testleri:
  
  \`\`\`typescript
  // integration testler buraya
  \`\`\`
  
  === TEST PLANI ===
  - Kapsanan senaryolar
  - Edge case'ler
  - Mock'lanması gereken bağımlılıklar`;

    try {
        const response = await sendToAI(prompt, false);

        const extractCode = (section: string | undefined): string => {
            if (!section) return '';
            const m = section.match(/```(?:typescript|javascript|ts|js)?\n([\s\S]+?)```/);
            return m ? m[1].trim() : section.replace(/```[\w]*/g, '').trim().substring(0, 1200);
        };

        const unitSection = response.split(/=== UNIT TEST KODU ===/i)[1]?.split(/=== INTEGRATION TEST KODU ===/i)[0];
        const integSection = response.split(/=== INTEGRATION TEST KODU ===/i)[1]?.split(/=== TEST PLANI ===/i)[0];
        const planSection = response.split(/=== TEST PLANI ===/i)[1];

        return {
            unitTests: extractCode(unitSection) || 'Unit test üretilemedi.',
            integrationTests: extractCode(integSection) || 'Integration test üretilemedi.',
            testPlan: planSection?.trim() || '- AI tarafından test planı oluşturuldu.'
        };
    } catch (error) {
        console.error('Panel test generation error:', error);
        return { unitTests: 'Test oluşturulamadı: ' + String(error), integrationTests: '', testPlan: '' };
    }
}

/**
 * EnhancedAIPanel → Refactoring sekmesi adapter.
 * AI'dan impact/type/description/before/after formatında döner.
 */
export async function suggestRefactoringForPanel(
    filePath: string,
    code: string
): Promise<{
    suggestions: Array<{ impact: 'high' | 'medium' | 'low'; type: string; description: string; before: string; after: string }>;
    summary: string;
}> {
    const ext = getFileExtension(filePath);
    const fileName = filePath.split(/[/\\]/).pop() || filePath;

    const prompt = `Sen bir refactoring uzmanısın. Kodu incele ve somut öneriler sun. TÜRKÇE.
  
  DOSYA: ${fileName}
  \`\`\`${ext}
  ${code.substring(0, 5000)}
  \`\`\`
  
  Her öneri için:
  
  === ÖNERİ ===
  ETKİ: high|medium|low
  TÜR: [Extract Function / Remove Duplication / Apply Pattern / vb.]
  AÇIKLAMA: [ne yapılmalı ve neden]
  ÖNCE:
  \`\`\`${ext}
  [mevcut problematik kod parçası]
  \`\`\`
  SONRA:
  \`\`\`${ext}
  [düzeltilmiş kod]
  \`\`\`
  
  === ÖZET ===
  [Genel değerlendirme]`;

    try {
        const response = await sendToAI(prompt, false);
        const suggestions: Array<{ impact: 'high' | 'medium' | 'low'; type: string; description: string; before: string; after: string }> = [];

        const blocks = response.split(/=== ÖNERİ ===/i).slice(1);
        for (const block of blocks) {
            const impactMatch = block.match(/ETKİ:\s*(high|medium|low)/i);
            const typeMatch = block.match(/TÜR:\s*(.+)/i);
            const descMatch = block.match(/AÇIKLAMA:\s*(.+)/i);
            const codeBlocks: string[] = [];
            const cbRegex = /```(?:\w+)?\n([\s\S]+?)```/g;
            let cbMatch;
            while ((cbMatch = cbRegex.exec(block)) !== null) codeBlocks.push(cbMatch[1].trim());

            if (typeMatch) {
                suggestions.push({
                    impact: (impactMatch?.[1]?.toLowerCase() as 'high' | 'medium' | 'low') || 'medium',
                    type: typeMatch[1].trim(),
                    description: descMatch?.[1]?.trim() || 'Refactoring önerisi',
                    before: codeBlocks[0] || '',
                    after: codeBlocks[1] || ''
                });
            }
        }

        if (suggestions.length === 0) {
            suggestions.push({ impact: 'medium', type: 'Genel İyileştirme', description: response.substring(0, 500), before: '', after: '' });
        }

        const summaryMatch = response.split(/=== ÖZET ===/i)[1];
        return { suggestions, summary: summaryMatch?.trim() || 'Refactoring analizi tamamlandı.' };
    } catch (error) {
        console.error('Panel refactoring error:', error);
        return { suggestions: [], summary: 'Refactoring analizi tamamlanamadı: ' + String(error) };
    }
}
