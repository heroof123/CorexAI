// utils/performance-monitor.ts
// Performance monitoring utilities

export interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private timers: Map<string, number> = new Map();
  private maxMetrics = 1000; // Keep last 1000 metrics

  /**
   * Start timing an operation
   */
  start(name: string): void {
    this.timers.set(name, performance.now());
  }

  /**
   * End timing and record metric
   */
  end(name: string, metadata?: Record<string, any>): number {
    const startTime = this.timers.get(name);
    if (!startTime) {
      console.warn(`⚠️ Performance: No start time for "${name}"`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.timers.delete(name);

    // Record metric
    this.metrics.push({
      name,
      duration,
      timestamp: Date.now(),
      metadata,
    });

    // Trim old metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    console.log(`⏱️ Performance: ${name} took ${duration.toFixed(2)}ms`);
    return duration;
  }

  /**
   * Measure async operation
   */
  async measure<T>(
    name: string,
    operation: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    this.start(name);
    try {
      const result = await operation();
      this.end(name, metadata);
      return result;
    } catch (error) {
      this.end(name, { ...metadata, error: true });
      throw error;
    }
  }

  /**
   * Get metrics for a specific operation
   */
  getMetrics(name?: string): PerformanceMetric[] {
    if (name) {
      return this.metrics.filter((m) => m.name === name);
    }
    return [...this.metrics];
  }

  /**
   * Get average duration for an operation
   */
  getAverage(name: string): number {
    const metrics = this.getMetrics(name);
    if (metrics.length === 0) return 0;

    const total = metrics.reduce((sum, m) => sum + m.duration, 0);
    return total / metrics.length;
  }

  /**
   * Get statistics for an operation
   */
  getStats(name: string): {
    count: number;
    average: number;
    min: number;
    max: number;
    total: number;
  } {
    const metrics = this.getMetrics(name);

    if (metrics.length === 0) {
      return { count: 0, average: 0, min: 0, max: 0, total: 0 };
    }

    const durations = metrics.map((m) => m.duration);
    const total = durations.reduce((sum, d) => sum + d, 0);

    return {
      count: metrics.length,
      average: total / metrics.length,
      min: Math.min(...durations),
      max: Math.max(...durations),
      total,
    };
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
    this.timers.clear();
  }

  /**
   * Get performance report
   */
  getReport(): string {
    const operations = new Set(this.metrics.map((m) => m.name));
    const lines: string[] = ['📊 Performance Report:', ''];

    for (const op of operations) {
      const stats = this.getStats(op);
      lines.push(
        `${op}:`,
        `  Count: ${stats.count}`,
        `  Average: ${stats.average.toFixed(2)}ms`,
        `  Min: ${stats.min.toFixed(2)}ms`,
        `  Max: ${stats.max.toFixed(2)}ms`,
        `  Total: ${stats.total.toFixed(2)}ms`,
        ''
      );
    }

    return lines.join('\n');
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Export for testing
export { PerformanceMonitor };
