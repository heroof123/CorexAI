import { callAI, extractJsonFromText } from "./ai/aiProvider";
import { invoke } from "@tauri-apps/api/core";
import { FileIndex } from "../types";

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

    public async translateProject(targetLang: string, fileIndex: FileIndex[], onProgress: (progress: number, label: string) => void): Promise<void> {
        if (!this.isEnabled) return;

        onProgress(0, `Analiz ediliyor...`);
        const targetDir = `polyglot_output/${targetLang.toLowerCase()}`;

        // Sadece kod dosyalarını filtrele. (Maliyeti düşük tutmak için)
        const codeFiles = fileIndex.filter(f =>
            !f.path.includes("node_modules") &&
            !f.path.includes("target/") &&
            (f.path.endsWith(".ts") || f.path.endsWith(".tsx") || f.path.endsWith(".js") || f.path.endsWith(".jsx"))
        );

        if (codeFiles.length === 0) {
            onProgress(100, `Hata: Çevrilecek geçerli dosya bulunamadı.`);
            return;
        }

        // 1. Proje Mimarisini Çıkar (Architecture)
        onProgress(10, `Hedef dil mimarisi tasarlanıyor (${targetLang})...`);
        const projectContext = codeFiles.map(f => f.path).join("\n");
        const archPrompt = `Sen Polyglot Architect'sin. Bir projeyi ${targetLang} diline çevireceğiz.
Aşağıdaki mevcut React/TS projesinin dosya yapısına bakarak en idiomatik ${targetLang} mimarisini oluştur.
Return ONLY JSON:
{
  "newStructure": ["src/main.${targetLang.toLowerCase() === 'rust' ? 'rs' : 'js'}", "src/components/comp1.${targetLang.toLowerCase() === 'rust' ? 'rs' : 'js'}"],
  "dependencies": "Paket bağımlılık dosyası içeriği (örn. Cargo.toml veya requirements.txt)"
}
Mevcut Dosyalar:
${projectContext.substring(0, 3000)}`;

        const archRes = await callAI(archPrompt, "planner");
        const archPlan = extractJsonFromText<any>(archRes) || {
            newStructure: [`src/main.${targetLang.substring(0, 2).toLowerCase()}`],
            dependencies: "Auto-generated dependencies"
        };

        // 2. Her dosyayı hedef dile çevir ve kaydet
        onProgress(20, `Dosyalar koda dökülüyor...`);
        let completed = 0;

        // Mimarideki 'dependencies' dosyasını yaz
        try {
            const depFileName = targetLang.toLowerCase() === 'rust' ? 'Cargo.toml' :
                targetLang.toLowerCase() === 'go' ? 'go.mod' :
                    targetLang.toLowerCase() === 'python' ? 'requirements.txt' : 'package.json';
            await invoke("create_file", { path: `${targetDir}/${depFileName}`, content: archPlan.dependencies });
        } catch (e) {
            console.error(e);
        }

        for (const file of codeFiles) {
            // İlerlemeyi güncelle
            const currentP = 20 + Math.floor((completed / codeFiles.length) * 70);
            onProgress(currentP, `Çevriliyor: ${file.path}`);

            const codePrompt = `Sen Polyglot Coder'sın.
Aşağıdaki TypeScript/JavaScript dosyasını tamamen deyimsel (idiomatic) bir ${targetLang} koduna çevir.
Dosya Yolu: ${file.path}
Proje genel mimarisi için bu dosya tekil olarak çevrilmelidir.
Dönüş yalnızca dönüştürülmüş kaynak kod olmalı, markdown backtick'leri ( \`\`\` ) veya açıklamalar kullanma. Saf kod ver:

${file.content.substring(0, 5000)}`;

            let translated = await callAI(codePrompt, "coder");
            if (translated.startsWith("\`\`\`")) {
                translated = translated.replace(/^\`\`\`(?:\w+)?\n([\s\S]*?)\`\`\`$/, '$1').trim();
            }

            // Basit yeni yol oluştur (sadece uzantıyı değiştiriyoruz veya archPlan'e bağlayabiliriz, uzantıyı zorla)
            let ext = ".txt";
            if (targetLang.toLowerCase() === 'rust') ext = ".rs";
            if (targetLang.toLowerCase() === 'go') ext = ".go";
            if (targetLang.toLowerCase() === 'python') ext = ".py";
            if (targetLang.toLowerCase() === 'java') ext = ".java";
            if (targetLang.toLowerCase() === 'typescript') ext = ".ts";

            const newPath = file.path.replace(/\.[^/.]+$/, "") + ext;

            try {
                await invoke("create_file", { path: `${targetDir}/${newPath}`, content: translated });
            } catch (e) {
                console.error(`Yazılamadı: ${newPath}`, e);
            }
            completed++;
        }

        onProgress(100, `Tamamlandı!`);
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
            const response = await callAI(prompt, "planner");
            return response.trim();
        } catch (e) {
            console.error("Polyglot Engine failed", e);
            return null;
        }
    }
}

export const polyglotEngine = PolyglotEngine.getInstance();
