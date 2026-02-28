// Centralized Logging Service

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: unknown;
  context?: string;
}

class Logger {
  private static instance: Logger;
  private isDev = import.meta.env.DEV;
  private logs: LogEntry[] = [];
  private readonly MAX_LOGS = 1000;

  private constructor() { }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Log a message with specified level
   */
  private log(level: LogLevel, message: string, data?: unknown, context?: string): void {
    const timestamp = new Date().toISOString();
    const logEntry: LogEntry = {
      timestamp,
      level,
      message,
      data,
      context,
    };

    // Store in memory (with limit)
    this.logs.push(logEntry);
    if (this.logs.length > this.MAX_LOGS) {
      this.logs.shift(); // Remove oldest
    }

    // Console output (development only)
    if (this.isDev) {
      const emoji = this.getEmoji(level);
      const contextStr = context ? `[${context}]` : "";
      const logMessage = `${emoji} ${contextStr} ${message}`;

      switch (level) {
        case "debug":
          console.debug(logMessage, data || "");
          break;
        case "info":
          console.info(logMessage, data || "");
          break;
        case "warn":
          console.warn(logMessage, data || "");
          break;
        case "error":
          console.error(logMessage, data || "");
          break;
      }
    }

    // Error tracking (production only)
    if (!this.isDev && level === "error") {
      this.sendToErrorTracking(logEntry);
    }

    // Persistent storage (optional)
    if (level === "error") {
      this.saveToLocalStorage(logEntry);
    }
  }

  /**
   * Debug level logging
   */
  debug(message: string, data?: any, context?: string): void {
    this.log("debug", message, data, context);
  }

  /**
   * Info level logging
   */
  info(message: string, data?: any, context?: string): void {
    this.log("info", message, data, context);
  }

  /**
   * Warning level logging
   */
  warn(message: string, data?: any, context?: string): void {
    this.log("warn", message, data, context);
  }

  /**
   * Error level logging
   */
  error(message: string, error?: any, context?: string): void {
    const errorData =
      error instanceof Error
        ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
        }
        : error;

    this.log("error", message, errorData, context);
  }

  /**
   * Get all logs
   */
  getLogs(level?: LogLevel): LogEntry[] {
    if (level) {
      return this.logs.filter(log => log.level === level);
    }
    return [...this.logs];
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = [];
    localStorage.removeItem("corex_error_logs");
  }

  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Get emoji for log level
   */
  private getEmoji(level: LogLevel): string {
    switch (level) {
      case "debug":
        return "🔍";
      case "info":
        return "ℹ️";
      case "warn":
        return "⚠️";
      case "error":
        return "❌";
      default:
        return "📝";
    }
  }

  /**
   * Save error logs to localStorage
   */
  private saveToLocalStorage(logEntry: LogEntry): void {
    try {
      const stored = localStorage.getItem("corex_error_logs");
      const errorLogs: LogEntry[] = stored ? JSON.parse(stored) : [];

      errorLogs.push(logEntry);

      // Keep only last 100 errors
      if (errorLogs.length > 100) {
        errorLogs.shift();
      }

      localStorage.setItem("corex_error_logs", JSON.stringify(errorLogs));
    } catch (error) {
      console.error("Failed to save error log:", error);
    }
  }

  /**
   * Send error to tracking service (Sentry, etc.)
   */
  private sendToErrorTracking(logEntry: LogEntry): void {
    // Store in localStorage for user review
    try {
      const errorLogs = this.getStoredErrorLogs();
      errorLogs.push({
        ...logEntry,
        timestamp: new Date().toISOString(),
      });
      // Keep only last 50 errors
      const trimmedLogs = errorLogs.slice(-50);
      localStorage.setItem("corex_error_logs", JSON.stringify(trimmedLogs));
    } catch (e) {
      console.error("Failed to store error log:", e);
    }

    // Export to Sentry / Error Tracking API
    if (!this.isDev) {
      console.error("[Error Tracking Captured]", logEntry);

      // Stub for real error tracking integration
      // if (window.Sentry) {
      //   Sentry.captureException(new Error(logEntry.message), { extra: logEntry.data });
      // }

      fetch("https://api.error-tracking.service.ai/mock-track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(logEntry)
      }).catch(() => { });
    }

    // Dispatch custom event for error boundary to pick up
    window.dispatchEvent(
      new CustomEvent("corex-error", {
        detail: logEntry,
      })
    );
  }

  /**
   * Get error logs from localStorage
   */
  getStoredErrorLogs(): LogEntry[] {
    try {
      const stored = localStorage.getItem("corex_error_logs");
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Failed to load error logs:", error);
      return [];
    }
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Export class for testing
export { Logger };

// Convenience exports
export const log = {
  debug: (message: string, data?: any, context?: string) => logger.debug(message, data, context),
  info: (message: string, data?: any, context?: string) => logger.info(message, data, context),
  warn: (message: string, data?: any, context?: string) => logger.warn(message, data, context),
  error: (message: string, error?: any, context?: string) => logger.error(message, error, context),
};

export default logger;
