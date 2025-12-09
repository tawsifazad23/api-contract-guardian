/**
 * Rules module
 *
 * Provides rule management, execution infrastructure, and built-in validation rules.
 */

export { RuleRegistry, createRuleRegistry } from './RuleRegistry';
export { RuleEngine, createRuleEngine } from './RuleEngine';
export type { RuleExecutionStats } from './RuleEngine';

// Built-in rules
export {
  // Structural rules
  infoRequired,
  openAPIVersionValid,
  pathsRequired,
  operationResponses,
  componentsSchema,
  // Documentation rules
  infoTitle,
  infoVersion,
  operationDescription,
  apiDescription,
  // REST rules
  pathNamingConvention,
  httpMethodSemantics,
  requestBodyDocumentation,
  statusCodeDocumentation,
  // Governance rules
  apiContactInfo,
  semanticVersioning,
  parameterNaming,
  schemaDocumentation,
  // Security rules
  securityDefinition,
  noHardcodedSecrets,
  explicitErrorResponses,
  // All rules collection
  BUILTIN_RULES,
} from './builtIn';
