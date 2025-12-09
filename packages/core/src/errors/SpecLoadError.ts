/**
 * SpecLoadError
 *
 * Raised when loading or parsing an OpenAPI specification fails.
 */

import { BaseError, ErrorContext } from './BaseError';
import { OpenAPIVersion, SpecFormat } from '../interfaces';

/**
 * Details about a spec loading error
 */
export interface SpecLoadErrorDetails {
  /**
   * File format that was attempted
   */
  format?: SpecFormat;

  /**
   * OpenAPI version that was detected or expected
   */
  version?: OpenAPIVersion;

  /**
   * Type of parsing error (e.g., 'YAML_PARSE_ERROR', 'JSON_PARSE_ERROR', 'SCHEMA_VALIDATION')
   */
  errorType?: string;

  /**
   * Parser error details
   */
  parseError?: string;

  /**
   * File size in bytes
   */
  fileSize?: number;
}

/**
 * Error raised when spec loading or parsing fails
 *
 * @example
 * ```typescript
 * throw new SpecLoadError(
 *   'Failed to parse OpenAPI specification',
 *   {
 *     filePath: 'openapi.yaml',
 *   },
 *   {
 *     suggestion: 'Check that the file is valid YAML and follows OpenAPI 3.0 structure',
 *     isRecoverable: false,
 *     specDetails: {
 *       format: SpecFormat.YAML,
 *       errorType: 'YAML_PARSE_ERROR',
 *       parseError: 'Invalid indentation at line 42',
 *     },
 *   }
 * );
 * ```
 */
export class SpecLoadError extends BaseError {
  /**
   * Spec loading-specific error details
   */
  public readonly specDetails: SpecLoadErrorDetails;

  /**
   * Create a new SpecLoadError
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
      specDetails?: SpecLoadErrorDetails;
    } = {}
  ) {
    super(message, 'SPEC_LOAD_ERROR', context, {
      suggestion: options.suggestion,
      isRecoverable: options.isRecoverable ?? false,
      originalError: options.originalError,
    });

    this.specDetails = options.specDetails ?? {};
    Object.setPrototypeOf(this, SpecLoadError.prototype);
  }

  /**
   * Get error as JSON for logging/serialization
   */
  public toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      specDetails: this.specDetails,
    };
  }
}
