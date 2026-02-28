import { callAI, getModelIdForRole } from "./ai";

export class CodeDnaSplicing {
    private static instance: CodeDnaSplicing;
    private isEnabled = false;
    private geneBank: { id: string; name: string; content: string }[] = [];

    private constructor() {
        this.loadGeneBank();
    }

    public static getInstance(): CodeDnaSplicing {
        if (!CodeDnaSplicing.instance) {
            CodeDnaSplicing.instance = new CodeDnaSplicing();
        }
        return CodeDnaSplicing.instance;
    }

    public setEnabled(enabled: boolean) {
        this.isEnabled = enabled;
    }

    private loadGeneBank() {
        try {
            const stored = localStorage.getItem("corex_gene_bank");
            if (stored) {
                this.geneBank = JSON.parse(stored);
            } else {
                // Some initial "genes"
                this.geneBank = [
                    {
                        id: "gene-auth",
                        name: "Best Practice Auth Middleware",
                        content: "export function authMiddleware(req, res, next) { /* auth logic here */ next(); }"
                    }
                ];
            }
        } catch (e) {
            console.error(e);
        }
    }

    private saveGeneBank() {
        localStorage.setItem("corex_gene_bank", JSON.stringify(this.geneBank));
    }

    public extractGene(_filePath: string, content: string, geneName: string) {
        if (!this.isEnabled) return "Dna Splicing devre dışı.";

        // Add new gene to bank
        const newGene = { id: `gene-${Date.now()}`, name: geneName, content };
        this.geneBank.push(newGene);
        this.saveGeneBank();
        return `"${geneName}" Gen Bankasına eklendi.`;
    }

    public async spliceProjectGenes(intent: string): Promise<string | null> {
        if (!this.isEnabled || this.geneBank.length === 0) return null;

        const genesList = this.geneBank.map(g => `- ${g.name}:\n${g.content.substring(0, 500)}...`).join("\n\n");

        const prompt = `Sen "Code DNA Splicing" (Proje Genetiği) motorusun. 
Projelerdeki en iyi genleri alarak melez, çalışır bir kod önerisi veya proje yapısı sunarsın.
Kullanıcı İsteği: "${intent}"

Kullanılabilir Genler:
${genesList}

Uygun genleri melezleyerek yepyeni ve çakışmasız, tamamen işlevsel bir kod sun.
Yanıtını sadece kodu veya açıklamayı vererek döndür.`;

        try {
            const response = await callAI(prompt, getModelIdForRole());
            return response;
        } catch (error) {
            console.error("Gene splicing failed:", error);
            return null;
        }
    }
}

export const codeDnaSplicing = CodeDnaSplicing.getInstance();
