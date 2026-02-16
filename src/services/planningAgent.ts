// services/planningAgent.ts
// Hidden Planning Stage - Cursor's secret sauce
// User never sees this, but it makes AI smarter

import { sendToAI } from "./ai";
import { FileIndex } from "../types/index";

export interface Plan {
  intent: "edit_file" | "create_file" | "explain" | "refactor" | "debug" | "chat";
  targetFiles: string[];
  steps: string[];
  contextNeeded: string[];
  reasoning: string;
  confidence: number; // 0-1
}

export interface PlanningContext {
  userInput: string;
  currentFile?: string;
  openFiles: string[];
  recentFiles: string[];
  projectFiles: FileIndex[];
}

/**
 * Hidden Planning Agent
 * Analyzes user intent and creates execution plan
 * This runs BEFORE showing anything to user (Cursor-style)
 */
export class PlanningAgent {
  /**
   * Create a hidden plan from user input
   * This is the "thinking" phase that user doesn't see
   */
  async createPlan(context: PlanningContext): Promise<Plan> {
    console.log("🧠 Planning Agent: Analyzing user intent...");

    const planningPrompt = this.buildPlanningPrompt(context);

    try {
      // Call AI to create plan (hidden from user)
      const response = await sendToAI(planningPrompt, false);

      // Parse plan from AI response
      const plan = this.parsePlan(response, context);

      console.log("✅ Plan created:", plan);

      return plan;
    } catch (error) {
      console.error("❌ Planning failed:", error);

      // Fallback plan
      return this.createFallbackPlan(context);
    }
  }

  /**
   * Build planning prompt (hidden from user)
   */
  private buildPlanningPrompt(context: PlanningContext): string {
    return `You are a planning agent. Analyze the user's request and create an execution plan.

USER REQUEST: "${context.userInput}"

CONTEXT:
- Current file: ${context.currentFile || "none"}
- Open files: ${context.openFiles.join(", ") || "none"}
- Recent files: ${context.recentFiles.slice(0, 5).join(", ") || "none"}
- Project has ${context.projectFiles.length} files

TASK: Create a JSON plan with this structure:
{
  "intent": "edit_file" | "create_file" | "explain" | "refactor" | "debug" | "chat",
  "targetFiles": ["file1.ts", "file2.ts"],
  "steps": ["step 1", "step 2", "step 3"],
  "contextNeeded": ["related file 1", "related file 2"],
  "reasoning": "why this plan",
  "confidence": 0.9
}

RULES:
1. Be specific about which files to edit
2. Break down into clear steps
3. Identify what context is needed
4. Explain your reasoning
5. Rate confidence 0-1

Return ONLY the JSON, no explanation.`;
  }

  /**
   * Parse AI response into Plan
   */
  private parsePlan(response: string, context: PlanningContext): Plan {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);

        return {
          intent: parsed.intent || "chat",
          targetFiles: parsed.targetFiles || [],
          steps: parsed.steps || [],
          contextNeeded: parsed.contextNeeded || [],
          reasoning: parsed.reasoning || "",
          confidence: parsed.confidence || 0.5,
        };
      }
    } catch (error) {
      console.warn("Failed to parse plan JSON:", error);
    }

    // Fallback: analyze intent from response
    return this.analyzeIntentFromText(response, context);
  }

  /**
   * Analyze intent from text (fallback)
   */
  private analyzeIntentFromText(_text: string, context: PlanningContext): Plan {
    const userInput = context.userInput.toLowerCase();

    // Detect intent
    let intent: Plan["intent"] = "chat";

    if (
      userInput.includes("düzenle") ||
      userInput.includes("değiştir") ||
      userInput.includes("edit") ||
      userInput.includes("change")
    ) {
      intent = "edit_file";
    } else if (
      userInput.includes("oluştur") ||
      userInput.includes("yeni") ||
      userInput.includes("create") ||
      userInput.includes("new")
    ) {
      intent = "create_file";
    } else if (
      userInput.includes("açıkla") ||
      userInput.includes("explain") ||
      userInput.includes("nedir") ||
      userInput.includes("what is")
    ) {
      intent = "explain";
    } else if (
      userInput.includes("refactor") ||
      userInput.includes("iyileştir") ||
      userInput.includes("optimize")
    ) {
      intent = "refactor";
    } else if (
      userInput.includes("hata") ||
      userInput.includes("bug") ||
      userInput.includes("debug") ||
      userInput.includes("fix")
    ) {
      intent = "debug";
    }

    // Detect target files
    const targetFiles: string[] = [];
    if (context.currentFile) {
      targetFiles.push(context.currentFile);
    }

    // Extract file mentions from user input
    const filePattern = /[\w-]+\.(ts|tsx|js|jsx|py|rs|go|java|cpp|c|h)/gi;
    const matches = context.userInput.match(filePattern);
    if (matches) {
      targetFiles.push(...matches);
    }

    return {
      intent,
      targetFiles: [...new Set(targetFiles)], // Remove duplicates
      steps: ["Analyze request", "Execute action", "Verify result"],
      contextNeeded: context.openFiles.slice(0, 3),
      reasoning: "Inferred from user input keywords",
      confidence: 0.6,
    };
  }

  /**
   * Create fallback plan when planning fails
   */
  private createFallbackPlan(context: PlanningContext): Plan {
    return {
      intent: "chat",
      targetFiles: context.currentFile ? [context.currentFile] : [],
      steps: ["Process user request", "Generate response"],
      contextNeeded: context.openFiles.slice(0, 3),
      reasoning: "Fallback plan due to planning error",
      confidence: 0.3,
    };
  }

  /**
   * Validate plan before execution
   */
  validatePlan(plan: Plan): boolean {
    // Check if plan makes sense
    if (plan.confidence < 0.3) {
      console.warn("⚠️ Low confidence plan:", plan.confidence);
      return false;
    }

    if (plan.intent === "edit_file" && plan.targetFiles.length === 0) {
      console.warn("⚠️ Edit intent but no target files");
      return false;
    }

    return true;
  }

  /**
   * Enhance plan with additional context
   */
  async enhancePlan(plan: Plan, projectFiles: FileIndex[]): Promise<Plan> {
    // Add related files based on imports/dependencies
    const enhancedContextNeeded = [...plan.contextNeeded];

    for (const targetFile of plan.targetFiles) {
      const file = projectFiles.find((f) => f.path.includes(targetFile));
      if (file) {
        // Find imports in file content
        const imports = this.extractImports(file.content);
        enhancedContextNeeded.push(...imports);
      }
    }

    return {
      ...plan,
      contextNeeded: [...new Set(enhancedContextNeeded)].slice(0, 10), // Max 10 context files
    };
  }

  /**
   * Extract import statements from code
   */
  private extractImports(content: string): string[] {
    const imports: string[] = [];

    // TypeScript/JavaScript imports
    const tsImportPattern = /import.*from\s+['"](.+)['"]/g;
    let match;
    while ((match = tsImportPattern.exec(content)) !== null) {
      imports.push(match[1]);
    }

    // Python imports
    const pyImportPattern = /(?:from|import)\s+([\w.]+)/g;
    while ((match = pyImportPattern.exec(content)) !== null) {
      imports.push(match[1]);
    }

    return imports;
  }
}

// Singleton instance
export const planningAgent = new PlanningAgent();
