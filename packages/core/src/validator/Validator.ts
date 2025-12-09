/**
 * Validator Orchestrator
 *
 * Main orchestration class that coordinates all validation components:
 * - Loads OpenAPI specifications
 * - Parses configuration
 * - Registers rules
 * - Executes validation
 * - Formats and returns results
 */

import { createLogger } from '../logger';
import { SpecLoader } from '../loader/SpecLoader';
import { ConfigParser } from '../config/ConfigParser';
import { RuleRegistry, createRuleRegistry } from '../rules/RuleRegistry';
import { RuleEngine, createRuleEngine } from '../rules/RuleEngine';
import { BUILTIN_RULES } from '../rules/builtIn';
import type {
  Rule,
  OpenAPISpec,
  ValidationResult,
  Config,
  RuleConfig,
  IssueSeverity,
} from '../interfaces';
import { IssueSeverity as IssueSeverityEnum } from '../interfaces';

const logger = createLogger('core', 'validator');

/**
 * Configuration for Validator
 */
export interface ValidatorConfig {
  /**
   * Configuration object or path to config file
   */
  config?: Config | string;

  /**
   * Whether to use built-in rules
   */
  useBuiltInRules?: boolean;

  /**
   * Additional custom rules to register
   */
  customRules?: Rule[];
}

/**
 * Validator Orchestrator
 *
 * Main class for orchestrating OpenAPI validation
 */
export class Validator {
  private specLoader: SpecLoader;
  private configParser: ConfigParser;
  private registry: RuleRegistry;
  private engine: RuleEngine;
  private config?: Config;

  /**
   * Create a new Validator
   *
   * @param validatorConfig - Validator configuration
   */
  constructor(validatorConfig?: ValidatorConfig) {
    logger.debug('Initializing Validator');

    this.specLoader = new SpecLoader();
    this.configParser = new ConfigParser();
    this.registry = createRuleRegistry();
    this.engine = createRuleEngine(this.registry);

    // Load configuration if provided
    if (validatorConfig?.config) {
      this.config = this.initializeConfig(validatorConfig.config);
    }

    // Register built-in rules
    if (validatorConfig?.useBuiltInRules !== false) {
      this.registry.registerBatch(BUILTIN_RULES);
      logger.info('Registered built-in rules', { count: BUILTIN_RULES.length });
    }

    // Register custom rules
    if (validatorConfig?.customRules) {
      this.registry.registerBatch(validatorConfig.customRules);
      logger.info('Registered custom rules', { count: validatorConfig.customRules.length });
    }

    // Apply configuration overrides if available
    if (this.config?.rules) {
      this.registry.applyOverrides(this.config.rules);
      logger.debug('Applied rule configuration overrides');
    }
  }

  /**
   * Initialize configuration from file or object
   *
   * @param config - Configuration object or file path
   * @returns Loaded configuration
   */
  private async initializeConfigAsync(config: Config | string): Promise<Config> {
    if (typeof config === 'string') {
      logger.debug('Loading configuration from file', { path: config });
      return await this.configParser.loadConfig(config);
    }
    return config;
  }

  /**
   * Validate an OpenAPI specification
   *
   * @param specPath - Path to OpenAPI specification file
   * @param defaultSeverity - Default severity level for issues
   * @returns Validation result
   */
  public async validate(specPath: string, defaultSeverity?: IssueSeverity): Promise<ValidationResult> {
    const startTime = performance.now();

    try {
      logger.info('Starting validation', { specPath });

      // Load the specification
      const loadResult = await this.specLoader.load(specPath);
      if (!loadResult.success) {
        logger.error('Failed to load specification', {
          specPath,
          error: loadResult.error,
        });
        return {
          spec: null,
          valid: false,
          issues: [],
          stats: {
            rulesExecuted: 0,
            issuesFound: 0,
            executionTime: performance.now() - startTime,
            totalTime: performance.now() - startTime,
          },
          metadata: {
            validatedAt: new Date(),
            configPath: this.config ? 'provided' : undefined,
            ruleCount: this.registry.getCount(),
            warnings: loadResult.warnings,
            error: loadResult.error,
          },
        };
      }

      const spec = loadResult.spec;

      // Determine which rules to execute
      const enabledRuleIds = this.registry
        .getAllIds()
        .filter((id) => this.registry.isEnabled(id));

      // Execute all enabled rules
      const { issues, stats, totalTime } = this.engine.executeAll(
        spec,
        enabledRuleIds,
        defaultSeverity || IssueSeverityEnum.WARNING
      );

      // Determine if validation passed
      const errorCount = issues.filter((i) => i.severity === IssueSeverityEnum.ERROR).length;
      const valid = errorCount === 0;

      logger.info('Validation completed', {
        valid,
        issuesFound: issues.length,
        errorCount,
        totalTime: totalTime.toFixed(2),
      });

      return {
        spec,
        valid,
        issues,
        stats: {
          rulesExecuted: stats.filter((s) => s.executed).length,
          issuesFound: issues.length,
          executionTime: totalTime,
          totalTime: performance.now() - startTime,
        },
        metadata: {
          validatedAt: new Date(),
          configPath: this.config ? 'provided' : undefined,
          ruleCount: this.registry.getCount(),
          warnings: loadResult.warnings,
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('Validation error', { specPath, error: message });

      return {
        spec: null,
        valid: false,
        issues: [],
        stats: {
          rulesExecuted: 0,
          issuesFound: 0,
          executionTime: 0,
          totalTime: performance.now() - startTime,
        },
        metadata: {
          validatedAt: new Date(),
          configPath: this.config ? 'provided' : undefined,
          ruleCount: this.registry.getCount(),
          error: message,
        },
      };
    }
  }

  /**
   * Get the rule registry
   *
   * @returns RuleRegistry instance
   */
  public getRegistry(): RuleRegistry {
    return this.registry;
  }

  /**
   * Get the rule engine
   *
   * @returns RuleEngine instance
   */
  public getEngine(): RuleEngine {
    return this.engine;
  }

  /**
   * Get the current configuration
   *
   * @returns Config object or undefined
   */
  public getConfig(): Config | undefined {
    return this.config;
  }

  /**
   * Get validator statistics
   *
   * @returns Statistics about registered rules
   */
  public getStats() {
    return this.registry.getStats();
  }

  /**
   * Register a custom rule
   *
   * @param rule - Rule to register
   */
  public registerRule(rule: Rule): void {
    this.registry.register(rule);
    logger.debug('Rule registered', { ruleId: rule.id });
  }

  /**
   * Register multiple custom rules
   *
   * @param rules - Rules to register
   */
  public registerRules(rules: Rule[]): void {
    this.registry.registerBatch(rules);
    logger.info('Rules registered', { count: rules.length });
  }

  /**
   * Apply rule configuration overrides
   *
   * @param ruleConfigs - Map of rule ID to config
   */
  public applyRuleOverrides(ruleConfigs: Record<string, boolean | RuleConfig>): void {
    this.registry.applyOverrides(ruleConfigs);
    logger.debug('Rule overrides applied');
  }
}

/**
 * Create a new Validator instance
 *
 * @param config - Validator configuration
 * @returns Validator instance
 */
export function createValidator(config?: ValidatorConfig): Validator {
  return new Validator(config);
}
