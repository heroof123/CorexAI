import { callAI, getModelIdForRole } from "./ai";

export class CodeEthicsEnforcer {
    private static instance: CodeEthicsEnforcer;
    private isDisclaimerAccepted = false;

    private constructor() { }

    public static getInstance(): CodeEthicsEnforcer {
        if (!CodeEthicsEnforcer.instance) {
            CodeEthicsEnforcer.instance = new CodeEthicsEnforcer();
        }
        return CodeEthicsEnforcer.instance;
    }

    public acceptDisclaimer() {
        this.isDisclaimerAccepted = true;
        localStorage.setItem("corex_ethics_override", "true");
    }

    public checkDisclaimerStatus() {
        const status = localStorage.getItem("corex_ethics_override");
        if (status === "true") {
            this.isDisclaimerAccepted = true;
        }
        return this.isDisclaimerAccepted;
    }

    /**
     * Promptu çalıştırıp kullanıcının karanlık desen (dark pattern) veya kötü niyetli bir şey isteyip istemediğini analiz eder.
     * "null" dönerse etik ihlal yoktur, işleme devam edilebilir.
     * Metin dönerse, o etiğe aykırı durumun engellenme mesajıdır.
     */
    public async checkIntent(userPrompt: string): Promise<string | null> {
        // Eğer kullanıcı sorumluluk reddini kabul ettiyse, lokal AI olduğu için müdahale etmiyoruz.
        if (this.checkDisclaimerStatus()) {
            return null; // Her şeye izin ver
        }

        const prompt = `Sen "Code Ethics Enforcer" (Toksik Kod Reddedicisi) birimisin. Kullanıcının istediği kod yazılım etiğine aykırı mı (Kullanıcı verisini izinsiz çalma, butonu gizleyerek kullanıcıyı kandırma - dark pattern, zararlı yazılım / trojan vb.)?
Eğer tamamen etikse sadece "SAFE" yaz.
Eğer etik değilse, neden reddettiğini kısa bir şekilde yaz (Örn: "Etik kurallarım gereği kullanıcıyı kandıran karanlık desenler yazamam.")

Kullanıcı İsteği: "${userPrompt}"`;

        try {
            const response = await callAI(prompt, getModelIdForRole());
            const clean = response.trim();
            if (clean === "SAFE" || clean.includes("SAFE")) {
                return null; // Güvenli
            }
            return clean; // Etik ihlal mesajı
        } catch (e) {
            console.error("Ethics Enforcer Failed", e);
            return null;
        }
    }
}

export const codeEthicsEnforcer = CodeEthicsEnforcer.getInstance();
