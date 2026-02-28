import { callAI, getModelIdForRole } from "./ai";

export interface ArcheologyReport {
    originalLanguage: string;
    estimatedEra: string;
    businessLogic: string;
    modernConversionCode: string;
    authorsLetter: string;
    vulnerabilitiesDetected: string[];
    migrationSteps: string[];
    eraEnvironmentQuirks: string;
}

export class LegacyWhisperer {
    private static instance: LegacyWhisperer;
    private isEnabled = false;

    private constructor() { }

    public static getInstance(): LegacyWhisperer {
        if (!LegacyWhisperer.instance) {
            LegacyWhisperer.instance = new LegacyWhisperer();
        }
        return LegacyWhisperer.instance;
    }

    public setEnabled(enabled: boolean) {
        this.isEnabled = enabled;
    }

    /**
     * Translates 20-30 years old legacy code (COBOL, Fortran, Delphi, early PHP/Java) 
     * to modern architecture and uncovers the original developer's intent.
     */
    public async decryptLegacyCode(legacyCode: string, targetLanguage: string = "TypeScript"): Promise<ArcheologyReport | null> {
        if (!this.isEnabled) return null;

        const prompt = `Sen "Legacy Whisperer" - Eski Kod Şifre Çözücü motorusun (Kod Arkeoloğu).
Verilen 20-30 yıllık COBOL, Fortran, Delphi veya eski spagetti kodları (legacy) incelersin.
Amaç sadece çevirmek değil, o dönemin kısıtlamalarını ve yazılımcının niyetini (Business Logic) anlamaktır.

Girdi Kod:
${legacyCode.substring(0, 5000)}

Lütfen aşağıdaki JSON formatında, Markdown vb. olmadan sadece geçerli bir JSON objesi döndür:
{
  "originalLanguage": "Tahmini orijinal dil (örn: Delphi 7)",
  "estimatedEra": "Tahmini dönem (örn: Late 90s)",
  "authorsLetter": "Sevgili modern geliştirici; bu kodu 199X yılında şu donanım/hafıza kısıtlamaları yüzünden böyle yazdım... (Orijinal yazarın ağzından saygılı, açıklayıcı ve modern çözüme yönlendiren mektup)",
  "vulnerabilitiesDetected": ["Döngüsel bellek sızıntısı riski", "SQL Injection'a açık raw SQL kullanımı"],
  "migrationSteps": ["Veritabanı bağlantılarını ORM ile değiştir", "GOTO bloklarını async/await yapısına çevir"],
  "eraEnvironmentQuirks": "O dönemde garbage collector olmadığı için bellek yönetimi manuel yapılmış, değişken isimleri 8 karakter sınırına takılmış.",
  "modernConversionCode": "Tamamen modern mimariye (Örn: ${targetLanguage}) uygun biçimde, SOLID ve Clean Code prensipleriyle yeniden yazılmış hali"
}`;

        try {
            const response = await callAI(prompt, getModelIdForRole());
            let cleaned = response.trim();
            if (cleaned.startsWith('\`\`\`')) {
                cleaned = cleaned.replace(/^\`\`\`(?:\w+)?\n([\s\S]*?)\`\`\`$/, '$1').trim();
            }

            const report: ArcheologyReport = JSON.parse(cleaned);
            return report;
        } catch (error) {
            console.error("Legacy Whisperer failed to decode ancient runes:", error);
            return null;
        }
    }

    /**
     * Belirli bir klasördeki tüm eski dosyaları tarayıp modern eşdeğerlerini öneren toplu arkeoloji analizi
     */
    public async massArcheologyScan(filePathsAndContents: { path: string, content: string }[], _targetLanguage: string = "TypeScript") {
        // Burada batch processing eklenebilir. Gerçek dünyada tek tek çağrılır veya RAG kullanılarak bağlam oluşturulur.
        console.log(`Starting mass archeology scan on ${filePathsAndContents.length} files...`);
        // İleride vektör veritabanına atılarak RAG üzerinden toplu context verilebilir.
        return "Mass scan initiated.";
    }

    /**
     * Eski sistemdeki kodun, o dönemin kısıtlı donanımlarında nasıl bir tepkimeye gireceğini simüle eder.
     * Örneğin 64MB RAM'li bir sunucuyu "simüle" ederek kullanıcının geçmişi deneyimlemesini sağlar.
     */
    public async simulateEraEnvironment(code: string, era: string): Promise<string | null> {
        if (!this.isEnabled) return null;
        const prompt = `Şu an "${era}" döneminin bir simülatörüsün. Aşağıdaki kod o dönemin cihazlarında (örneğin 64MB RAM, yavaş disk, kısıtlı CPU) nasıl çalışırdı? Hangi limitlere takılırdı? Kışkırtıcı bir simülasyon çıktısı ver:
         Kod:
         ${code.substring(0, 1000)}`;

        try {
            return await callAI(prompt, getModelIdForRole());
        } catch (e) {
            return null;
        }
    }
}

export const legacyWhisperer = LegacyWhisperer.getInstance();
