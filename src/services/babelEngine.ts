import { callAI, getModelIdForRole } from "./ai";

export class BabelEngine {
    private static instance: BabelEngine;
    private isEnabled = false;

    private constructor() { }

    public static getInstance(): BabelEngine {
        if (!BabelEngine.instance) {
            BabelEngine.instance = new BabelEngine();
        }
        return BabelEngine.instance;
    }

    public setEnabled(enabled: boolean) {
        this.isEnabled = enabled;
    }

    public async translateIntentToCode(intentText: string, contextRules = ""): Promise<string | null> {
        if (!this.isEnabled) return null;

        const prompt = `Sen "Babel Engine" - Evrensel Geliştirici Dilisin. Geliştiricinin her türlü dil, bozuk ifade (Türkçe, İngilizce karışık) ve hatta tamamen terminolojiden uzak "Şeyin şeyini yapan o şeyi yaz" gibi dilden arınmış niyetlerini tam, çalışır koda çevirirsin.
Dili bir bariyer değil, sadece niyetin iletim aracı olarak görürsün.
Mevcut bağlam/kurallar: ${contextRules}

Kullanıcı İfadesi: "${intentText}"
Bunu en temiz, mantıklı bir koda çevir. Doğrudan kodu yansıt. Eğer niyet tamamen belirsizse, tahmin ederek en olası genel fonksiyonu veya bileşeni yaz.`;

        try {
            const response = await callAI(prompt, getModelIdForRole());
            let clean = response.replace(/^\`\`\`(?:\w+)?/, '').replace(/\`\`\`$/, '').trim();
            return clean;
        } catch (e) {
            console.error("Babel engine failed:", e);
            return null;
        }
    }
}

export const babelEngine = BabelEngine.getInstance();
