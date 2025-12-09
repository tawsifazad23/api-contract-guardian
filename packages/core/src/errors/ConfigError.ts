/**
 * ConfigError
 *
 * Raised when configuration file parsing or validation fails.
 */

import { BaseError, ErrorContext } from './BaseError';

/**
 * Details about a configuration error
 */
export interface ConfigErrorDetails {
  /**
   * Configuration property that caused the error
   */
  property?: string;

  /**
   * Value that was invalid
   */
  value?: unknown;

  /**
   * Expected value type or format
   */
  expectedFormat?: string;

  /**
   * Validation schema constraint
   */
  constraint?: string;
}

/**
 * Error raised when configuration parsing or validation fails
 *
 * @example
 * ```typescript
 * throw new ConfigError(
 *   'Invalid ruleset configuration',
 *   {
 *     filePath: '.api-guardian.yaml',
 *     line: 15,
 *   },
 *   {
 *     suggestion: 'Check that the ruleset exists or is properly defined',
 *     isRecoverable: true,
 *     configDetails: {
 *       property: 'rulesets.custom',
 *       expectedFormat: 'RulesetDefinition',
 *     },
 *   }
 * );
 * ```
 */
export class ConfigError extends BaseError {
  /**
   * Configuration-specific error details
   */
  public readonly configDetails: ConfigErrorDetails;

  /**
   * Create a new ConfigError
   *
   * @param message - Error message
   * @param context - Error context
   * @param options - Additional error options
   */
  constructor(
    message: string,
    context: ErrorContext = {},
    options: {
      suggestion?: string;
      isRecoverable?: boolean;
      originalError?: Error;
      configDetails?: ConfigErrorDetails;
    } = {}
  ) {
    super(message, 'CONFIG_ERROR', context, {
      suggestion: options.suggestion,
      isRecoverable: options.isRecoverable ?? true,
      originalError: options.originalError,
    });

    this.configDetails = options.configDetails ?? {};
    Object.setPrototypeOf(this, ConfigError.prototype);
  }

  /**
   * Get error as JSON for logging/serialization
   */
  public toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      configDetails: this.configDetails,
    };
  }
}
