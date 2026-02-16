// utils/error-handler.ts
// Centralized error handling

export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

export interface ErrorContext {
  component?: string;
  operation?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface ErrorLog {
  id: string;
  message: string;
  severity: ErrorSeverity;
  timestamp: number;
  stack?: string;
  context?: ErrorContext;
  recovered: boolean;
}

class ErrorHandler {
  private errors: ErrorLog[] = [];
  private maxErrors = 500; // Keep last 500 errors
  private errorCallbacks: Array<(error: ErrorLog) => void> = [];

  /**
   * Handle an error
   */
  handle(
    error: Error | string,
    severity: ErrorSeverity = ErrorSeverity.ERROR,
    context?: ErrorContext
  ): ErrorLog {
    const errorLog: ErrorLog = {
      id: `err-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      message: error instanceof Error ? error.message : error,
      severity,
      timestamp: Date.now(),
      stack: error instanceof Error ? error.stack : undefined,
      context,
      recovered: false,
    };

    // Log to console
    this.logToConsole(errorLog);

    // Store error
    this.errors.push(errorLog);
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }

    // Notify callbacks
    this.errorCallbacks.forEach((callback) => {
      try {
        callback(errorLog);
      } catch (e) {
        console.error('Error in error callback:', e);
      }
    });

    return errorLog;
  }

  /**
   * Log to console with appropriate level
   */
  private logToConsole(error: ErrorLog): void {
    const prefix = `[${error.severity.toUpperCase()}]`;
    const message = `${prefix} ${error.message}`;
    const details = error.context
      ? `\nContext: ${JSON.stringify(error.context, null, 2)}`
      : '';

    switch (error.severity) {
      case ErrorSeverity.INFO:
        console.info(message + details);
        break;
      case ErrorSeverity.WARNING:
        console.warn(message + details);
        break;
      case ErrorSeverity.ERROR:
        console.error(message + details);
        if (error.stack) console.error(error.stack);
        break;
      case ErrorSeverity.CRITICAL:
        console.error(`🚨 ${message}` + details);
        if (error.stack) console.error(error.stack);
        break;
    }
  }

  /**
   * Mark error as recovered
   */
  markRecovered(errorId: string): void {
    const error = this.errors.find((e) => e.id === errorId);
    if (error) {
      error.recovered = true;
    }
  }

  /**
   * Get all errors
   */
  getErrors(severity?: ErrorSeverity): ErrorLog[] {
    if (severity) {
      return this.errors.filter((e) => e.severity === severity);
    }
    return [...this.errors];
  }

  /**
   * Get unrecovered errors
   */
  getUnrecoveredErrors(): ErrorLog[] {
    return this.errors.filter((e) => !e.recovered);
  }

  /**
   * Clear errors
   */
  clear(): void {
    this.errors = [];
  }

  /**
   * Subscribe to errors
   */
  onError(callback: (error: ErrorLog) => void): () => void {
    this.errorCallbacks.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.errorCallbacks.indexOf(callback);
      if (index > -1) {
        this.errorCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Get error statistics
   */
  getStats(): {
    total: number;
    bySeverity: Record<ErrorSeverity, number>;
    unrecovered: number;
  } {
    const stats = {
      total: this.errors.length,
      bySeverity: {
        [ErrorSeverity.INFO]: 0,
        [ErrorSeverity.WARNING]: 0,
        [ErrorSeverity.ERROR]: 0,
        [ErrorSeverity.CRITICAL]: 0,
      },
      unrecovered: 0,
    };

    for (const error of this.errors) {
      stats.bySeverity[error.severity]++;
      if (!error.recovered) {
        stats.unrecovered++;
      }
    }

    return stats;
  }

  /**
   * Get error report
   */
  getReport(): string {
    const stats = this.getStats();
    const lines: string[] = ['🚨 Error Report:', ''];

    lines.push(`Total Errors: ${stats.total}`);
    lines.push(`Unrecovered: ${stats.unrecovered}`);
    lines.push('');
    lines.push('By Severity:');
    lines.push(`  Info: ${stats.bySeverity[ErrorSeverity.INFO]}`);
    lines.push(`  Warning: ${stats.bySeverity[ErrorSeverity.WARNING]}`);
    lines.push(`  Error: ${stats.bySeverity[ErrorSeverity.ERROR]}`);
    lines.push(`  Critical: ${stats.bySeverity[ErrorSeverity.CRITICAL]}`);

    if (stats.unrecovered > 0) {
      lines.push('');
      lines.push('Recent Unrecovered Errors:');
      const unrecovered = this.getUnrecoveredErrors().slice(-5);
      for (const error of unrecovered) {
        lines.push(`  - [${error.severity}] ${error.message}`);
      }
    }

    return lines.join('\n');
  }
}

// Singleton instance
export const errorHandler = new ErrorHandler();

// Export for testing
export { ErrorHandler };

/**
 * Utility function to wrap async operations with error handling
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context?: ErrorContext
): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    errorHandler.handle(
      error instanceof Error ? error : new Error(String(error)),
      ErrorSeverity.ERROR,
      context
    );
    return null;
  }
}

/**
 * Utility function to retry operations
 */
export async function retry<T>(
  operation: () => Promise<T>,
  options: {
    maxAttempts?: number;
    delay?: number;
    context?: ErrorContext;
  } = {}
): Promise<T> {
  const { maxAttempts = 3, delay = 1000, context } = options;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxAttempts) {
        errorHandler.handle(
          error instanceof Error ? error : new Error(String(error)),
          ErrorSeverity.ERROR,
          { 
            ...context, 
            metadata: { 
              ...context?.metadata, 
              attempt, 
              maxAttempts 
            } 
          }
        );
        throw error;
      }

      errorHandler.handle(
        `Attempt ${attempt}/${maxAttempts} failed, retrying...`,
        ErrorSeverity.WARNING,
        { 
          ...context, 
          metadata: { 
            ...context?.metadata, 
            attempt 
          } 
        }
      );

      await new Promise((resolve) => setTimeout(resolve, delay * attempt));
    }
  }

  throw new Error('Retry failed');
}
