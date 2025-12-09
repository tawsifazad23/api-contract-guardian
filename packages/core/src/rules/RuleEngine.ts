/**
 * Rule Engine
 *
 * Executes validation rules against OpenAPI specifications.
 * Collects validation issues and provides execution statistics.
 */

import { createLogger } from '../logger';
import { RuleRegistry } from './RuleRegistry';
import type { ValidationIssue, IssueSeverity, OpenAPISpec } from '../interfaces';

const logger = createLogger('core', 'rule-engine');

/**
 * Execution statistics for a rule
 */
export interface RuleExecutionStats {
  ruleId: string;
  executed: boolean;
  issuesFound: number;
  executionTime: number;
  error?: string;
}

/**
 * Rule Engine
 *
 * Executes registered rules against OpenAPI specs and collects issues.
 */
export class RuleEngine {
  private registry: RuleRegistry;

  /**
   * Create a new RuleEngine
   *
   * @param registry - RuleRegistry with registered rules
   */
  constructor(registry: RuleRegistry) {
    this.registry = registry;
  }

  /**
   * Execute a single rule
   *
   * @param ruleId - Rule ID to execute
   * @param spec - OpenAPI spec to validate
   * @param defaultSeverity - Default severity level
   * @returns Array of validation issues and execution stats
   */
  public executeRule(
    ruleId: string,
    spec: OpenAPISpec,
    defaultSeverity?: IssueSeverity
  ): { issues: ValidationIssue[]; stats: RuleExecutionStats } {
    const startTime = performance.now();

    const stats: RuleExecutionStats = {
      ruleId,
      executed: false,
      issuesFound: 0,
      executionTime: 0,
    };

    try {
      // Check if rule is registered
      const rule = this.registry.get(ruleId);
      if (!rule) {
        logger.warn('Rule not found', { ruleId });
        stats.error = `Rule "${ruleId}" not found`;
        stats.executionTime = performance.now() - startTime;
        return { issues: [], stats };
      }

      // Check if rule is enabled
      if (!this.registry.isEnabled(ruleId)) {
        logger.debug('Rule skipped (disabled)', { ruleId });
        stats.executionTime = performance.now() - startTime;
        return { issues: [], stats };
      }

      // Get effective rule configuration
      const effectiveRule = this.registry.getEffectiveRule(ruleId, defaultSeverity);
      if (!effectiveRule) {
        stats.error = `Could not resolve rule configuration for "${ruleId}"`;
        stats.executionTime = performance.now() - startTime;
        return { issues: [], stats };
      }

      // Execute rule function
      logger.debug('Executing rule', { ruleId });
      const rawResults = effectiveRule.fn(spec, effectiveRule.options);

      // Convert raw results to ValidationIssue[]
      const issues = this.normalizeResults(rawResults, ruleId, rule.name, effectiveRule.severity);

      stats.executed = true;
      stats.issuesFound = issues.length;
      stats.executionTime = performance.now() - startTime;

      if (issues.length > 0) {
        logger.debug('Rule execution found issues', {
          ruleId,
          issuesFound: issues.length,
          time: stats.executionTime.toFixed(2),
        });
      }

      return { issues, stats };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('Rule execution failed', { ruleId, error: message });
      stats.error = message;
      stats.executionTime = performance.now() - startTime;
      return { issues: [], stats };
    }
  }

  /**
   * Execute all enabled rules
   *
   * @param spec - OpenAPI spec to validate
   * @param ruleIds - Specific rule IDs to execute (optional, all if not provided)
   * @param defaultSeverity - Default severity level
   * @returns Array of all validation issues and execution stats
   */
  public executeAll(
    spec: OpenAPISpec,
    ruleIds?: string[],
    defaultSeverity?: IssueSeverity
  ): {
    issues: ValidationIssue[];
    stats: RuleExecutionStats[];
    totalTime: number;
  } {
    const startTime = performance.now();
    const toExecute = ruleIds || this.registry.getAllIds();
    const allIssues: ValidationIssue[] = [];
    const executionStats: RuleExecutionStats[] = [];

    logger.info('Starting rule execution', {
      rulesToExecute: toExecute.length,
      totalRegistered: this.registry.getCount(),
    });

    for (const ruleId of toExecute) {
      const { issues, stats } = this.executeRule(ruleId, spec, defaultSeverity);
      allIssues.push(...issues);
      executionStats.push(stats);
    }

    const totalTime = performance.now() - startTime;

    logger.info('Rule execution completed', {
      rulesExecuted: executionStats.filter((s) => s.executed).length,
      totalIssuesFound: allIssues.length,
      totalTime: totalTime.toFixed(2),
    });

    return { issues: allIssues, stats: executionStats, totalTime };
  }

  /**
   * Normalize rule function results to ValidationIssue[]
   *
   * Rules can return various formats; this normalizes them
   *
   * @param results - Raw results from rule function
   * @param ruleId - Rule ID
   * @param ruleName - Human-readable rule name
   * @param severity - Issue severity level
   * @returns Normalized ValidationIssue array
   */
  private normalizeResults(
    results: unknown,
    ruleId: string,
    ruleName: string,
    severity: IssueSeverity
  ): ValidationIssue[] {
    if (!Array.isArray(results)) {
      return [];
    }

    return results
      .map((result, index) => {
        if (!result || typeof result !== 'object') {
          return null;
        }

        const obj = result as Record<string, unknown>;

        // Skip objects without message property
        if (!('message' in obj)) {
          logger.warn('Invalid rule result', {
            ruleId,
            resultIndex: index,
            resultType: typeof result,
          });
          return null;
        }

        // Convert to ValidationIssue, merging with rule metadata
        return {
          ruleId: (obj.ruleId as string) || ruleId,
          ruleDescription: (obj.ruleDescription as string) || ruleName,
          severity: (obj.severity as IssueSeverity) || severity,
          path: (obj.path as string) || 'root',
          line: (obj.line as number) || undefined,
          column: (obj.column as number) || undefined,
          message: (obj.message as string) || '',
          suggestion: (obj.suggestion as string) || undefined,
          category: (obj.category as string) || undefined,
        } as ValidationIssue;
      })
      .filter((issue) => issue !== null) as ValidationIssue[];
  }

  /**
   * Get rule statistics
   *
   * @returns Statistics about registered rules
   */
  public getRuleStats() {
    return this.registry.getStats();
  }

  /**
   * Get registry reference
   *
   * @returns RuleRegistry instance
   */
  public getRegistry(): RuleRegistry {
    return this.registry;
  }
}

/**
 * Create a new RuleEngine
 *
 * @param registry - RuleRegistry with registered rules
 * @returns RuleEngine instance
 */
export function createRuleEngine(registry: RuleRegistry): RuleEngine {
  return new RuleEngine(registry);
}
