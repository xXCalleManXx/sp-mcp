import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadConfig, getConfig } from "./config.js";

// Import tool handlers
import { devLogsSchema, devLogsHandler, devStartSchema, devStartHandler } from "./tools/development.js";
import { testRunSchema, testRunHandler } from "./tools/testing.js";
import { nodeSchema, nodeHandler } from "./tools/node.js";
import { yarnRunSchema, yarnRunHandler, installSchema, installHandler } from "./tools/package-management.js";
import { deleteProjectFileSchema, deleteProjectFileHandler } from "./tools/file-management.js";
import { migrationsGenerateSchema, migrationsGenerateHandler } from "./tools/database.js";
import { logger } from "./utils/logger.js";

export const createServer = () => {
    // Load configuration first
    const args = process.argv.slice(2);
    logger.debug(`Loading configuration with arguments: ${JSON.stringify(args)}`);
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
        description: 'Get the logs of the development server. It uses pm2 to get the logs of the process running in the background.',
        inputSchema: devLogsSchema
    }, devLogsHandler);

    server.registerTool('dev-start', {
        title: 'Start development server',
        description: 'Start the development server for the project. If the server is already running, nothing will happen. It uses pm2 to run the process in the background.',
        inputSchema: devStartSchema
    }, devStartHandler);

    // Register Node.js tools
    server.registerTool('node', {
        description: 'Run a Node.js command in the project directory. This tool is useful for running any Node.js command that is not covered by other tools.',
        inputSchema: nodeSchema
    }, nodeHandler);

    // Register testing tools (only if at least one test type is enabled)
    if (config.testsEnabled || config.e2eTestsEnabled) {
        server.registerTool("run", {
            title: "Run tests",
            description: "Run test files. All tests are run by default, but you can specify a file name or test name to run specific tests. If you want to run e2e tests, set the isE2E flag to true. All arguments are optional.",
            inputSchema: testRunSchema
        }, testRunHandler);
    }

    // Register package management tools
    server.registerTool("package-run", {
        title: `Run a ${config.packageManager} command`,
        description: `Run a ${config.packageManager} command. This tool is useful for running any ${config.packageManager} command that is not covered by other tools.`,
        inputSchema: yarnRunSchema
    }, yarnRunHandler);

    server.registerTool("install", {
        title: "Install packages",
        description: `Install packages using ${config.packageManager}. Can install as regular dependencies or devDependencies.`,
        inputSchema: installSchema
    }, installHandler);

    // Register file management tools
    server.registerTool("delete-project-file", {
        title: "Delete a file from the project",
        description: "Delete a file from the project. This tool is useful for cleaning up files that are no longer needed.",
        inputSchema: deleteProjectFileSchema
    }, deleteProjectFileHandler);

    // Register database tools (only if TypeORM is enabled)
    if (config.typeormEnabled) {
        server.registerTool("migrations-generate", {
            title: "Generate new TypeORM migration files",
            description: "When entities are changed, this tool can be used to generate new TypeORM migration files. It will create a new migration file in the migrations directory.",
            inputSchema: migrationsGenerateSchema
        }, migrationsGenerateHandler);
    }

    return server;
};

export const start = async () => {
    // Suppress Node.js warnings that might interfere with MCP JSON protocol
    process.env.NODE_NO_WARNINGS = '1';
    
    const server = createServer();
    
    // Start receiving messages on stdin and sending messages on stdout
    const transport = new StdioServerTransport();
    await server.connect(transport);
};
