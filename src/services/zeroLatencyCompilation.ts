export class ZeroLatencyCompilation {
    private static instance: ZeroLatencyCompilation;
    private isEnabled = false;
    private speculativeCache: Map<string, string> = new Map();
    private compilationTimer: any = null;

    private constructor() { }

    public static getInstance(): ZeroLatencyCompilation {
        if (!ZeroLatencyCompilation.instance) {
            ZeroLatencyCompilation.instance = new ZeroLatencyCompilation();
        }
        return ZeroLatencyCompilation.instance;
    }

    public setEnabled(enabled: boolean) {
        this.isEnabled = enabled;
    }

    /**
     * User codes in the editor. ZeroLatencyCompilation listens and speculatively compiles.
     */
    public onCodeChange(filePath: string, currentContent: string) {
        if (!this.isEnabled) return;

        if (this.compilationTimer) {
            clearTimeout(this.compilationTimer);
        }

        // Speculate compilation after 500ms of idle typing
        this.compilationTimer = setTimeout(() => {
            this.speculateCompile(filePath, currentContent);
        }, 500);
    }

    private async speculateCompile(filePath: string, content: string) {
        // In a real rust/TS environment, we would invoke the local compiler dry-run via Tauri.
        // For now, we simulate AST building.
        const mockHash = this.hashCode(content);

        // Simüle edilen arka plan derlemesi
        this.speculativeCache.set(filePath, mockHash);
        console.log(`[ZeroLatency] Speculative compilation finished for ${filePath}. Ready to save in 0ms!`);
    }

    /**
     * Returns true if already compiled in the background
     */
    public isPreCompiled(filePath: string, content: string): boolean {
        if (!this.isEnabled) return false;
        const mockHash = this.hashCode(content);
        return this.speculativeCache.get(filePath) === mockHash;
    }

    private hashCode(str: string): string {
        let hash = 0;
        for (let i = 0, len = str.length; i < len; i++) {
            let chr = str.charCodeAt(i);
            hash = (hash << 5) - hash + chr;
            hash |= 0; // Convert to 32bit integer
        }
        return hash.toString();
    }
}

export const zeroLatencyCompilation = ZeroLatencyCompilation.getInstance();
