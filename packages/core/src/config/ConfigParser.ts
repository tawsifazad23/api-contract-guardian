/**
 * Configuration Parser
 *
 * Loads, validates, and merges API Guardian configuration files.
 * Supports .api-guardian.yaml configuration with extends/inheritance.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { ConfigError } from '../errors';
import { createLogger } from '../logger';
import type { ApiGuardianConfig, ResolvedConfig, CliOverrides } from '../interfaces';
import { DEFAULT_CONFIG, getPresetRuleset } from './defaults';

const logger = createLogger('core', 'config');

/**
 * Parse YAML content to config object
 *
 * @param content - YAML content string
 * @returns Parsed configuration object
 * @throws ConfigError on parse failure
 */
function parseYAML(content: string): Record<string, unknown> {
  try {
    const parsed = yaml.load(content);
    // Empty YAML files parse to null/undefined - return empty object
    if (parsed === null || parsed === undefined) {
      return {};
    }
    if (typeof parsed !== 'object') {
      throw new Error('YAML did not parse to an object');
    }
    return parsed as Record<string, unknown>;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new ConfigError(
      `Failed to parse config YAML: ${message}`,
      {},
      {
        configDetails: {
          property: 'root',
          expectedFormat: 'valid YAML',
          constraint: 'must be valid YAML syntax',
        },
      }
    );
  }
}

/**
 * Validate config structure
 *
 * @param config - Configuration to validate
 * @returns Validation result (true if valid)
 * @throws ConfigError if validation fails
 */
function validateConfig(config: Record<string, unknown>): boolean {
  // extends must be string or array of strings
  if (config.extends !== undefined) {
    const exts = config.extends;
    if (
      typeof exts !== 'string' &&
      (!Array.isArray(exts) || !exts.every((e) => typeof e === 'string'))
    ) {
      throw new ConfigError(
        'Invalid config: "extends" must be a string or array of strings',
        {},
        {
          configDetails: {
            property: 'extends',
            value: exts,
            expectedFormat: 'string | string[]',
            constraint: 'must contain only strings',
          },
        }
      );
    }
  }

  // rules must be a record
  if (config.rules !== undefined && typeof config.rules !== 'object') {
    throw new ConfigError(
      'Invalid config: "rules" must be an object',
      {},
      {
        configDetails: {
          property: 'rules',
          value: typeof config.rules,
          expectedFormat: 'Record<string, RuleConfig>',
          constraint: 'must be an object with rule configurations',
        },
      }
    );
  }

  // rulesets must be a record
  if (config.rulesets !== undefined && typeof config.rulesets !== 'object') {
    throw new ConfigError(
      'Invalid config: "rulesets" must be an object',
      {},
      {
        configDetails: {
          property: 'rulesets',
          value: typeof config.rulesets,
          expectedFormat: 'Record<string, RulesetDefinition>',
          constraint: 'must be an object with ruleset definitions',
        },
      }
    );
  }

  // files must be an array
  if (config.files !== undefined && !Array.isArray(config.files)) {
    throw new ConfigError(
      'Invalid config: "files" must be an array',
      {},
      {
        configDetails: {
          property: 'files',
          value: typeof config.files,
          expectedFormat: 'FileConfig[]',
          constraint: 'must be an array of file configurations',
        },
      }
    );
  }

  // failOnWarnings must be boolean
  if (config.failOnWarnings !== undefined && typeof config.failOnWarnings !== 'boolean') {
    throw new ConfigError(
      'Invalid config: "failOnWarnings" must be a boolean',
      {},
      {
        configDetails: {
          property: 'failOnWarnings',
          value: typeof config.failOnWarnings,
          expectedFormat: 'boolean',
          constraint: 'must be true or false',
        },
      }
    );
  }

  // showInfo must be boolean
  if (config.showInfo !== undefined && typeof config.showInfo !== 'boolean') {
    throw new ConfigError(
      'Invalid config: "showInfo" must be a boolean',
      {},
      {
        configDetails: {
          property: 'showInfo',
          value: typeof config.showInfo,
          expectedFormat: 'boolean',
          constraint: 'must be true or false',
        },
      }
    );
  }

  return true;
}

/**
 * Configuration Parser
 *
 * Loads and merges API Guardian configurations from files
 * and command-line overrides.
 */
export class ConfigParser {
  private loadedConfigs: Map<string, ApiGuardianConfig> = new Map();

  /**
   * Load a configuration file
   *
   * @param filePath - Path to config file (.api-guardian.yaml, .api-guardian.json, etc.)
   * @returns Loaded configuration
   * @throws ConfigError if file not found or invalid
   *
   * @example
   * ```typescript
   * const parser = new ConfigParser();
   * const config = await parser.loadConfig('.api-guardian.yaml');
   * ```
   */
  public async loadConfig(filePath: string): Promise<ApiGuardianConfig> {
    logger.debug('Loading config file', { filePath });

    // Check cache
    if (this.loadedConfigs.has(filePath)) {
      logger.debug('Config loaded from cache', { filePath });
      return this.loadedConfigs.get(filePath)!;
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new ConfigError(
        `Config file not found: ${filePath}`,
        {},
        {
          isRecoverable: true,
          configDetails: {
            property: 'configPath',
            value: filePath,
            expectedFormat: 'valid file path',
            constraint: 'file must exist',
          },
          suggestion: `Check that the config file exists at: ${filePath}`,
        }
      );
    }

    // Read file
    let content: string;
    try {
      content = fs.readFileSync(filePath, 'utf-8');
      logger.debug('Config file read successfully', { size: content.length });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new ConfigError(
        `Failed to read config file: ${message}`,
        {},
        {
          isRecoverable: false,
          configDetails: {
            property: 'configPath',
            value: filePath,
            expectedFormat: 'readable file',
            constraint: 'must have read permissions',
          },
          suggestion: `Check file permissions for: ${filePath}`,
          originalError: error instanceof Error ? error : undefined,
        }
      );
    }

    // Detect format and parse
    const ext = path.extname(filePath).toLowerCase();
    let parsed: Record<string, unknown>;

    if (ext === '.json') {
      try {
        parsed = JSON.parse(content) as Record<string, unknown>;
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        throw new ConfigError(
          `Failed to parse config JSON: ${msg}`,
          {},
          {
            configDetails: {
              property: 'root',
              expectedFormat: 'valid JSON',
              constraint: 'must be valid JSON syntax',
            },
          }
        );
      }
    } else {
      // Default to YAML for .yaml, .yml, or unknown extensions
      parsed = parseYAML(content);
    }

    // Validate
    validateConfig(parsed);

    const config = parsed as ApiGuardianConfig;

    // Cache it
    this.loadedConfigs.set(filePath, config);

    logger.info('Config loaded successfully', {
      filePath,
      hasRules: !!config.rules,
      hasRulesets: !!config.rulesets,
    });

    return config;
  }

  /**
   * Load and resolve configuration with extends
   *
   * @param filePath - Path to config file
   * @returns Resolved configuration with all extends processed
   * @throws ConfigError if loading or resolving fails
   */
  public async loadAndResolve(filePath: string): Promise<ResolvedConfig> {
    logger.debug('Loading and resolving config', { filePath });

    const config = await this.loadConfig(filePath);
    const resolved = await this.resolveExtends(config, filePath);

    return {
      ...resolved,
      configPath: filePath,
    };
  }

  /**
   * Resolve extends in configuration
   *
   * Processes the extends field to merge parent configurations
   *
   * @param config - Configuration to resolve
   * @param basePath - Base path for relative extends paths
   * @returns Resolved configuration
   * @throws ConfigError if extends resolution fails
   */
  private async resolveExtends(
    config: ApiGuardianConfig,
    basePath: string
  ): Promise<ApiGuardianConfig> {
    if (!config.extends) {
      return config;
    }

    const extendsArray = Array.isArray(config.extends) ? config.extends : [config.extends];

    let merged: ApiGuardianConfig = DEFAULT_CONFIG;

    for (const ext of extendsArray) {
      logger.debug('Resolving extends', { extends: ext });

      let extConfig: ApiGuardianConfig;

      if (ext.includes('/') || ext.includes('\\')) {
        // File path - recursively resolve extends in the extended file
        const extPath = path.resolve(path.dirname(basePath), ext);
        const loadedConfig = await this.loadConfig(extPath);
        extConfig = await this.resolveExtends(loadedConfig, extPath);
      } else {
        // Preset ruleset (spectral:oas, api-guardian:recommended, etc.)
        const [namespace, preset] = ext.split(':');

        if (namespace === 'api-guardian' || namespace === 'preset') {
          const ruleset = getPresetRuleset(preset);
          if (!ruleset) {
            throw new ConfigError(
              `Unknown preset ruleset: ${ext}`,
              {},
              {
                configDetails: {
                  property: 'extends',
                  value: ext,
                  expectedFormat: 'api-guardian:strict|standard|lenient or valid file path',
                  constraint: 'must reference valid preset or file',
                },
                suggestion: `Use one of: api-guardian:strict, api-guardian:standard, api-guardian:lenient`,
              }
            );
          }

          // Create config from ruleset
          extConfig = {
            rulesets: {
              [preset]: ruleset,
            },
          };
        } else if (namespace === 'spectral') {
          // Phase 2: Spectral integration
          logger.debug('Spectral preset not yet supported', { preset });
          continue;
        } else {
          throw new ConfigError(
            `Unknown extends namespace: ${namespace}`,
            {},
            {
              configDetails: {
                property: 'extends',
                value: ext,
                expectedFormat: 'api-guardian:preset or spectral:preset',
                constraint: 'must use known namespace',
              },
              suggestion: `Use api-guardian:strict, api-guardian:standard, or api-guardian:lenient`,
            }
          );
        }
      }

      // Merge with existing
      merged = this.mergeConfigs(merged, extConfig);
    }

    // Finally merge the provided config on top
    merged = this.mergeConfigs(merged, config);

    return merged;
  }

  /**
   * Merge two configurations
   *
   * Child config overrides parent config
   *
   * @param parent - Parent configuration
   * @param child - Child configuration
   * @returns Merged configuration
   */
  private mergeConfigs(parent: ApiGuardianConfig, child: ApiGuardianConfig): ApiGuardianConfig {
    return {
      // Scalar values: child overrides parent
      defaultSeverity: child.defaultSeverity ?? parent.defaultSeverity,
      failOnWarnings:
        child.failOnWarnings !== undefined ? child.failOnWarnings : parent.failOnWarnings,
      showInfo: child.showInfo !== undefined ? child.showInfo : parent.showInfo,

      // Arrays: child replaces parent
      files: child.files ?? parent.files,

      // Objects: deep merge
      rules: {
        ...parent.rules,
        ...child.rules,
      },
      rulesets: {
        ...parent.rulesets,
        ...child.rulesets,
      },

      // Custom properties: child overrides
      ...Object.entries(child)
        .filter(
          ([key]) =>
            ![
              'defaultSeverity',
              'failOnWarnings',
              'showInfo',
              'files',
              'rules',
              'rulesets',
              'extends',
            ].includes(key)
        )
        .reduce(
          (acc, [key, value]) => {
            acc[key] = value;
            return acc;
          },
          {} as Record<string, unknown>
        ),
    };
  }

  /**
   * Apply CLI overrides to configuration
   *
   * CLI options take precedence over config file settings
   *
   * @param config - Base configuration
   * @param overrides - CLI options to apply
   * @returns Configuration with overrides applied
   */
  public applyOverrides(config: ResolvedConfig, overrides: CliOverrides): ResolvedConfig {
    logger.debug('Applying CLI overrides', {
      ruleset: overrides.ruleset,
      failSeverity: overrides.failSeverity,
      verbose: overrides.verbose,
    });

    const result: ResolvedConfig = { ...config };

    // Ruleset override
    if (overrides.ruleset) {
      const ruleset = getPresetRuleset(overrides.ruleset);
      if (ruleset) {
        if (!result.rulesets) {
          result.rulesets = {};
        }
        result.rulesets[overrides.ruleset] = ruleset;
        result.activeRuleset = overrides.ruleset;
      }
    }

    // File paths override
    if (overrides.ignorePaths && result.files) {
      result.files = result.files.map((file) => ({
        ...file,
        ignore: [...(file.ignore ?? []), ...overrides.ignorePaths!],
      }));
    }

    // Output format override
    if (overrides.format) {
      result.outputFormat = overrides.format;
    }

    // Verbose flag
    if (overrides.verbose) {
      result.verbose = true;
    }

    // Watch flag
    if (overrides.watch) {
      result.watch = true;
    }

    // Fix flag
    if (overrides.fix) {
      result.fix = true;
    }

    return result;
  }

  /**
   * Clear cached configurations
   */
  public clearCache(): void {
    this.loadedConfigs.clear();
    logger.debug('Config cache cleared');
  }

  /**
   * Get cache statistics
   *
   * @returns Cache stats
   */
  public getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.loadedConfigs.size,
      entries: Array.from(this.loadedConfigs.keys()),
    };
  }
}

/**
 * Create a new ConfigParser instance
 *
 * @returns ConfigParser instance
 */
export function createConfigParser(): ConfigParser {
  return new ConfigParser();
}
