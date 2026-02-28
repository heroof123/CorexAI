import { callAI, getModelIdForRole } from "./ai";
import { FileIndex } from "../types";

export class WhatIfSandboxService {
    public static async simulateScenario(scenario: string, fileIndex: FileIndex[]): Promise<string> {
        // Prepare context from fileIndex
        const fileSummaries = fileIndex
            .slice(0, 10) // Limit to top 10 files to avoid massive context
            .map(f => `File: ${f.path}\n\`\`\`\n${f.content.substring(0, 500)}...\n\`\`\``)
            .join("\n\n");

        const prompt = `You are the 'What-If Sandbox' Engine.
The user is asking a "What-if" scenario about their project.
Scenario: "${scenario}"

Project Files summary:
${fileSummaries}

As a Quantum-Level Architecture Simulator, analyze this scenario in a parallel universe simulation.
Provide:
1. 🧪 Expected Outcome (Performance impact, security impact, architectural shift).
2. 💥 Breaking Changes: Which files will likely break or need modifications? Be specific.
3. 🗺️ Step-by-Step Migration Plan if they decide to proceed.

Format nicely in Markdown and respond in Turkish.`;

        try {
            const response = await callAI(prompt, getModelIdForRole());
            return `🧪 **What-If Sandbox (Paralel Evren Simülasyonu)**\n\n${response}`;
        } catch (error) {
            return `❌ What-If Sandbox hatası: ${error}`;
        }
    }
}
