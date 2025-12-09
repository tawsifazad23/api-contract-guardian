/**
 * OpenAPI Specification types and interfaces
 *
 * Represents the structure of an OpenAPI 3.0.x or 3.1.x specification.
 * This is a simplified representation focused on contract validation.
 */

/**
 * OpenAPI specification version
 *
 * @enum {string}
 */
export enum OpenAPIVersion {
  V3_0 = '3.0',
  V3_1 = '3.1',
}

/**
 * OpenAPI specification format
 *
 * @enum {string}
 */
export enum SpecFormat {
  YAML = 'yaml',
  JSON = 'json',
}

/**
 * Metadata about the loaded spec
 */
export interface SpecMetadata {
  /**
   * Path to the spec file
   */
  filePath: string;

  /**
   * Format of the spec (yaml or json)
   */
  format: SpecFormat;

  /**
   * Detected OpenAPI version
   */
  version: OpenAPIVersion;

  /**
   * Timestamp when the spec was loaded
   */
  loadedAt: Date;

  /**
   * Raw content if this is a referenced spec
   */
  content?: string;
}

/**
 * Info object from OpenAPI spec
 */
export interface InfoObject {
  /**
   * The title of the API
   */
  title?: string;

  /**
   * A description of the API
   */
  description?: string;

  /**
   * The version of the API
   * Should follow semantic versioning (^d.d.d$)
   */
  version?: string;

  /**
   * A URL to the Terms of Service for the API
   */
  termsOfService?: string;

  /**
   * Contact information for the API
   */
  contact?: {
    name?: string;
    url?: string;
    email?: string;
  };

  /**
   * License information for the API
   */
  license?: {
    name?: string;
    url?: string;
  };
}

/**
 * Path object from OpenAPI spec
 */
export interface PathObject {
  /**
   * Summary of the operations
   */
  summary?: string;

  /**
   * Description of the path
   */
  description?: string;

  /**
   * Operations (get, post, put, delete, patch, options, head, trace)
   */
  get?: OperationObject;
  post?: OperationObject;
  put?: OperationObject;
  delete?: OperationObject;
  patch?: OperationObject;
  options?: OperationObject;
  head?: OperationObject;
  trace?: OperationObject;

  /**
   * Parameters that are applicable for all operations described under this path
   */
  parameters?: Array<Record<string, unknown>>;
}

/**
 * Operation object from OpenAPI spec
 */
export interface OperationObject {
  /**
   * A list of tags for API documentation control
   */
  tags?: string[];

  /**
   * A short summary of what the operation does
   */
  summary?: string;

  /**
   * A verbose explanation of the operation behavior
   */
  description?: string;

  /**
   * Unique string used to identify the operation
   */
  operationId?: string;

  /**
   * A list of parameters that are applicable for this operation
   */
  parameters?: Array<Record<string, unknown>>;

  /**
   * The request body applicable for this operation
   */
  requestBody?: Record<string, unknown>;

  /**
   * The list of possible responses as they are returned from executing this operation
   */
  responses?: Record<string, unknown>;

  /**
   * A declaration of which security schemes are applied for this operation
   */
  security?: Array<Record<string, unknown>>;

  /**
   * A list of servers which are relevant to this operation
   */
  servers?: Array<Record<string, unknown>>;
}

/**
 * Component schema object
 */
export interface SchemaObject {
  /**
   * Title of the schema
   */
  title?: string;

  /**
   * Description of the schema
   */
  description?: string;

  /**
   * Type of the schema
   */
  type?: string;

  /**
   * Example value
   */
  example?: unknown;

  /**
   * Properties of the schema
   */
  properties?: Record<string, SchemaObject>;

  /**
   * Required properties
   */
  required?: string[];

  /**
   * Items schema (for arrays)
   */
  items?: SchemaObject;

  /**
   * Composition schemas
   */
  allOf?: SchemaObject[];
  oneOf?: SchemaObject[];
  anyOf?: SchemaObject[];
  not?: SchemaObject;

  /**
   * Other properties
   */
  [key: string]: unknown;
}

/**
 * Components object containing reusable schemas, parameters, etc.
 */
export interface ComponentsObject {
  /**
   * Reusable schema definitions
   */
  schemas?: Record<string, SchemaObject>;

  /**
   * Reusable response definitions
   */
  responses?: Record<string, Record<string, unknown>>;

  /**
   * Reusable parameter definitions
   */
  parameters?: Record<string, Record<string, unknown>>;

  /**
   * Reusable request body definitions
   */
  requestBodies?: Record<string, Record<string, unknown>>;

  /**
   * Security scheme definitions
   */
  securitySchemes?: Record<string, Record<string, unknown>>;

  /**
   * Other reusable components
   */
  [key: string]: unknown;
}

/**
 * Parsed and validated OpenAPI specification
 *
 * This is the main interface representing an OpenAPI spec
 * after it has been loaded and parsed.
 */
export interface OpenAPISpec {
  /**
   * Metadata about the specification
   */
  metadata: SpecMetadata;

  /**
   * OpenAPI version (e.g., "3.0.3", "3.1.0")
   */
  openapi?: string;

  /**
   * API information (title, version, description, etc.)
   */
  info?: InfoObject;

  /**
   * External documentation
   */
  externalDocs?: Record<string, unknown>;

  /**
   * Servers where the API is available
   */
  servers?: Array<Record<string, unknown>>;

  /**
   * Available paths and operations
   */
  paths?: Record<string, PathObject>;

  /**
   * Webhooks (OpenAPI 3.1 feature)
   */
  webhooks?: Record<string, unknown>;

  /**
   * Reusable components (schemas, parameters, responses, security schemes, etc.)
   */
  components?: ComponentsObject;

  /**
   * Security definitions that apply to the whole API
   */
  security?: Array<Record<string, unknown>>;

  /**
   * A map of possible out-of-band callbacks
   */
  callbacks?: Record<string, unknown>;

  /**
   * Specification extensions (x-*)
   */
  [key: string]: unknown;

  /**
   * Raw parsed object (the original deserialized spec)
   */
  _raw?: Record<string, unknown>;
}

/**
 * Result of loading and parsing an OpenAPI spec
 */
export interface LoadedSpec {
  /**
   * The loaded and parsed specification
   */
  spec: OpenAPISpec;

  /**
   * Any warnings encountered during loading
   */
  warnings?: string[];

  /**
   * Whether the spec was successfully loaded and parsed
   */
  success: boolean;

  /**
   * Error message if loading failed
   */
  error?: string;
}
