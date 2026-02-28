import { callAI, getModelIdForRole } from "./ai";

export interface SynestheticAnalysis {
    lineRanges: {
        start: number;
        end: number;
        type: "async" | "pure" | "side_effect" | "dangerous_mutation";
    }[];
}

export class SynestheticCodeView {
    private static instance: SynestheticCodeView;
    private isEnabled = false;

    private constructor() { }

    public static getInstance(): SynestheticCodeView {
        if (!SynestheticCodeView.instance) {
            SynestheticCodeView.instance = new SynestheticCodeView();
        }
        return SynestheticCodeView.instance;
    }

    public setEnabled(enabled: boolean) {
        this.isEnabled = enabled;
    }

    public async analyzeVibes(code: string): Promise<SynestheticAnalysis | null> {
        if (!this.isEnabled) return null;
        // Semantik kodu işitme/görme/dokunma hissiyatına çevirmek için AI ile parse et
        const prompt = `Sen "Synesthetic Code View" yapay zekasısın. Kodun hissiyatını çözersin.
Kodu analiz et ve hangi satırların async(bekleme), pure(saf), side_effect(yan etki) veya dangerous_mutation(tehlikeli durum) olduğunu belirle.

Kod (Satır numaralı say):
${code.split('\\n').map((line, idx) => `${idx + 1}: ${line}`).join('\\n')}

SADECE geçerli bir JSON listesi döndür, "başlangıçSatırı, bitişSatırı, tip" objelerinden oluşsun. Örnek format:
[
  { "start": 1, "end": 5, "type": "pure" },
  { "start": 6, "end": 10, "type": "async" },
  { "start": 11, "end": 12, "type": "dangerous_mutation" },
  { "start": 13, "end": 20, "type": "side_effect" }
]`;

        try {
            const response = await callAI(prompt, getModelIdForRole());
            let clean = response.replace(/^\`\`\`(?:\w+)?/, '').replace(/\`\`\`$/, '').trim();
            const ranges = JSON.parse(clean);
            return { lineRanges: ranges };
        } catch (e) {
            console.error("Synesthetic Code View parsing failed:", e);
            return null;
        }
    }

    /**
     * Eğer cihaz destekliyorsa Haptic Feedback (Titreşim) uygular
     */
    public vibrate(pattern: number | number[]) {
        if (!this.isEnabled) return;
        if (typeof navigator !== "undefined" && navigator.vibrate) {
            navigator.vibrate(pattern);
        }
    }

    public playHapticForType(type: "async" | "pure" | "side_effect" | "dangerous_mutation" | "success") {
        switch (type) {
            case "async":
                this.vibrate([20, 50, 20]); // Hafif titreme
                break;
            case "dangerous_mutation":
                this.vibrate([100, 30, 100, 30, 200]); // Agresif titreşim
                break;
            case "success":
                this.vibrate([30, 100, 40]); // Tatmin edici click
                break;
        }
    }
}

export const synestheticCodeView = SynestheticCodeView.getInstance();
