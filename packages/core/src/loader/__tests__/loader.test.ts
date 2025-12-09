/**
 * Tests for SpecLoader and RefResolver
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { SpecLoader, createSpecLoader } from '../SpecLoader';
import { RefResolver, createRefResolver } from '../RefResolver';
import { SpecLoadError, RefResolutionError } from '../../errors';
import { SpecFormat, OpenAPIVersion, type OpenAPISpec } from '../../interfaces';

describe('Loader Module', () => {
  let tempDir: string;

  beforeAll(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-'));
  });

  afterAll(() => {
    // Clean up temp files
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

  describe('SpecLoader', () => {
    let loader: SpecLoader;

    beforeEach(() => {
      loader = createSpecLoader();
    });

    it('should create a SpecLoader instance', () => {
      expect(loader).toBeInstanceOf(SpecLoader);
    });

    it('should load a JSON OpenAPI spec', async () => {
      const specContent = {
        openapi: '3.0.3',
        info: {
          title: 'Test API',
          version: '1.0.0',
        },
        paths: {},
      };

      const filePath = path.join(tempDir, 'openapi.json');
      fs.writeFileSync(filePath, JSON.stringify(specContent));

      const spec = await loader.loadSpec(filePath);

      expect(spec.openapi).toBe('3.0.3');
      expect(spec.info?.title).toBe('Test API');
      expect(spec.metadata.format).toBe(SpecFormat.JSON);
      expect(spec.metadata.version).toBe(OpenAPIVersion.V3_0);
    });

    it('should load a YAML OpenAPI spec', async () => {
      const specContent = `
openapi: 3.0.3
info:
  title: Test API
  version: 1.0.0
paths: {}
`;

      const filePath = path.join(tempDir, 'openapi.yaml');
      fs.writeFileSync(filePath, specContent);

      const spec = await loader.loadSpec(filePath);

      expect(spec.openapi).toBe('3.0.3');
      expect(spec.info?.title).toBe('Test API');
      expect(spec.metadata.format).toBe(SpecFormat.YAML);
    });

    it('should detect OpenAPI 3.1.x', async () => {
      const specContent = {
        openapi: '3.1.0',
        info: {
          title: 'Test API',
          version: '1.0.0',
        },
        paths: {},
      };

      const filePath = path.join(tempDir, 'openapi-31.json');
      fs.writeFileSync(filePath, JSON.stringify(specContent));

      const spec = await loader.loadSpec(filePath);

      expect(spec.metadata.version).toBe(OpenAPIVersion.V3_1);
    });

    it('should throw SpecLoadError for non-existent file', async () => {
      await expect(loader.loadSpec('/nonexistent/path.yaml')).rejects.toThrow(SpecLoadError);
    });

    it('should throw SpecLoadError for invalid JSON', async () => {
      const filePath = path.join(tempDir, 'invalid.json');
      fs.writeFileSync(filePath, 'not valid json {');

      await expect(loader.loadSpec(filePath)).rejects.toThrow(SpecLoadError);
    });

    it('should throw SpecLoadError for invalid YAML', async () => {
      const filePath = path.join(tempDir, 'invalid.yaml');
      fs.writeFileSync(filePath, 'invalid: yaml: bad: indentation');

      await expect(loader.loadSpec(filePath)).rejects.toThrow(SpecLoadError);
    });

    it('should throw SpecLoadError for missing info', async () => {
      const specContent = {
        openapi: '3.0.3',
        paths: {},
      };

      const filePath = path.join(tempDir, 'no-info.json');
      fs.writeFileSync(filePath, JSON.stringify(specContent));

      await expect(loader.loadSpec(filePath)).rejects.toThrow(SpecLoadError);
    });

    it('should throw SpecLoadError for missing openapi version', async () => {
      const specContent = {
        info: {
          title: 'Test API',
          version: '1.0.0',
        },
        paths: {},
      };

      const filePath = path.join(tempDir, 'no-version.json');
      fs.writeFileSync(filePath, JSON.stringify(specContent));

      await expect(loader.loadSpec(filePath)).rejects.toThrow(SpecLoadError);
    });

    it('should load multiple specs', async () => {
      const spec1Content = {
        openapi: '3.0.3',
        info: { title: 'API 1', version: '1.0.0' },
        paths: {},
      };

      const spec2Content = {
        openapi: '3.0.3',
        info: { title: 'API 2', version: '2.0.0' },
        paths: {},
      };

      const filePath1 = path.join(tempDir, 'api1.json');
      const filePath2 = path.join(tempDir, 'api2.json');

      fs.writeFileSync(filePath1, JSON.stringify(spec1Content));
      fs.writeFileSync(filePath2, JSON.stringify(spec2Content));

      const specs = await loader.loadSpecs([filePath1, filePath2]);

      expect(specs).toHaveLength(2);
      expect(specs[0].info?.title).toBe('API 1');
      expect(specs[1].info?.title).toBe('API 2');
    });
  });

  describe('RefResolver', () => {
    let spec: OpenAPISpec;
    let resolver: RefResolver;

    beforeAll(async () => {
      const specContent = {
        openapi: '3.0.3',
        info: {
          title: 'Test API',
          version: '1.0.0',
        },
        paths: {},
        components: {
          schemas: {
            User: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
              },
            },
            Error: {
              type: 'object',
              properties: {
                code: { type: 'number' },
                message: { type: 'string' },
              },
            },
          },
        },
      };

      const filePath = path.join(tempDir, 'spec-for-resolver.json');
      fs.writeFileSync(filePath, JSON.stringify(specContent));

      const loader = createSpecLoader();
      spec = await loader.loadSpec(filePath);
      resolver = createRefResolver(spec);
    });

    it('should create a RefResolver instance', () => {
      expect(resolver).toBeInstanceOf(RefResolver);
    });

    it('should resolve internal references', () => {
      const userSchema = resolver.resolve('#/components/schemas/User');

      expect(userSchema).toEqual({
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
        },
      });
    });

    it('should resolve multiple different references', () => {
      const userSchema = resolver.resolve('#/components/schemas/User');
      const errorSchema = resolver.resolve('#/components/schemas/Error');

      expect(userSchema).toHaveProperty('properties.name');
      expect(errorSchema).toHaveProperty('properties.code');
    });

    it('should throw RefResolutionError for non-existent reference', () => {
      expect(() => {
        resolver.resolve('#/components/schemas/NonExistent');
      }).toThrow(RefResolutionError);
    });

    it('should throw RefResolutionError for external references', () => {
      expect(() => {
        resolver.resolve('https://example.com/schema.json#/definitions/User');
      }).toThrow(RefResolutionError);
    });

    it('should check if reference exists', () => {
      expect(resolver.exists('#/components/schemas/User')).toBe(true);
      expect(resolver.exists('#/components/schemas/NonExistent')).toBe(false);
    });

    it('should cache resolved references', () => {
      // Clear cache to start fresh
      resolver.clearCache();

      // First resolution
      resolver.resolve('#/components/schemas/User');
      let stats = resolver.getCacheStats();
      expect(stats.size).toBe(1);

      // Second resolution (should be cached)
      resolver.resolve('#/components/schemas/User');
      stats = resolver.getCacheStats();
      expect(stats.size).toBe(1);
    });

    it('should provide cache statistics', () => {
      resolver.clearCache();

      resolver.resolve('#/components/schemas/User');
      resolver.resolve('#/components/schemas/Error');

      const stats = resolver.getCacheStats();

      expect(stats.size).toBe(2);
      expect(stats.entries).toContain('#/components/schemas/User');
      expect(stats.entries).toContain('#/components/schemas/Error');
    });

    it('should clear cache', () => {
      resolver.resolve('#/components/schemas/User');

      let stats = resolver.getCacheStats();
      expect(stats.size).toBeGreaterThan(0);

      resolver.clearCache();

      stats = resolver.getCacheStats();
      expect(stats.size).toBe(0);
    });
  });

  describe('Factory functions', () => {
    it('should create SpecLoader via factory', () => {
      const loader = createSpecLoader();

      expect(loader).toBeInstanceOf(SpecLoader);
    });

    it('should create RefResolver via factory', async () => {
      const specContent = {
        openapi: '3.0.3',
        info: { title: 'Test API', version: '1.0.0' },
        paths: {},
        components: { schemas: {} },
      };

      const filePath = path.join(tempDir, 'factory-spec.json');
      fs.writeFileSync(filePath, JSON.stringify(specContent));

      const loader = createSpecLoader();
      const spec = await loader.loadSpec(filePath);
      const resolver = createRefResolver(spec);

      expect(resolver).toBeInstanceOf(RefResolver);
    });
  });
});
