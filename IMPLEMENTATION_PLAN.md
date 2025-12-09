# API Contract Guardian - Phase 1 Implementation Plan

## 📋 Overview

Phase 1 MVP focuses on building a solid foundation for the core validation engine and basic CLI tool. This plan details the exact implementation sequence, architectural decisions, and quality gates.

**Duration**: Weeks 1-4
**Goal**: A working CLI tool that can validate OpenAPI specs against 20 essential rules

---

## 🏗️ Architectural Decisions

### 1. Monorepo Strategy
- **Tool**: npm workspaces (native, no external tooling)
- **Rationale**: Simpler than lerna, built-in to Node.js 16+, sufficient for this scale
- **Structure**: Root package.json defines workspaces, each package is independent

### 2. TypeScript Configuration
- **Target**: ES2020, CommonJS modules (best CLI compatibility)
- **strict**: true (all strict flags enabled)
- **Declaration Files**: Generated for package distribution
- **Path Aliases**: @core, @cli for cross-package imports

### 3. Build & Distribution
- **Compiler**: tsc (no bundler for CLI, simplicity matters)
- **CLI Entry**: bin/api-guardian.ts transpiled to CommonJS
- **npm Link**: For local development testing

### 4. Testing Strategy
- **Framework**: Jest (native TypeScript support via ts-jest)
- **Coverage Target**: >85% minimum for Phase 1
- **Test Structure**: Tests colocated with logic, separate test directory for fixtures
- **Fixtures**: Real OpenAPI 3.0/3.1 examples from public APIs

### 5. Rule Engine Design
- **Foundation**: Spectral 6.x (don't reinvent the wheel)
- **Custom Rules**: Implement Spectral-compatible rule format for extensibility
- **Rule Registry**: In-memory registry with lazy loading
- **20 Essential Rules**: Grouped by category (structural, documentation, REST, governance, security)

### 6. Error Handling
- **Custom Error Classes**: ValidationError, ConfigError, SpecLoadError, RefResolutionError
- **Error Context**: Line numbers, file paths, suggested fixes where possible
- **Error Messages**: User-friendly with actionable guidance

### 7. Logging
- **Library**: Debug module (lightweight, zero-dependency)
- **Namespaces**: @api-guardian:core, @api-guardian:cli, etc.
- **Levels**: error, warn, info, debug (configurable via DEBUG env var)

---

## 📁 File Structure & Modules

### Root Configuration Files
```
api-contract-guardian/
├── package.json                 # Workspace definition, shared scripts
├── tsconfig.json                # Base TypeScript config
├── .eslintrc.json               # ESLint configuration
├── .prettierrc                  # Prettier formatting
├── jest.config.js               # Root Jest config
├── .gitignore
├── .husky/                      # Git hooks
├── .github/workflows/
│   └── ci.yml                   # CI/CD pipeline
└── README.md
```

### Core Package (`packages/core/`)

**Purpose**: Validation engine, spec loading, rule engine, config parsing

**Module Structure**:

#### `src/interfaces/`
Defines all contracts before implementation
- `Rule.ts` - Rule interface for Spectral-compatible rules
- `Validator.ts` - Main validator orchestrator interface
- `Config.ts` - Configuration interface
- `OpenAPISpec.ts` - Parsed OpenAPI spec interface
- `index.ts` - Barrel export

#### `src/errors/`
Custom error classes with context
- `ValidationError.ts` - Raised on validation failures
- `ConfigError.ts` - Raised on config parsing issues
- `SpecLoadError.ts` - Raised on spec loading failures
- `RefResolutionError.ts` - Raised on $ref resolution failures
- `index.ts` - Barrel export

#### `src/logger/`
Debug-based logging with namespaces
- `Logger.ts` - Simple debug wrapper
- `index.ts` - Create logger instance

#### `src/loader/`
Spec file loading and reference resolution
- `SpecLoader.ts` - Load JSON/YAML files, detect format/version
- `RefResolver.ts` - Resolve $ref pointers (internal and external)
- `index.ts` - Barrel export

#### `src/config/`
Configuration parsing and validation
- `ConfigParser.ts` - Parse .api-guardian.yaml files
- `defaults.ts` - Default configuration values
- `index.ts` - Barrel export

#### `src/engine/`
Rule engine and registry
- `RuleEngine.ts` - Execute rules against specs
- `RuleRegistry.ts` - Register, retrieve, and manage rules
- `index.ts` - Barrel export

#### `src/validators/`
Validation orchestration
- `Validator.ts` - Main validator that coordinates spec loading, rule execution, reporting
- `index.ts` - Barrel export

#### `src/reporters/`
Output formatting (Phase 1: terminal only)
- `TerminalReporter.ts` - Colored terminal output with counts/severity grouping
- `index.ts` - Barrel export

#### `src/rules/`
Built-in rule definitions
- `builtIn/structural/` - 4 rules (valid schema, $ref, components, composition)
- `builtIn/documentation/` - 4 rules (descriptions, examples, IDs, security docs)
- `builtIn/rest/` - 4 rules (HTTP methods, status codes, errors, pagination)
- `builtIn/governance/` - 4 rules (versioning, naming, headers, rate limiting)
- `builtIn/security/` - 4 rules (security schemes, PII, HTTPS, auth docs)
- `index.ts` - Export all rules

#### `src/index.ts`
Public API exports for consumption by CLI

### Core Package Tests (`packages/core/tests/`)

```
tests/
├── fixtures/
│   ├── specs/
│   │   ├── valid-petstore.yaml       # Complete valid spec
│   │   ├── invalid-schema.yaml       # Schema errors
│   │   ├── missing-docs.yaml         # Documentation gaps
│   │   └── broken-refs.yaml          # $ref issues
│   └── configs/
│       ├── strict.yaml
│       ├── standard.yaml
│       └── lenient.yaml
├── unit/
│   ├── loader.test.ts
│   ├── config.test.ts
│   ├── engine.test.ts
│   ├── validator.test.ts
│   ├── reporters.test.ts
│   └── rules.test.ts
└── integration/
    └── validator-e2e.test.ts
```

### CLI Package (`packages/cli/`)

**Purpose**: Command-line interface for validation

#### `src/commands/`
- `validate.ts` - Validate command implementation
- `index.ts` - Barrel export

#### `src/utils/`
- `outputFormatter.ts` - Format output with colors/spinners
- `index.ts` - Barrel export

#### `src/index.ts`
- CLI initialization and command registration

#### `bin/`
- `api-guardian.ts` - Entry point for npm bin

### CLI Package Tests (`packages/cli/tests/`)
- `validate.test.ts` - Command execution tests
- `integration.test.ts` - Full CLI flow tests

---

## 🔄 Implementation Sequence

### Week 1: Foundation & Infrastructure

**Task 1: Repository & Monorepo Setup**
- Initialize git repository
- Set up npm workspaces
- Create package directories
- Configure root package.json with workspace definition and shared scripts

**Task 2: Root Configuration**
- TypeScript: `tsconfig.json` with strict mode, path aliases (@core, @cli)
- ESLint: `.eslintrc.json` with TypeScript support, strict rules
- Prettier: `.prettierrc` with consistent formatting
- Jest: `jest.config.js` for monorepo with ts-jest preset
- Husky & lint-staged: Pre-commit hooks for linting/formatting

**Task 3: Shared Dependencies**
- Install root-level: TypeScript, Jest, ESLint, Prettier, ts-jest, @types/node, debug
- Create `.npmrc` for workspace settings

**Deliverable**: Clean monorepo structure with all tooling configured and running

---

### Week 1-2: Core Package Foundation

**Task 4: Interfaces**
- Define all contracts: `Rule`, `Validator`, `Config`, `OpenAPISpec`
- Use JSDoc extensively for IDE autocomplete
- No implementations—contracts only

**Task 5: Error Classes**
- `ValidationError`, `ConfigError`, `SpecLoadError`, `RefResolutionError`
- Each includes: message, code, context (file, line, suggestion)
- Write unit tests for error creation and serialization

**Task 6: Logger**
- Simple debug-based logger with namespaces
- Methods: error(), warn(), info(), debug()
- Write unit tests for logging behavior

**Task 7: OpenAPI Spec Loader**
- `SpecLoader.ts`: Load JSON/YAML files, detect OpenAPI version
- `RefResolver.ts`: Resolve $ref pointers (local and remote)
- Handle bundled specs (single file) and split specs (multiple files)
- Unit tests with fixture specs

**Deliverable**: Core foundation with spec loading capability

---

### Week 2: Configuration & Rule Engine

**Task 8: Configuration Parser**
- Parse `.api-guardian.yaml` files
- Support extends/inheritance from presets
- Validate config against schema
- Unit tests with fixture configs

**Task 9: Rule Engine**
- `RuleEngine.ts`: Execute rules against spec objects
- `RuleRegistry.ts`: Register and retrieve rules by name
- Support rule severity levels (error, warning, info, hint)
- Unit tests for rule execution

**Task 10: Validator Orchestrator**
- Main `Validator` class that:
  - Loads spec file
  - Parses configuration
  - Executes all registered rules
  - Collects and returns results
- Unit tests for orchestration flow
- Integration tests combining loader + engine + config

**Deliverable**: End-to-end validation pipeline (spec → results)

---

### Week 2-3: Built-in Rules

**Task 11: 20 Essential Rules**
Implement Spectral-compatible rules in groups:

**Structural Integrity (4 rules)**
- Valid OpenAPI schema structure
- Proper $ref usage (no broken references)
- Valid component definitions
- Schema composition validation (allOf/oneOf/anyOf)

**Documentation Quality (4 rules)**
- Required operation descriptions
- Required parameter descriptions
- Example values in schemas
- Security scheme documentation

**REST Best Practices (4 rules)**
- Valid HTTP method usage
- Standard status code patterns (200, 201, 400, 401, 404, 500)
- Standard error response structure
- Pagination parameter documentation

**Governance (4 rules)**
- Semantic versioning format (^d.d.d$)
- Naming convention enforcement (camelCase for properties)
- Correlation ID header requirement
- Rate limiting documentation

**Security (4 rules)**
- Security schemes defined and applied
- Sensitive fields identification (id, email, password)
- HTTPS-only enforcement
- Authentication/authorization documentation

Unit tests for each rule with fixtures demonstrating pass/fail cases

**Deliverable**: 20 working rules with >85% coverage

---

### Week 3: Reporting & CLI

**Task 12: Terminal Reporter**
- Format validation results for terminal output
- Group issues by severity
- Show file paths and line numbers
- Colored output (chalk): red (errors), yellow (warnings), blue (info)
- Summary counts

Unit tests for output formatting

**Task 13: CLI Validate Command**
- Implement validate command with options:
  - `--config <file>` - Custom config path
  - `--ruleset <name>` - Preset (strict/standard/lenient)
  - `--format <type>` - Output format (terminal only in Phase 1)
  - `--fail-severity <level>` - Exit code threshold
  - `--ignore-paths <patterns>` - Glob patterns to exclude
  - `--watch` - Revalidate on file changes
- Error handling and exit codes
- Unit tests for command parsing
- Integration tests for full CLI flow

**Task 14: CLI Package Setup**
- Entry point: `bin/api-guardian.ts` using Commander.js
- Help text and command documentation
- Version from package.json
- Proper exit codes

**Deliverable**: Working CLI tool: `api-guardian validate <spec>`

---

### Week 3-4: Integration & Quality

**Task 15: Fixture OpenAPI Specs**
Create realistic test fixtures:
- `valid-petstore.yaml` - Complete, valid OpenAPI 3.0 spec
- `invalid-schema.yaml` - Schema structure errors
- `missing-docs.yaml` - Documentation gaps
- `broken-refs.yaml` - $ref resolution failures
- `security-issues.yaml` - Security rule violations

**Task 16: Comprehensive Testing**
- Unit test coverage >85% for all modules
- Integration tests for full validator pipeline
- E2E tests for CLI command
- Test fixtures covering all rule categories
- Run coverage reports

**Task 17: Documentation**
- README.md with usage examples
- CONTRIBUTING.md with dev setup
- Inline JSDoc on all public APIs
- Example config files

**Task 18: CI/CD Pipeline**
- GitHub Actions workflow
- Install dependencies
- Lint code (ESLint)
- Run tests with coverage
- Build packages
- Fail on test failures or coverage drops

**Deliverable**: Production-ready MVP with full test suite and documentation

---

## 📊 Quality Gates

### Code Quality
- [ ] ESLint passes without warnings
- [ ] Prettier formatting applied
- [ ] No unused variables or imports
- [ ] All functions have JSDoc comments

### Testing
- [ ] >85% code coverage
- [ ] All modules have unit tests
- [ ] Integration tests for major flows
- [ ] E2E tests for CLI commands
- [ ] All tests passing

### Documentation
- [ ] README with quick start
- [ ] CONTRIBUTING.md with dev setup
- [ ] JSDoc on all exported functions/classes
- [ ] Example configs provided
- [ ] Error messages are clear and actionable

### Git & CI
- [ ] Git history is clean (meaningful commits)
- [ ] GitHub Action passing on main
- [ ] No secrets in repository
- [ ] License file present

---

## 🎯 Success Criteria

**Phase 1 Complete When:**
1. ✅ `npm install` + `npm test` works with >85% coverage
2. ✅ `api-guardian validate openapi.yaml` produces correct results
3. ✅ All 20 rules are implemented and tested
4. ✅ Terminal output is clear and helpful
5. ✅ Configuration files work correctly
6. ✅ Error messages guide users to solutions
7. ✅ CI/CD pipeline passes consistently
8. ✅ Documentation is comprehensive
9. ✅ Code follows established patterns consistently

---

## 🚀 Next Phases (Deferred)

**Phase 2** will add:
- Breaking change detection (diff command)
- JSON/JUnit/HTML/Markdown output formats
- Auto-fix capabilities
- Watch mode enhancements

**Phase 3** will add:
- VSCode extension
- GitHub Action wrapper
- Docker image
- Advanced documentation

---

## 📝 Notes

- **Dependency Injection**: Use constructor parameters, not singletons, for testability
- **Error Context**: Always include file path, line number, and actionable suggestions
- **Logging**: Use debug module with @api-guardian namespaces for troubleshooting
- **Configuration**: Support both YAML and JSON for flexibility
- **Extensibility**: Design rule engine to support custom rules from Day 1
- **Performance**: Don't optimize yet—focus on correctness. Revisit in Phase 2 if needed.
