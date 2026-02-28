import { invoke } from "@tauri-apps/api/core";
import { callAI } from "./ai/aiProvider";

export interface LinterIssue {
    file: string;
    line: number;
    severity: 'error' | 'warning' | 'info';
    message: string;
    context: string;
    suggestion: string;
}

export class SemanticLinter {
    private static instance: SemanticLinter;

    private constructor() { }

    public static getInstance(): SemanticLinter {
        if (!SemanticLinter.instance) {
            SemanticLinter.instance = new SemanticLinter();
        }
        return SemanticLinter.instance;
    }

    public async scanProject(): Promise<LinterIssue[]> {
        const projectMap = await invoke<string>("get_project_map", {});
        const issues: LinterIssue[] = [];

        // Scan top level files for architectural issues
        const prompt = `Analyze this project structure for semantic issues (e.g., circular dependencies, missing error boundaries, unclosed database connections patterns).
PROJECT STRUCTURE:
${projectMap}

Return a JSON array of issues. FORMAT: [{"file": string, "line": number, "severity": "error"|"warning", "message": string, "suggestion": string}]`;

        const result = await callAI(prompt, 'chat');
        try {
            const parsed = JSON.parse(result.replace(/```json\n?|```/g, '').trim());
            if (Array.isArray(parsed)) {
                issues.push(...parsed);
            }
        } catch (e) {
            console.error("Failed to parse semantic linter result:", e);
        }

        return issues;
    }
}

export const semanticLinter = SemanticLinter.getInstance();
