/**
 * Tests for Built-in Validation Rules
 *
 * Tests all 20 built-in rules across 5 categories
 */

import {
  infoRequired,
  openAPIVersionValid,
  pathsRequired,
  operationResponses,
  componentsSchema,
  infoTitle,
  infoVersion,
  operationDescription,
  apiDescription,
  pathNamingConvention,
  httpMethodSemantics,
  requestBodyDocumentation,
  statusCodeDocumentation,
  apiContactInfo,
  semanticVersioning,
  parameterNaming,
  schemaDocumentation,
  securityDefinition,
  noHardcodedSecrets,
  explicitErrorResponses,
  BUILTIN_RULES,
} from '../builtIn';
import type { OpenAPISpec } from '../../interfaces';
import { SpecFormat, OpenAPIVersion } from '../../interfaces';

describe('Built-in Validation Rules', () => {
  // Base valid spec for testing
  const validSpec: OpenAPISpec = {
    openapi: '3.0.3',
    info: {
      title: 'Test API',
      version: '1.0.0',
      description: 'A test API',
    },
    paths: {
      '/users': {
        get: {
          description: 'Get all users',
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

  describe('STRUCTURAL RULES', () => {
    describe('infoRequired', () => {
      it('should pass when info object exists', () => {
        const issues = infoRequired.fn(validSpec);
        expect(issues).toHaveLength(0);
      });

      it('should fail when info object is missing', () => {
        const spec = { ...validSpec, info: undefined };
        const issues = infoRequired.fn(spec) as Array<Record<string, unknown>>;
        expect(issues).toHaveLength(1);
        expect(issues[0].message as string).toContain('Missing required info object');
      });
    });

    describe('openAPIVersionValid', () => {
      it('should pass with valid 3.0.x version', () => {
        const issues = openAPIVersionValid.fn(validSpec);
        expect(issues).toHaveLength(0);
      });

      it('should pass with valid 3.1.x version', () => {
        const spec = { ...validSpec, openapi: '3.1.0' };
        const issues = openAPIVersionValid.fn(spec);
        expect(issues).toHaveLength(0);
      });

      it('should fail with invalid version', () => {
        const spec = { ...validSpec, openapi: '2.0' };
        const issues = openAPIVersionValid.fn(spec) as Array<Record<string, unknown>>;
        expect(issues).toHaveLength(1);
        expect(issues[0].message as string).toContain('Invalid OpenAPI version');
      });

      it('should fail when version is missing', () => {
        const spec = { ...validSpec, openapi: undefined };
        const issues = openAPIVersionValid.fn(spec) as Array<Record<string, unknown>>;
        expect(issues).toHaveLength(1);
        expect(issues[0].message as string).toContain('version is missing');
      });
    });

    describe('pathsRequired', () => {
      it('should pass when paths exist', () => {
        const issues = pathsRequired.fn(validSpec);
        expect(issues).toHaveLength(0);
      });

      it('should fail when paths are empty', () => {
        const spec = { ...validSpec, paths: {} };
        const issues = pathsRequired.fn(spec) as Array<Record<string, unknown>>;
        expect(issues).toHaveLength(1);
        expect(issues[0].message as string).toContain('No paths defined');
      });

      it('should fail when paths are missing', () => {
        const spec = { ...validSpec, paths: undefined };
        const issues = pathsRequired.fn(spec) as Array<Record<string, unknown>>;
        expect(issues).toHaveLength(1);
      });
    });

    describe('operationResponses', () => {
      it('should pass when all operations have responses', () => {
        const issues = operationResponses.fn(validSpec);
        expect(issues).toHaveLength(0);
      });

      it('should fail when operation has no responses', () => {
        const spec: OpenAPISpec = {
          ...validSpec,
          paths: {
            '/users': {
              get: {
                description: 'Get users',
                // No responses
              },
            },
          },
        };
        const issues = operationResponses.fn(spec) as Array<Record<string, unknown>>;
        expect(issues).toHaveLength(1);
        expect(issues[0].message as string).toContain('has no responses');
      });

      it('should handle multiple operations', () => {
        const spec: OpenAPISpec = {
          ...validSpec,
          paths: {
            '/users': {
              get: {
                description: 'Get users',
                responses: { '200': { description: 'OK' } },
              },
              post: {
                description: 'Create user',
                // No responses
              },
            },
          },
        };
        const issues = operationResponses.fn(spec) as Array<Record<string, unknown>>;
        expect(issues).toHaveLength(1);
        expect(issues[0].message as string).toContain('POST');
      });
    });

    describe('componentsSchema', () => {
      it('should pass when components schemas exist', () => {
        const spec: OpenAPISpec = {
          ...validSpec,
          components: {
            schemas: {
              User: {
                type: 'object',
                properties: { id: { type: 'string' } },
              },
            },
          },
        };
        const issues = componentsSchema.fn(spec);
        expect(issues).toHaveLength(0);
      });

      it('should warn when no component schemas', () => {
        const issues = componentsSchema.fn(validSpec) as Array<Record<string, unknown>>;
        expect(issues).toHaveLength(1);
        expect(issues[0].message as string).toContain('No reusable schema');
      });
    });
  });

  describe('DOCUMENTATION RULES', () => {
    describe('infoTitle', () => {
      it('should pass when title exists', () => {
        const issues = infoTitle.fn(validSpec);
        expect(issues).toHaveLength(0);
      });

      it('should fail when title is missing', () => {
        const spec = { ...validSpec, info: { version: '1.0.0' } };
        const issues = infoTitle.fn(spec) as Array<Record<string, unknown>>;
        expect(issues).toHaveLength(1);
        expect(issues[0].message as string).toContain('Missing info.title');
      });
    });

    describe('infoVersion', () => {
      it('should pass when version exists', () => {
        const issues = infoVersion.fn(validSpec);
        expect(issues).toHaveLength(0);
      });

      it('should fail when version is missing', () => {
        const spec = { ...validSpec, info: { title: 'API' } };
        const issues = infoVersion.fn(spec) as Array<Record<string, unknown>>;
        expect(issues).toHaveLength(1);
        expect(issues[0].message as string).toContain('Missing info.version');
      });
    });

    describe('operationDescription', () => {
      it('should pass when operations have descriptions', () => {
        const issues = operationDescription.fn(validSpec);
        expect(issues).toHaveLength(0);
      });

      it('should pass when operations have summary', () => {
        const spec: OpenAPISpec = {
          ...validSpec,
          paths: {
            '/users': {
              get: {
                summary: 'Get all users',
                responses: { '200': { description: 'OK' } },
              },
            },
          },
        };
        const issues = operationDescription.fn(spec);
        expect(issues).toHaveLength(0);
      });

      it('should warn when operation lacks description and summary', () => {
        const spec: OpenAPISpec = {
          ...validSpec,
          paths: {
            '/users': {
              get: {
                responses: { '200': { description: 'OK' } },
              },
            },
          },
        };
        const issues = operationDescription.fn(spec) as Array<Record<string, unknown>>;
        expect(issues).toHaveLength(1);
        expect(issues[0].message as string).toContain('lacks description');
      });
    });

    describe('apiDescription', () => {
      it('should pass when description exists', () => {
        const issues = apiDescription.fn(validSpec);
        expect(issues).toHaveLength(0);
      });

      it('should warn when description is missing', () => {
        const spec = { ...validSpec, info: { title: 'API', version: '1.0.0' } };
        const issues = apiDescription.fn(spec) as Array<Record<string, unknown>>;
        expect(issues).toHaveLength(1);
        expect(issues[0].message as string).toContain('Missing info.description');
      });
    });
  });

  describe('REST RULES', () => {
    describe('pathNamingConvention', () => {
      it('should pass with lowercase kebab-case paths', () => {
        const spec: OpenAPISpec = {
          ...validSpec,
          paths: {
            '/users': {},
            '/user-accounts': {},
          },
        };
        const issues = pathNamingConvention.fn(spec) as Array<Record<string, unknown>>;
        expect(
          issues.filter((i) => (i.message as string).includes('should use lowercase'))
        ).toHaveLength(0);
      });

      it('should warn about uppercase in paths', () => {
        const spec: OpenAPISpec = {
          ...validSpec,
          paths: {
            '/Users': {},
          },
        };
        const issues = pathNamingConvention.fn(spec) as Array<Record<string, unknown>>;
        expect(issues).toHaveLength(1);
        expect(issues[0].message as string).toContain('should use lowercase');
      });

      it('should warn about snake_case in paths', () => {
        const spec: OpenAPISpec = {
          ...validSpec,
          paths: {
            '/user_accounts': {},
          },
        };
        const issues = pathNamingConvention.fn(spec);
        expect(issues).toHaveLength(1);
      });

      it('should allow path parameters', () => {
        const spec: OpenAPISpec = {
          ...validSpec,
          paths: {
            '/users/{userId}': {},
          },
        };
        const issues = pathNamingConvention.fn(spec);
        expect(issues).toHaveLength(0);
      });
    });

    describe('httpMethodSemantics', () => {
      it('should pass with correct semantics', () => {
        const issues = httpMethodSemantics.fn(validSpec);
        expect(issues).toHaveLength(0);
      });

      it('should warn when GET operation modifies data', () => {
        const spec: OpenAPISpec = {
          ...validSpec,
          paths: {
            '/users': {
              get: {
                operationId: 'deleteUser',
                responses: { '200': { description: 'OK' } },
              },
            },
          },
        };
        const issues = httpMethodSemantics.fn(spec) as Array<Record<string, unknown>>;
        expect(issues).toHaveLength(1);
        expect(issues[0].message as string).toContain('appears to modify data');
      });
    });

    describe('requestBodyDocumentation', () => {
      it('should pass when POST has request body', () => {
        const spec: OpenAPISpec = {
          ...validSpec,
          paths: {
            '/users': {
              post: {
                description: 'Create user',
                requestBody: { content: {} },
                responses: { '201': { description: 'Created' } },
              },
            },
          },
        };
        const issues = requestBodyDocumentation.fn(spec);
        expect(issues).toHaveLength(0);
      });

      it('should warn when POST missing request body', () => {
        const spec: OpenAPISpec = {
          ...validSpec,
          paths: {
            '/users': {
              post: {
                description: 'Create user',
                responses: { '201': { description: 'Created' } },
              },
            },
          },
        };
        const issues = requestBodyDocumentation.fn(spec) as Array<Record<string, unknown>>;
        expect(issues).toHaveLength(1);
        expect(issues[0].message as string).toContain('no request body');
      });

      it('should check PUT and PATCH operations', () => {
        const spec: OpenAPISpec = {
          ...validSpec,
          paths: {
            '/users/{id}': {
              put: {
                description: 'Update user',
                responses: { '200': { description: 'OK' } },
              },
              patch: {
                description: 'Partial update',
                responses: { '200': { description: 'OK' } },
              },
            },
          },
        };
        const issues = requestBodyDocumentation.fn(spec);
        expect(issues.length).toBeGreaterThanOrEqual(2);
      });
    });

    describe('statusCodeDocumentation', () => {
      it('should pass when error codes documented', () => {
        const spec: OpenAPISpec = {
          ...validSpec,
          paths: {
            '/users': {
              post: {
                description: 'Create user',
                responses: {
                  '201': { description: 'Created' },
                  '400': { description: 'Bad Request' },
                },
              },
            },
          },
        };
        const issues = statusCodeDocumentation.fn(spec) as Array<Record<string, unknown>>;
        expect(issues.filter((i) => (i.message as string).includes('missing 4xx'))).toHaveLength(0);
      });

      it('should warn when error codes missing', () => {
        const spec: OpenAPISpec = {
          ...validSpec,
          paths: {
            '/users': {
              post: {
                description: 'Create user',
                responses: {
                  '201': { description: 'Created' },
                },
              },
            },
          },
        };
        const issues = statusCodeDocumentation.fn(spec) as Array<Record<string, unknown>>;
        expect(issues).toHaveLength(1);
        expect(issues[0].message as string).toContain('missing 4xx');
      });
    });
  });

  describe('GOVERNANCE RULES', () => {
    describe('apiContactInfo', () => {
      it('should pass when contact info exists', () => {
        const spec: OpenAPISpec = {
          ...validSpec,
          info: {
            ...validSpec.info!,
            contact: { name: 'Support', email: 'support@example.com' },
          },
        };
        const issues = apiContactInfo.fn(spec) as Array<Record<string, unknown>>;
        expect(issues).toHaveLength(0);
      });

      it('should warn when contact info missing', () => {
        const issues = apiContactInfo.fn(validSpec) as Array<Record<string, unknown>>;
        expect(issues).toHaveLength(1);
        expect(issues[0].message as string).toContain('Missing contact');
      });
    });

    describe('semanticVersioning', () => {
      it('should pass with semantic version', () => {
        const issues = semanticVersioning.fn(validSpec);
        expect(issues).toHaveLength(0);
      });

      it('should warn with non-semver format', () => {
        const spec = {
          ...validSpec,
          info: { ...validSpec.info!, version: 'latest' },
        };
        const issues = semanticVersioning.fn(spec) as Array<Record<string, unknown>>;
        expect(issues).toHaveLength(1);
        expect(issues[0].message as string).toContain('does not follow semantic');
      });

      it('should pass with extended semver', () => {
        const spec = {
          ...validSpec,
          info: { ...validSpec.info!, version: '1.0.0-beta.1' },
        };
        const issues = semanticVersioning.fn(spec);
        expect(issues).toHaveLength(0);
      });
    });

    describe('parameterNaming', () => {
      it('should pass with camelCase parameters', () => {
        const spec: OpenAPISpec = {
          ...validSpec,
          paths: {
            '/users': {
              get: {
                parameters: [{ name: 'userId' }],
                responses: { '200': { description: 'OK' } },
              },
            },
          },
        };
        const issues = parameterNaming.fn(spec) as Array<Record<string, unknown>>;
        expect(issues.filter((i) => (i.message as string).includes('camelCase'))).toHaveLength(0);
      });

      it('should warn about snake_case parameters', () => {
        const spec: OpenAPISpec = {
          ...validSpec,
          paths: {
            '/users': {
              get: {
                parameters: [{ name: 'user_id' }],
                responses: { '200': { description: 'OK' } },
              },
            },
          },
        };
        const issues = parameterNaming.fn(spec) as Array<Record<string, unknown>>;
        expect(issues).toHaveLength(1);
        expect(issues[0].message as string).toContain('snake_case');
      });
    });

    describe('schemaDocumentation', () => {
      it('should pass when schemas have descriptions', () => {
        const spec: OpenAPISpec = {
          ...validSpec,
          components: {
            schemas: {
              User: {
                type: 'object',
                description: 'A user object',
              },
            },
          },
        };
        const issues = schemaDocumentation.fn(spec);
        expect(issues).toHaveLength(0);
      });

      it('should warn when schema missing description', () => {
        const spec: OpenAPISpec = {
          ...validSpec,
          components: {
            schemas: {
              User: {
                type: 'object',
              },
            },
          },
        };
        const issues = schemaDocumentation.fn(spec) as Array<Record<string, unknown>>;
        expect(issues).toHaveLength(1);
        expect(issues[0].message as string).toContain('missing a description');
      });
    });
  });

  describe('SECURITY RULES', () => {
    describe('securityDefinition', () => {
      it('should pass when security is not required', () => {
        const issues = securityDefinition.fn(validSpec);
        expect(issues).toHaveLength(0);
      });

      it('should pass when security schemes defined', () => {
        const spec: OpenAPISpec = {
          ...validSpec,
          security: [{ bearerAuth: [] }],
          components: {
            securitySchemes: {
              bearerAuth: { type: 'http', scheme: 'bearer' },
            },
          },
        };
        const issues = securityDefinition.fn(spec);
        expect(issues).toHaveLength(0);
      });

      it('should warn when security required but no schemes', () => {
        const spec: OpenAPISpec = {
          ...validSpec,
          security: [{ bearerAuth: [] }],
        };
        const issues = securityDefinition.fn(spec) as Array<Record<string, unknown>>;
        expect(issues).toHaveLength(1);
        expect(issues[0].message as string).toContain('no security schemes');
      });
    });

    describe('noHardcodedSecrets', () => {
      it('should pass with safe examples', () => {
        const spec: OpenAPISpec = {
          ...validSpec,
          components: {
            schemas: {
              User: {
                type: 'object',
                example: 'demoUser',
              },
            },
          },
        };
        const issues = noHardcodedSecrets.fn(spec);
        expect(issues).toHaveLength(0);
      });

      it('should flag suspicious example data', () => {
        const spec: OpenAPISpec = {
          ...validSpec,
          components: {
            schemas: {
              Auth: {
                type: 'object',
                example: 'mySecretPassword123',
              },
            },
          },
        };
        const issues = noHardcodedSecrets.fn(spec) as Array<Record<string, unknown>>;
        expect(issues).toHaveLength(1);
        expect(issues[0].message as string).toContain('sensitive');
      });
    });

    describe('explicitErrorResponses', () => {
      it('should pass when error responses defined', () => {
        const spec: OpenAPISpec = {
          ...validSpec,
          paths: {
            '/users': {
              post: {
                description: 'Create user',
                responses: {
                  '201': { description: 'Created' },
                  '400': { description: 'Bad Request' },
                },
              },
            },
          },
        };
        const issues = explicitErrorResponses.fn(spec);
        expect(issues).toHaveLength(0);
      });

      it('should warn when only success responses', () => {
        const spec: OpenAPISpec = {
          ...validSpec,
          paths: {
            '/users': {
              post: {
                description: 'Create user',
                responses: {
                  '201': { description: 'Created' },
                },
              },
            },
          },
        };
        const issues = explicitErrorResponses.fn(spec) as Array<Record<string, unknown>>;
        expect(issues).toHaveLength(1);
        expect(issues[0].message as string).toContain('should define error');
      });
    });
  });

  describe('BUILTIN_RULES collection', () => {
    it('should export all 20 rules', () => {
      expect(BUILTIN_RULES).toHaveLength(20);
    });

    it('should have rules from all 5 categories', () => {
      const categories = new Set(BUILTIN_RULES.map((rule) => rule.category));
      expect(categories.size).toBe(5);
    });

    it('should have unique rule IDs', () => {
      const ids = BUILTIN_RULES.map((rule) => rule.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have proper structure for each rule', () => {
      for (const rule of BUILTIN_RULES) {
        expect(rule.id).toBeDefined();
        expect(rule.name).toBeDefined();
        expect(rule.description).toBeDefined();
        expect(rule.severity).toBeDefined();
        expect(rule.category).toBeDefined();
        expect(typeof rule.fn).toBe('function');
      }
    });
  });
});
