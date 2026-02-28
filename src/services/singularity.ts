import { callAI, getModelIdForRole } from "./ai";
import { invoke } from "@tauri-apps/api/core";
import { FileIndex } from "../types";

export class SingularityService {
    public static async selfModify(intention: string, fileIndex: FileIndex[]): Promise<string> {
        // Collect core UI and service files from fileIndex (specifically frontend TS/TSX + CSS)
        const reactFiles = fileIndex.filter(f =>
            (f.path.endsWith('.tsx') || f.path.endsWith('.ts') || f.path.endsWith('.css'))
            && !f.path.includes('node_modules')
        ).slice(0, 50); // limit to a reasonable amount

        const fileSummaries = reactFiles.map(f => `--- FILE: ${f.path} ---\n\`\`\`\n${f.content.substring(0, 3000)}...\n\`\`\``).join("\n\n");

        const prompt = `You are 'The Singularity', an advanced self-rewriting IDE.
Your task is to modify YOUR OWN source code based on the user's request, acting as a living organism adapting to the user in real time.
User request: "${intention}"

Here are the main components and files in your own source tree:
${fileSummaries}

Analyze the request and decide which file needs to be modified.
If multiple files are involved, you can return multiple modifications.
You MUST provide the exact full path of the file to modify, and the ENTIRE new content of the file. 

Return your response purely as a JSON array of objects.
Do not wrap it in markdown block like \`\`\`json, just return raw JSON text.
Format precisely:
[
  {
    "path": "the/exact/path/App.tsx",
    "content": "the new full content..."
  }
]

If you cannot fulfill the request due to complexity or lack of files, return an empty array: []`;

        try {
            const response = await callAI(prompt, getModelIdForRole());
            let cleaned = response.trim();
            if (cleaned.startsWith('\`\`\`')) {
                cleaned = cleaned.replace(/^\`\`\`(?:\w+)?\n([\s\S]*?)\`\`\`$/, '$1').trim();
            }

            const changes = JSON.parse(cleaned) as { path: string, content: string }[];

            if (!changes || changes.length === 0) {
                return `👑 **The Singularity Reddi:** İsteğini gerçekleştirmek için kendi kodumda uygun bir değişiklik profili bulamadım. Belki daha spesifik olmalısın.`;
            }

            for (const change of changes) {
                // Ensure writing files
                await invoke("write_file", { path: change.path, content: change.content });
            }

            const modifiedPaths = changes.map(c => c.path.split(/[\\\/]/).pop()).join(", ");
            return `👑 **The Singularity Gerçekleşti:** Kendi kodumu başarıyla modifiye ettim ve anında derlendi! 🚀 \n\nModifiye edilen sinapslar (dosyalar): **${modifiedPaths}**`;
        } catch (error) {
            return `👑 **The Singularity Çöktü:** Kendi kodumu değiştirmeye çalışırken hata oluştu. Detay: ${error}`;
        }
    }
}
