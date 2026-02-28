import { callAI, getModelIdForRole } from "./ai";

export class QuantumCodeSuperposition {
    private static instance: QuantumCodeSuperposition;
    private isEnabled = false;

    private constructor() { }

    public static getInstance(): QuantumCodeSuperposition {
        if (!QuantumCodeSuperposition.instance) {
            QuantumCodeSuperposition.instance = new QuantumCodeSuperposition();
        }
        return QuantumCodeSuperposition.instance;
    }

    public setEnabled(enabled: boolean) {
        this.isEnabled = enabled;
    }

    public async enterSuperposition(task: string, filePath: string, existingCode: string): Promise<string[] | null> {
        if (!this.isEnabled) return null;

        const prompt = `Sen "Quantum Code Superposition" - Kuantum Kodlama yapay zekasısın. 
Görev: "${task}"
Dosya: ${filePath}
Mevcut Kod bağlamı: ${existingCode.substring(0, 1000)}

Kuantum süperpozisyonda aynı fonksiyonun 3 farklı varyasyonunu (3 paralel evren) yaz.
Geliştirici dalga fonksiyonunu çökerterek birini seçecek. Varyasyonları şu formatta ver:

=== VARIATION 1 (Hızlı Çözüm) ===
<kod>
=== VARIATION 2 (Mimari Açıdan Temiz, Klasik OOP) ===
<kod>
=== VARIATION 3 (Performans/Fonksiyonel Programlama) ===
<kod>
`;

        try {
            const resp = await callAI(prompt, getModelIdForRole());
            const blocks = resp.split("===").filter(Boolean);
            const variations: string[] = [];

            let currentVar = "";
            for (let i = 0; i < blocks.length; i++) {
                if (blocks[i].includes("VARIATION ")) {
                    if (currentVar) variations.push(currentVar.trim());
                    currentVar = blocks[i] + (blocks[i + 1] || "");
                    i++; // skip next block as it was added
                }
            }
            if (currentVar) { variations.push(currentVar.trim()); }

            return variations.length > 0 ? variations : [resp];
        } catch (e) {
            console.error("Quantum superposition failed:", e);
            return null;
        }
    }
}

export const quantumCodeSuperposition = QuantumCodeSuperposition.getInstance();
