/**
 * Tests for custom error classes
 */

import {
  BaseError,
  ValidationError,
  ConfigError,
  SpecLoadError,
  RefResolutionError,
  type ErrorContext,
} from '../index';
import { SpecFormat } from '../../interfaces';

describe('Error Classes', () => {
  describe('BaseError', () => {
    it('should create a base error with message and code', () => {
      const error = new BaseError('Test error', 'TEST_ERROR');

      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.name).toBe('BaseError');
      expect(error.isRecoverable).toBe(false);
      expect(error.timestamp).toBeInstanceOf(Date);
    });

    it('should include context information', () => {
      const context: ErrorContext = {
        filePath: 'test.yaml',
        line: 42,
        column: 10,
      };

      const error = new BaseError('Test error', 'TEST_ERROR', context);

      expect(error.context.filePath).toBe('test.yaml');
      expect(error.context.line).toBe(42);
      expect(error.context.column).toBe(10);
    });

    it('should include suggestion', () => {
      const error = new BaseError('Test error', 'TEST_ERROR', {}, { suggestion: 'Fix this' });

      expect(error.suggestion).toBe('Fix this');
    });

    it('should support recoverable errors', () => {
      const error = new BaseError('Recoverable error', 'TEST_ERROR', {}, { isRecoverable: true });

      expect(error.isRecoverable).toBe(true);
    });

    it('should format error message with context', () => {
      const error = new BaseError(
        'Something went wrong',
        'TEST_ERROR',
        { filePath: 'test.yaml', line: 10 },
        { suggestion: 'Fix the syntax' }
      );

      const formatted = error.getFormattedMessage();

      expect(formatted).toContain('Something went wrong');
      expect(formatted).toContain('File: test.yaml');
      expect(formatted).toContain('Location: 10');
      expect(formatted).toContain('Suggestion: Fix the syntax');
    });

    it('should convert to JSON', () => {
      const error = new BaseError(
        'Test error',
        'TEST_ERROR',
        { filePath: 'test.yaml' },
        { suggestion: 'Fix it' }
      );

      const json = error.toJSON();

      expect(json.name).toBe('BaseError');
      expect(json.message).toBe('Test error');
      expect(json.code).toBe('TEST_ERROR');
      expect(json.suggestion).toBe('Fix it');
      expect(json.stack).toBeDefined();
    });

    it('should convert to string', () => {
      const error = new BaseError('Test error', 'TEST_CODE');

      expect(error.toString()).toBe('BaseError [TEST_CODE]: Test error');
    });

    it('should support wrapped errors', () => {
      const originalError = new Error('Original');
      const wrappedError = new BaseError('Wrapped error', 'WRAP_ERROR', {}, { originalError });

      expect(wrappedError.originalError).toBe(originalError);
    });
  });

  describe('ValidationError', () => {
    it('should create a validation error', () => {
      const error = new ValidationError('Validation failed');

      expect(error.message).toBe('Validation failed');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.name).toBe('ValidationError');
    });

    it('should include validation details', () => {
      const error = new ValidationError(
        'Missing description',
        { filePath: 'openapi.yaml', line: 45 },
        {
          validationDetails: {
            ruleId: 'operation-description',
            path: '$.paths./users.get',
          },
        }
      );

      expect(error.validationDetails.ruleId).toBe('operation-description');
      expect(error.validationDetails.path).toBe('$.paths./users.get');
    });

    it('should support instanceof check', () => {
      const error = new ValidationError('Test');

      expect(error).toBeInstanceOf(ValidationError);
      expect(error).toBeInstanceOf(BaseError);
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('ConfigError', () => {
    it('should create a config error', () => {
      const error = new ConfigError('Invalid config');

      expect(error.message).toBe('Invalid config');
      expect(error.code).toBe('CONFIG_ERROR');
      expect(error.name).toBe('ConfigError');
      expect(error.isRecoverable).toBe(true);
    });

    it('should include config details', () => {
      const error = new ConfigError(
        'Invalid ruleset',
        { filePath: '.api-guardian.yaml', line: 15 },
        {
          configDetails: {
            property: 'rulesets.custom',
            expectedFormat: 'RulesetDefinition',
          },
        }
      );

      expect(error.configDetails.property).toBe('rulesets.custom');
      expect(error.configDetails.expectedFormat).toBe('RulesetDefinition');
    });

    it('should be recoverable by default', () => {
      const error = new ConfigError('Config error');

      expect(error.isRecoverable).toBe(true);
    });
  });

  describe('SpecLoadError', () => {
    it('should create a spec load error', () => {
      const error = new SpecLoadError('Failed to load spec');

      expect(error.message).toBe('Failed to load spec');
      expect(error.code).toBe('SPEC_LOAD_ERROR');
      expect(error.name).toBe('SpecLoadError');
      expect(error.isRecoverable).toBe(false);
    });

    it('should include spec details', () => {
      const error = new SpecLoadError(
        'YAML parse error',
        { filePath: 'openapi.yaml', line: 42 },
        {
          specDetails: {
            format: SpecFormat.YAML,
            errorType: 'YAML_PARSE_ERROR',
            parseError: 'Invalid indentation',
          },
        }
      );

      expect(error.specDetails.format).toBe(SpecFormat.YAML);
      expect(error.specDetails.errorType).toBe('YAML_PARSE_ERROR');
    });
  });

  describe('RefResolutionError', () => {
    it('should create a ref resolution error', () => {
      const error = new RefResolutionError('Failed to resolve $ref');

      expect(error.message).toBe('Failed to resolve $ref');
      expect(error.code).toBe('REF_RESOLUTION_ERROR');
      expect(error.name).toBe('RefResolutionError');
    });

    it('should include ref details', () => {
      const error = new RefResolutionError(
        'Schema not found',
        { filePath: 'openapi.yaml', line: 125 },
        {
          refDetails: {
            ref: '#/components/schemas/NonExistentSchema',
            refType: 'internal',
            reason: 'NOT_FOUND',
          },
        }
      );

      expect(error.refDetails.ref).toBe('#/components/schemas/NonExistentSchema');
      expect(error.refDetails.reason).toBe('NOT_FOUND');
    });
  });

  describe('Error inheritance', () => {
    it('should maintain instanceof relationship', () => {
      const errors = [
        new ValidationError('Test'),
        new ConfigError('Test'),
        new SpecLoadError('Test'),
        new RefResolutionError('Test'),
      ];

      errors.forEach((error) => {
        expect(error).toBeInstanceOf(BaseError);
        expect(error).toBeInstanceOf(Error);
      });
    });

    it('should support throwing and catching', () => {
      expect(() => {
        throw new ValidationError('Validation failed');
      }).toThrow(ValidationError);

      expect(() => {
        throw new ValidationError('Validation failed');
      }).toThrow(BaseError);
    });
  });

  describe('Error serialization', () => {
    it('should serialize validation error to JSON', () => {
      const error = new ValidationError(
        'Test',
        { filePath: 'test.yaml' },
        { validationDetails: { ruleId: 'test-rule' } }
      );

      const json = error.toJSON();

      expect(json.code).toBe('VALIDATION_ERROR');
      expect(json.validationDetails).toEqual({ ruleId: 'test-rule' });
    });

    it('should serialize config error to JSON', () => {
      const error = new ConfigError(
        'Test',
        { filePath: 'config.yaml' },
        { configDetails: { property: 'rules' } }
      );

      const json = error.toJSON();

      expect(json.code).toBe('CONFIG_ERROR');
      expect(json.configDetails).toEqual({ property: 'rules' });
    });

    it('should serialize spec load error to JSON', () => {
      const error = new SpecLoadError(
        'Test',
        { filePath: 'spec.yaml' },
        { specDetails: { format: SpecFormat.YAML } }
      );

      const json = error.toJSON();

      expect(json.code).toBe('SPEC_LOAD_ERROR');
      expect(json.specDetails).toEqual({ format: SpecFormat.YAML });
    });

    it('should serialize ref resolution error to JSON', () => {
      const error = new RefResolutionError(
        'Test',
        { filePath: 'spec.yaml' },
        { refDetails: { ref: '#/test' } }
      );

      const json = error.toJSON();

      expect(json.code).toBe('REF_RESOLUTION_ERROR');
      expect(json.refDetails).toEqual({ ref: '#/test' });
    });
  });
});
