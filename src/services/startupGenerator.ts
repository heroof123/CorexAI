import { callAI } from "./ai/aiProvider";
import { invoke } from "@tauri-apps/api/core";

export class StartupGenerator {
    private static instance: StartupGenerator;

    private constructor() { }

    public static getInstance(): StartupGenerator {
        if (!StartupGenerator.instance) {
            StartupGenerator.instance = new StartupGenerator();
        }
        return StartupGenerator.instance;
    }

    public async generateStartup(idea: string): Promise<void> {
        console.log(`🚀 Otonom Girişimci: "${idea}" fikri üzerine şirket inşa ediliyor...`);

        // 1. Planlama
        const planPrompt = `Build an autonomous startup from this idea: "${idea}". 
List the required files and directory structure for a Next.js + Tailwind + Lucide project.
Return ONLY JSON: {"name": string, "structure": string[]}`;

        const planRaw = await callAI(planPrompt, 'planner');
        const plan = JSON.parse(planRaw.replace(/```json\n?|```/g, '').trim());

        // 2. Dosya Oluşturma
        for (const file of plan.structure) {
            console.log(`🛠️ Creating ${file}...`);
            const codePrompt = `Write the code for ${file} for the startup "${plan.name}". 
IDEA: ${idea}
Return ONLY code.`;

            const code = await callAI(codePrompt, 'coder');
            // Assuming we have a way to create files in a new directory
            await invoke("create_startup_file", { path: `${plan.name}/${file}`, content: code });
        }

        console.log(`🏁 Girişim İnşası Tamamlandı! Proje: ${plan.name} dizinine kuruldu.`);
    }
}

export const startupGenerator = StartupGenerator.getInstance();
