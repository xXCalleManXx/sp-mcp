# SP-MCP - System Process Model Context Protocol Server

A Model Context Protocol (MCP) server for system processes that provides development tools like test running, package management, file operations, and development server management. Built for Nodejs or other javascript/typescript runtimes.

## Setup

The server communicates via JSON-RPC over stdin/stdout following the MCP protocol. It's designed to be used with MCP clients like Claude Desktop or VS Code.

### VS Code MCP Configuration

Add this server to your VS Code MCP configuration file (`~/.vscode/mcp_servers.json` or similar):

```json
{
  "mcpServers": {
    "sp-mcp": {
      "command": "bunx",
      "args": ["sp-mcp"],
      "env": {
        "MCP_PACKAGE_MANAGER": "bun",
        "MCP_TESTS_ENABLED": "true",
        "MCP_E2E_TESTS_ENABLED": "true",
        "MCP_DEV_COMMAND": "dev"
      }
    }
  }
}
```

### Claude Desktop Configuration

Add to your Claude Desktop configuration file (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "sp-mcp": {
      "command": "bunx",
      "args": ["sp-mcp", "--package-manager", "bun", "--tests-enabled", "true"]
    }
  }
}
```

### Basic Usage

```bash
# Run with default configuration
bunx sp-mcp

# Run with custom configuration
bunx sp-mcp --package-manager bun --tests-enabled true

# Using environment variables
MCP_PACKAGE_MANAGER=npm MCP_TESTS_ENABLED=true bunx sp-mcp
```

## Configuration

The server can be configured via environment variables or command line arguments. Command line arguments take priority over environment variables.

### Environment Variables

| Variable | Description | Type | Default |
|----------|-------------|------|---------|
| `MCP_PACKAGE_MANAGER` | Package manager to use for running commands | `yarn\|npm\|bun` | `yarn` |
| `MCP_E2E_TESTS_ENABLED` | Enable end-to-end tests functionality | `true\|false` | `false` |
| `MCP_E2E_TEST_COMMAND` | Command to run e2e tests in package.json | `string` | `test:e2e` |
| `MCP_TESTS_ENABLED` | Enable unit tests functionality | `true\|false` | `false` |
| `MCP_TEST_COMMAND` | Command to run unit tests in package.json | `string` | `test` |
| `MCP_DEV_COMMAND` | Command to start development server in package.json | `string` | `dev` |
| `MCP_BANNED_SCRIPTS` | List of package.json scripts that are not allowed to run | `comma-separated list` | `deploy:prod,dev,add` |
| `MCP_TYPEORM_ENABLED` | Enable TypeORM migration features | `true\|false` | `false` |
| `MCP_MIGRATION_GENERATE_COMMAND` | Command to generate TypeORM migration files | `string` | `migration:generate` |
| `MCP_GRAPHQL_ENABLED` | Enable GraphQL tools functionality | `true\|false` | `false` |

### Command Line Arguments

All environment variables have corresponding command line arguments that override environment settings:

| Argument | Description | Example |
|----------|-------------|---------|
| `--package-manager` | Same as `MCP_PACKAGE_MANAGER` | `--package-manager bun` |
| `--e2e-tests-enabled` | Same as `MCP_E2E_TESTS_ENABLED` | `--e2e-tests-enabled true` |
| `--e2e-test-command` | Same as `MCP_E2E_TEST_COMMAND` | `--e2e-test-command test:e2e` |
| `--tests-enabled` | Same as `MCP_TESTS_ENABLED` | `--tests-enabled true` |
| `--test-command` | Same as `MCP_TEST_COMMAND` | `--test-command test` |
| `--dev-command` | Same as `MCP_DEV_COMMAND` | `--dev-command dev` |
| `--banned-scripts` | Same as `MCP_BANNED_SCRIPTS` | `--banned-scripts deploy:prod,build:prod` |
| `--typeorm-enabled` | Same as `MCP_TYPEORM_ENABLED` | `--typeorm-enabled true` |
| `--migration-generate-command` | Same as `MCP_MIGRATION_GENERATE_COMMAND` | `--migration-generate-command migration:generate` |
| `--graphql-enabled` | Same as `MCP_GRAPHQL_ENABLED` | `--graphql-enabled true` |

## Available Tools

The server provides the following MCP tools:

### Always Available Tools

#### Development Tools
- **`dev-start`** - Start development server using pm2
  - Uses the configured `devCommand` (default: `dev`)
  - Runs the process in background using pm2
  - No additional configuration required

- **`dev-logs`** - Get development server logs from pm2
  - Retrieves logs from the pm2 process
  - Supports configurable number of log lines (max 200)
  - No additional configuration required

#### Package Management Tools
- **`package-run`** - Run package manager commands
  - Uses the configured `packageManager` (yarn/npm/bun)
  - Respects the `bannedScripts` configuration
  - No additional configuration required

- **`install`** - Install packages as dependencies or devDependencies
  - Uses the configured `packageManager` (yarn/npm/bun)
  - Supports both regular and dev dependencies
  - No additional configuration required

#### File Management Tools
- **`delete-project-file`** - Delete files from the project
  - Deletes specified files from the project directory
  - No additional configuration required

#### Node.js Tools
- **`node`** - Run Node.js commands in the project directory
  - Execute any Node.js command or script
  - No additional configuration required

### Conditional Tools

#### Testing Tools
**Requirements**: `MCP_TESTS_ENABLED=true` OR `MCP_E2E_TESTS_ENABLED=true`

- **`run`** - Run unit tests or e2e tests
  - **Unit tests**: Available when `MCP_TESTS_ENABLED=true`
  - **E2E tests**: Available when `MCP_E2E_TESTS_ENABLED=true`
  - Supports file-specific testing (`fileName` parameter)
  - Supports test name filtering (`testName` parameter)
  - Automatic detection of e2e tests by `.e2e-spec.ts` file extension
  - Uses configured `testCommand` (default: `test`) for unit tests
  - Uses configured `e2eTestCommand` (default: `test:e2e`) for e2e tests

#### Database Tools
**Requirements**: `MCP_TYPEORM_ENABLED=true`

- **`migrations-generate`** - Generate TypeORM migration files
  - Generates new migration files when entities are changed
  - Uses configured `migrationGenerateCommand` (default: `migration:generate`)
  - Creates migration files in the migrations directory

#### GraphQL Tools
**Requirements**: `MCP_GRAPHQL_ENABLED=true`

- **`graphql-call`** - Execute GraphQL queries and mutations
  - Make requests to any GraphQL endpoint
  - Supports GraphQL queries and mutations
  - Optional JSON variables for parameterized queries
  - Optional custom headers
  - Optional Basic authentication (username/password)
  - Returns the complete GraphQL response

- **`graphql-schema`** - Fetch GraphQL schema via introspection
  - Retrieves the full GraphQL schema from any endpoint
  - Uses introspection query to get complete type information
  - Saves schema as JSON to specified file location
  - Optional Basic authentication (username/password)
  - Creates directories if they don't exist

### Tool Availability Summary

| Tool | Always Available | Requires Configuration |
|------|------------------|------------------------|
| `dev-start` | ✅ | None |
| `dev-logs` | ✅ | None |
| `package-run` | ✅ | None |
| `install` | ✅ | None |
| `delete-project-file` | ✅ | None |
| `node` | ✅ | None |
| `run` | ❌ | `MCP_TESTS_ENABLED=true` or `MCP_E2E_TESTS_ENABLED=true` |
| `migrations-generate` | ❌ | `MCP_TYPEORM_ENABLED=true` |
| `graphql-call` | ❌ | `MCP_GRAPHQL_ENABLED=true` |
| `graphql-schema` | ❌ | `MCP_GRAPHQL_ENABLED=true` |

## Examples

### Basic Development Setup

```bash
# Start with npm package manager and tests enabled
MCP_PACKAGE_MANAGER=npm MCP_TESTS_ENABLED=true bunx sp-mcp

# Or using command line arguments
bunx sp-mcp --package-manager npm --tests-enabled true
```

### Full Featured Setup

```bash
# Enable all features with custom commands
bunx sp-mcp \
  --package-manager bun \
  --tests-enabled true \
  --e2e-tests-enabled true \
  --test-command "test:unit" \
  --e2e-test-command "test:e2e" \
  --dev-command "start:dev" \
  --typeorm-enabled true \
  --migration-generate-command "db:migration:generate"
```

### Environment Variable Configuration

```bash
# Set up environment variables
export MCP_PACKAGE_MANAGER=bun
export MCP_TESTS_ENABLED=true
export MCP_E2E_TESTS_ENABLED=true
export MCP_DEV_COMMAND=start:dev
export MCP_BANNED_SCRIPTS=deploy:prod,build:prod,release

# Run server
bunx sp-mcp
```

### Mixed Configuration (Args Override Env)

```bash
# Environment sets defaults, arguments override specific settings
MCP_PACKAGE_MANAGER=yarn MCP_TESTS_ENABLED=false bunx sp-mcp --package-manager bun --tests-enabled true
# Result: Uses bun as package manager with tests enabled
```

### TypeORM Database Development

```bash
# Enable TypeORM features for database development
bunx sp-mcp \
  --package-manager npm \
  --typeorm-enabled true \
  --migration-generate-command "typeorm:migration:generate"
```

### GraphQL Development

```bash
# Enable GraphQL tools for API development
bunx sp-mcp \
  --package-manager npm \
  --graphql-enabled true

# Use with environment variable
MCP_GRAPHQL_ENABLED=true bunx sp-mcp
```

## Configuration Testing

Test your configuration with the included test script:

```bash
# Test current configuration
node test-config.js

# Test with specific arguments
node test-config.js --package-manager bun --tests-enabled true

# Show configuration help
node test-config.js --help
```

## Security

The `bannedScripts` configuration prevents certain package.json scripts from being executed through the `package-run` tool. By default, scripts like `deploy:prod`, `dev`, and `add` are banned to prevent accidental deployment or server startup through the wrong tool.

## Requirements

- **Bun**: 1.0.0 or higher
- **PM2**: Required for development server management
- **TypeScript**: ^5 (peer dependency)

## License

MIT

## Contributing

This project is built with Bun and TypeScript. To contribute:

1. Install Bun
2. Install dependencies: `bun install`
3. Run tests: `bun test` (if test scripts are configured)
4. Start development: `bun run index.ts`

## Troubleshooting

### Common Issues

1. **Server not starting**: Check that Bun is properly installed and version is 1.0.0+
2. **Tests not running**: Ensure `testsEnabled` or `e2eTestsEnabled` is set to `true`
3. **Package manager commands failing**: Verify the correct package manager is configured
4. **PM2 issues**: Ensure PM2 is installed globally: `npm install -g pm2`

### Debug Mode

Enable debug logging by setting the appropriate log level in your MCP client configuration.
