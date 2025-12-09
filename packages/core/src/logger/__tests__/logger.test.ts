/**
 * Tests for Logger utility
 */

import { Logger, createLogger, type ILogger } from '../Logger';

describe('Logger', () => {
  describe('Logger class', () => {
    it('should create a logger with namespace', () => {
      const logger = new Logger('test');

      expect(logger.getNamespace()).toBe('@api-guardian:test');
    });

    it('should create a logger with sub-namespace', () => {
      const logger = new Logger('core', 'loader');

      expect(logger.getNamespace()).toBe('@api-guardian:core:loader');
    });

    it('should have all logging methods', () => {
      const logger = new Logger('test');

      expect(typeof logger.error).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.debug).toBe('function');
    });

    it('should log error messages', () => {
      const logger = new Logger('test');

      // Should not throw
      expect(() => {
        logger.error('Test error');
      }).not.toThrow();

      expect(() => {
        logger.error('Test error', { code: 'TEST_ERROR' });
      }).not.toThrow();
    });

    it('should log warning messages', () => {
      const logger = new Logger('test');

      expect(() => {
        logger.warn('Test warning');
      }).not.toThrow();

      expect(() => {
        logger.warn('Test warning', { count: 5 });
      }).not.toThrow();
    });

    it('should log info messages', () => {
      const logger = new Logger('test');

      expect(() => {
        logger.info('Test info');
      }).not.toThrow();

      expect(() => {
        logger.info('Test info', { status: 'ok' });
      }).not.toThrow();
    });

    it('should log debug messages', () => {
      const logger = new Logger('test');

      expect(() => {
        logger.debug('Test debug');
      }).not.toThrow();

      expect(() => {
        logger.debug('Test debug', { details: 'value' });
      }).not.toThrow();
    });

    it('should work with different namespaces', () => {
      const coreLogger = new Logger('core');
      const cliLogger = new Logger('cli');
      const loaderLogger = new Logger('core', 'loader');

      expect(coreLogger.getNamespace()).toBe('@api-guardian:core');
      expect(cliLogger.getNamespace()).toBe('@api-guardian:cli');
      expect(loaderLogger.getNamespace()).toBe('@api-guardian:core:loader');
    });
  });

  describe('createLogger factory', () => {
    it('should create a logger instance', () => {
      const logger = createLogger('test');

      expect(logger).toBeInstanceOf(Logger);
    });

    it('should create a logger with namespace', () => {
      const logger = createLogger('test');

      expect(logger.getNamespace()).toBe('@api-guardian:test');
    });

    it('should create a logger with sub-namespace', () => {
      const logger = createLogger('core', 'parser');

      expect(logger.getNamespace()).toBe('@api-guardian:core:parser');
    });

    it('should return ILogger interface', () => {
      const logger: ILogger = createLogger('test');

      expect(logger).toHaveProperty('error');
      expect(logger).toHaveProperty('warn');
      expect(logger).toHaveProperty('info');
      expect(logger).toHaveProperty('debug');
      expect(logger).toHaveProperty('getNamespace');
    });
  });

  describe('Logging with data', () => {
    it('should accept optional data parameter', () => {
      const logger = new Logger('test');

      expect(() => {
        logger.error('Error', { key: 'value' });
        logger.warn('Warning', { count: 10 });
        logger.info('Info', { status: 'started' });
        logger.debug('Debug', { details: 'some data' });
      }).not.toThrow();
    });

    it('should work without data parameter', () => {
      const logger = new Logger('test');

      expect(() => {
        logger.error('Error');
        logger.warn('Warning');
        logger.info('Info');
        logger.debug('Debug');
      }).not.toThrow();
    });
  });

  describe('Multiple loggers', () => {
    it('should create independent logger instances', () => {
      const logger1 = createLogger('module1');
      const logger2 = createLogger('module2');

      expect(logger1.getNamespace()).toBe('@api-guardian:module1');
      expect(logger2.getNamespace()).toBe('@api-guardian:module2');
    });

    it('should support hierarchical namespaces', () => {
      const logger1 = createLogger('core', 'validator');
      const logger2 = createLogger('core', 'loader');
      const logger3 = createLogger('cli', 'commands');

      expect(logger1.getNamespace()).toBe('@api-guardian:core:validator');
      expect(logger2.getNamespace()).toBe('@api-guardian:core:loader');
      expect(logger3.getNamespace()).toBe('@api-guardian:cli:commands');
    });
  });

  describe('Logger interface compliance', () => {
    it('should implement ILogger interface', () => {
      const logger: ILogger = new Logger('test');

      const methods: (keyof ILogger)[] = ['error', 'warn', 'info', 'debug', 'getNamespace'];

      methods.forEach((method) => {
        expect(typeof logger[method]).toBe('function');
      });
    });

    it('should be usable as ILogger type', () => {
      const loggers: ILogger[] = [
        createLogger('core'),
        createLogger('cli'),
        createLogger('core', 'validator'),
      ];

      loggers.forEach((logger) => {
        expect(logger.getNamespace()).toContain('@api-guardian');
      });
    });
  });
});
