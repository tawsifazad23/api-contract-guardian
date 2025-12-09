/**
 * Base error class for API Contract Guardian
 *
 * All custom errors extend from this base class to provide consistent
 * error handling, context, and error codes.
 */

/**
 * Error context containing details about where the error occurred
 */
export interface ErrorContext {
  /**
   * File path where the error occurred
   */
  filePath?: string;

  /**
   * Line number in the file (1-indexed)
   */
  line?: number;

  /**
   * Column number in the file (1-indexed)
   */
  column?: number;

  /**
   * Additional context details
   */
  details?: Record<string, unknown>;
}

/**
 * Base error class for all API Guardian errors
 */
export class BaseError extends Error {
  /**
   * Error code for programmatic error handling
   */
  public readonly code: string;

  /**
   * Context information about the error
   */
  public readonly context: ErrorContext;

  /**
   * Suggested action to fix the error
   */
  public readonly suggestion?: string;

  /**
   * Whether this error is recoverable
   */
  public readonly isRecoverable: boolean;

  /**
   * Timestamp when the error occurred
   */
  public readonly timestamp: Date;

  /**
   * Original error (if this is a wrapped error)
   */
  public readonly originalError?: Error;

  /**
   * Create a new BaseError
   *
   * @param message - Error message
   * @param code - Error code
   * @param context - Error context
   * @param options - Additional error options
   */
  constructor(
    message: string,
    code: string,
    context: ErrorContext = {},
    options: {
      suggestion?: string;
      isRecoverable?: boolean;
      originalError?: Error;
    } = {}
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.context = context;
    this.suggestion = options.suggestion;
    this.isRecoverable = options.isRecoverable ?? false;
    this.timestamp = new Date();
    this.originalError = options.originalError;

    // Set prototype for instanceof checks to work correctly
    Object.setPrototypeOf(this, BaseError.prototype);

    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Get a formatted error message with context
   */
  public getFormattedMessage(): string {
    const parts = [this.message];

    if (this.context.filePath) {
      parts.push(`File: ${this.context.filePath}`);
    }

    if (this.context.line !== undefined) {
      const location = `${this.context.line}${
        this.context.column !== undefined ? `:${this.context.column}` : ''
      }`;
      parts.push(`Location: ${location}`);
    }

    if (this.suggestion) {
      parts.push(`Suggestion: ${this.suggestion}`);
    }

    return parts.join('\n');
  }

  /**
   * Get error as JSON for logging/serialization
   */
  public toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      context: this.context,
      suggestion: this.suggestion,
      isRecoverable: this.isRecoverable,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack,
    };
  }

  /**
   * Get error as string
   */
  public toString(): string {
    return `${this.name} [${this.code}]: ${this.message}`;
  }
}
