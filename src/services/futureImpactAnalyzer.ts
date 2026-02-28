import { callAI, getModelIdForRole } from "./ai";

export interface ImpactReport {
    maintenanceCostHours: number;
    debtRisk: "Düşük" | "Orta" | "Yüksek" | "Kritik";
    suggestion: string;
    deprecationRisk?: string;
}

export class FutureImpactAnalyzer {
    private static instance: FutureImpactAnalyzer;
    private isEnabled = false;

    private constructor() { }

    public static getInstance(): FutureImpactAnalyzer {
        if (!FutureImpactAnalyzer.instance) {
            FutureImpactAnalyzer.instance = new FutureImpactAnalyzer();
        }
        return FutureImpactAnalyzer.instance;
    }

    public setEnabled(enabled: boolean) {
        this.isEnabled = enabled;
    }

    public async analyzeFile(filePath: string, content: string): Promise<ImpactReport | null> {
        if (!this.isEnabled) return null;

        try {
            const prompt = `Sen "Gelecek Etki Analizörü" (Future Impact Analyzer) yapay zekasısın.
Bu kodun 2 yıl sonra ne kadar teknik borç yaratacağını, bakım maliyetinin kaç saat olacağını tahmin etmelisin.
Kullanılan paketlerin güncelliğini, mimarinin sürdürülebilirliğini analiz et.

Dosya: ${filePath}
Kod:
${content.substring(0, 3000)}

Cevabını SADECE aşağıdaki JSON formatında ver, başka metin ekleme:
{
  "maintenanceCostHours": 40,
  "debtRisk": "Yüksek",
  "suggestion": "Bu hızlı çözüm 18 ay içinde ciddi bakım maliyeti doğuracak. Şablon metod deseni kullanın.",
  "deprecationRisk": "Şu paket 14 aydır güncellenmedi, alternatifini değerlendirin."
}`;

            const response = await callAI(prompt, getModelIdForRole());
            let cleaned = response.trim();
            if (cleaned.startsWith('\`\`\`')) {
                cleaned = cleaned.replace(/^\`\`\`(?:\w+)?\n([\s\S]*?)\`\`\`$/, '$1').trim();
            }

            const report: ImpactReport = JSON.parse(cleaned);
            return report;
        } catch (error) {
            console.error("Future Impact Analyzer failed:", error);
            return null;
        }
    }
}

export const futureImpactAnalyzer = FutureImpactAnalyzer.getInstance();
