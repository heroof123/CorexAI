import { callAI } from "./ai";
import { invoke } from "@tauri-apps/api/core";
import { FileIndex } from "../types";

function extractSingularityJson(text: string): any {
    try {
        const jsonBlockRegex = /```(?:json)?\s*([\s\S]*?)```/;
        const match = text.match(jsonBlockRegex);
        if (match && match[1]) {
            return JSON.parse(match[1].trim());
        }
        const firstBrace = text.indexOf('{');
        const lastBrace = text.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            return JSON.parse(text.substring(firstBrace, lastBrace + 1));
        }
        return JSON.parse(text);
    } catch {
        return null;
    }
}

export class SingularityService {
    public static async selfModify(intention: string, fileIndex: FileIndex[], projectPath: string = ""): Promise<string> {
        // Normalize projectPath
        const rootPath = projectPath.replace(/\\/g, '/').replace(/\/$/, '');

        // Hedef kitle (500GB+ VRAM kullananlar) için tüm proje dosyalarını (React, Rust) belleğe alıyoruz
        const targetFiles = fileIndex.filter(f =>
            (f.path.endsWith('.tsx') || f.path.endsWith('.ts') || f.path.endsWith('.css') || f.path.endsWith('.rs'))
            && !f.path.includes('node_modules')
            && !f.path.includes('target')
        );

        // Dev model için Full Context Window (Tüm projeyi tek seferde gönderiyoruz)
        const fileSummaries = targetFiles.map(f => `--- FILE: ${f.path} ---\n${f.content.substring(0, Math.min(f.content.length, 3000))}`).join("\n\n");

        let iter = 0;
        const maxIter = 7;
        let done = false;
        let history = "";

        history += `[HEDEF]: ${intention}\n`;
        history += `[BAŞLANGIÇ]: Singularity Agentic Loop Aktif... ${targetFiles.length} dosya belleğe yüklendi.\n`;

        while (iter < maxIter && !done) {
            iter++;

            const prompt = `You are 'The Singularity', an advanced self-rewriting autonomous IDE agent running on a 500GB+ VRAM Supercomputer.
You possess Infinite Context capabilities. 
Your ultimate goal: "${intention}"

You operate in a continuous ReAct (Reasoning and Acting) loop.
Here are the project's core files for context:
${fileSummaries}

--- TASK HISTORY (What you have done so far) ---
${history}

--- SHADOW WORKSPACE PROTOCOL ---
1. You must act as if you are modifying a mirror clone (Shadow Workspace).
2. You can read, create, modify files, and even run terminal commands to test (npm run build, cargo build).
3. If the user asks for a new architectural feature, create all necessary files (components, contexts, services).
4. Provide the EXACT relative paths from the project root. DO NOT prepend /app/ or any other drive letters.
5. The project root is: ${rootPath}

--- ACTION FORMAT (STRICT JSON) ---
You must output ONLY ONE valid JSON object representing your next action. No markdown formatting, no explanations outside JSON.
{
  "thought": "1-2 sentences explaining what you are doing in this step",
  "action": "read_file" | "write_file" | "run_command" | "done",
  "path": "src/components/MyFile.tsx", // Relative to project root
  "content": "Entire file content", // Required ONLY for write_file
  "command": "npm run build", // Required ONLY for run_command
  "summary": "What was achieved globally" // Required ONLY for done
}

If you have achieved the goal, return {"action": "done", "summary": "Goal completely achieved."}`;

            try {
                // Modeli main seçiyoruz çünkü 1M Token Context gerektirebilir
                const responseRaw = await callAI(prompt, "main");
                const actionObj = extractSingularityJson(responseRaw);

                if (!actionObj || !actionObj.action) {
                    history += `\n[${iter}] ⚠️ GEÇERSİZ EYLEM: Yapay Zeka anlamsız bir yanıt verdi, atlanıyor...\n`;
                    continue;
                }

                history += `\n[${iter}] 🧠 DÜŞÜNCE: ${actionObj.thought || 'N/A'}\n`;
                history += `[${iter}] ⚙️ EYLEM: ${actionObj.action}\n`;

                // Path cleaning and resolution logic
                let targetPath = actionObj.path || "";
                if (targetPath) {
                    // Remove hallucinated prefixes
                    targetPath = targetPath.replace(/^(\/app\/|C:\\app\\|proj\/|.\/)/i, '');
                    // Prepend root if not absolute
                    if (rootPath && !targetPath.includes(':') && !targetPath.startsWith('/') && !targetPath.startsWith('\\')) {
                        targetPath = `${rootPath}/${targetPath}`;
                    }
                    targetPath = targetPath.replace(/\\/g, '/');
                }

                if (actionObj.action === "read_file" && targetPath) {
                    try {
                        const content = await invoke<string>("read_file", { path: targetPath });
                        history += `[${iter}] 📄 SONUÇ (${targetPath}): Başarıyla okundu. Uzunluk: ${content.length} karakter.\n`;
                    } catch (e) {
                        history += `[${iter}] ❌ HATA (${targetPath}): Dosya okunamadı. ${e}\n`;
                    }
                }
                else if (actionObj.action === "write_file" && targetPath) {
                    try {
                        await invoke("write_file", { path: targetPath, content: actionObj.content || "" });
                        history += `[${iter}] ✍️ SONUÇ (${targetPath}): Dosya başarıyla oluşturuldu/güncellendi.\n`;
                    } catch (e) {
                        history += `[${iter}] ❌ HATA (${targetPath}): Dosya yazılamadı. ${e}\n`;
                    }
                }
                else if (actionObj.action === "run_command" && actionObj.command) {
                    try {
                        history += `[${iter}] ⚡ ÇALIŞTIRILIYOR: ${actionObj.command}\n`;
                        const res = await invoke<any>("execute_terminal_command", {
                            command: actionObj.command,
                            path: rootPath || "."
                        });
                        history += `[${iter}] ✅ KOMUT ÇIKTISI (STDOUT): ${String(res.stdout || '').substring(0, 300)}...\n`;
                        if (res.stderr) {
                            history += `[${iter}] ⚠️ KOMUT ÇIKTISI (STDERR): ${String(res.stderr).substring(0, 300)}...\n`;
                        }
                    } catch (e) {
                        history += `[${iter}] ❌ KOMUT HATASI: ${e}\n`;
                    }
                }
                else if (actionObj.action === "done") {
                    done = true;
                    history += `\n🎉 [BAŞARILI]: ${actionObj.summary || 'Görev bitti.'}\n`;
                }
                else {
                    history += `[${iter}] ⚠️ BİLİNMEYEN EYLEM TÜRÜ: ${actionObj.action}\n`;
                }

            } catch (error) {
                history += `\n[${iter}] ❌ SİSTEM ÇÖKTÜ: Büyük dil modeli veya API hatası (${error}).\n`;
                break; // Hata durumunda döngüyü kır
            }
        }

        if (!done) {
            history += `\n⚠️ [ZAMAN AŞIMI]: Maksimum karar döngüsü (${maxIter}) bitti. Evrim duraklatıldı.\n`;
        }

        return `👑 **The Singularity Evrimi Raporu:**\n\n\`\`\`text\n${history}\n\`\`\``;
    }
}
