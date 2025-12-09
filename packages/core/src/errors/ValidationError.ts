/**
 * ValidationError
 *
 * Raised when OpenAPI spec validation fails or produces issues.
 * Contains details about what validation failed and why.
 */

import { BaseError, ErrorContext } from './BaseError';

/**
 * Details about a validation failure
 */
export interface ValidationErrorDetails {
  /**
   * The rule that failed
   */
  ruleId?: string;

  /**
   * Path to the element that failed validation (JSON Pointer format)
   */
  path?: string;

  /**
   * The value that failed validation
   */
  value?: unknown;

  /**
   * Expected value or constraint
   */
  expected?: unknown;

  /**
   * Actual value
   */
  actual?: unknown;

  /**
   * Number of validation errors
   */
  errorCount?: number;
}

/**
 * Error raised when spec validation fails
 *
 * @example
 * ```typescript
 * throw new ValidationError(
 *   'Validation failed: operation must have description',
 *   {
 *     filePath: 'openapi.yaml',
 *     line: 45,
 *     details: {
 *       ruleId: 'operation-description',
 *       path: '$.paths./users.get',
 *     },
 *   },
 *   {
 *     suggestion: 'Add a description to the operation',
 *     isRecoverable: false,
 *   }
 * );
 * ```
 */
export class ValidationError extends BaseError {
  /**
   * Validation-specific error details
   */
  public readonly validationDetails: ValidationErrorDetails;

  /**
   * Create a new ValidationError
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
      validationDetails?: ValidationErrorDetails;
    } = {}
  ) {
    super(message, 'VALIDATION_ERROR', context, {
      suggestion: options.suggestion,
      isRecoverable: options.isRecoverable ?? false,
      originalError: options.originalError,
    });

    this.validationDetails = options.validationDetails ?? {};
    Object.setPrototypeOf(this, ValidationError.prototype);
  }

  /**
   * Get error as JSON for logging/serialization
   */
  public toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      validationDetails: this.validationDetails,
    };
  }
}
