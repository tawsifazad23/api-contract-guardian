/**
 * Rule interface and definitions
 *
 * Defines the contract for validation rules that are executed against OpenAPI specs.
 * Rules can be built-in or custom, following the Spectral rule format.
 */

import { IssueSeverity } from './ValidationResult';

/**
 * Rule function that performs validation
 *
 * A rule function takes the spec object and returns validation issues
 */
export type RuleFunction = (spec: unknown, options?: Record<string, unknown>) => unknown[];

/**
 * Rule category - groups rules by domain
 *
 * @enum {string}
 */
export enum RuleCategory {
  STRUCTURAL = 'structural',
  DOCUMENTATION = 'documentation',
  REST = 'rest',
  GOVERNANCE = 'governance',
  SECURITY = 'security',
}

/**
 * Configuration options for a rule
 */
export interface RuleOptions {
  /**
   * Custom rule configuration options
   */
  [key: string]: unknown;
}

/**
 * A validation rule that checks OpenAPI specs
 *
 * @example
 * ```typescript
 * const operationDescriptionRule: Rule = {
 *   id: 'operation-description',
 *   name: 'Operation Description',
 *   description: 'All operations must have descriptions',
 *   severity: IssueSeverity.ERROR,
 *   category: RuleCategory.DOCUMENTATION,
 *   enabled: true,
 *   fn: (spec) => {
 *     // Implementation returns violations
 *   }
 * };
 * ```
 */
export interface Rule {
  /**
   * Unique rule identifier
   * @example "operation-description"
   * @example "require-correlation-id"
   */
  id: string;

  /**
   * Human-readable rule name
   * @example "Operation Description"
   */
  name: string;

  /**
   * Detailed description of what the rule validates
   */
  description: string;

  /**
   * Default severity level for violations
   */
  severity: IssueSeverity;

  /**
   * Rule category for organization and filtering
   */
  category: RuleCategory;

  /**
   * Whether the rule is enabled by default
   * @default true
   */
  enabled?: boolean;

  /**
   * Whether violations from this rule can be auto-fixed
   * @default false
   */
  fixable?: boolean;

  /**
   * The actual validation function
   *
   * Should return an array of violations/issues found.
   * Each violation should include path, message, and other issue details.
   */
  fn: RuleFunction;

  /**
   * Optional rule options/configuration
   */
  options?: RuleOptions;
}

/**
 * Rule definition for Spectral-style rules
 *
 * This extends Rule to include Spectral-specific properties
 * like 'given' and 'then' for JSON Path-based validation
 */
export interface SpectralRule extends Rule {
  /**
   * JSON Path expression to select elements to validate
   * @example "$.paths[*][*]"
   * @example "$.components.schemas.*"
   */
  given?: string;

  /**
   * Spectral 'then' clause for validation
   */
  then?: Record<string, unknown>;

  /**
   * Function options for Spectral functions
   */
  functionOptions?: Record<string, unknown>;
}

/**
 * Rule override - allows modifying rule behavior in config
 */
export interface RuleOverride {
  /**
   * Rule ID to override
   */
  ruleId: string;

  /**
   * New severity level
   */
  severity?: IssueSeverity;

  /**
   * Whether to enable/disable the rule
   */
  enabled?: boolean;

  /**
   * Custom options for the rule
   */
  options?: RuleOptions;
}
