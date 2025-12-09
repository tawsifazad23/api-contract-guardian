/**
 * Tests for core interfaces
 *
 * These tests verify that interfaces are properly structured
 * and can be implemented correctly.
 */

import {
  IssueSeverity,
  RuleCategory,
  RulesetLevel,
  OpenAPIVersion,
  SpecFormat,
  type ValidationIssue,
  type Rule,
  type ApiGuardianConfig,
  type OpenAPISpec,
  type Validator,
} from '../index';

describe('Interfaces', () => {
  describe('IssueSeverity enum', () => {
    it('should have all severity levels', () => {
      expect(IssueSeverity.ERROR).toBe('error');
      expect(IssueSeverity.WARNING).toBe('warning');
      expect(IssueSeverity.INFO).toBe('info');
      expect(IssueSeverity.HINT).toBe('hint');
    });
  });

  describe('RuleCategory enum', () => {
    it('should have all rule categories', () => {
      expect(RuleCategory.STRUCTURAL).toBe('structural');
      expect(RuleCategory.DOCUMENTATION).toBe('documentation');
      expect(RuleCategory.REST).toBe('rest');
      expect(RuleCategory.GOVERNANCE).toBe('governance');
      expect(RuleCategory.SECURITY).toBe('security');
    });
  });

  describe('RulesetLevel enum', () => {
    it('should have all ruleset levels', () => {
      expect(RulesetLevel.STRICT).toBe('strict');
      expect(RulesetLevel.STANDARD).toBe('standard');
      expect(RulesetLevel.LENIENT).toBe('lenient');
    });
  });

  describe('OpenAPIVersion enum', () => {
    it('should have all OpenAPI versions', () => {
      expect(OpenAPIVersion.V3_0).toBe('3.0');
      expect(OpenAPIVersion.V3_1).toBe('3.1');
    });
  });

  describe('SpecFormat enum', () => {
    it('should have all spec formats', () => {
      expect(SpecFormat.YAML).toBe('yaml');
      expect(SpecFormat.JSON).toBe('json');
    });
  });

  describe('ValidationIssue interface', () => {
    it('should create a valid validation issue', () => {
      const issue: ValidationIssue = {
        ruleId: 'operation-description',
        ruleDescription: 'All operations must have descriptions',
        severity: IssueSeverity.ERROR,
        path: '$.paths./users.get',
        line: 45,
        message: 'Missing description for GET /users operation',
      };

      expect(issue.ruleId).toBe('operation-description');
      expect(issue.severity).toBe(IssueSeverity.ERROR);
      expect(issue.path).toBe('$.paths./users.get');
      expect(issue.line).toBe(45);
    });

    it('should allow optional fields', () => {
      const issue: ValidationIssue = {
        ruleId: 'test-rule',
        ruleDescription: 'Test rule',
        severity: IssueSeverity.WARNING,
        path: '$.test',
        message: 'Test message',
      };

      expect(issue.column).toBeUndefined();
      expect(issue.suggestion).toBeUndefined();
      expect(issue.category).toBeUndefined();
    });
  });

  describe('Rule interface', () => {
    it('should create a valid rule', () => {
      const rule: Rule = {
        id: 'test-rule',
        name: 'Test Rule',
        description: 'A test rule',
        severity: IssueSeverity.ERROR,
        category: RuleCategory.DOCUMENTATION,
        fn: () => [],
      };

      expect(rule.id).toBe('test-rule');
      expect(rule.severity).toBe(IssueSeverity.ERROR);
      expect(rule.category).toBe(RuleCategory.DOCUMENTATION);
      expect(typeof rule.fn).toBe('function');
    });

    it('should allow optional fields', () => {
      const rule: Rule = {
        id: 'test-rule',
        name: 'Test Rule',
        description: 'A test rule',
        severity: IssueSeverity.WARNING,
        category: RuleCategory.STRUCTURAL,
        fn: () => [],
      };

      expect(rule.enabled).toBeUndefined();
      expect(rule.fixable).toBeUndefined();
      expect(rule.options).toBeUndefined();
    });
  });

  describe('ApiGuardianConfig interface', () => {
    it('should create a valid configuration', () => {
      const config: ApiGuardianConfig = {
        extends: ['spectral:oas'],
        defaultSeverity: IssueSeverity.WARNING,
      };

      expect(config.extends).toEqual(['spectral:oas']);
      expect(config.defaultSeverity).toBe(IssueSeverity.WARNING);
    });

    it('should allow rules configuration', () => {
      const config: ApiGuardianConfig = {
        rules: {
          'operation-description': {
            severity: IssueSeverity.ERROR,
            enabled: true,
          },
        },
      };

      expect(config.rules).toBeDefined();
      expect(config.rules?.['operation-description']).toBeDefined();
    });
  });

  describe('OpenAPISpec interface', () => {
    it('should create a valid OpenAPI spec structure', () => {
      const spec: OpenAPISpec = {
        metadata: {
          filePath: 'openapi.yaml',
          format: SpecFormat.YAML,
          version: OpenAPIVersion.V3_0,
          loadedAt: new Date(),
        },
        openapi: '3.0.3',
        info: {
          title: 'Test API',
          version: '1.0.0',
        },
        paths: {},
      };

      expect(spec.metadata.filePath).toBe('openapi.yaml');
      expect(spec.info?.title).toBe('Test API');
      expect(spec.paths).toEqual({});
    });
  });

  describe('Validator interface', () => {
    it('should define validator contract', () => {
      // This test verifies the interface structure is correct
      // by checking that expected method names would exist

      const mockValidator: Validator = {
        initialize: jest.fn().mockResolvedValue(undefined),
        validate: jest.fn(),
        validateMultiple: jest.fn(),
        loadSpec: jest.fn(),
        registerRule: jest.fn(),
        registerRules: jest.fn(),
        getRule: jest.fn(),
        getAllRules: jest.fn().mockReturnValue([]),
        getConfig: jest.fn(),
        updateConfig: jest.fn(),
        getVersion: jest.fn().mockReturnValue('1.0.0'),
        shutdown: jest.fn().mockResolvedValue(undefined),
      };

      expect(typeof mockValidator.initialize).toBe('function');
      expect(typeof mockValidator.validate).toBe('function');
      expect(typeof mockValidator.shutdown).toBe('function');
    });
  });

  describe('Interface exports', () => {
    it('should export all enums', () => {
      expect(IssueSeverity).toBeDefined();
      expect(RuleCategory).toBeDefined();
      expect(RulesetLevel).toBeDefined();
      expect(OpenAPIVersion).toBeDefined();
      expect(SpecFormat).toBeDefined();
    });

    it('should be able to compose interfaces', () => {
      const issue: ValidationIssue = {
        ruleId: 'rule-1',
        ruleDescription: 'Rule 1',
        severity: IssueSeverity.ERROR,
        path: '$.test',
        message: 'Test',
        category: RuleCategory.DOCUMENTATION,
      };

      expect(issue.severity).toBe(IssueSeverity.ERROR);
      expect(issue.category).toBe(RuleCategory.DOCUMENTATION);
    });
  });
});
