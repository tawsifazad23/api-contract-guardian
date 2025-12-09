/**
 * Validation result types and structures
 *
 * Represents the output of a validation run, including all issues found
 * and metadata about the validation process.
 */

/**
 * Severity level for a validation issue
 *
 * @enum {string}
 * - error: Contract-breaking issues that block CI/CD
 * - warning: Best practice violations that don't block
 * - info: Suggestions for improvement
 * - hint: Optional enhancements
 */
export enum IssueSeverity {
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
  HINT = 'hint',
}

/**
 * A single validation issue found in the spec
 */
export interface ValidationIssue {
  /**
   * Unique rule identifier (e.g., 'operation-description', 'require-correlation-id')
   */
  ruleId: string;

  /**
   * Human-readable rule description
   * @example "All operations must have descriptions"
   */
  ruleDescription: string;

  /**
   * Issue severity level
   */
  severity: IssueSeverity;

  /**
   * Path to the problematic element in the spec (JSON Pointer format)
   * @example "$.paths./users.get"
   * @example "$.components.schemas.User.properties.email"
   */
  path: string;

  /**
   * Line number in the source file (1-indexed)
   */
  line?: number;

  /**
   * Column number in the source file (1-indexed)
   */
  column?: number;

  /**
   * Detailed description of the issue
   * @example "Missing description for GET /users operation"
   */
  message: string;

  /**
   * Suggested fix for the issue (if auto-fixable)
   * @example "Add a description to the operation"
   */
  suggestion?: string;

  /**
   * Category of the rule (e.g., 'structural', 'documentation', 'rest', 'governance', 'security')
   */
  category?: string;
}

/**
 * Statistics about validation results
 */
export interface ValidationStats {
  /**
   * Total number of issues found
   */
  totalIssues: number;

  /**
   * Number of errors (blocking issues)
   */
  errors: number;

  /**
   * Number of warnings
   */
  warnings: number;

  /**
   * Number of info messages
   */
  info: number;

  /**
   * Number of hints
   */
  hints: number;

  /**
   * Number of files validated
   */
  filesValidated: number;

  /**
   * Validation duration in milliseconds
   */
  duration: number;
}

/**
 * Complete validation result from running rules against a spec
 */
export interface ValidationResult {
  /**
   * Indicates if validation passed (no errors)
   */
  isValid: boolean;

  /**
   * All issues found during validation
   */
  issues: ValidationIssue[];

  /**
   * Statistics about the validation results
   */
  stats: ValidationStats;

  /**
   * Timestamp when validation was performed
   */
  timestamp: Date;

  /**
   * Path to the validated spec file
   */
  specPath: string;

  /**
   * Ruleset that was used for validation
   */
  ruleset: string;
}
