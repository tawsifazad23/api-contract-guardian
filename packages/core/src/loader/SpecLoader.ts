/**
 * OpenAPI Specification Loader
 *
 * Loads, parses, and validates OpenAPI specification files.
 * Supports JSON and YAML formats, auto-detects OpenAPI version.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { SpecLoadError } from '../errors';
import { OpenAPIVersion, SpecFormat, type OpenAPISpec } from '../interfaces';
import { createLogger } from '../logger';

const logger = createLogger('core', 'loader');

/**
 * Detect spec format from file extension
 *
 * @param filePath - Path to spec file
 * @returns Detected format (json or yaml)
 */
function detectFormat(filePath: string): SpecFormat {
  const ext = path.extname(filePath).toLowerCase();
  return ext === '.json' ? SpecFormat.JSON : SpecFormat.YAML;
}

/**
 * Detect OpenAPI version from parsed spec
 *
 * @param spec - Parsed spec object
 * @returns OpenAPI version (3.0 or 3.1)
 */
function detectOpenAPIVersion(spec: Record<string, unknown>): OpenAPIVersion {
  const version = String(spec.openapi ?? '');

  if (version.startsWith('3.1')) {
    return OpenAPIVersion.V3_1;
  }
  if (version.startsWith('3.0')) {
    return OpenAPIVersion.V3_0;
  }

  // Default to 3.0 if version not found
  return OpenAPIVersion.V3_0;
}

/**
 * Parse YAML content
 *
 * @param content - YAML content string
 * @returns Parsed object
 * @throws SpecLoadError on parse failure
 */
function parseYAML(content: string): Record<string, unknown> {
  try {
    const parsed = yaml.load(content);
    if (typeof parsed !== 'object' || parsed === null) {
      throw new Error('YAML did not parse to an object');
    }
    return parsed as Record<string, unknown>;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new SpecLoadError(
      `Failed to parse YAML: ${message}`,
      {},
      {
        specDetails: {
          errorType: 'YAML_PARSE_ERROR',
          parseError: message,
        },
      }
    );
  }
}

/**
 * Parse JSON content
 *
 * @param content - JSON content string
 * @returns Parsed object
 * @throws SpecLoadError on parse failure
 */
function parseJSON(content: string): Record<string, unknown> {
  try {
    return JSON.parse(content) as Record<string, unknown>;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new SpecLoadError(
      `Failed to parse JSON: ${message}`,
      {},
      {
        specDetails: {
          errorType: 'JSON_PARSE_ERROR',
          parseError: message,
        },
      }
    );
  }
}

/**
 * OpenAPI Specification Loader
 *
 * Handles loading, parsing, and preparing OpenAPI specifications
 * for validation and processing.
 */
export class SpecLoader {
  /**
   * Load an OpenAPI specification from a file
   *
   * @param filePath - Path to the spec file (.json or .yaml)
   * @returns Loaded and parsed specification
   * @throws SpecLoadError if loading or parsing fails
   *
   * @example
   * ```typescript
   * const loader = new SpecLoader();
   * const spec = await loader.loadSpec('openapi.yaml');
   * console.log(spec.info.title);
   * ```
   */
  public async loadSpec(filePath: string): Promise<OpenAPISpec> {
    logger.debug('Loading spec', { filePath });

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new SpecLoadError(
        `Spec file not found: ${filePath}`,
        { filePath },
        {
          isRecoverable: false,
          suggestion: `Check that the file path is correct: ${filePath}`,
        }
      );
    }

    // Read file
    let content: string;
    try {
      content = fs.readFileSync(filePath, 'utf-8');
      logger.debug('Spec file read successfully', { size: content.length });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new SpecLoadError(
        `Failed to read spec file: ${message}`,
        { filePath },
        {
          isRecoverable: false,
          suggestion: `Check file permissions and that the path is valid: ${filePath}`,
          originalError: error instanceof Error ? error : undefined,
        }
      );
    }

    // Detect format
    const format = detectFormat(filePath);
    logger.debug('Detected spec format', { format });

    // Parse content based on format
    let parsed: Record<string, unknown>;
    if (format === SpecFormat.JSON) {
      parsed = parseJSON(content);
    } else {
      parsed = parseYAML(content);
    }

    // Detect OpenAPI version
    const version = detectOpenAPIVersion(parsed);
    logger.debug('Detected OpenAPI version', { version });

    // Validate it has required fields
    if (!parsed.info) {
      throw new SpecLoadError(
        'Invalid OpenAPI spec: missing required "info" field',
        { filePath },
        {
          isRecoverable: false,
          suggestion: 'OpenAPI specs must have an info section with title and version',
        }
      );
    }

    if (!parsed.openapi) {
      throw new SpecLoadError(
        'Invalid OpenAPI spec: missing required "openapi" version field',
        { filePath },
        {
          isRecoverable: false,
          suggestion: 'Spec must have openapi: "3.0.x" or "3.1.x"',
        }
      );
    }

    logger.info('Spec loaded successfully', {
      title: (parsed.info as Record<string, unknown>)?.title,
      version: (parsed.info as Record<string, unknown>)?.version,
    });

    const specWithMetadata: OpenAPISpec = {
      ...(parsed as OpenAPISpec),
      metadata: {
        filePath,
        format,
        version,
        loadedAt: new Date(),
        content,
      },
      _raw: parsed,
    };

    return specWithMetadata;
  }

  /**
   * Load multiple specs from file paths
   *
   * @param filePaths - Array of file paths
   * @returns Array of loaded specs
   * @throws SpecLoadError for first failed file
   */
  public async loadSpecs(filePaths: string[]): Promise<OpenAPISpec[]> {
    const results: OpenAPISpec[] = [];

    for (const filePath of filePaths) {
      const spec = await this.loadSpec(filePath);
      results.push(spec);
    }

    return results;
  }
}

/**
 * Create a new SpecLoader instance
 *
 * @returns SpecLoader instance
 */
export function createSpecLoader(): SpecLoader {
  return new SpecLoader();
}
