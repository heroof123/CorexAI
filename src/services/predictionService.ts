

export interface PredictionResult {
    text: string;
    range?: {
        startLineNumber: number;
        startColumn: number;
        endLineNumber: number;
        endColumn: number;
    };
}

export class PredictionService {
    private static instance: PredictionService;
    private lastRequestTime: number = 0;
    private debouncedDelay: number = 800; // 800ms debounce

    private constructor() { }

    public static getInstance(): PredictionService {
        if (!PredictionService.instance) {
            PredictionService.instance = new PredictionService();
        }
        return PredictionService.instance;
    }

    /**
     * Get a code completion suggestion (Ghost Text)
     */
    public async getCompletion(
        content: string,
        line: number,
        column: number,
        filePath: string
    ): Promise<string | null> {
        const now = Date.now();
        if (now - this.lastRequestTime < this.debouncedDelay) {
            return null; // Throttle
        }
        this.lastRequestTime = now;

        try {
            const lines = content.split('\n');
            const currentLine = lines[line - 1] || '';
            const prefixContent = lines.slice(0, line - 1).join('\n') + (line > 1 ? '\n' : '') + currentLine.substring(0, column - 1);
            const suffixContent = currentLine.substring(column - 1) + (line <= lines.length ? '\n' : '') + lines.slice(line).join('\n');

            // Limit context size to avoid massive tokens
            const limitedPrefix = prefixContent.slice(-2000);
            const limitedSuffix = suffixContent.slice(0, 500);

            // --- PREDICTIVE INTENT ENGINE LOGIC ---
            // Rather than just blind completion, we analyze the current line's intent
            const trimmedLine = currentLine.trim();
            let intentInstruction = "Continue the code logically.";

            // 1. Component/Function scaffolding intent
            if (trimmedLine.match(/^export (default )?(function|const) [A-Z]/)) {
                intentInstruction = "The user is starting a new React component or major function. Provide the standard scaffolding (props, return statement, maybe early hooks if obvious).";
            }
            // 2. Auth/Middleware intent
            else if (filePath.toLowerCase().includes('auth') || filePath.toLowerCase().includes('middleware') || trimmedLine.includes('req, res, next')) {
                intentInstruction = "The user is writing authentication or middleware code. Prioritize token verification, session checks, or error handling patterns standard to this context.";
            }
            // 3. State management intent
            else if (trimmedLine.includes('const [') && trimmedLine.includes('useState')) {
                intentInstruction = "The user is declaring React state. Predict the rest of the useState hook based on the variable name (e.g., const [isOpen, setIsOpen] = useState(false)).";
            }
            // 4. API fetching intent
            else if (trimmedLine.includes('fetch(') || trimmedLine.includes('axios.') || (trimmedLine.includes('const') && trimmedLine.includes('await'))) {
                intentInstruction = "The user is making an API call. Provide the standard try/catch block with response parsing and error handling.";
            }
            // 5. Array iteration intent
            else if (trimmedLine.match(/\.map\s*\(/) || trimmedLine.match(/\.forEach\s*\(/) || trimmedLine.match(/\.filter\s*\(/)) {
                intentInstruction = "The user is iterating over an array. Provide the callback function skeleton, taking care to include reasonable parameter names (e.g., item, index).";
            }

            const prompt = `You are the core of a 'Predictive Intent Engine' for an advanced IDE.
Your goal is to anticipate exactly what the developer is trying to write next, based on the cursor position and the context of the file.

FILE: ${filePath}
INTENT DETECTED: ${intentInstruction}

CODE BEFORE CURSOR:
${limitedPrefix}
<CURSOR>
CODE AFTER CURSOR:
${limitedSuffix}

Return ONLY the exact code to be inserted at the <CURSOR> position. Do NOT output markdown formatting blocks (\`\`\`). Do NOT output any explanations. Just raw code.`;

            const { callAI } = await import("./ai");
            const { getModelIdForRole } = await import("./ai");
            const modelId = getModelIdForRole();
            const result = await callAI(prompt, modelId);

            // Clean result (remove hallucinations or wrapping)
            let cleaned = result.trim();
            if (cleaned.startsWith('\`\`\`')) {
                cleaned = cleaned.replace(/^\`\`\`(?:\w+)?\n([\s\S]*?)\`\`\`$/, '$1').trim();
            }

            // Don't return empty strings as valid completions
            if (!cleaned) return null;

            return cleaned;
        } catch (error) {
            console.error("Ghost text prediction failed:", error);
            return null;
        }
    }
}

export const predictionService = PredictionService.getInstance();
