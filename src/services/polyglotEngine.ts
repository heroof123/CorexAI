import { callAI, getModelIdForRole } from "./ai";

export class PolyglotEngine {
    private static instance: PolyglotEngine;
    private isEnabled = true;

    private constructor() { }

    public static getInstance(): PolyglotEngine {
        if (!PolyglotEngine.instance) {
            PolyglotEngine.instance = new PolyglotEngine();
        }
        return PolyglotEngine.instance;
    }

    public async translateArchitecture(projectContext: string, currentLang: string, targetLang: string): Promise<string | null> {
        if (!this.isEnabled) return null;
        const prompt = `Sen "Polyglot Engine" (Çoklu Dil Çevirmen) yapay zekasısın. 
Bir projeyi sadece satır satır çevirmez, aynı zamanda klasör mimarisini, asenkron modellerini ve dependency yapılarını Hedef Dile göre "Yeniden İnşa" edersin.

Mevcut Dil/Mimari: ${currentLang}
Hedef Dil/Mimari: ${targetLang}

Aşağıdaki mevcut mimari bağlamına bakarak hedef dile çevrilmiş ana çerçeveyi (Main dosya, bağımlılık dosyası ve temel dizin yapısı) oluştur:

Mevcut Proje Özeti:
${projectContext.substring(0, 2000)}

Çıktıyı Markdown formatında, klasör ağacı ve temel kodlarla ver.`;

        try {
            const response = await callAI(prompt, getModelIdForRole());
            return response.trim();
        } catch (e) {
            console.error("Polyglot Engine failed", e);
            return null;
        }
    }
}

export const polyglotEngine = PolyglotEngine.getInstance();
