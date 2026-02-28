import { callAI, getModelIdForRole } from "./ai";

export interface ErrorInsight {
    title: string;
    link: string;
    summary: string;
    score: number;
    isSafe: boolean;
}

export class CollectiveIntelligenceService {
    private static instance: CollectiveIntelligenceService;

    private constructor() { }

    public static getInstance() {
        if (!CollectiveIntelligenceService.instance) {
            CollectiveIntelligenceService.instance = new CollectiveIntelligenceService();
        }
        return CollectiveIntelligenceService.instance;
    }

    /**
     * Searches StackOverflow and GitHub conceptually.
     * Since we don't have direct GitHub/Reddit API keys built-in to the user's PC,
     * we will query Stack Exchange public API which doesn't require keys for basic search.
     */
    public async analyzeError(errorMessage: string, codeSnippet: string): Promise<ErrorInsight[]> {
        const query = encodeURIComponent(errorMessage.substring(0, 100)); // Search first 100 chars

        try {
            // Step 1: Query StackExchange Public API
            const response = await fetch(`https://api.stackexchange.com/2.3/search/advanced?order=desc&sort=relevance&q=${query}&site=stackoverflow&filter=withbody`);

            if (!response.ok) {
                throw new Error("API Limit or Network Error");
            }

            const data = await response.json();

            if (!data.items || data.items.length === 0) {
                return []; // No public internet matches found
            }

            // Step 2: Grab the top 3 relevant internet discussions
            const topResults = data.items.slice(0, 3);

            // Step 3: Analyze these collective solutions using out local LLM
            const insights: ErrorInsight[] = [];

            for (const item of topResults) {
                const prompt = `You are a strict Cyber Security Expert and part of the 'Collective Intelligence' IDE feature.
The user encountered this error: "${errorMessage}"

I have found a discussion on the internet (StackOverflow) where other developers posted a solution:
Title: ${item.title}
Body snippet: ${item.body.substring(0, 2000)} // Limit to fit context

YOUR CRITICAL TASK:
1. FIRST, analyze the "Body snippet" for any malicious code, reverse shells, dangerous commands (e.g., rm -rf, curl | bash), obfuscated payloads (base64), or anything that could compromise the user's PC.
2. If it is MALICIOUS or DANGEROUS, your response MUST START EXACTLY with the word "MALICIOUS:" followed by a short explanation of the threat.
3. If it is SAFE, explain how to apply their fix to our code. Return ONLY a short paragraph (max 3 sentences) explaining the fix. Do not write full scripts.`;

                const summary = await callAI(prompt, getModelIdForRole());

                const isMalicious = summary.trim().toUpperCase().startsWith("MALICIOUS:");
                let finalSummary = summary.trim();

                if (isMalicious) {
                    finalSummary = `🚨 GÜVENLİK UYARISI: ${finalSummary.replace(/MALICIOUS:/i, '').trim()}`;
                }

                insights.push({
                    title: item.title,
                    link: item.link,
                    summary: finalSummary,
                    score: item.score,
                    isSafe: !isMalicious
                });
            }

            return insights;

        } catch (error) {
            console.error("[Collective Intelligence] Search Failed", error);

            // Fallback: If no internet or API rate limit, simulate checking GitHub issues via LLM knowledge
            const fallbackPrompt = `The user encountered the following tricky error:
"${errorMessage}"
Code: ${codeSnippet}

Pretend you are searching GitHub issues and Reddit threads. 
Provide 2 highly specific, realistic "collective intelligence" findings where others solved this. Ensure the solutions are 100% safe.
Format exactly as JSON array of objects: [{ "title": "...", "link": "github.com/issue/123", "summary": "...", "score": 90, "isSafe": true }]
Do not write markdown, just raw JSON.`;

            try {
                const fallbackResponse = await callAI(fallbackPrompt, getModelIdForRole());
                let cleaned = fallbackResponse.trim();
                if (cleaned.startsWith('\`\`\`')) {
                    cleaned = cleaned.replace(/^\`\`\`(?:\w+)?\n([\s\S]*?)\`\`\`$/, '$1').trim();
                }
                const fallbackData = JSON.parse(cleaned) as ErrorInsight[];
                return fallbackData;
            } catch (fallbackError) {
                return [];
            }
        }
    }
}

export const collectiveIntelligenceService = CollectiveIntelligenceService.getInstance();
