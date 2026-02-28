import { callAI, getModelIdForRole } from "./ai";
import { invoke } from "@tauri-apps/api/core";

export class LivingDocumentationService {
    private static instance: LivingDocumentationService;

    private constructor() { }

    public static getInstance(): LivingDocumentationService {
        if (!LivingDocumentationService.instance) {
            LivingDocumentationService.instance = new LivingDocumentationService();
        }
        return LivingDocumentationService.instance;
    }

    /**
     * Kodda bir değişiklik olduğunda dökümantasyonu otomatik günceller
     */
    public async updateDocumentation(projectPath: string, filePath: string, content: string): Promise<void> {
        try {
            // Sadece kod dosyaları için çalışsın
            if (!filePath.match(/\.(ts|tsx|js|jsx|rs|py|go|java|c|cpp|cs)$/)) return;

            const fileName = filePath.split('/').pop() || filePath.split('\\').pop() || 'unknown';

            const prompt = `You are the "Living Documentation" engine.
The following file has just been updated.
Analyze the code and generate a comprehensive, modern Markdown documentation for it.
Include:
1. Object/Purpose of the file
2. Exported Functions/Classes and their usage
3. Potential side-effects or important notes

Return ONLY the raw markdown content. Do not wrap in \`\`\`markdown.

FILE: ${fileName}
CODE:
${content}
`;

            const modelId = getModelIdForRole();
            const mdContent = await callAI(prompt, modelId);

            // Proje dizininde docs klasörü oluştur ve oraya kaydet
            const separator = projectPath.includes('\\') ? '\\' : '/';
            const docsDir = `${projectPath}${separator}docs`;

            // Rust tarafında klasör oluşturma yeteneği eklenecek, şimdilik doğrudan docs/fileName.md yazmayı deneyeceğiz
            // invoke hooklarına path.join gibi davranmak için:
            const docPath = `${docsDir}${separator}${fileName}.md`;

            // Klasörü oluşturmayı dene (varsa hata yoksayılır)
            try {
                await invoke("create_dir", { path: docsDir });
            } catch (e) { /* ignore if exists */ }

            try {
                await invoke("write_file", { path: docPath, content: mdContent.trim() });
                console.log(`[Living Docs] Updated documentation for ${fileName}`);
            } catch (e) {
                await invoke("create_file", { path: docPath, content: mdContent.trim() });
                console.log(`[Living Docs] Created documentation for ${fileName}`);
            }

        } catch (error) {
            console.error("[Living Docs] Failed to update documentation:", error);
        }
    }
}

export const livingDocsService = LivingDocumentationService.getInstance();
