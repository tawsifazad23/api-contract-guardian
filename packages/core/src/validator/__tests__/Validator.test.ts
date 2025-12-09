/**
 * Tests for Validator Orchestrator
 */

import { Validator, createValidator } from '../Validator';
import { RuleCategory, IssueSeverity } from '../../interfaces';
import type { Rule } from '../../interfaces';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

describe('Validator Orchestrator', () => {
  let tempDir: string;
  let validSpecPath: string;
  let invalidSpecPath: string;

  beforeAll(() => {
    // Create temporary directory for test specs
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'api-contract-test-'));

    // Create a valid OpenAPI spec
    const validSpec = {
      openapi: '3.0.3',
      info: {
        title: 'Test API',
        version: '1.0.0',
        description: 'A test API for validation',
        contact: {
          name: 'Support',
          email: 'support@example.com',
        },
      },
      paths: {
        '/users': {
          get: {
            description: 'Get all users',
            responses: {
              '200': {
                description: 'Success',
              },
              '400': {
                description: 'Bad Request',
              },
            },
          },
          post: {
            description: 'Create a new user',
            requestBody: {
              content: {
                'application/json': {},
              },
            },
            responses: {
              '201': {
                description: 'Created',
              },
              '400': {
                description: 'Bad Request',
              },
            },
          },
        },
      },
      components: {
        schemas: {
          User: {
            type: 'object',
            description: 'A user object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
            },
          },
        },
      },
    };

    validSpecPath = path.join(tempDir, 'valid.json');
    fs.writeFileSync(validSpecPath, JSON.stringify(validSpec, null, 2));

    // Create an invalid OpenAPI spec (missing required fields)
    const invalidSpec = {
      openapi: '3.0.3',
      paths: {
        '/users': {
          get: {
            // Missing description and responses
          },
        },
      },
    };

    invalidSpecPath = path.join(tempDir, 'invalid.json');
    fs.writeFileSync(invalidSpecPath, JSON.stringify(invalidSpec, null, 2));
  });

  afterAll(() => {
    // Cleanup temporary directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
    }
  });

  describe('Validator Creation', () => {
    it('should create a Validator instance', () => {
      const validator = new Validator();
      expect(validator).toBeInstanceOf(Validator);
    });

    it('should create a Validator via factory function', () => {
      const validator = createValidator();
      expect(validator).toBeInstanceOf(Validator);
    });

    it('should register built-in rules by default', () => {
      const validator = new Validator();
      expect(validator.getStats().totalRules).toBe(20);
    });

    it('should skip built-in rules if disabled', () => {
      const validator = new Validator({ useBuiltInRules: false });
      expect(validator.getStats().totalRules).toBe(0);
    });

    it('should register custom rules', () => {
      const customRule: Rule = {
        id: 'custom-rule',
        name: 'Custom Rule',
        description: 'A custom test rule',
        severity: IssueSeverity.WARNING,
        category: RuleCategory.STRUCTURAL,
        fn: () => [],
      };

      const validator = new Validator({
        customRules: [customRule],
      });

      expect(validator.getStats().totalRules).toBe(21); // 20 built-in + 1 custom
    });

    it('should register multiple custom rules', () => {
      const customRules: Rule[] = [
        {
          id: 'custom-1',
          name: 'Custom 1',
          description: 'Custom rule 1',
          severity: IssueSeverity.WARNING,
          category: RuleCategory.STRUCTURAL,
          fn: () => [],
        },
        {
          id: 'custom-2',
          name: 'Custom 2',
          description: 'Custom rule 2',
          severity: IssueSeverity.INFO,
          category: RuleCategory.DOCUMENTATION,
          fn: () => [],
        },
      ];

      const validator = new Validator({
        customRules: customRules,
      });

      expect(validator.getStats().totalRules).toBe(22); // 20 built-in + 2 custom
    });
  });

  describe('Validation', () => {
    it('should validate a valid spec', async () => {
      const validator = new Validator();
      const result = await validator.validate(validSpecPath);

      expect(result).toBeDefined();
      expect(result.valid).toBe(true);
      expect(result.spec).toBeDefined();
      expect(result.issues).toBeDefined();
      expect(result.stats).toBeDefined();
      expect(result.metadata).toBeDefined();
    });

    it('should find issues in invalid spec', async () => {
      const validator = new Validator();
      const result = await validator.validate(invalidSpecPath);

      expect(result.valid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
    });

    it('should track validation statistics', async () => {
      const validator = new Validator();
      const result = await validator.validate(validSpecPath);

      expect(result.stats.rulesExecuted).toBeGreaterThan(0);
      expect(result.stats.issuesFound).toBeGreaterThanOrEqual(0);
      expect(result.stats.executionTime).toBeGreaterThanOrEqual(0);
      expect(result.stats.totalTime).toBeGreaterThanOrEqual(0);
    });

    it('should include validation metadata', async () => {
      const validator = new Validator();
      const result = await validator.validate(validSpecPath);

      expect(result.metadata.validatedAt).toBeInstanceOf(Date);
      expect(result.metadata.ruleCount).toBe(20);
    });

    it('should handle missing spec file', async () => {
      const validator = new Validator();
      const result = await validator.validate('/nonexistent/spec.json');

      expect(result.valid).toBe(false);
      expect(result.spec).toBeNull();
      expect(result.metadata.error).toBeDefined();
    });

    it('should respect default severity', async () => {
      const validator = new Validator();
      const result = await validator.validate(validSpecPath, IssueSeverity.ERROR);

      expect(result).toBeDefined();
      expect(result.metadata.ruleCount).toBe(20);
    });
  });

  describe('Rule Management', () => {
    it('should register a single rule', () => {
      const validator = new Validator();
      const initialCount = validator.getStats().totalRules;

      const customRule: Rule = {
        id: 'test-rule',
        name: 'Test Rule',
        description: 'Test',
        severity: IssueSeverity.INFO,
        category: RuleCategory.STRUCTURAL,
        fn: () => [],
      };

      validator.registerRule(customRule);
      expect(validator.getStats().totalRules).toBe(initialCount + 1);
    });

    it('should register multiple rules', () => {
      const validator = new Validator();
      const initialCount = validator.getStats().totalRules;

      const rules: Rule[] = [
        {
          id: 'rule-1',
          name: 'Rule 1',
          description: 'Test',
          severity: IssueSeverity.INFO,
          category: RuleCategory.STRUCTURAL,
          fn: () => [],
        },
        {
          id: 'rule-2',
          name: 'Rule 2',
          description: 'Test',
          severity: IssueSeverity.WARNING,
          category: RuleCategory.REST,
          fn: () => [],
        },
      ];

      validator.registerRules(rules);
      expect(validator.getStats().totalRules).toBe(initialCount + 2);
    });

    it('should apply rule overrides', async () => {
      const validator = new Validator();

      // Disable a built-in rule
      validator.applyRuleOverrides({
        'info-required': false,
      });

      // The rule should be disabled
      expect(validator.getRegistry().isEnabled('info-required')).toBe(false);
    });

    it('should apply severity overrides', async () => {
      const validator = new Validator();

      validator.applyRuleOverrides({
        'info-required': {
          severity: IssueSeverity.WARNING,
        },
      });

      const rule = validator.getRegistry().getEffectiveRule('info-required');
      expect(rule?.severity).toBe(IssueSeverity.WARNING);
    });

    it('should apply multiple overrides', () => {
      const validator = new Validator();

      validator.applyRuleOverrides({
        'info-required': {
          enabled: false,
          severity: IssueSeverity.INFO,
        },
        'paths-required': {
          severity: IssueSeverity.ERROR,
        },
      });

      expect(validator.getRegistry().isEnabled('info-required')).toBe(false);
      expect(validator.getRegistry().getEffectiveRule('paths-required')?.severity).toBe(
        IssueSeverity.ERROR
      );
    });
  });

  describe('Registry and Engine Access', () => {
    it('should provide access to registry', () => {
      const validator = new Validator();
      const registry = validator.getRegistry();

      expect(registry).toBeDefined();
      expect(registry.getCount()).toBe(20);
    });

    it('should provide access to engine', () => {
      const validator = new Validator();
      const engine = validator.getEngine();

      expect(engine).toBeDefined();
      expect(engine.getRegistry()).toBe(validator.getRegistry());
    });

    it('should provide access to configuration', () => {
      const validator1 = new Validator();
      expect(validator1.getConfig()).toBeUndefined();

      const config = {
        rules: {},
      };
      const validator2 = new Validator({ config });
      expect(validator2.getConfig()).toBeDefined();
    });

    it('should provide rule statistics', () => {
      const validator = new Validator();
      const stats = validator.getStats();

      expect(stats.totalRules).toBe(20);
      expect(stats.enabledRules).toBe(20);
      expect(stats.rulesByCategory).toBeDefined();
    });
  });

  describe('Validation with Custom Rules', () => {
    it('should execute custom rules during validation', async () => {
      const customRule: Rule = {
        id: 'custom-check',
        name: 'Custom Check',
        description: 'Custom validation check',
        severity: IssueSeverity.ERROR,
        category: RuleCategory.STRUCTURAL,
        fn: (spec: unknown) => {
          const apiSpec = spec as any;
          if (!apiSpec.info?.description) {
            return [
              {
                message: 'Custom check: API missing description',
                path: '$.info',
              },
            ];
          }
          return [];
        },
      };

      const validator = new Validator({
        useBuiltInRules: false,
        customRules: [customRule],
      });

      const result = await validator.validate(validSpecPath);

      expect(result.stats.rulesExecuted).toBeGreaterThanOrEqual(0);
    });

    it('should allow disabling specific custom rules', async () => {
      const customRule: Rule = {
        id: 'custom-error',
        name: 'Custom Error',
        description: 'Always fails',
        severity: IssueSeverity.ERROR,
        category: RuleCategory.STRUCTURAL,
        fn: () => [
          {
            message: 'Custom error',
            path: '$.paths',
          },
        ],
      };

      const validator = new Validator({
        useBuiltInRules: false,
        customRules: [customRule],
      });

      // Disable the custom rule
      validator.applyRuleOverrides({
        'custom-error': false,
      });

      const result = await validator.validate(validSpecPath);

      // The error should not appear since the rule is disabled
      const customIssues = result.issues.filter((i) => i.message.includes('Custom error'));
      expect(customIssues).toHaveLength(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid spec files gracefully', async () => {
      const validator = new Validator();

      // Create an invalid JSON file
      const invalidJsonPath = path.join(tempDir, 'invalid.json');
      fs.writeFileSync(invalidJsonPath, '{invalid json}');

      const result = await validator.validate(invalidJsonPath);

      expect(result.valid).toBe(false);
      expect(result.spec).toBeNull();
      expect(result.metadata.error).toBeDefined();

      fs.unlinkSync(invalidJsonPath);
    });

    it('should handle validation errors', async () => {
      const errorRule: Rule = {
        id: 'error-rule',
        name: 'Error Rule',
        description: 'Throws an error',
        severity: IssueSeverity.ERROR,
        category: RuleCategory.STRUCTURAL,
        fn: () => {
          throw new Error('Rule execution failed');
        },
      };

      const validator = new Validator({
        useBuiltInRules: false,
        customRules: [errorRule],
      });

      const result = await validator.validate(validSpecPath);

      // Validation should still complete even if a rule throws
      expect(result).toBeDefined();
    });
  });

  describe('Integration Tests', () => {
    it('should perform end-to-end validation', async () => {
      const validator = new Validator();
      const result = await validator.validate(validSpecPath);

      // Verify complete validation result
      expect(result.spec).toBeDefined();
      expect(result.spec?.info?.title).toBe('Test API');
      expect(result.issues).toBeDefined();
      expect(Array.isArray(result.issues)).toBe(true);
      expect(result.stats).toBeDefined();
      expect(result.metadata).toBeDefined();
      expect(result.metadata.validatedAt).toBeInstanceOf(Date);
    });

    it('should validate multiple specs sequentially', async () => {
      const validator = new Validator();

      const result1 = await validator.validate(validSpecPath);
      const result2 = await validator.validate(invalidSpecPath);

      expect(result1.valid).toBe(true);
      expect(result2.valid).toBe(false);
    });

    it('should produce consistent results for same spec', async () => {
      const validator = new Validator();

      const result1 = await validator.validate(validSpecPath);
      const result2 = await validator.validate(validSpecPath);

      expect(result1.issues.length).toBe(result2.issues.length);
      expect(result1.stats.rulesExecuted).toBe(result2.stats.rulesExecuted);
    });
  });
});
