/**
 * Configuration interface and types
 *
 * Defines the structure of the .api-guardian.yaml configuration file
 * and how rules and rulesets are configured.
 */

import { IssueSeverity } from './ValidationResult';
import { RuleOverride } from './Rule';

/**
 * Preset ruleset levels
 *
 * @enum {string}
 */
export enum RulesetLevel {
  STRICT = 'strict',
  STANDARD = 'standard',
  LENIENT = 'lenient',
}

/**
 * Configuration for how to handle a single file/spec
 */
export interface FileConfig {
  /**
   * Glob pattern for files to validate
   * (e.g., "specs/**\/*.yaml", "api/openapi.json")
   */
  pattern: string;

  /**
   * Glob patterns to ignore
   * (e.g., ["node_modules/**", ".git/**"])
   */
  ignore?: string[];

  /**
   * Rules or rulesets to apply to these files
   */
  rules?: string | string[];
}

/**
 * Rule configuration with severity and options
 */
export interface RuleConfig {
  /**
   * Rule severity level
   */
  severity?: IssueSeverity;

  /**
   * Whether the rule is enabled
   */
  enabled?: boolean;

  /**
   * Rule-specific options
   */
  options?: Record<string, unknown>;
}

/**
 * Preset ruleset definition
 */
export interface RulesetDefinition {
  /**
   * Rules included in this ruleset
   */
  rules?: Record<string, boolean | RuleConfig>;

  /**
   * Parent rulesets to extend
   */
  extends?: string | string[];

  /**
   * Default severity level for all rules in this set
   */
  defaultSeverity?: IssueSeverity;
}

/**
 * API Guardian configuration
 *
 * This is the main configuration interface, typically loaded from .api-guardian.yaml
 *
 * @example
 * ```yaml
 * extends:
 *   - spectral:oas
 *   - api-guardian:recommended
 *
 * rules:
 *   operation-description:
 *     severity: error
 *
 *   require-correlation-id:
 *     severity: error
 *
 * rulesets:
 *   strict:
 *     extends:
 *       - spectral:oas
 *     rules:
 *       operation-description: true
 *       require-correlation-id:
 *         severity: error
 * ```
 */
export interface ApiGuardianConfig {
  /**
   * Existing rulesets or configurations to extend/inherit
   * @example ["spectral:oas", "api-guardian:recommended"]
   */
  extends?: string | string[];

  /**
   * Override or configure individual rules
   * @example
   * ```
   * rules:
   *   operation-description:
   *     severity: error
   *   custom-rule:
   *     enabled: true
   *     options:
   *       customOption: value
   * ```
   */
  rules?: Record<string, boolean | RuleConfig | RuleOverride>;

  /**
   * Define or configure custom rulesets
   */
  rulesets?: Record<string, RulesetDefinition>;

  /**
   * Files to validate
   */
  files?: FileConfig[];

  /**
   * Default severity level for rules
   */
  defaultSeverity?: IssueSeverity;

  /**
   * Whether to fail on warnings (not just errors)
   * @default false
   */
  failOnWarnings?: boolean;

  /**
   * Whether to show info messages
   * @default true
   */
  showInfo?: boolean;

  /**
   * Custom options/metadata
   */
  [key: string]: unknown;
}

/**
 * Merged/resolved configuration after processing extends and overrides
 */
export interface ResolvedConfig extends ApiGuardianConfig {
  /**
   * The configuration file path that was loaded
   */
  configPath?: string;

  /**
   * All rules that should be executed
   */
  resolvedRules?: Record<string, RuleConfig>;

  /**
   * The active ruleset
   */
  activeRuleset?: string;
}

/**
 * CLI options that can override config file settings
 */
export interface CliOverrides {
  /**
   * Config file path to use
   */
  configPath?: string;

  /**
   * Ruleset preset to use (overrides config)
   */
  ruleset?: RulesetLevel | string;

  /**
   * Minimum severity to fail on
   */
  failSeverity?: IssueSeverity;

  /**
   * Glob patterns to ignore
   */
  ignorePaths?: string[];

  /**
   * Output format
   */
  format?: string;

  /**
   * Output file path
   */
  outputPath?: string;

  /**
   * Whether to auto-fix issues
   */
  fix?: boolean;

  /**
   * Whether to watch for changes
   */
  watch?: boolean;

  /**
   * Verbose output
   */
  verbose?: boolean;
}
