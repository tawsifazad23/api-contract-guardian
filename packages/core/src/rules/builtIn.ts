/**
 * Built-in Validation Rules
 *
 * A comprehensive set of 20 essential rules for OpenAPI contract validation
 * covering: Structural, Documentation, REST, Governance, and Security categories.
 */

import type { Rule, OpenAPISpec } from '../interfaces';
import { RuleCategory, IssueSeverity } from '../interfaces';

/**
 * STRUCTURAL RULES (5 rules)
 * Validate the core structure and required components of OpenAPI specs
 */

export const infoRequired: Rule = {
  id: 'info-required',
  name: 'Info Object Required',
  description: 'OpenAPI specification must contain an info object',
  severity: IssueSeverity.ERROR,
  category: RuleCategory.STRUCTURAL,
  fn: (spec: unknown) => {
    const apiSpec = spec as OpenAPISpec;
    if (!apiSpec.info) {
      return [
        {
          message: 'Missing required info object',
          path: '$',
          suggestion: 'Add info object with title and version',
        },
      ];
    }
    return [];
  },
};

export const openAPIVersionValid: Rule = {
  id: 'openapi-version-valid',
  name: 'Valid OpenAPI Version',
  description: 'OpenAPI version must be 3.0.x or 3.1.x',
  severity: IssueSeverity.ERROR,
  category: RuleCategory.STRUCTURAL,
  fn: (spec: unknown) => {
    const apiSpec = spec as OpenAPISpec;
    if (!apiSpec.openapi) {
      return [
        {
          message: 'OpenAPI version is missing',
          path: '$.openapi',
          suggestion: 'Specify a valid OpenAPI version (3.0.0 to 3.1.x)',
        },
      ];
    }

    const version = apiSpec.openapi;
    const isValid = /^3\.[01]\./.test(version);
    if (!isValid) {
      return [
        {
          message: `Invalid OpenAPI version "${version}"`,
          path: '$.openapi',
          suggestion: 'Use OpenAPI 3.0.x or 3.1.x',
        },
      ];
    }
    return [];
  },
};

export const pathsRequired: Rule = {
  id: 'paths-required',
  name: 'Paths Object Required',
  description: 'OpenAPI specification must contain at least one path',
  severity: IssueSeverity.ERROR,
  category: RuleCategory.STRUCTURAL,
  fn: (spec: unknown) => {
    const apiSpec = spec as OpenAPISpec;
    const paths = apiSpec.paths || {};
    const pathCount = Object.keys(paths).length;

    if (pathCount === 0) {
      return [
        {
          message: 'No paths defined in specification',
          path: '$.paths',
          suggestion: 'Define at least one API endpoint path',
        },
      ];
    }
    return [];
  },
};

export const operationResponses: Rule = {
  id: 'operation-responses',
  name: 'Operation Responses Required',
  description: 'All operations must define at least one response',
  severity: IssueSeverity.ERROR,
  category: RuleCategory.STRUCTURAL,
  fn: (spec: unknown) => {
    const apiSpec = spec as OpenAPISpec;
    const issues = [];
    const paths = apiSpec.paths || {};

    for (const [pathKey, pathObj] of Object.entries(paths)) {
      if (!pathObj) continue;
      const httpMethods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head', 'trace'];

      for (const method of httpMethods) {
        const operation = (pathObj as Record<string, unknown>)[method];
        if (operation && typeof operation === 'object') {
          const op = operation as Record<string, unknown>;
          if (!op.responses || Object.keys(op.responses as Record<string, unknown>).length === 0) {
            issues.push({
              message: `Operation ${method.toUpperCase()} ${pathKey} has no responses defined`,
              path: `$.paths["${pathKey}"].${method}.responses`,
              suggestion: 'Define at least one response (e.g., 200 Success)',
            });
          }
        }
      }
    }
    return issues;
  },
};

export const componentsSchema: Rule = {
  id: 'components-schema',
  name: 'Reusable Components Should Be Used',
  description: 'Reusable schema definitions should be in components',
  severity: IssueSeverity.WARNING,
  category: RuleCategory.STRUCTURAL,
  fn: (spec: unknown) => {
    const apiSpec = spec as OpenAPISpec;
    const hasComponents =
      apiSpec.components?.schemas && Object.keys(apiSpec.components.schemas).length > 0;

    if (!hasComponents) {
      return [
        {
          message: 'No reusable schema components defined',
          path: '$.components.schemas',
          suggestion: 'Define reusable schemas in components for better maintainability',
        },
      ];
    }
    return [];
  },
};

/**
 * DOCUMENTATION RULES (4 rules)
 * Validate documentation quality and completeness
 */

export const infoTitle: Rule = {
  id: 'info-title',
  name: 'Info Title Required',
  description: 'API title must be defined in info object',
  severity: IssueSeverity.ERROR,
  category: RuleCategory.DOCUMENTATION,
  fn: (spec: unknown) => {
    const apiSpec = spec as OpenAPISpec;
    if (!apiSpec.info?.title) {
      return [
        {
          message: 'Missing info.title',
          path: '$.info.title',
          suggestion: 'Provide a clear title for your API',
        },
      ];
    }
    return [];
  },
};

export const infoVersion: Rule = {
  id: 'info-version',
  name: 'Info Version Required',
  description: 'API version must be defined in info object',
  severity: IssueSeverity.ERROR,
  category: RuleCategory.DOCUMENTATION,
  fn: (spec: unknown) => {
    const apiSpec = spec as OpenAPISpec;
    if (!apiSpec.info?.version) {
      return [
        {
          message: 'Missing info.version',
          path: '$.info.version',
          suggestion: 'Provide a version number following semantic versioning (e.g., 1.0.0)',
        },
      ];
    }
    return [];
  },
};

export const operationDescription: Rule = {
  id: 'operation-description',
  name: 'Operation Description Required',
  description: 'All operations should have a description',
  severity: IssueSeverity.WARNING,
  category: RuleCategory.DOCUMENTATION,
  fn: (spec: unknown) => {
    const apiSpec = spec as OpenAPISpec;
    const issues = [];
    const paths = apiSpec.paths || {};

    for (const [pathKey, pathObj] of Object.entries(paths)) {
      if (!pathObj) continue;
      const httpMethods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head', 'trace'];

      for (const method of httpMethods) {
        const operation = (pathObj as Record<string, unknown>)[method];
        if (operation && typeof operation === 'object') {
          const op = operation as Record<string, unknown>;
          if (!op.description && !op.summary) {
            issues.push({
              message: `Operation ${method.toUpperCase()} ${pathKey} lacks description`,
              path: `$.paths["${pathKey}"].${method}`,
              suggestion: 'Add a description explaining what this operation does',
            });
          }
        }
      }
    }
    return issues;
  },
};

export const apiDescription: Rule = {
  id: 'api-description',
  name: 'API Description Required',
  description: 'API should have a description in the info object',
  severity: IssueSeverity.WARNING,
  category: RuleCategory.DOCUMENTATION,
  fn: (spec: unknown) => {
    const apiSpec = spec as OpenAPISpec;
    if (!apiSpec.info?.description) {
      return [
        {
          message: 'Missing info.description',
          path: '$.info.description',
          suggestion: 'Provide a clear description of your API',
        },
      ];
    }
    return [];
  },
};

/**
 * REST RULES (4 rules)
 * Validate REST API best practices
 */

export const pathNamingConvention: Rule = {
  id: 'path-naming-convention',
  name: 'Path Naming Convention',
  description: 'Path segments should follow REST naming conventions (lowercase, kebab-case)',
  severity: IssueSeverity.INFO,
  category: RuleCategory.REST,
  fn: (spec: unknown) => {
    const apiSpec = spec as OpenAPISpec;
    const issues = [];
    const paths = apiSpec.paths || {};

    for (const pathKey of Object.keys(paths)) {
      // Check for uppercase letters or underscores in path segments
      const segments = pathKey.split('/').filter((s) => s.length > 0);
      for (const segment of segments) {
        if (/{/.test(segment)) continue; // Skip path parameters
        if (/[A-Z_]/.test(segment) || /([a-z]+_[a-z]+)/.test(segment)) {
          issues.push({
            message: `Path segment "${segment}" should use lowercase kebab-case`,
            path: `$.paths["${pathKey}"]`,
            suggestion:
              'Use lowercase letters with hyphens for multi-word segments (e.g., /user-accounts)',
          });
        }
      }
    }
    return issues;
  },
};

export const httpMethodSemantics: Rule = {
  id: 'http-method-semantics',
  name: 'HTTP Method Semantics',
  description: 'HTTP methods should follow REST semantics',
  severity: IssueSeverity.WARNING,
  category: RuleCategory.REST,
  fn: (spec: unknown) => {
    const apiSpec = spec as OpenAPISpec;
    const issues = [];
    const paths = apiSpec.paths || {};

    for (const [pathKey, pathObj] of Object.entries(paths)) {
      if (!pathObj) continue;

      // Check GET should not modify
      const getOp = (pathObj as Record<string, unknown>).get;
      if (getOp && typeof getOp === 'object') {
        const op = getOp as Record<string, unknown>;
        const opId = (op.operationId as string) || '';
        if (/create|update|delete|remove/.test(opId.toLowerCase())) {
          issues.push({
            message: `GET operation on ${pathKey} appears to modify data`,
            path: `$.paths["${pathKey}"].get`,
            suggestion: 'Use POST/PUT/DELETE for operations that modify data',
          });
        }
      }
    }
    return issues;
  },
};

export const requestBodyDocumentation: Rule = {
  id: 'request-body-documentation',
  name: 'Request Body Should Be Documented',
  description: 'POST/PUT/PATCH operations should document request body',
  severity: IssueSeverity.WARNING,
  category: RuleCategory.REST,
  fn: (spec: unknown) => {
    const apiSpec = spec as OpenAPISpec;
    const issues = [];
    const paths = apiSpec.paths || {};

    for (const [pathKey, pathObj] of Object.entries(paths)) {
      if (!pathObj) continue;
      const modifyingMethods = ['post', 'put', 'patch'];

      for (const method of modifyingMethods) {
        const operation = (pathObj as Record<string, unknown>)[method];
        if (operation && typeof operation === 'object') {
          const op = operation as Record<string, unknown>;
          if (!op.requestBody) {
            issues.push({
              message: `${method.toUpperCase()} operation on ${pathKey} has no request body documented`,
              path: `$.paths["${pathKey}"].${method}`,
              suggestion: `Document the request body for ${method.toUpperCase()} operations`,
            });
          }
        }
      }
    }
    return issues;
  },
};

export const statusCodeDocumentation: Rule = {
  id: 'status-code-documentation',
  name: 'All Status Codes Should Be Documented',
  description: 'Each operation should document common status codes',
  severity: IssueSeverity.INFO,
  category: RuleCategory.REST,
  fn: (spec: unknown) => {
    const apiSpec = spec as OpenAPISpec;
    const issues = [];
    const paths = apiSpec.paths || {};

    for (const [pathKey, pathObj] of Object.entries(paths)) {
      if (!pathObj) continue;
      const httpMethods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head', 'trace'];

      for (const method of httpMethods) {
        const operation = (pathObj as Record<string, unknown>)[method];
        if (operation && typeof operation === 'object') {
          const op = operation as Record<string, unknown>;
          const responses = (op.responses as Record<string, unknown>) || {};
          const statusCodes = Object.keys(responses);

          // Check for client error codes (4xx)
          const hasClientError = statusCodes.some((code) => /^4/.test(code));

          if (!hasClientError && method !== 'get') {
            issues.push({
              message: `${method.toUpperCase()} ${pathKey} missing 4xx error response`,
              path: `$.paths["${pathKey}"].${method}.responses`,
              suggestion: 'Document client error responses (e.g., 400, 422)',
            });
          }
        }
      }
    }
    return issues;
  },
};

/**
 * GOVERNANCE RULES (4 rules)
 * Validate API governance and consistency
 */

export const apiContactInfo: Rule = {
  id: 'api-contact-info',
  name: 'Contact Information Required',
  description: 'API should provide contact information',
  severity: IssueSeverity.INFO,
  category: RuleCategory.GOVERNANCE,
  fn: (spec: unknown) => {
    const apiSpec = spec as OpenAPISpec;
    if (!apiSpec.info?.contact) {
      return [
        {
          message: 'Missing contact information',
          path: '$.info.contact',
          suggestion: 'Add contact information (name, email, or URL)',
        },
      ];
    }
    return [];
  },
};

export const semanticVersioning: Rule = {
  id: 'semantic-versioning',
  name: 'Semantic Versioning',
  description: 'API version should follow semantic versioning format',
  severity: IssueSeverity.WARNING,
  category: RuleCategory.GOVERNANCE,
  fn: (spec: unknown) => {
    const apiSpec = spec as OpenAPISpec;
    const version = apiSpec.info?.version || '';

    if (!version) {
      return [];
    }

    // Check for semantic versioning format (e.g., 1.0.0)
    if (!/^\d+\.\d+\.\d+/.test(version)) {
      return [
        {
          message: `Version "${version}" does not follow semantic versioning`,
          path: '$.info.version',
          suggestion: 'Use semantic versioning format (e.g., 1.0.0, 2.1.3)',
        },
      ];
    }
    return [];
  },
};

export const parameterNaming: Rule = {
  id: 'parameter-naming',
  name: 'Parameter Naming Convention',
  description: 'Parameters should follow camelCase naming convention',
  severity: IssueSeverity.INFO,
  category: RuleCategory.GOVERNANCE,
  fn: (spec: unknown) => {
    const apiSpec = spec as OpenAPISpec;
    const issues = [];
    const paths = apiSpec.paths || {};

    for (const [pathKey, pathObj] of Object.entries(paths)) {
      if (!pathObj) continue;
      const pathParams = (pathObj as Record<string, unknown>).parameters || [];

      if (Array.isArray(pathParams)) {
        for (const param of pathParams) {
          const p = param as Record<string, unknown>;
          const name = p.name as string;
          if (name && /_/.test(name) && !/^x_/.test(name)) {
            issues.push({
              message: `Parameter "${name}" uses snake_case instead of camelCase`,
              path: `$.paths["${pathKey}"].parameters`,
              suggestion: 'Use camelCase for parameter names',
            });
          }
        }
      }

      const httpMethods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head', 'trace'];
      for (const method of httpMethods) {
        const operation = (pathObj as Record<string, unknown>)[method];
        if (operation && typeof operation === 'object') {
          const op = operation as Record<string, unknown>;
          const opParams = (op.parameters as Array<Record<string, unknown>>) || [];

          for (const param of opParams) {
            const name = param.name as string;
            if (name && /_/.test(name) && !/^x_/.test(name)) {
              issues.push({
                message: `Parameter "${name}" uses snake_case instead of camelCase`,
                path: `$.paths["${pathKey}"].${method}.parameters`,
                suggestion: 'Use camelCase for parameter names',
              });
            }
          }
        }
      }
    }
    return issues;
  },
};

export const schemaDocumentation: Rule = {
  id: 'schema-documentation',
  name: 'Schema Objects Should Be Documented',
  description: 'Reusable schema objects should have descriptions',
  severity: IssueSeverity.INFO,
  category: RuleCategory.GOVERNANCE,
  fn: (spec: unknown) => {
    const apiSpec = spec as OpenAPISpec;
    const issues = [];
    const schemas = apiSpec.components?.schemas || {};

    for (const [schemaName, schema] of Object.entries(schemas)) {
      const s = schema as Record<string, unknown>;
      if (!s.description) {
        issues.push({
          message: `Schema "${schemaName}" is missing a description`,
          path: `$.components.schemas["${schemaName}"]`,
          suggestion: 'Add a description explaining what this schema represents',
        });
      }
    }
    return issues;
  },
};

/**
 * SECURITY RULES (3 rules)
 * Validate security best practices
 */

export const securityDefinition: Rule = {
  id: 'security-definition',
  name: 'Security Definition',
  description: 'API should define security schemes if using authentication',
  severity: IssueSeverity.WARNING,
  category: RuleCategory.SECURITY,
  fn: (spec: unknown) => {
    const apiSpec = spec as OpenAPISpec;
    const hasSecurity = apiSpec.security && apiSpec.security.length > 0;
    const hasSecuritySchemes =
      apiSpec.components?.securitySchemes &&
      Object.keys(apiSpec.components.securitySchemes).length > 0;

    if (hasSecurity && !hasSecuritySchemes) {
      return [
        {
          message: 'Security is required but no security schemes are defined',
          path: '$.components.securitySchemes',
          suggestion: 'Define security schemes in components (e.g., bearerAuth, apiKeyAuth)',
        },
      ];
    }
    return [];
  },
};

export const noHardcodedSecrets: Rule = {
  id: 'no-hardcoded-secrets',
  name: 'No Hardcoded Secrets',
  description: 'Example values should not contain passwords or secrets',
  severity: IssueSeverity.ERROR,
  category: RuleCategory.SECURITY,
  fn: (spec: unknown) => {
    const apiSpec = spec as OpenAPISpec;
    const issues = [];
    const secretPatterns = [/password/i, /secret/i, /token/i, /api[_-]?key/i, /auth/i];

    // Check schema examples
    const schemas = apiSpec.components?.schemas || {};
    for (const [schemaName, schema] of Object.entries(schemas)) {
      const s = schema as Record<string, unknown>;
      const example = s.example;
      if (example && typeof example === 'string') {
        for (const pattern of secretPatterns) {
          if (pattern.test(example) && !/example|demo|test|fake/i.test(example)) {
            issues.push({
              message: `Schema "${schemaName}" contains potentially sensitive example data`,
              path: `$.components.schemas["${schemaName}"].example`,
              suggestion: 'Use generic example values (e.g., "examplePassword", "demoToken")',
            });
            break;
          }
        }
      }
    }
    return issues;
  },
};

export const explicitErrorResponses: Rule = {
  id: 'explicit-error-responses',
  name: 'Explicit Error Responses',
  description: 'Operations should define explicit error responses',
  severity: IssueSeverity.INFO,
  category: RuleCategory.SECURITY,
  fn: (spec: unknown) => {
    const apiSpec = spec as OpenAPISpec;
    const issues = [];
    const paths = apiSpec.paths || {};

    for (const [pathKey, pathObj] of Object.entries(paths)) {
      if (!pathObj) continue;
      const httpMethods = ['get', 'post', 'put', 'delete', 'patch'];

      for (const method of httpMethods) {
        const operation = (pathObj as Record<string, unknown>)[method];
        if (operation && typeof operation === 'object') {
          const op = operation as Record<string, unknown>;
          const responses = (op.responses as Record<string, unknown>) || {};
          const hasClientError = Object.keys(responses).some((code) => /^4/.test(code));
          const hasServerError = Object.keys(responses).some((code) => /^5/.test(code));

          if (!hasClientError && !hasServerError) {
            issues.push({
              message: `${method.toUpperCase()} ${pathKey} should define error responses`,
              path: `$.paths["${pathKey}"].${method}.responses`,
              suggestion: 'Add error response definitions (e.g., 400, 404, 500)',
            });
          }
        }
      }
    }
    return issues;
  },
};

/**
 * Export all built-in rules
 */
export const BUILTIN_RULES: Rule[] = [
  // Structural (5)
  infoRequired,
  openAPIVersionValid,
  pathsRequired,
  operationResponses,
  componentsSchema,

  // Documentation (4)
  infoTitle,
  infoVersion,
  operationDescription,
  apiDescription,

  // REST (4)
  pathNamingConvention,
  httpMethodSemantics,
  requestBodyDocumentation,
  statusCodeDocumentation,

  // Governance (4)
  apiContactInfo,
  semanticVersioning,
  parameterNaming,
  schemaDocumentation,

  // Security (3)
  securityDefinition,
  noHardcodedSecrets,
  explicitErrorResponses,
];
