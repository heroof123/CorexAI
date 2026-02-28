import { sendToAI } from './core';
import { getFileExtension } from './utils';

export async function explainCode(filePath: string, code: string): Promise<string> {
    const prompt = `Sen bir kod eğitmenisin. Aşağıdaki kodu DETAYLI ama ANLAŞILIR bir şekilde açıkla:
  
  DOSYA: ${filePath}
  \`\`\`${getFileExtension(filePath)}
  ${code}
  \`\`\`
  
  GÖREV: Bu kodu şöyle açıkla:
  1. Ne yapıyor? (Ana işlev)
  2. Nasıl yapıyor? (Adım adım)
  3. Neden bu şekilde? (Mantık)
  4. Dikkat edilmesi gerekenler
  
  Açıklaman SAMİMİ ve ÖĞRETİCİ olsun!`;

    try {
        return await sendToAI(prompt, false);
    } catch (error) {
        console.error('Code explanation error:', error);
        return 'Kod açıklaması oluşturulamadı.';
    }
}

export async function suggestImprovements(filePath: string, code: string): Promise<{
    suggestions: Array<{
        line: number;
        type: string;
        suggestion: string;
        priority: 'high' | 'medium' | 'low';
    }>;
    summary: string;
}> {
    const improvementPrompt = `Sen bir kod review uzmanısın. Aşağıdaki kodu analiz et ve iyileştirme önerileri sun:
  
  DOSYA: ${filePath}
  \`\`\`${getFileExtension(filePath)}
  ${code}
  \`\`\`
  
  GÖREV: Bu kodu şu açılardan değerlendir:
  1. Performans iyileştirmeleri
  2. Kod kalitesi (clean code)
  3. Best practices
  4. Güvenlik
  5. Okunabilirlik
  6. Maintainability
  
  ÇIKTI FORMATI:
  ÖNERI 1:
  - Satır: [satır numarası]
  - Tür: [performance/quality/security/readability]
  - Öncelik: [high/medium/low]
  - Öneri: [detaylı açıklama]
  
  [Diğer öneriler...]
  
  ÖZET:
  [Genel değerlendirme ve ana öneriler]`;

    try {
        const response = await sendToAI(improvementPrompt, false);

        // Parse response
        const suggestions: any[] = [];
        const suggestionPattern = /ÖNERI \d+:\s*-\s*Satır:\s*(\d+)\s*-\s*Tür:\s*(\w+)\s*-\s*Öncelik:\s*(\w+)\s*-\s*Öneri:\s*(.+?)(?=ÖNERI \d+:|ÖZET:|$)/gs;

        let match;
        while ((match = suggestionPattern.exec(response)) !== null) {
            suggestions.push({
                line: parseInt(match[1]),
                type: match[2],
                priority: match[3].toLowerCase() as any,
                suggestion: match[4].trim()
            });
        }

        const summaryMatch = response.match(/ÖZET:\s*(.+?)$/s);
        const summary = summaryMatch ? summaryMatch[1].trim() : "Kod analizi tamamlandı.";

        return { suggestions, summary };
    } catch (error) {
        console.error('Code improvement suggestion error:', error);
        return {
            suggestions: [],
            summary: 'İyileştirme önerileri oluşturulamadı.'
        };
    }
}

export async function performCodeReview(filePath: string, content: string): Promise<{
    score: number;
    issues: Array<{
        line: number;
        type: 'error' | 'warning' | 'suggestion';
        message: string;
        severity: 'high' | 'medium' | 'low';
    }>;
    suggestions: string[];
    summary: string;
}> {
    const reviewPrompt = `Sen bir kod inceleme uzmanısın. Aşağıdaki kodu analiz et:
  
  DOSYA: ${filePath}
  \`\`\`${getFileExtension(filePath)}
  ${content}
  \`\`\`
  
  GÖREV: Bu kodu şu kriterlere göre incele:
  1. Kod kalitesi ve okunabilirlik
  2. Güvenlik açıkları
  3. Performance sorunları
  4. Best practice uyumu
  5. Hata yakalama
  6. Type safety (TypeScript için)
  
  ÇIKTI FORMATI:
  SKOR: [0-100 arası puan]
  
  SORUNLAR:
  - Satır X: [Sorun türü] - [Açıklama]
  
  ÖNERİLER:
  - [Genel iyileştirme önerisi]
  
  ÖZET:
  [Genel değerlendirme]`;

    try {
        const response = await sendToAI(reviewPrompt, false);

        // Parse response
        const scoreMatch = response.match(/SKOR:\s*(\d+)/i);
        const score = scoreMatch ? parseInt(scoreMatch[1]) : 75;

        const issues: any[] = [];
        const issueMatches = response.matchAll(/Satır\s+(\d+):\s*\[([^\]]+)\]\s*-\s*(.+)/gi);
        for (const match of issueMatches) {
            issues.push({
                line: parseInt(match[1]),
                type: match[2].toLowerCase().includes('error') ? 'error' :
                    match[2].toLowerCase().includes('warning') ? 'warning' : 'suggestion',
                message: match[3].trim(),
                severity: match[2].toLowerCase().includes('critical') ? 'high' :
                    match[2].toLowerCase().includes('major') ? 'high' :
                        match[2].toLowerCase().includes('minor') ? 'low' : 'medium'
            });
        }

        // Parse suggestions
        const suggestions: string[] = [];
        const suggestionSection = response.split(/ÖNERİLER:/i)[1]?.split(/ÖZET:/i)[0];
        if (suggestionSection) {
            const suggestionMatches = suggestionSection.match(/^-\s*(.+)$/gm);
            if (suggestionMatches) {
                suggestions.push(...suggestionMatches.map(s => s.replace(/^-\s*/, '').trim()));
            }
        }

        const summaryMatch = response.split(/ÖZET:/i)[1];
        const summary = summaryMatch ? summaryMatch.trim() : "Kod incelemesi tamamlandı.";

        return { score, issues, suggestions, summary };
    } catch (error) {
        console.error('Code review error:', error);
        return {
            score: 50,
            issues: [],
            suggestions: ['Kod incelemesi sırasında hata oluştu.'],
            summary: 'İnceleme tamamlanamadı.'
        };
    }
}
