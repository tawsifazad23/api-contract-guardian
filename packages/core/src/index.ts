/**
 * @api-contract-guardian/core
 *
 * Core validation engine for API Contract Guardian
 * Handles OpenAPI spec loading, rule execution, and validation orchestration
 */

// Export all interfaces and types
export * from './interfaces';

// Export all error classes
export * from './errors';

// Export logger utilities
export * from './logger';

// Export loader utilities
export * from './loader';

// Export configuration utilities
export * from './config';

// Export rule management utilities
export * from './rules';

// Export validator orchestrator
export * from './validator';

/**
 * Core package version
 */
export const version = '1.0.0';
