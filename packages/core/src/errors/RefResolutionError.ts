/**
 * RefResolutionError
 *
 * Raised when resolving JSON Schema $ref pointers fails.
 */

import { BaseError, ErrorContext } from './BaseError';

/**
 * Details about a $ref resolution error
 */
export interface RefResolutionErrorDetails {
  /**
   * The $ref pointer that failed to resolve
   */
  ref?: string;

  /**
   * Type of reference (internal, external URL, file path)
   */
  refType?: 'internal' | 'external' | 'file';

  /**
   * Target path that the ref points to
   */
  targetPath?: string;

  /**
   * Why the ref failed to resolve
   */
  reason?: 'NOT_FOUND' | 'CIRCULAR' | 'INVALID_FORMAT' | 'NETWORK_ERROR' | 'PARSE_ERROR';

  /**
   * The object that contains the broken ref
   */
  parentPath?: string;
}

/**
 * Error raised when $ref resolution fails
 *
 * @example
 * ```typescript
 * throw new RefResolutionError(
 *   'Failed to resolve $ref: #/components/schemas/NonExistentSchema',
 *   {
 *     filePath: 'openapi.yaml',
 *     line: 125,
 *   },
 *   {
 *     suggestion: 'Verify that the schema is defined in components.schemas',
 *     isRecoverable: false,
 *     refDetails: {
 *       ref: '#/components/schemas/NonExistentSchema',
 *       refType: 'internal',
 *       reason: 'NOT_FOUND',
 *       parentPath: '$.paths./users.get.responses.200.content.application/json.schema',
 *     },
 *   }
 * );
 * ```
 */
export class RefResolutionError extends BaseError {
  /**
   * $ref resolution-specific error details
   */
  public readonly refDetails: RefResolutionErrorDetails;

  /**
   * Create a new RefResolutionError
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
      refDetails?: RefResolutionErrorDetails;
    } = {}
  ) {
    super(message, 'REF_RESOLUTION_ERROR', context, {
      suggestion: options.suggestion,
      isRecoverable: options.isRecoverable ?? false,
      originalError: options.originalError,
    });

    this.refDetails = options.refDetails ?? {};
    Object.setPrototypeOf(this, RefResolutionError.prototype);
  }

  /**
   * Get error as JSON for logging/serialization
   */
  public toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      refDetails: this.refDetails,
    };
  }
}
