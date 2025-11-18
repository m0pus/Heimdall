/**
 * Frontend Logger - Configurable logging with verbosity levels
 *
 * Usage:
 *   import { logger } from '@/lib/logger';
 *   logger.debug('Component', 'Debug message', { data });
 *   logger.info('API', 'Request sent');
 *   logger.warn('Validation', 'Missing field');
 *   logger.error('Network', 'Failed to fetch', error);
 *
 * Configuration:
 *   Set LOG_LEVEL in .env or browser localStorage
 *   Values: 'debug', 'info', 'warn', 'error', 'none'
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'none';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  none: 4,
};

class Logger {
  private level: LogLevel;

  constructor() {
    // Check localStorage first, then environment, then default to 'warn' in production
    const storedLevel = this.getStoredLevel();
    const envLevel = this.getEnvLevel();
    const defaultLevel = import.meta.env.PROD ? 'warn' : 'debug';

    this.level = storedLevel || envLevel || defaultLevel;

    if (!import.meta.env.PROD) {
      console.log(
        `%c[Logger] Initialized with level: ${this.level}`,
        'color: #3b82f6; font-weight: bold'
      );
    }
  }

  private getStoredLevel(): LogLevel | null {
    try {
      const stored = localStorage.getItem('LOG_LEVEL');
      if (stored && stored in LOG_LEVELS) {
        return stored as LogLevel;
      }
    } catch (e) {
      // localStorage might not be available
    }
    return null;
  }

  private getEnvLevel(): LogLevel | null {
    const envLevel = import.meta.env.VITE_LOG_LEVEL;
    if (envLevel && envLevel in LOG_LEVELS) {
      return envLevel as LogLevel;
    }
    return null;
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.level];
  }

  private formatMessage(context: string, message: string): string {
    return `[${context}] ${message}`;
  }

  private getContextColor(level: LogLevel): string {
    switch (level) {
      case 'debug':
        return '#6b7280'; // gray
      case 'info':
        return '#3b82f6'; // blue
      case 'warn':
        return '#f59e0b'; // yellow
      case 'error':
        return '#ef4444'; // red
      default:
        return '#000000';
    }
  }

  /**
   * Debug logging - for detailed diagnostics
   */
  debug(context: string, message: string, ...args: any[]): void {
    if (!this.shouldLog('debug')) return;

    const color = this.getContextColor('debug');
    console.log(
      `%c${this.formatMessage(context, message)}`,
      `color: ${color}`,
      ...args
    );
  }

  /**
   * Info logging - for general information
   */
  info(context: string, message: string, ...args: any[]): void {
    if (!this.shouldLog('info')) return;

    const color = this.getContextColor('info');
    console.log(
      `%c${this.formatMessage(context, message)}`,
      `color: ${color}; font-weight: bold`,
      ...args
    );
  }

  /**
   * Warning logging - for non-critical issues
   */
  warn(context: string, message: string, ...args: any[]): void {
    if (!this.shouldLog('warn')) return;

    const color = this.getContextColor('warn');
    console.warn(
      `%c${this.formatMessage(context, message)}`,
      `color: ${color}; font-weight: bold`,
      ...args
    );
  }

  /**
   * Error logging - for critical issues
   */
  error(context: string, message: string, ...args: any[]): void {
    if (!this.shouldLog('error')) return;

    const color = this.getContextColor('error');
    console.error(
      `%c${this.formatMessage(context, message)}`,
      `color: ${color}; font-weight: bold`,
      ...args
    );
  }

  /**
   * Set the current log level
   */
  setLevel(level: LogLevel): void {
    this.level = level;
    try {
      localStorage.setItem('LOG_LEVEL', level);
      console.log(
        `%c[Logger] Level changed to: ${level}`,
        'color: #3b82f6; font-weight: bold'
      );
    } catch (e) {
      // localStorage might not be available
    }
  }

  /**
   * Get the current log level
   */
  getLevel(): LogLevel {
    return this.level;
  }
}

// Export singleton instance
export const logger = new Logger();

// Make logger available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).logger = logger;
}
