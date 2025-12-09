/**
 * Validator interface and types
 *
 * Defines the contract for the main validation orchestrator
 * that coordinates spec loading, rule execution, and reporting.
 */

import { ValidationResult } from './ValidationResult';
import { ResolvedConfig, CliOverrides } from './Config';
import { OpenAPISpec } from './OpenAPISpec';
import { Rule } from './Rule';

/**
 * Options for validator initialization
 */
export interface ValidatorOptions {
  /**
   * Path to configuration file (defaults to .api-guardian.yaml)
   */
  configPath?: string;

  /**
   * CLI option overrides for configuration
   */
  cliOverrides?: CliOverrides;

  /**
   * Whether to cache specs between validations
   */
  cacheSpecs?: boolean;

  /**
   * Timeout for validation in milliseconds
   */
  timeout?: number;
}

/**
 * Main validator orchestrator interface
 *
 * The Validator is responsible for:
 * 1. Loading configuration from files
 * 2. Loading and parsing OpenAPI specifications
 * 3. Executing rules against specs
 * 4. Collecting and formatting results
 *
 * @example
 * ```typescript
 * const validator = new ValidatorImpl(options);
 *
 * const result = await validator.validate('openapi.yaml');
 * console.log(result.issues);
 * ```
 */
export interface Validator {
  /**
   * Initialize the validator (async setup if needed)
   */
  initialize(): Promise<void>;

  /**
   * Validate a single OpenAPI spec file
   *
   * @param specPath - Path to the OpenAPI spec file
   * @param config - Optional configuration overrides
   * @returns Validation result with all issues found
   */
  validate(specPath: string, config?: ResolvedConfig): Promise<ValidationResult>;

  /**
   * Validate multiple spec files
   *
   * @param specPaths - Array of spec file paths or glob pattern
   * @param config - Optional configuration overrides
   * @returns Array of validation results
   */
  validateMultiple(specPaths: string[], config?: ResolvedConfig): Promise<ValidationResult[]>;

  /**
   * Load and parse an OpenAPI specification
   *
   * @param specPath - Path to the spec file
   * @returns Loaded and parsed specification
   * @throws SpecLoadError if spec cannot be loaded or parsed
   */
  loadSpec(specPath: string): Promise<OpenAPISpec>;

  /**
   * Register a custom rule
   *
   * @param rule - Rule to register
   */
  registerRule(rule: Rule): void;

  /**
   * Register multiple rules
   *
   * @param rules - Rules to register
   */
  registerRules(rules: Rule[]): void;

  /**
   * Get a rule by ID
   *
   * @param ruleId - Rule identifier
   * @returns Rule or undefined if not found
   */
  getRule(ruleId: string): Rule | undefined;

  /**
   * Get all registered rules
   *
   * @returns Array of all registered rules
   */
  getAllRules(): Rule[];

  /**
   * Get current configuration
   *
   * @returns Current resolved configuration
   */
  getConfig(): ResolvedConfig;

  /**
   * Update configuration
   *
   * @param config - New configuration
   */
  updateConfig(config: ResolvedConfig): void;

  /**
   * Get validator version
   *
   * @returns Version string
   */
  getVersion(): string;

  /**
   * Cleanup resources and shutdown
   */
  shutdown(): Promise<void>;
}

/**
 * Rule execution result
 */
export interface RuleExecutionResult {
  /**
   * The rule that was executed
   */
  rule: Rule;

  /**
   * Issues found by this rule
   */
  issues: unknown[];

  /**
   * Execution time in milliseconds
   */
  executionTime: number;

  /**
   * Whether execution was successful
   */
  success: boolean;

  /**
   * Error message if execution failed
   */
  error?: string;
}

/**
 * Validator factory for creating validator instances
 */
export interface ValidatorFactory {
  /**
   * Create a new validator instance
   *
   * @param options - Validator configuration options
   * @returns New validator instance
   */
  create(options?: ValidatorOptions): Validator;

  /**
   * Create a validator with default built-in rules
   *
   * @param options - Validator configuration options
   * @returns New validator with built-in rules
   */
  createWithBuiltins(options?: ValidatorOptions): Validator;
}
