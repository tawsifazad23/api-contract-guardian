/**
 * Logger utility
 *
 * Thin wrapper around the debug module providing consistent logging
 * across API Contract Guardian with namespace-based debug levels.
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const debug = require('debug');

/**
 * Log level type
 */
export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

/**
 * Logger interface
 */
export interface ILogger {
  /**
   * Log an error message
   */
  error(message: string, data?: Record<string, unknown>): void;

  /**
   * Log a warning message
   */
  warn(message: string, data?: Record<string, unknown>): void;

  /**
   * Log an info message
   */
  info(message: string, data?: Record<string, unknown>): void;

  /**
   * Log a debug message
   */
  debug(message: string, data?: Record<string, unknown>): void;

  /**
   * Get the debug namespace
   */
  getNamespace(): string;
}

/**
 * Logger implementation using debug module
 *
 * Creates namespace-based loggers following the pattern: @api-guardian:module:submodule
 *
 * @example
 * ```typescript
 * const logger = new Logger('core');
 * logger.info('Starting validation');
 * logger.debug('Loaded config', { rules: 10 });
 * ```
 *
 * Enable debug output:
 * ```bash
 * DEBUG=@api-guardian:* npm start
 * DEBUG=@api-guardian:core npm start
 * ```
 */
export class Logger implements ILogger {
  private readonly namespace: string;

  private readonly errorDebugger: debug.IDebugger;

  private readonly warnDebugger: debug.IDebugger;

  private readonly infoDebugger: debug.IDebugger;

  private readonly debugDebugger: debug.IDebugger;

  /**
   * Create a new Logger
   *
   * @param namespace - Logger namespace (e.g., 'core', 'cli', 'loader')
   * @param subnamespace - Optional sub-namespace (e.g., 'validator', 'spec-loader')
   */
  constructor(namespace: string, subnamespace?: string) {
    const parts = ['@api-guardian', namespace];
    if (subnamespace) {
      parts.push(subnamespace);
    }
    this.namespace = parts.join(':');

    // Create debug instances for each level
    this.errorDebugger = debug(`${this.namespace}:error`);
    this.warnDebugger = debug(`${this.namespace}:warn`);
    this.infoDebugger = debug(`${this.namespace}:info`);
    this.debugDebugger = debug(`${this.namespace}:debug`);

    // Ensure error and warn are always visible
    if (process.env.NODE_ENV === 'production') {
      this.errorDebugger.enabled = true;
      this.warnDebugger.enabled = true;
    }
  }

  /**
   * Log an error message
   *
   * @param message - Error message
   * @param data - Optional context data
   */
  public error(message: string, data?: Record<string, unknown>): void {
    this.errorDebugger(message, data ?? {});
  }

  /**
   * Log a warning message
   *
   * @param message - Warning message
   * @param data - Optional context data
   */
  public warn(message: string, data?: Record<string, unknown>): void {
    this.warnDebugger(message, data ?? {});
  }

  /**
   * Log an info message
   *
   * @param message - Info message
   * @param data - Optional context data
   */
  public info(message: string, data?: Record<string, unknown>): void {
    this.infoDebugger(message, data ?? {});
  }

  /**
   * Log a debug message
   *
   * @param message - Debug message
   * @param data - Optional context data
   */
  public debug(message: string, data?: Record<string, unknown>): void {
    this.debugDebugger(message, data ?? {});
  }

  /**
   * Get the debug namespace for this logger
   *
   * @returns Namespace string
   */
  public getNamespace(): string {
    return this.namespace;
  }
}

/**
 * Create a logger for a specific module
 *
 * @param namespace - Module namespace
 * @param subnamespace - Optional sub-namespace
 * @returns Logger instance
 */
export function createLogger(namespace: string, subnamespace?: string): ILogger {
  return new Logger(namespace, subnamespace);
}
