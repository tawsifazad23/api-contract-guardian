/**
 * Core interfaces and types
 *
 * Central export point for all type definitions used throughout
 * the API Contract Guardian validation engine.
 */

export type { ValidationIssue, ValidationStats, ValidationResult } from './ValidationResult';
export { IssueSeverity } from './ValidationResult';

export type { Rule, RuleFunction, RuleOptions, SpectralRule, RuleOverride } from './Rule';
export { RuleCategory } from './Rule';

export type {
  ApiGuardianConfig,
  FileConfig,
  RuleConfig,
  RulesetDefinition,
  ResolvedConfig,
  CliOverrides,
} from './Config';
export { RulesetLevel } from './Config';

export type {
  OpenAPISpec,
  LoadedSpec,
  SpecMetadata,
  InfoObject,
  PathObject,
  OperationObject,
  SchemaObject,
  ComponentsObject,
} from './OpenAPISpec';
export { OpenAPIVersion, SpecFormat } from './OpenAPISpec';

export type {
  Validator,
  ValidatorOptions,
  ValidatorFactory,
  RuleExecutionResult,
} from './Validator';
