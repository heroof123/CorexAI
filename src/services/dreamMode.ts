import { invoke } from "@tauri-apps/api/core";
import { callAI, getModelIdForRole } from "./ai";

export class DreamModeService {
    private static instance: DreamModeService;
    private timerId: any = null;
    private readonly IDLE_TIMEOUT_MS = 60000; // 1 minute of inactivity triggers sleep
    private readonly ANALYSIS_INTERVAL_MS = 30000; // Analyze a file every 30s while sleeping

    private isSleeping = false;
    private lastActivity = Date.now();
    private projectIndex: any[] = []; // Simple reference to the current project files

    private constructor() {
        this.resetIdleTimer();
        window.addEventListener("mousemove", this.handleActivity);
        window.addEventListener("keydown", this.handleActivity);
        window.addEventListener("click", this.handleActivity);
    }

    public static getInstance() {
        if (!DreamModeService.instance) {
            DreamModeService.instance = new DreamModeService();
        }
        return DreamModeService.instance;
    }

    private handleActivity = () => {
        this.lastActivity = Date.now();
        if (this.isSleeping) {
            this.wakeUp();
        }
    };

    public setProjectFiles(files: any[]) {
        this.projectIndex = files;
    }

    public getDreamJournal(): any[] {
        const stored = localStorage.getItem("corex_dream_journal");
        if (stored) return JSON.parse(stored);
        return [];
    }

    private resetIdleTimer() {
        if (this.timerId) clearInterval(this.timerId);

        this.timerId = setInterval(() => {
            const idleTime = Date.now() - this.lastActivity;
            if (idleTime > this.IDLE_TIMEOUT_MS && !this.isSleeping) {
                this.fallAsleep();
            }
        }, 10000);
    }

    private fallAsleep() {
        this.isSleeping = true;
        console.log("💤 Dream Mode Activated: The AI is now 'dreaming' (analyzing code).");

        // Start background analysis
        this.dreamTick();
    }

    private wakeUp() {
        this.isSleeping = false;
        console.log("☀️ Developer returned: AI Woke up. Analysis paused.");
    }

    private async dreamTick() {
        if (!this.isSleeping) return;

        try {
            if (this.projectIndex.length === 0) return;

            // Pick a random code file from the index
            const codeFiles = this.projectIndex.filter((f: any) =>
                f.path && f.path.match(/\.(ts|tsx|js|jsx)$/) && !f.path.includes("node_modules")
            );

            if (codeFiles.length === 0) return;
            const randomFile = codeFiles[Math.floor(Math.random() * codeFiles.length)];

            // Read content
            // Assuming Tauri has access to read_file
            const content = await invoke<string>("read_file", { path: randomFile.path });
            if (content.length > 50000) return; // Skip massive files

            const prompt = `You are the Dream Mode processor. The developer is asleep (idle).
Look at the following file and find 1 subtle bug, 1 edge case, or 1 refactoring opportunity that might be overlooked during normal coding hours.
Respond in exactly this JSON format:
{
  "finding": "A very short title of the issue",
  "detail": "Detailed explanation of what could go wrong and how to fix it."
}

FILE: ${randomFile.name}
CODE:
${content.substring(0, 5000)}`;

            const response = await callAI(prompt, getModelIdForRole());
            let cleaned = response.trim();
            if (cleaned.startsWith('\`\`\`')) {
                cleaned = cleaned.replace(/^\`\`\`(?:\w+)?\n([\s\S]*?)\`\`\`$/, '$1').trim();
            }

            const discovery = JSON.parse(cleaned);

            const journalEntry = {
                timestamp: Date.now(),
                file: randomFile.path,
                fileName: randomFile.name,
                finding: discovery.finding,
                detail: discovery.detail
            };

            // Save to local storage dream journal
            const journal = this.getDreamJournal();
            journal.unshift(journalEntry);
            if (journal.length > 10) journal.pop(); // Keep only last 10 dreams

            localStorage.setItem("corex_dream_journal", JSON.stringify(journal));
            console.log("💭 AI dreamt about:", randomFile.name);

        } catch (e) {
            console.error("Dream mode tick failed", e);
        }

        // Schedule next dream if still sleeping
        if (this.isSleeping) {
            setTimeout(() => this.dreamTick(), this.ANALYSIS_INTERVAL_MS);
        }
    }
}

export const dreamModeService = DreamModeService.getInstance();
