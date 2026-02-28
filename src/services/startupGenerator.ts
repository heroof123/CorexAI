import { callAI, extractJsonFromText } from "./ai/aiProvider";
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

    public async generateStartup(idea: string, basePath: string, onProgress?: (step: string) => void): Promise<void> {
        const log = (msg: string) => {
            console.log(msg);
            if (onProgress) onProgress(msg);
        };

        log(`🚀 Fikir Analiz Ediliyor: "${idea}"`);

        // 1. Planlama
        const planPrompt = `You are a legendary Startup CTO. We need to build a prototype for this idea: "${idea}". 
List the strictly necessary files and directory structure for a modern web application (e.g. Next.js + Tailwind or standard React).
Keep it minimal but functional (5-8 core files: package.json, index.html, main component, etc).
Return ONLY valid JSON matching exactly this structure with no markdown or explanations:
{
  "name": "startup-name-no-spaces",
  "structure": ["package.json", "src/App.tsx", "src/main.tsx", "index.html"]
}`;

        log(`🧠 Mimari Plan Çıkartılıyor...`);
        const planRaw = await callAI(planPrompt, 'planner');
        let plan = extractJsonFromText<{ name: string, structure: string[] }>(planRaw);

        if (!plan || !plan.structure || !plan.name) {
            plan = {
                name: "ai-startup",
                structure: ["package.json", "src/App.tsx", "src/index.css", "index.html"]
            };
        }

        const projectRoot = basePath ? `${basePath}/${plan.name}` : plan.name;
        log(`📁 Proje Dizini Oluşturuluyor: ${projectRoot}`);

        // 2. Dosya Oluşturma
        for (let i = 0; i < plan.structure.length; i++) {
            const file = plan.structure[i];
            log(`🛠️ [${i + 1}/${plan.structure.length}] Kodlanıyor: ${file}`);

            const codePrompt = `Write the full, complete, production-ready code for the file: ${file} 
Startup Name: "${plan.name}"
Core Idea: "${idea}"
Context: This is one file in a larger project. Ensure it integrates well.
If it is a package.json, include react, react-dom and basic scripts.
Return ONLY the raw code/text for this file. DO NOT WRAP in markdown like \`\`\`typescript. Just plain executable code.`;

            let code = await callAI(codePrompt, 'coder');

            if (code.startsWith("\`\`\`")) {
                code = code.replace(/^\`\`\`(?:\w+)?\n([\s\S]*?)\`\`\`$/, '$1').trim();
            }

            try {
                await invoke("create_file", { path: `${projectRoot}/${file}`, content: code });
            } catch (e) {
                log(`❌ Hata (${file}): ${e}`);
            }
        }

        log(`🔥 Girişim Başarıyla Kuruldu! Klasörü Kontrol Edin.`);
        log(`✅ BİTTİ`);
    }
}

export const startupGenerator = StartupGenerator.getInstance();
