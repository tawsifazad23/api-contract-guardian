/**
 * Tests for ConfigParser and default configurations
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { ConfigParser, createConfigParser } from '../ConfigParser';
import {
  DEFAULT_CONFIG,
  STRICT_RULESET,
  STANDARD_RULESET,
  LENIENT_RULESET,
  getPresetRuleset,
  mergeRulesets,
} from '../defaults';
import { ConfigError } from '../../errors';
import { IssueSeverity } from '../../interfaces';

describe('Config Module', () => {
  let tempDir: string;

  beforeAll(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-config-'));
  });

  afterAll(() => {
    try {
      const files = fs.readdirSync(tempDir);
      files.forEach((file) => {
        fs.unlinkSync(path.join(tempDir, file));
      });
      fs.rmdirSync(tempDir);
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('Default Configurations', () => {
    it('should export default config', () => {
      expect(DEFAULT_CONFIG).toBeDefined();
      expect(DEFAULT_CONFIG.defaultSeverity).toBe(IssueSeverity.WARNING);
      expect(DEFAULT_CONFIG.failOnWarnings).toBe(false);
      expect(DEFAULT_CONFIG.showInfo).toBe(true);
    });

    it('should have strict ruleset', () => {
      expect(STRICT_RULESET).toBeDefined();
      expect(STRICT_RULESET.defaultSeverity).toBe(IssueSeverity.ERROR);
      expect(STRICT_RULESET.rules).toBeDefined();
      expect(Object.keys(STRICT_RULESET.rules!).length).toBeGreaterThan(0);
    });

    it('should have standard ruleset', () => {
      expect(STANDARD_RULESET).toBeDefined();
      expect(STANDARD_RULESET.extends).toBe('strict');
      expect(STANDARD_RULESET.rules).toBeDefined();
    });

    it('should have lenient ruleset', () => {
      expect(LENIENT_RULESET).toBeDefined();
      expect(LENIENT_RULESET.defaultSeverity).toBe(IssueSeverity.WARNING);
      expect(LENIENT_RULESET.rules).toBeDefined();
    });

    it('should get preset ruleset by level', () => {
      const strict = getPresetRuleset('strict');
      expect(strict).toEqual(STRICT_RULESET);

      const standard = getPresetRuleset('standard');
      expect(standard).toEqual(STANDARD_RULESET);

      const lenient = getPresetRuleset('lenient');
      expect(lenient).toEqual(LENIENT_RULESET);
    });

    it('should return null for unknown preset', () => {
      const unknown = getPresetRuleset('unknown');
      expect(unknown).toBeNull();
    });

    it('should merge rulesets', () => {
      const merged = mergeRulesets(STRICT_RULESET, STANDARD_RULESET);

      expect(merged).toBeDefined();
      expect(merged.defaultSeverity).toBe(STANDARD_RULESET.defaultSeverity);
      expect(merged.rules).toBeDefined();
      expect(Object.keys(merged.rules!).length).toBeGreaterThan(0);
    });
  });

  describe('ConfigParser', () => {
    let parser: ConfigParser;

    beforeEach(() => {
      parser = createConfigParser();
    });

    it('should create a ConfigParser instance', () => {
      expect(parser).toBeInstanceOf(ConfigParser);
    });

    it('should load a YAML config file', async () => {
      const configContent = `
defaultSeverity: error
failOnWarnings: true
rules:
  operation-description: true
  operation-tags-required:
    severity: warning
    enabled: true
`;

      const filePath = path.join(tempDir, 'config.yaml');
      fs.writeFileSync(filePath, configContent);

      const config = await parser.loadConfig(filePath);

      expect(config.defaultSeverity).toBe(IssueSeverity.ERROR);
      expect(config.failOnWarnings).toBe(true);
      expect(config.rules).toBeDefined();
      expect(config.rules!['operation-description']).toBe(true);
    });

    it('should load a JSON config file', async () => {
      const configContent = {
        defaultSeverity: 'warning',
        failOnWarnings: false,
        rules: {
          'operation-description': true,
          'operation-tags-required': {
            severity: 'error',
            enabled: true,
          },
        },
      };

      const filePath = path.join(tempDir, 'config.json');
      fs.writeFileSync(filePath, JSON.stringify(configContent));

      const config = await parser.loadConfig(filePath);

      expect(config.defaultSeverity).toBe(IssueSeverity.WARNING);
      expect(config.failOnWarnings).toBe(false);
      expect(config.rules).toBeDefined();
    });

    it('should throw ConfigError for non-existent file', async () => {
      await expect(parser.loadConfig('/nonexistent/path.yaml')).rejects.toThrow(ConfigError);
    });

    it('should throw ConfigError for invalid YAML', async () => {
      const filePath = path.join(tempDir, 'invalid.yaml');
      fs.writeFileSync(filePath, 'invalid: yaml: bad: indentation:\n\t:');

      await expect(parser.loadConfig(filePath)).rejects.toThrow(ConfigError);
    });

    it('should throw ConfigError for invalid JSON', async () => {
      const filePath = path.join(tempDir, 'invalid.json');
      fs.writeFileSync(filePath, 'not valid json {');

      await expect(parser.loadConfig(filePath)).rejects.toThrow(ConfigError);
    });

    it('should validate extends field', async () => {
      const configContent = {
        extends: 123, // Invalid: should be string or array
        rules: {},
      };

      const filePath = path.join(tempDir, 'bad-extends.yaml');
      fs.writeFileSync(filePath, JSON.stringify(configContent));

      await expect(parser.loadConfig(filePath)).rejects.toThrow(ConfigError);
    });

    it('should validate rules field', async () => {
      const configContent = {
        rules: 'not-an-object', // Invalid
      };

      const filePath = path.join(tempDir, 'bad-rules.yaml');
      fs.writeFileSync(filePath, JSON.stringify(configContent));

      await expect(parser.loadConfig(filePath)).rejects.toThrow(ConfigError);
    });

    it('should validate files field', async () => {
      const configContent = {
        files: 'not-an-array', // Invalid
      };

      const filePath = path.join(tempDir, 'bad-files.yaml');
      fs.writeFileSync(filePath, JSON.stringify(configContent));

      await expect(parser.loadConfig(filePath)).rejects.toThrow(ConfigError);
    });

    it('should validate failOnWarnings field', async () => {
      const configContent = {
        failOnWarnings: 'yes', // Invalid: should be boolean
      };

      const filePath = path.join(tempDir, 'bad-fail.yaml');
      fs.writeFileSync(filePath, JSON.stringify(configContent));

      await expect(parser.loadConfig(filePath)).rejects.toThrow(ConfigError);
    });

    it('should cache loaded configs', async () => {
      const configContent = {
        defaultSeverity: 'warning',
      };

      const filePath = path.join(tempDir, 'cached.yaml');
      fs.writeFileSync(filePath, JSON.stringify(configContent));

      await parser.loadConfig(filePath);
      let stats = parser.getCacheStats();
      expect(stats.size).toBe(1);

      // Load again - should use cache
      await parser.loadConfig(filePath);
      stats = parser.getCacheStats();
      expect(stats.size).toBe(1);
    });

    it('should clear cache', async () => {
      const configContent = { rules: {} };
      const filePath = path.join(tempDir, 'for-clear.yaml');
      fs.writeFileSync(filePath, JSON.stringify(configContent));

      await parser.loadConfig(filePath);
      let stats = parser.getCacheStats();
      expect(stats.size).toBeGreaterThan(0);

      parser.clearCache();
      stats = parser.getCacheStats();
      expect(stats.size).toBe(0);
    });

    it('should resolve extends from preset', async () => {
      const configContent = `
extends:
  - api-guardian:strict
rules:
  operation-description:
    severity: warning
`;

      const filePath = path.join(tempDir, 'extend-preset.yaml');
      fs.writeFileSync(filePath, configContent);

      const config = await parser.loadAndResolve(filePath);

      expect(config.configPath).toBe(filePath);
      expect(config.rulesets).toBeDefined();
      expect(config.rules).toBeDefined();
    });

    it('should resolve extends from file path', async () => {
      const baseConfigContent = `
defaultSeverity: error
rules:
  operation-description: true
`;

      const extendingConfigContent = `
extends:
  - ./base-config.yaml
rules:
  operation-tags-required:
    severity: warning
`;

      const basePath = path.join(tempDir, 'base-config.yaml');
      const extendingPath = path.join(tempDir, 'extending-config.yaml');

      fs.writeFileSync(basePath, baseConfigContent);
      fs.writeFileSync(extendingPath, extendingConfigContent);

      const config = await parser.loadAndResolve(extendingPath);

      expect(config.configPath).toBe(extendingPath);
      expect(config.rules!['operation-description']).toBe(true);
      expect(config.rules!['operation-tags-required']).toBeDefined();
    });

    it('should throw error for unknown preset', async () => {
      const configContent = `
extends:
  - api-guardian:unknown-preset
`;

      const filePath = path.join(tempDir, 'bad-preset.yaml');
      fs.writeFileSync(filePath, configContent);

      await expect(parser.loadAndResolve(filePath)).rejects.toThrow(ConfigError);
    });

    it('should throw error for unknown extends namespace', async () => {
      const configContent = `
extends:
  - unknown:something
`;

      const filePath = path.join(tempDir, 'bad-namespace.yaml');
      fs.writeFileSync(filePath, configContent);

      await expect(parser.loadAndResolve(filePath)).rejects.toThrow(ConfigError);
    });

    it('should apply CLI overrides', async () => {
      const configContent = {
        defaultSeverity: 'warning',
        verbose: false,
      };

      const filePath = path.join(tempDir, 'for-overrides.yaml');
      fs.writeFileSync(filePath, JSON.stringify(configContent));

      const config = await parser.loadAndResolve(filePath);

      const overridden = parser.applyOverrides(config, {
        verbose: true,
        format: 'json',
        watch: true,
      });

      expect(overridden.verbose).toBe(true);
      expect(overridden.outputFormat).toBe('json');
      expect(overridden.watch).toBe(true);
    });

    it('should apply ruleset override', async () => {
      const configContent = { rules: {} };
      const filePath = path.join(tempDir, 'for-ruleset.yaml');
      fs.writeFileSync(filePath, JSON.stringify(configContent));

      const config = await parser.loadAndResolve(filePath);
      const overridden = parser.applyOverrides(config, {
        ruleset: 'strict',
      });

      expect(overridden.activeRuleset).toBe('strict');
    });

    it('should apply ignorePaths override', async () => {
      const configContent = {
        files: [{ pattern: 'specs/**/*.yaml' }],
      };

      const filePath = path.join(tempDir, 'for-ignore.yaml');
      fs.writeFileSync(filePath, JSON.stringify(configContent));

      const config = await parser.loadAndResolve(filePath);
      const overridden = parser.applyOverrides(config, {
        ignorePaths: ['node_modules/**', '.git/**'],
      });

      expect(overridden.files![0].ignore).toContain('node_modules/**');
      expect(overridden.files![0].ignore).toContain('.git/**');
    });

    it('should handle empty config file', async () => {
      const filePath = path.join(tempDir, 'empty.yaml');
      fs.writeFileSync(filePath, '');

      // Empty file should parse to null, but we handle it
      const config = await parser.loadConfig(filePath);
      expect(config).toBeDefined();
    });

    it('should handle config with custom properties', async () => {
      const configContent = {
        rules: {},
        customProperty: 'customValue',
        anotherProperty: {
          nested: 'value',
        },
      };

      const filePath = path.join(tempDir, 'custom-props.yaml');
      fs.writeFileSync(filePath, JSON.stringify(configContent));

      const config = await parser.loadConfig(filePath);

      expect((config as any).customProperty).toBe('customValue');
      expect((config as any).anotherProperty?.nested).toBe('value');
    });

    it('should resolve multiple extends in order', async () => {
      const baseConfig = `
rules:
  rule1: true
  rule2: false
`;

      const middleConfig = `
extends:
  - ./base-config.yaml
rules:
  rule2: true
  rule3: true
`;

      const topConfig = `
extends:
  - ./middle-config.yaml
rules:
  rule3: false
`;

      const basePath = path.join(tempDir, 'base-config.yaml');
      const middlePath = path.join(tempDir, 'middle-config.yaml');
      const topPath = path.join(tempDir, 'top-config.yaml');

      fs.writeFileSync(basePath, baseConfig);
      fs.writeFileSync(middlePath, middleConfig);
      fs.writeFileSync(topPath, topConfig);

      const config = await parser.loadAndResolve(topPath);

      expect(config.rules!['rule1']).toBe(true);
      expect(config.rules!['rule2']).toBe(true);
      expect(config.rules!['rule3']).toBe(false);
    });

    it('should get cache stats with entries', async () => {
      parser.clearCache();

      const config1Path = path.join(tempDir, 'stats1.yaml');
      const config2Path = path.join(tempDir, 'stats2.yaml');

      fs.writeFileSync(config1Path, 'rules: {}');
      fs.writeFileSync(config2Path, 'rules: {}');

      await parser.loadConfig(config1Path);
      await parser.loadConfig(config2Path);

      const stats = parser.getCacheStats();

      expect(stats.size).toBe(2);
      expect(stats.entries).toContain(config1Path);
      expect(stats.entries).toContain(config2Path);
    });
  });

  describe('Factory function', () => {
    it('should create ConfigParser via factory', () => {
      const parser = createConfigParser();

      expect(parser).toBeInstanceOf(ConfigParser);
    });
  });
});
