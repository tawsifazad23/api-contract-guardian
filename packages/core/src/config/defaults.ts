/**
 * Default configurations for API Guardian
 *
 * Provides preset rulesets for different validation strictness levels
 * and baseline configurations for quick setup.
 */

import { IssueSeverity } from '../interfaces';
import type { ApiGuardianConfig, RulesetDefinition, RulesetLevel } from '../interfaces';

/**
 * Strict ruleset - enforces all rules at error level
 * Best for production APIs requiring high standards
 */
export const STRICT_RULESET: RulesetDefinition = {
  defaultSeverity: IssueSeverity.ERROR,
  rules: {
    // Structural rules
    'paths-required': true,
    'info-required': true,
    'operation-id-required': true,
    'operation-tags-required': true,
    'operation-description-required': true,
    'schema-properties-required': true,

    // Documentation rules
    'operation-description': { enabled: true, severity: IssueSeverity.ERROR },
    'operation-summary': { enabled: true, severity: IssueSeverity.WARNING },
    'parameter-description': { enabled: true, severity: IssueSeverity.WARNING },
    'schema-description': { enabled: true, severity: IssueSeverity.WARNING },

    // REST rules
    'path-naming-convention': {
      enabled: true,
      severity: IssueSeverity.ERROR,
      options: { casing: 'kebab' },
    },
    'http-status-codes': { enabled: true, severity: IssueSeverity.ERROR },
    'success-response-required': { enabled: true, severity: IssueSeverity.ERROR },
    'error-response-required': { enabled: true, severity: IssueSeverity.ERROR },

    // Governance rules
    'version-format': { enabled: true, severity: IssueSeverity.ERROR },
    'contact-info-required': { enabled: true, severity: IssueSeverity.WARNING },

    // Security rules
    'no-api-key-in-url': { enabled: true, severity: IssueSeverity.ERROR },
    'require-correlation-id': { enabled: true, severity: IssueSeverity.ERROR },
  },
};

/**
 * Standard ruleset - balanced validation
 * Recommended for most APIs
 */
export const STANDARD_RULESET: RulesetDefinition = {
  defaultSeverity: IssueSeverity.WARNING,
  extends: 'strict',
  rules: {
    // Loosen some warnings to info in standard mode
    'operation-summary': { enabled: true, severity: IssueSeverity.INFO },
    'parameter-description': { enabled: true, severity: IssueSeverity.INFO },
    'schema-description': { enabled: true, severity: IssueSeverity.INFO },
    'contact-info-required': { enabled: true, severity: IssueSeverity.INFO },
  },
};

/**
 * Lenient ruleset - minimal validation
 * For non-production or legacy APIs
 */
export const LENIENT_RULESET: RulesetDefinition = {
  defaultSeverity: IssueSeverity.WARNING,
  rules: {
    // Only enforce critical structural rules
    'paths-required': true,
    'info-required': true,
    'operation-tags-required': true,
    'operation-description-required': true,

    // REST essentials
    'http-status-codes': { enabled: true, severity: IssueSeverity.WARNING },
    'success-response-required': { enabled: true, severity: IssueSeverity.WARNING },

    // Security critical
    'no-api-key-in-url': { enabled: true, severity: IssueSeverity.ERROR },
  },
};

/**
 * Default API Guardian configuration
 * Used as baseline when no config file is provided
 */
export const DEFAULT_CONFIG: ApiGuardianConfig = {
  defaultSeverity: IssueSeverity.WARNING,
  failOnWarnings: false,
  showInfo: true,
  files: [
    {
      pattern: 'openapi.{json,yaml,yml}',
    },
    {
      pattern: 'api/**/*.{json,yaml,yml}',
      ignore: ['**/node_modules/**', '**/.git/**'],
    },
  ],
  rulesets: {
    strict: STRICT_RULESET,
    standard: STANDARD_RULESET,
    lenient: LENIENT_RULESET,
  },
};

/**
 * Get preset ruleset by level
 *
 * @param level - Ruleset level (strict, standard, lenient)
 * @returns Ruleset definition or null if not found
 */
export function getPresetRuleset(level: RulesetLevel | string): RulesetDefinition | null {
  const rulesets: Record<string, RulesetDefinition> = {
    strict: STRICT_RULESET,
    standard: STANDARD_RULESET,
    lenient: LENIENT_RULESET,
  };

  return rulesets[level] ?? null;
}

/**
 * Merge two ruleset definitions with proper inheritance
 *
 * @param parent - Parent/base ruleset
 * @param child - Child ruleset to merge
 * @returns Merged ruleset definition
 */
export function mergeRulesets(
  parent: RulesetDefinition,
  child: RulesetDefinition
): RulesetDefinition {
  return {
    defaultSeverity: child.defaultSeverity ?? parent.defaultSeverity,
    rules: {
      ...parent.rules,
      ...child.rules,
    },
    extends: child.extends ?? parent.extends,
  };
}
