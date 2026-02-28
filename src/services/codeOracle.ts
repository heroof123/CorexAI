import { callAI, getModelIdForRole } from "./ai";

export class CodeOracle {
    private static instance: CodeOracle;
    private isEnabled = false;
    private typingTimer: any = null;
    private lastAnalyzedContent: string = "";

    private constructor() { }

    public static getInstance(): CodeOracle {
        if (!CodeOracle.instance) {
            CodeOracle.instance = new CodeOracle();
        }
        return CodeOracle.instance;
    }

    public setEnabled(enabled: boolean) {
        this.isEnabled = enabled;
    }

    public async predictBugs(filePath: string, content: string): Promise<string | null> {
        if (!this.isEnabled) return null;
        if (content === this.lastAnalyzedContent) return null;
        if (content.length < 50) return null;

        this.lastAnalyzedContent = content;

        try {
            const prompt = `Sen "Hata Kehaneti Motoru" (Code Oracle) yapay zekasısın. Henüz bitmemiş, yeni yazılan kodu analiz edip GELECEKTEKİ hatayı (Null pointer, race condition, memory leak vb.) yazılımcı daha fonksiyonu bitirmeden tahmin edersin.
Kodu incele ve kritik bir hata potansiyeli bulursan kısa ve net bir uyarı yap. Bulamazsan sadece "NO_BUG" yaz.

Dosya: ${filePath}
Kod (muhtemelen yarım):
${content}

Yanıt (Eğer hata varsa): "Bu yönde devam edersen 11. satır civarında bir undefined reference hatası olacak. Çünkü..."
Yanıt (Hata yoksa): Sadece NO_BUG`;

            const response = await callAI(prompt, getModelIdForRole());
            const result = response.trim();

            if (result === "NO_BUG" || result.includes("NO_BUG")) {
                return null;
            }

            return result;
        } catch (e) {
            console.error("Code Oracle prediction failed:", e);
            return null;
        }
    }

    public watchFiles(content: string, filePath: string, onBugPredicted: (msg: string) => void) {
        if (!this.isEnabled) return;

        if (this.typingTimer) {
            clearTimeout(this.typingTimer);
        }

        this.typingTimer = setTimeout(async () => {
            const prediction = await this.predictBugs(filePath, content);
            if (prediction) {
                onBugPredicted(prediction);
            }
        }, 4000); // Wait 4 seconds after typing stops
    }
}

export const codeOracle = CodeOracle.getInstance();
