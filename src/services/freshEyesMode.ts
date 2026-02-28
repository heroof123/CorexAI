import { callAI, getModelIdForRole } from "./ai";

export class FreshEyesMode {
    private static instance: FreshEyesMode;

    private constructor() { }

    public static getInstance(): FreshEyesMode {
        if (!FreshEyesMode.instance) {
            FreshEyesMode.instance = new FreshEyesMode();
        }
        return FreshEyesMode.instance;
    }

    /**
     * Kodu yabancılaştırarak veya Mermaid.js flow diyagramına çevirerek "geliştirici körlüğünü" kırar.
     */
    public async alienateCode(code: string): Promise<string | null> {
        const prompt = `Sen "Fresh Eyes Mode" (Geliştirici Körlüğü Kalkanı) yapay zekasısın.
Yazılımcı saatlerce aynı koda baktığı için hatayı (bug) göremiyor. 
Kodu ezber bozacak bir şekilde tamamen farklı formatta sun:
1) Eğer kod karmaşıksa onu bir hikayeye/metafora dönüştür.
2) Ya da sadece Mermaid.js Logic Akış Diyagramı oluştur.
3) Değişken isimlerini rastgele anlamsız kavramlar (Elma, Armut, Gemi) ile değiştir.
Sadece bu 3 taktikten birini uygulayarak çıktıyı ver, maksat beyni şaşırtmak.

Kod:
${code.substring(0, 1500)}`;

        try {
            const response = await callAI(prompt, getModelIdForRole());
            return response.trim();
        } catch (e) {
            console.error("Fresh eyes mode failed", e);
            return null;
        }
    }
}

export const freshEyesMode = FreshEyesMode.getInstance();
