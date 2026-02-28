import { sendToAI } from './core';
import { getFileExtension } from './utils';

// Security Scanner
export async function scanSecurity(filePath: string, content: string): Promise<{
    vulnerabilities: Array<{
        line: number;
        type: string;
        severity: 'critical' | 'high' | 'medium' | 'low';
        description: string;
        solution: string;
    }>;
    score: number;
    summary: string;
}> {
    const securityPrompt = `Sen bir güvenlik uzmanısın. Aşağıdaki kodu güvenlik açıkları için analiz et:
  
  DOSYA: ${filePath}
  \`\`\`${getFileExtension(filePath)}
  ${content}
  \`\`\`
  
  GÖREV: Bu kodu şu güvenlik açıkları için kontrol et:
  1. SQL Injection
  2. XSS (Cross-Site Scripting)
  3. CSRF (Cross-Site Request Forgery)
  4. Authentication/Authorization sorunları
  5. Input validation eksiklikleri
  6. Sensitive data exposure
  7. Insecure dependencies
  
  ÇIKTI FORMATI:
  GÜVENLIK SKORU: [0-100 arası puan]
  
  AÇIKLAR:
  - Satır X: [Açık türü] - SEVERITY: [critical/high/medium/low] - [Açıklama] - ÇÖZÜM: [Çözüm önerisi]
  
  ÖZET:
  [Genel güvenlik değerlendirmesi]`;

    try {
        const response = await sendToAI(securityPrompt, false);

        const scoreMatch = response.match(/GÜVENLIK SKORU:\s*(\d+)/i);
        const score = scoreMatch ? parseInt(scoreMatch[1]) : 80;

        const vulnerabilities: any[] = [];
        const vulnMatches = response.matchAll(/Satır\s+(\d+):\s*([^-]+)\s*-\s*SEVERITY:\s*([^-]+)\s*-\s*([^-]+)\s*-\s*ÇÖZÜM:\s*(.+)/gi);

        for (const match of vulnMatches) {
            vulnerabilities.push({
                line: parseInt(match[1]),
                type: match[2].trim(),
                severity: match[3].trim().toLowerCase() as any,
                description: match[4].trim(),
                solution: match[5].trim()
            });
        }

        const summaryMatch = response.split(/ÖZET:/i)[1];
        const summary = summaryMatch ? summaryMatch.trim() : "Güvenlik taraması tamamlandı.";

        return { vulnerabilities, score, summary };
    } catch (error) {
        console.error('Security scan error:', error);
        return {
            vulnerabilities: [],
            score: 50,
            summary: 'Güvenlik taraması tamamlanamadı.'
        };
    }
}

// Package Manager AI
export async function analyzePackages(packageJsonContent: string): Promise<{
    outdated: Array<{
        name: string;
        current: string;
        latest: string;
        type: 'major' | 'minor' | 'patch';
    }>;
    security: Array<{
        name: string;
        severity: 'critical' | 'high' | 'medium' | 'low';
        description: string;
    }>;
    suggestions: string[];
    summary: string;
}> {
    const packagePrompt = `Sen bir paket yönetimi uzmanısın. Aşağıdaki package.json dosyasını analiz et:
  
  \`\`\`json
  ${packageJsonContent}
  \`\`\`
  
  GÖREV: Bu paketleri analiz et:
  1. Güncel olmayan paketleri tespit et
  2. Güvenlik açığı olan paketleri bul
  3. Gereksiz paketleri belirle
  4. Alternatif paket önerileri sun
  
  ÇIKTI FORMATI:
  === ESKİ PAKETLER ===
  - [paket-adı]: [mevcut-versiyon] → [yeni-versiyon] ([major/minor/patch])
  
  === GÜVENLİK ===
  - [paket-adı]: [critical/high/medium/low] - [açıklama]
  
  === ÖNERİLER ===
  - [Genel öneriler]
  
  === ÖZET ===
  [Genel değerlendirme]`;

    try {
        const response = await sendToAI(packagePrompt, false);

        // Parse outdated packages
        const outdated: any[] = [];
        const outdatedSection = response.split(/=== ESKİ PAKETLER ===/i)[1]?.split(/=== GÜVENLİK ===/i)[0];
        if (outdatedSection) {
            const outdatedMatches = outdatedSection.matchAll(/^-\s*([^:]+):\s*([^\s]+)\s*→\s*([^\s]+)\s*\(([^)]+)\)/gm);
            for (const match of outdatedMatches) {
                outdated.push({
                    name: match[1].trim(),
                    current: match[2].trim(),
                    latest: match[3].trim(),
                    type: match[4].trim() as any
                });
            }
        }

        // Parse security issues
        const security: any[] = [];
        const securitySection = response.split(/=== GÜVENLİK ===/i)[1]?.split(/=== ÖNERİLER ===/i)[0];
        if (securitySection) {
            const securityMatches = securitySection.matchAll(/^-\s*([^:]+):\s*([^\s]+)\s*-\s*(.+)/gm);
            for (const match of securityMatches) {
                security.push({
                    name: match[1].trim(),
                    severity: match[2].trim().toLowerCase() as any,
                    description: match[3].trim()
                });
            }
        }

        // Parse suggestions
        const suggestions: string[] = [];
        const suggestionSection = response.split(/=== ÖNERİLER ===/i)[1]?.split(/=== ÖZET ===/i)[0];
        if (suggestionSection) {
            const suggestionMatches = suggestionSection.match(/^-\s*(.+)$/gm);
            if (suggestionMatches) {
                suggestions.push(...suggestionMatches.map(s => s.replace(/^-\s*/, '').trim()));
            }
        }

        const summaryMatch = response.split(/=== ÖZET ===/i)[1];
        const summary = summaryMatch ? summaryMatch.trim() : "Paket analizi tamamlandı.";

        return { outdated, security, suggestions, summary };
    } catch (error) {
        console.error('Package analysis error:', error);
        return {
            outdated: [],
            security: [],
            suggestions: ['Paket analizi sırasında hata oluştu.'],
            summary: 'Analiz tamamlanamadı.'
        };
    }
}

// Environment Manager AI
export async function analyzeEnvironment(envContent: string): Promise<{
    missing: string[];
    insecure: Array<{
        key: string;
        issue: string;
        suggestion: string;
    }>;
    suggestions: string[];
    template: string;
}> {
    const envPrompt = `Sen bir environment yönetimi uzmanısın. Aşağıdaki .env dosyasını analiz et:
  
  \`\`\`
  ${envContent}
  \`\`\`
  
  GÖREV: Bu environment dosyasını analiz et:
  1. Eksik olabilecek yaygın değişkenleri tespit et
  2. Güvenlik sorunlarını bul
  3. İyileştirme önerileri sun
  4. .env.example şablonu oluştur
  
  ÇIKTI FORMATI:
  === EKSİK DEĞİŞKENLER ===
  - [değişken-adı]
  
  === GÜVENLİK SORUNLARI ===
  - [değişken-adı]: [sorun] - ÖNERİ: [çözüm]
  
  === ÖNERİLER ===
  - [Genel öneriler]
  
  === ŞABLON ===
  [.env.example içeriği]`;

    try {
        const response = await sendToAI(envPrompt, false);

        // Parse missing variables
        const missing: string[] = [];
        const missingSection = response.split(/=== EKSİK DEĞİŞKENLER ===/i)[1]?.split(/=== GÜVENLİK SORUNLARI ===/i)[0];
        if (missingSection) {
            const missingMatches = missingSection.match(/^-\s*(.+)$/gm);
            if (missingMatches) {
                missing.push(...missingMatches.map(s => s.replace(/^-\s*/, '').trim()));
            }
        }

        // Parse security issues
        const insecure: any[] = [];
        const securitySection = response.split(/=== GÜVENLİK SORUNLARI ===/i)[1]?.split(/=== ÖNERİLER ===/i)[0];
        if (securitySection) {
            const securityMatches = securitySection.matchAll(/^-\s*([^:]+):\s*([^-]+)\s*-\s*ÖNERİ:\s*(.+)/gm);
            for (const match of securityMatches) {
                insecure.push({
                    key: match[1].trim(),
                    issue: match[2].trim(),
                    suggestion: match[3].trim()
                });
            }
        }

        // Parse suggestions
        const suggestions: string[] = [];
        const suggestionSection = response.split(/=== ÖNERİLER ===/i)[1]?.split(/=== ŞABLON ===/i)[0];
        if (suggestionSection) {
            const suggestionMatches = suggestionSection.match(/^-\s*(.+)$/gm);
            if (suggestionMatches) {
                suggestions.push(...suggestionMatches.map(s => s.replace(/^-\s*/, '').trim()));
            }
        }

        const templateMatch = response.split(/=== ŞABLON ===/i)[1];
        const template = templateMatch ? templateMatch.trim() : '';

        return { missing, insecure, suggestions, template };
    } catch (error) {
        console.error('Environment analysis error:', error);
        return {
            missing: [],
            insecure: [],
            suggestions: ['Environment analizi sırasında hata oluştu.'],
            template: ''
        };
    }
}
