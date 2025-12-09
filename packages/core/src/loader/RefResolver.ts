/**
 * JSON Reference ($ref) Resolver
 *
 * Resolves JSON Schema $ref pointers within OpenAPI specifications.
 * Supports local references (e.g., #/components/schemas/MySchema).
 */

import { RefResolutionError } from '../errors';
import { type OpenAPISpec } from '../interfaces';
import { createLogger } from '../logger';

const logger = createLogger('core', 'ref-resolver');

/**
 * Parse a JSON reference pointer
 *
 * @param ref - Reference string (e.g., "#/components/schemas/User")
 * @returns Parsed reference parts
 */
function parseRef(ref: string): {
  isInternal: boolean;
  path: string[];
} {
  if (!ref.startsWith('#/')) {
    return { isInternal: false, path: [] };
  }

  const path = ref.substring(2).split('/');
  return { isInternal: true, path };
}

/**
 * Get value from object using JSON Pointer path
 *
 * @param obj - Object to traverse
 * @param path - Array of path segments
 * @returns Value at path or undefined
 */
function getValueByPath(obj: unknown, path: string[]): unknown {
  let current: unknown = obj;

  for (const segment of path) {
    if (typeof current !== 'object' || current === null) {
      return undefined;
    }

    const key = decodeURIComponent(segment);
    current = (current as Record<string, unknown>)[key];
  }

  return current;
}

/**
 * JSON Reference Resolver
 *
 * Resolves $ref pointers in OpenAPI specs.
 * Currently supports local references only.
 */
export class RefResolver {
  private spec: OpenAPISpec;

  private cache: Map<string, unknown> = new Map();

  /**
   * Create a new RefResolver
   *
   * @param spec - OpenAPI specification
   */
  constructor(spec: OpenAPISpec) {
    this.spec = spec;
  }

  /**
   * Resolve a $ref pointer
   *
   * @param ref - Reference string (e.g., "#/components/schemas/User")
   * @returns Resolved value
   * @throws RefResolutionError if ref cannot be resolved
   *
   * @example
   * ```typescript
   * const resolver = new RefResolver(spec);
   * const userSchema = resolver.resolve('#/components/schemas/User');
   * ```
   */
  public resolve(ref: string): unknown {
    // Check cache
    if (this.cache.has(ref)) {
      logger.debug('Returning cached reference', { ref });
      return this.cache.get(ref);
    }

    logger.debug('Resolving reference', { ref });

    const { isInternal, path } = parseRef(ref);

    // Only support internal references for Phase 1
    if (!isInternal) {
      throw new RefResolutionError(
        `External references are not supported: ${ref}`,
        {},
        {
          isRecoverable: false,
          refDetails: {
            ref,
            refType: 'external',
            reason: 'INVALID_FORMAT',
          },
          suggestion: 'Phase 1 supports local references only (e.g., #/components/schemas/...)',
        }
      );
    }

    // Resolve the path
    const value = getValueByPath(this.spec, path);

    if (value === undefined) {
      throw new RefResolutionError(
        `Reference not found: ${ref}`,
        { filePath: this.spec.metadata.filePath },
        {
          isRecoverable: false,
          refDetails: {
            ref,
            refType: 'internal',
            targetPath: path.join('/'),
            reason: 'NOT_FOUND',
          },
          suggestion: `Check that the referenced path exists in the spec: ${ref}`,
        }
      );
    }

    // Cache result
    this.cache.set(ref, value);
    logger.debug('Reference resolved and cached', { ref });

    return value;
  }

  /**
   * Check if a reference exists
   *
   * @param ref - Reference string to check
   * @returns True if reference can be resolved
   */
  public exists(ref: string): boolean {
    try {
      this.resolve(ref);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clear the resolution cache
   */
  public clearCache(): void {
    this.cache.clear();
    logger.debug('Reference cache cleared');
  }

  /**
   * Get cache statistics
   *
   * @returns Cache stats
   */
  public getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
    };
  }
}

/**
 * Create a new RefResolver for a spec
 *
 * @param spec - OpenAPI specification
 * @returns RefResolver instance
 */
export function createRefResolver(spec: OpenAPISpec): RefResolver {
  return new RefResolver(spec);
}
