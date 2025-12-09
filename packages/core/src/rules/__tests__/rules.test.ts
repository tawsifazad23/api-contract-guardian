/**
 * Tests for RuleRegistry and RuleEngine
 */

import { RuleRegistry, createRuleRegistry, RuleEngine, createRuleEngine } from '../index';
import { RuleCategory, IssueSeverity, SpecFormat, OpenAPIVersion } from '../../interfaces';
import type { Rule, OpenAPISpec } from '../../interfaces';

describe('Rules Module', () => {
  let registry: RuleRegistry;
  let engine: RuleEngine;

  // Test rules
  const testRule1: Rule = {
    id: 'test-rule-1',
    name: 'Test Rule 1',
    description: 'A test rule for validation',
    severity: IssueSeverity.ERROR,
    category: RuleCategory.STRUCTURAL,
    enabled: true,
    fn: (spec) => {
      const issues = [];
      const apiSpec = spec as OpenAPISpec;
      if (!apiSpec.info?.title) {
        issues.push({
          ruleId: 'test-rule-1',
          message: 'Missing info.title',
          path: '$.info.title',
        });
      }
      return issues;
    },
  };

  const testRule2: Rule = {
    id: 'test-rule-2',
    name: 'Test Rule 2',
    description: 'Another test rule',
    severity: IssueSeverity.WARNING,
    category: RuleCategory.DOCUMENTATION,
    enabled: true,
    fn: (spec) => {
      const issues = [];
      const apiSpec = spec as OpenAPISpec;
      if (!apiSpec.info?.description) {
        issues.push({
          ruleId: 'test-rule-2',
          message: 'Missing info.description',
          path: '$.info.description',
        });
      }
      return issues;
    },
  };

  const testRule3: Rule = {
    id: 'test-rule-3',
    name: 'Test Rule 3',
    description: 'Rule with options',
    severity: IssueSeverity.INFO,
    category: RuleCategory.REST,
    fn: (spec, options) => {
      const minPaths = (options?.minPaths as number) || 1;
      const apiSpec = spec as OpenAPISpec;
      const pathCount = Object.keys(apiSpec.paths || {}).length;
      if (pathCount < minPaths) {
        return [
          {
            ruleId: 'test-rule-3',
            message: `Expected at least ${minPaths} paths, found ${pathCount}`,
            path: '$.paths',
          },
        ];
      }
      return [];
    },
    options: { minPaths: 1 },
  };

  const testSpec: OpenAPISpec = {
    openapi: '3.0.3',
    info: {
      title: 'Test API',
      version: '1.0.0',
    },
    paths: {
      '/api/test': {
        get: {
          summary: 'Get test',
          responses: {
            '200': {
              description: 'Success',
            },
          },
        },
      },
    },
    metadata: {
      filePath: 'openapi.yaml',
      format: SpecFormat.YAML,
      version: OpenAPIVersion.V3_0,
      loadedAt: new Date(),
      content: '{}',
    },
    _raw: {},
  };

  beforeEach(() => {
    registry = createRuleRegistry();
    engine = createRuleEngine(registry);
  });

  describe('RuleRegistry', () => {
    it('should create a RuleRegistry instance', () => {
      expect(registry).toBeInstanceOf(RuleRegistry);
    });

    it('should register a single rule', () => {
      registry.register(testRule1);

      expect(registry.get('test-rule-1')).toEqual(testRule1);
      expect(registry.has('test-rule-1')).toBe(true);
    });

    it('should register multiple rules', () => {
      registry.registerBatch([testRule1, testRule2, testRule3]);

      expect(registry.getCount()).toBe(3);
      expect(registry.get('test-rule-1')).toBeDefined();
      expect(registry.get('test-rule-2')).toBeDefined();
      expect(registry.get('test-rule-3')).toBeDefined();
    });

    it('should throw error on duplicate rule ID', () => {
      registry.register(testRule1);

      expect(() => {
        registry.register(testRule1);
      }).toThrow();
    });

    it('should return all registered rules', () => {
      registry.registerBatch([testRule1, testRule2, testRule3]);

      const all = registry.getAll();
      expect(all).toHaveLength(3);
      expect(all.map((r) => r.id)).toContain('test-rule-1');
      expect(all.map((r) => r.id)).toContain('test-rule-2');
      expect(all.map((r) => r.id)).toContain('test-rule-3');
    });

    it('should get rules by category', () => {
      registry.registerBatch([testRule1, testRule2, testRule3]);

      const structural = registry.getByCategory(RuleCategory.STRUCTURAL);
      expect(structural).toHaveLength(1);
      expect(structural[0].id).toBe('test-rule-1');

      const documentation = registry.getByCategory(RuleCategory.DOCUMENTATION);
      expect(documentation).toHaveLength(1);
      expect(documentation[0].id).toBe('test-rule-2');

      const rest = registry.getByCategory(RuleCategory.REST);
      expect(rest).toHaveLength(1);
      expect(rest[0].id).toBe('test-rule-3');
    });

    it('should apply simple enable/disable override', () => {
      registry.register(testRule1);

      registry.applyOverrides({ 'test-rule-1': false });
      expect(registry.isEnabled('test-rule-1')).toBe(false);

      registry.applyOverrides({ 'test-rule-1': true });
      expect(registry.isEnabled('test-rule-1')).toBe(true);
    });

    it('should apply severity override', () => {
      registry.register(testRule1);

      registry.applyOverrides({
        'test-rule-1': {
          severity: IssueSeverity.WARNING,
        },
      });

      const rule = registry.getEffectiveRule('test-rule-1');
      expect(rule?.severity).toBe(IssueSeverity.WARNING);
    });

    it('should apply multiple overrides', () => {
      registry.registerBatch([testRule1, testRule2]);

      registry.applyOverrides({
        'test-rule-1': {
          enabled: false,
          severity: IssueSeverity.WARNING,
        },
        'test-rule-2': {
          severity: IssueSeverity.ERROR,
        },
      });

      expect(registry.isEnabled('test-rule-1')).toBe(false);
      expect(registry.getEffectiveRule('test-rule-1')?.severity).toBe(IssueSeverity.WARNING);
      expect(registry.getEffectiveRule('test-rule-2')?.severity).toBe(IssueSeverity.ERROR);
    });

    it('should apply options override', () => {
      registry.register(testRule3);

      registry.applyOverrides({
        'test-rule-3': {
          options: { minPaths: 5 },
        },
      });

      const rule = registry.getEffectiveRule('test-rule-3');
      expect(rule?.options?.minPaths).toBe(5);
    });

    it('should use default severity in effective rule', () => {
      registry.register(testRule1);

      const rule = registry.getEffectiveRule('test-rule-1', IssueSeverity.INFO);
      expect(rule?.severity).toBe(IssueSeverity.ERROR); // Original severity
    });

    it('should override with default severity when not specified', () => {
      registry.register(testRule1);

      registry.applyOverrides({
        'test-rule-1': {
          enabled: true,
          // No severity specified
        },
      });

      const rule = registry.getEffectiveRule('test-rule-1', IssueSeverity.INFO);
      expect(rule?.severity).toBe(IssueSeverity.INFO); // Uses default
    });

    it('should clear overrides', () => {
      registry.register(testRule1);
      registry.applyOverrides({ 'test-rule-1': false });

      expect(registry.isEnabled('test-rule-1')).toBe(false);

      registry.clearOverrides();
      expect(registry.isEnabled('test-rule-1')).toBe(true);
    });

    it('should get all rule IDs', () => {
      registry.registerBatch([testRule1, testRule2, testRule3]);

      const ids = registry.getAllIds();
      expect(ids).toEqual(expect.arrayContaining(['test-rule-1', 'test-rule-2', 'test-rule-3']));
      expect(ids).toHaveLength(3);
    });

    it('should get all categories', () => {
      registry.registerBatch([testRule1, testRule2, testRule3]);

      const categories = registry.getAllCategories();
      expect(categories).toEqual(
        expect.arrayContaining([
          RuleCategory.STRUCTURAL,
          RuleCategory.DOCUMENTATION,
          RuleCategory.REST,
        ])
      );
    });

    it('should provide registry statistics', () => {
      registry.registerBatch([testRule1, testRule2, testRule3]);
      registry.applyOverrides({ 'test-rule-1': false });

      const stats = registry.getStats();
      expect(stats.totalRules).toBe(3);
      expect(stats.enabledRules).toBe(2);
      expect(stats.overridesApplied).toBe(1);
      expect(stats.rulesByCategory[RuleCategory.STRUCTURAL]).toBe(1);
      expect(stats.rulesByCategory[RuleCategory.DOCUMENTATION]).toBe(1);
      expect(stats.rulesByCategory[RuleCategory.REST]).toBe(1);
    });

    it('should clear registry', () => {
      registry.registerBatch([testRule1, testRule2, testRule3]);

      expect(registry.getCount()).toBe(3);
      registry.clear();
      expect(registry.getCount()).toBe(0);
      expect(registry.get('test-rule-1')).toBeUndefined();
    });

    it('should return undefined for non-existent rule', () => {
      expect(registry.get('non-existent')).toBeUndefined();
      expect(registry.getEffectiveRule('non-existent')).toBeNull();
      expect(registry.has('non-existent')).toBe(false);
    });
  });

  describe('RuleEngine', () => {
    it('should create a RuleEngine instance', () => {
      expect(engine).toBeInstanceOf(RuleEngine);
    });

    it('should execute a single rule', () => {
      registry.register(testRule1);

      const { stats } = engine.executeRule('test-rule-1', testSpec);

      expect(stats.ruleId).toBe('test-rule-1');
      expect(stats.executed).toBe(true);
      expect(stats.issuesFound).toBe(0); // Spec has title
      expect(stats.executionTime).toBeGreaterThan(0);
    });

    it('should find issues in spec', () => {
      const specWithoutTitle: OpenAPISpec = {
        ...testSpec,
        info: { version: '1.0.0' }, // No title
      };

      registry.register(testRule1);

      const { issues, stats } = engine.executeRule('test-rule-1', specWithoutTitle);

      expect(stats.issuesFound).toBe(1);
      expect(issues).toHaveLength(1);
      expect(issues[0].ruleId).toBe('test-rule-1');
      expect(issues[0].message).toContain('Missing info.title');
    });

    it('should skip disabled rules', () => {
      registry.register(testRule1);
      registry.applyOverrides({ 'test-rule-1': false });

      const { stats } = engine.executeRule('test-rule-1', testSpec);

      expect(stats.executed).toBe(false);
    });

    it('should handle non-existent rule', () => {
      const { stats } = engine.executeRule('non-existent', testSpec);

      expect(stats.executed).toBe(false);
      expect(stats.error).toContain('not found');
    });

    it('should pass options to rule function', () => {
      registry.register({
        ...testRule3,
        options: { minPaths: 2 }, // Require at least 2 paths
      });

      const { stats } = engine.executeRule(
        'test-rule-3',
        testSpec // Has only 1 path
      );

      expect(stats.issuesFound).toBe(1);
    });

    it('should execute all rules', () => {
      registry.registerBatch([testRule1, testRule2]);

      const { issues, stats, totalTime } = engine.executeAll(testSpec);

      expect(stats).toHaveLength(2);
      expect(stats[0].ruleId).toBe('test-rule-1');
      expect(stats[1].ruleId).toBe('test-rule-2');
      expect(totalTime).toBeGreaterThan(0);
      expect(issues.length).toBeGreaterThanOrEqual(0);
    });

    it('should execute specific rules only', () => {
      registry.registerBatch([testRule1, testRule2, testRule3]);

      const { stats } = engine.executeAll(testSpec, ['test-rule-1', 'test-rule-2']);

      expect(stats).toHaveLength(2);
      expect(stats.map((s) => s.ruleId)).toEqual(['test-rule-1', 'test-rule-2']);
    });

    it('should handle rule execution error', () => {
      const errorRule: Rule = {
        id: 'error-rule',
        name: 'Error Rule',
        description: 'A rule that throws',
        severity: IssueSeverity.ERROR,
        category: RuleCategory.STRUCTURAL,
        fn: () => {
          throw new Error('Test error');
        },
      };

      registry.register(errorRule);

      const { issues, stats } = engine.executeRule('error-rule', testSpec);

      expect(stats.executed).toBe(false);
      expect(stats.error).toContain('Test error');
      expect(issues).toHaveLength(0);
    });

    it('should normalize various result formats', () => {
      const customResultRule: Rule = {
        id: 'custom-rule',
        name: 'Custom Rule',
        description: 'Returns various formats',
        severity: IssueSeverity.ERROR,
        category: RuleCategory.STRUCTURAL,
        fn: () => [
          {
            message: 'Issue 1',
            path: '$.paths',
          },
          {
            message: 'Issue 2',
            path: '$.info',
          },
        ],
      };

      registry.register(customResultRule);

      const { issues, stats } = engine.executeRule('custom-rule', testSpec);

      expect(stats.issuesFound).toBe(2);
      expect(issues).toHaveLength(2);
      expect(issues[0].ruleId).toBe('custom-rule');
      expect(issues[0].ruleDescription).toBe('Custom Rule');
      expect(issues[0].severity).toBe(IssueSeverity.ERROR);
    });

    it('should get rule statistics', () => {
      registry.registerBatch([testRule1, testRule2]);

      const stats = engine.getRuleStats();
      expect(stats.totalRules).toBe(2);
      expect(stats.enabledRules).toBe(2);
    });

    it('should provide access to registry', () => {
      const reg = engine.getRegistry();
      expect(reg).toBe(registry);
    });

    it('should apply default severity', () => {
      registry.register(testRule1);

      // Test with a rule that returns issues
      const specWithoutTitle: OpenAPISpec = {
        ...testSpec,
        info: { version: '1.0.0' }, // No title
      };

      const { issues: issuesWithDefault } = engine.executeRule(
        'test-rule-1',
        specWithoutTitle,
        IssueSeverity.WARNING
      );

      expect(issuesWithDefault.length).toBeGreaterThan(0);
      expect(issuesWithDefault[0].severity).toBe(IssueSeverity.ERROR); // Original rule severity
    });
  });

  describe('Factory functions', () => {
    it('should create RuleRegistry via factory', () => {
      const reg = createRuleRegistry();
      expect(reg).toBeInstanceOf(RuleRegistry);
    });

    it('should create RuleEngine via factory', () => {
      const reg = createRuleRegistry();
      const eng = createRuleEngine(reg);
      expect(eng).toBeInstanceOf(RuleEngine);
    });
  });
});
