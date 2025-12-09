/**
 * Rule Registry
 *
 * Manages the registration, retrieval, and configuration of validation rules.
 * Provides a centralized registry for built-in and custom rules.
 */

import { createLogger } from '../logger';
import type { Rule, RuleCategory, RuleConfig } from '../interfaces';
import { IssueSeverity } from '../interfaces';

const logger = createLogger('core', 'rule-registry');

/**
 * Rule Registry
 *
 * Manages rule lifecycle: registration, retrieval, enabling/disabling,
 * and configuration overrides.
 */
export class RuleRegistry {
  private rules: Map<string, Rule> = new Map();
  private ruleCategories: Map<RuleCategory, Set<string>> = new Map();
  private overrides: Map<string, RuleConfig> = new Map();

  /**
   * Register a rule
   *
   * @param rule - Rule to register
   * @throws Error if rule ID already exists
   *
   * @example
   * ```typescript
   * const registry = new RuleRegistry();
   * registry.register({
   *   id: 'operation-description',
   *   name: 'Operation Description',
   *   description: 'Operations must have descriptions',
   *   severity: IssueSeverity.ERROR,
   *   category: RuleCategory.DOCUMENTATION,
   *   fn: (spec) => []
   * });
   * ```
   */
  public register(rule: Rule): void {
    if (this.rules.has(rule.id)) {
      throw new Error(`Rule with ID "${rule.id}" is already registered`);
    }

    this.rules.set(rule.id, rule);
    logger.debug('Rule registered', { ruleId: rule.id, category: rule.category });

    // Track by category
    if (!this.ruleCategories.has(rule.category)) {
      this.ruleCategories.set(rule.category, new Set());
    }
    this.ruleCategories.get(rule.category)!.add(rule.id);
  }

  /**
   * Register multiple rules at once
   *
   * @param rules - Rules to register
   */
  public registerBatch(rules: Rule[]): void {
    for (const rule of rules) {
      this.register(rule);
    }
    logger.info('Batch registered rules', { count: rules.length });
  }

  /**
   * Get a rule by ID
   *
   * @param ruleId - Rule ID to retrieve
   * @returns Rule or undefined if not found
   */
  public get(ruleId: string): Rule | undefined {
    return this.rules.get(ruleId);
  }

  /**
   * Get all registered rules
   *
   * @returns Array of all rules
   */
  public getAll(): Rule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Get rules by category
   *
   * @param category - Rule category
   * @returns Array of rules in category
   */
  public getByCategory(category: RuleCategory): Rule[] {
    const ruleIds = this.ruleCategories.get(category) ?? new Set();
    return Array.from(ruleIds)
      .map((id) => this.rules.get(id))
      .filter((rule) => rule !== undefined) as Rule[];
  }

  /**
   * Check if a rule is registered
   *
   * @param ruleId - Rule ID to check
   * @returns True if rule exists
   */
  public has(ruleId: string): boolean {
    return this.rules.has(ruleId);
  }

  /**
   * Apply configuration overrides to rules
   *
   * Overrides allow enabling/disabling rules and changing severity levels
   *
   * @param ruleConfigs - Map of rule ID to config
   */
  public applyOverrides(ruleConfigs: Record<string, boolean | RuleConfig>): void {
    for (const [ruleId, config] of Object.entries(ruleConfigs)) {
      if (typeof config === 'boolean') {
        // Simple enable/disable
        const override: RuleConfig = { enabled: config };
        this.overrides.set(ruleId, override);
        logger.debug('Applied rule override', { ruleId, enabled: config });
      } else {
        // Complex override with severity and options
        this.overrides.set(ruleId, config);
        logger.debug('Applied rule override', {
          ruleId,
          severity: config.severity,
          enabled: config.enabled,
        });
      }
    }
  }

  /**
   * Get effective rule configuration
   *
   * Returns the rule merged with any overrides
   *
   * @param ruleId - Rule ID
   * @param defaultSeverity - Default severity level to use
   * @returns Effective rule configuration
   */
  public getEffectiveRule(ruleId: string, defaultSeverity?: IssueSeverity): Rule | null {
    const rule = this.rules.get(ruleId);
    if (!rule) {
      return null;
    }

    const override = this.overrides.get(ruleId);
    if (!override) {
      return rule;
    }

    // Merge rule with override
    return {
      ...rule,
      enabled: override.enabled ?? rule.enabled,
      severity: override.severity ?? (defaultSeverity || rule.severity),
      options: {
        ...rule.options,
        ...override.options,
      },
    };
  }

  /**
   * Check if a rule should be executed
   *
   * A rule should execute if it's enabled (defaults to true)
   *
   * @param ruleId - Rule ID
   * @returns True if rule should execute
   */
  public isEnabled(ruleId: string): boolean {
    const rule = this.getEffectiveRule(ruleId);
    if (!rule) {
      return false;
    }
    return rule.enabled !== false; // Default to enabled
  }

  /**
   * Clear all overrides
   */
  public clearOverrides(): void {
    this.overrides.clear();
    logger.debug('Rule overrides cleared');
  }

  /**
   * Get all registered rule IDs
   *
   * @returns Array of rule IDs
   */
  public getAllIds(): string[] {
    return Array.from(this.rules.keys());
  }

  /**
   * Get all categories that have rules
   *
   * @returns Array of categories with registered rules
   */
  public getAllCategories(): RuleCategory[] {
    return Array.from(this.ruleCategories.keys());
  }

  /**
   * Get count of registered rules
   *
   * @returns Total number of registered rules
   */
  public getCount(): number {
    return this.rules.size;
  }

  /**
   * Get registry statistics
   *
   * @returns Registry stats
   */
  public getStats(): {
    totalRules: number;
    rulesByCategory: Record<string, number>;
    enabledRules: number;
    overridesApplied: number;
  } {
    const rulesByCategory: Record<string, number> = {};
    for (const [category, ruleIds] of this.ruleCategories.entries()) {
      rulesByCategory[category] = ruleIds.size;
    }

    let enabledRules = 0;
    for (const rule of this.rules.values()) {
      if (this.isEnabled(rule.id)) {
        enabledRules++;
      }
    }

    return {
      totalRules: this.rules.size,
      rulesByCategory,
      enabledRules,
      overridesApplied: this.overrides.size,
    };
  }

  /**
   * Clear all rules
   *
   * Useful for testing or resetting the registry
   */
  public clear(): void {
    this.rules.clear();
    this.ruleCategories.clear();
    this.overrides.clear();
    logger.debug('Rule registry cleared');
  }
}

/**
 * Create a new RuleRegistry instance
 *
 * @returns RuleRegistry instance
 */
export function createRuleRegistry(): RuleRegistry {
  return new RuleRegistry();
}
