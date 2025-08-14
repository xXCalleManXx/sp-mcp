import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadConfig, getConfig, getVersion } from "./config.js";

// Import tool handlers
import { devLogsSchema, devLogsHandler, devStartSchema, devStartHandler } from "./tools/development.js";
import { getTestRunSchema, testRunHandler } from "./tools/testing.js";
import { nodeSchema, nodeHandler } from "./tools/node.js";
import { landoSchema, landoHandler } from "./tools/lando.js";
import { yarnRunSchema, yarnRunHandler, installSchema, installHandler } from "./tools/package-management.js";
import { deleteProjectFileSchema, deleteProjectFileHandler } from "./tools/file-management.js";
import { migrationsGenerateSchema, migrationsGenerateHandler } from "./tools/database.js";
import { graphqlCallSchema, graphqlCallHandler, graphqlSchemaSchema, graphqlSchemaHandler } from "./tools/graphql.js";
import { logger } from "./utils/logger.js";
import { runCLI } from "./utils/cli.js";

export const createServer = () => {
    // Load configuration first
    const args = process.argv.slice(2);
    const config = loadConfig(args);

    logger.debug(`Loaded configuration: ${JSON.stringify(config)}`);

    // Create an MCP server
    const server = new McpServer({
        name: "development-tools",
        version: "1.0.0"
    });

    // Register development tools
    server.registerTool('dev-logs', {
        title: 'Get development server logs',
        description: 'Get the logs of the development server using the configured logs command. Supports custom log commands for different environments (PM2, Lando, Docker, etc.). Requires the project root directory.',
        inputSchema: devLogsSchema
    }, devLogsHandler);

    server.registerTool('dev-start', {
        title: 'Start development server',
        description: 'Start the development server for the project using the configured dev command. Supports different environments (PM2, Lando, Docker, etc.). Requires the project root directory.',
        inputSchema: devStartSchema
    }, devStartHandler);

    // Register Node.js tools
    server.registerTool('node', {
        description: 'Run a Node.js command in the project directory. This tool is useful for running any Node.js command that is not covered by other tools. Requires the project root directory.',
        inputSchema: nodeSchema
    }, nodeHandler);

    if (config.packageManager === 'composer') {
        server.registerTool("lando", {
            title: "Run a Lando command",
            description: "Run a Lando command in the project directory. This tool is useful for running any Lando command that is not covered by other tools. Requires the project root directory.",
            inputSchema: landoSchema
        }, landoHandler);
    }

    // Register testing tools (only if at least one test type is enabled)
    if (config.testsEnabled || config.e2eTestsEnabled) {
        server.registerTool("test", {
            title: "Run tests",
            description: "Run test files. All tests are run by default, but you can specify a file name or test name to run specific tests. If you want to run e2e tests, set the isE2E flag to true. All arguments are optional. Always requires the project root directory.",
            inputSchema: getTestRunSchema()
        }, testRunHandler);
    }

    // Register package management tools
    server.registerTool("package-run", {
        title: `Run a ${config.packageManager} command`,
        description: `Run a ${config.packageManager} command. This tool is useful for running any ${config.packageManager} command that is not covered by other tools. Requires the project root directory.`,
        inputSchema: yarnRunSchema
    }, yarnRunHandler);

    server.registerTool("install", {
        title: "Install packages",
        description: `Install packages using ${config.packageManager}. Can install as regular dependencies or devDependencies. Requires the project root directory.`,
        inputSchema: installSchema
    }, installHandler);

    // Register file management tools
    server.registerTool("delete-project-file", {
        title: "Delete a file from the project",
        description: "Delete a file from the project. This tool is useful for cleaning up files that are no longer needed. Requires the project root directory.",
        inputSchema: deleteProjectFileSchema
    }, deleteProjectFileHandler);

    // Register database tools (only if TypeORM is enabled)
    if (config.typeormEnabled) {
        server.registerTool("migrations-generate", {
            title: "Generate new TypeORM migration files",
            description: "When entities are changed, this tool can be used to generate new TypeORM migration files. It will create a new migration file in the migrations directory. Requires the project root directory.",
            inputSchema: migrationsGenerateSchema
        }, migrationsGenerateHandler);
    }

    // Register GraphQL tools (only if GraphQL is enabled)
    if (config.graphqlEnabled) {
        server.registerTool("graphql-call", {
            title: "Call GraphQL endpoint",
            description: "Execute GraphQL queries or mutations against a GraphQL endpoint. Supports Basic authentication and custom headers.",
            inputSchema: graphqlCallSchema
        }, graphqlCallHandler);

        server.registerTool("graphql-schema", {
            title: "Fetch GraphQL schema",
            description: "Fetch the full GraphQL schema from an endpoint using introspection and save it to a file. Supports Basic authentication.",
            inputSchema: graphqlSchemaSchema
        }, graphqlSchemaHandler);
    }

    return server;
};

export const start = async () => {
    // Suppress Node.js warnings that might interfere with MCP JSON protocol
    process.env.NODE_NO_WARNINGS = '1';

    const server = createServer();

    const version = await getVersion();

    logger.debug(`Starting MCP server version ${version}`);

    // Start receiving messages on stdin and sending messages on stdout
    const transport = new StdioServerTransport();
    await server.connect(transport);
};
