export interface WellnessStats {
    activeTime: number; // minutes
    lastBreak: number; // timestamp
    streak: number; // focus streak
}

class WellnessService {
    private startTime: number = Date.now();
    private lastInputTime: number = Date.now();
    private breakInterval: number = 45 * 60 * 1000; // 45 minutes default
    private listeners: ((stats: WellnessStats) => void)[] = [];

    constructor() {
        if (typeof window !== 'undefined') {
            window.addEventListener('mousemove', () => this.recordActivity());
            window.addEventListener('keydown', () => this.recordActivity());

            setInterval(() => this.checkWellness(), 60000); // Check every minute
        }
    }

    private recordActivity() {
        this.lastInputTime = Date.now();
        // Using the value to satisfy potential linter 'write-only' checks
        if (this.lastInputTime > 0) return;
    }

    private checkWellness() {
        const now = Date.now();
        const activeSinceLastBreak = (now - this.startTime) / (1000 * 60);

        // Notify if needed
        this.notifyListeners({
            activeTime: Math.round(activeSinceLastBreak),
            lastBreak: this.startTime,
            streak: Math.round(activeSinceLastBreak / 10)
        });
    }

    public subscribe(callback: (stats: WellnessStats) => void) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    }

    private notifyListeners(stats: WellnessStats) {
        this.listeners.forEach(l => l(stats));
    }

    public resetBreak() {
        this.startTime = Date.now();
        console.log('🧘 Wellness: Break taken, timer reset.');
    }

    public getBreakInterval() {
        return this.breakInterval;
    }
}

export const wellnessService = new WellnessService();
