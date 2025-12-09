/**
 * Error classes for API Contract Guardian
 *
 * Central export point for all custom error types and utilities.
 */

export { BaseError, type ErrorContext } from './BaseError';
export { ValidationError, type ValidationErrorDetails } from './ValidationError';
export { ConfigError, type ConfigErrorDetails } from './ConfigError';
export { SpecLoadError, type SpecLoadErrorDetails } from './SpecLoadError';
export { RefResolutionError, type RefResolutionErrorDetails } from './RefResolutionError';
