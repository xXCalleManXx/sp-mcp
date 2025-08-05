import { z } from "zod";
import { logger } from "./utils/logger";
import { runCLI } from "./utils/cli";
import packageJson from "../package.json";

/**
 * Get default dev command based on package manager
 */
function getDefaultDevCommand(packageManager: 'yarn' | 'npm' | 'bun' | 'composer'): string {
    if (packageManager === 'composer') {
        return 'lando start';
    }
    return `pm2 start ${packageManager} --name {{projectName}} -- dev`;
}

/**
 * Get default dev logs command based on package manager
 */
function getDefaultDevLogsCommand(packageManager: 'yarn' | 'npm' | 'bun' | 'composer'): string {
    if (packageManager === 'composer') {
        return 'lando logs --timestamps --service appserver | tail -{{lines}}';
    }
    return 'pm2 logs {{projectName}} --lines {{lines}} --nostream';
}

// Define the configuration schema with descriptions
const ConfigSchema = z.object({
    packageManager: z.enum(['yarn', 'npm', 'bun', 'composer'])
        .default('yarn')
        .describe('Package manager to use for running commands'),
    packageManagerCommand: z.string()
        .optional()
        .describe('Custom command to run the package manager (e.g., "lando composer", "ddev composer", "/usr/local/bin/composer"). Defaults to the package manager name.'),
    devCommand: z.string()
        .optional()
        .describe('Absolute command to start development server. Defaults based on package manager.'),
    devLogsCommand: z.string()
        .optional()
        .describe('Absolute command to get development server logs. Defaults based on package manager.'),
    e2eTestsEnabled: z.boolean()
        .default(false)
        .describe('Enable end-to-end tests functionality'),
    e2eTestCommand: z.string()
        .default('test:e2e')
        .describe('Command to run e2e tests in package.json'),
    testsEnabled: z.boolean()
        .default(false)
        .describe('Enable unit tests functionality'),
    testCommand: z.string()
        .default('test')
        .describe('Command to run unit tests in package.json'),
    bannedScripts: z.array(z.string())
        .default(['deploy:prod', 'dev', 'add'])
        .describe('List of package.json scripts that are not allowed to run'),
    typeormEnabled: z.boolean()
        .default(false)
        .describe('Enable TypeORM migration features'),
    migrationGenerateCommand: z.string()
        .default('migration:generate')
        .describe('Command to generate TypeORM migration files')
});

export type Config = z.infer<typeof ConfigSchema>;

// Generate environment variable mappings dynamically from schema
function generateEnvMappings(): Record<string, keyof Config> {
    const mappings: Record<string, keyof Config> = {};
    const schemaKeys = Object.keys(ConfigSchema.shape) as Array<keyof Config>;
    
    schemaKeys.forEach(key => {
        const envKey = `MCP_${key.replace(/([A-Z])/g, '_$1').toUpperCase()}`;
        mappings[envKey] = key;
    });
    
    return mappings;
}

// Generate command line argument mappings dynamically from schema
function generateArgMappings(): Record<string, keyof Config> {
    const mappings: Record<string, keyof Config> = {};
    const schemaKeys = Object.keys(ConfigSchema.shape) as Array<keyof Config>;
    
    schemaKeys.forEach(key => {
        const argKey = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
        mappings[argKey] = key;
    });
    
    return mappings;
}

const ENV_MAPPINGS = generateEnvMappings();
const ARG_MAPPINGS = generateArgMappings();

/**
 * Get the type of a schema field for type-safe parsing
 */
function getSchemaFieldType(key: keyof Config): string {
    const field = ConfigSchema.shape[key];
    
    if (field instanceof z.ZodBoolean || field instanceof z.ZodDefault && field._def.innerType instanceof z.ZodBoolean) {
        return 'boolean';
    }
    if (field instanceof z.ZodArray || field instanceof z.ZodDefault && field._def.innerType instanceof z.ZodArray) {
        return 'array';
    }
    if (field instanceof z.ZodEnum || field instanceof z.ZodDefault && field._def.innerType instanceof z.ZodEnum) {
        return 'enum';
    }
    return 'string';
}

/**
 * Parse a value based on its expected type
 */
function parseValueByType(value: string, type: string): any {
    switch (type) {
        case 'boolean':
            return value.toLowerCase() === 'true';
        case 'array':
            return value.split(',').map(s => s.trim()).filter(s => s.length > 0);
        default:
            return value;
    }
}

/**
 * Parse environment variables into config object
 */
function parseEnvironmentVariables(): Partial<Config> {
    const config: Partial<Config> = {};
    
    Object.entries(ENV_MAPPINGS).forEach(([envKey, configKey]) => {
        const envValue = process.env[envKey];
        if (envValue !== undefined) {
            const fieldType = getSchemaFieldType(configKey);
            (config as any)[configKey] = parseValueByType(envValue, fieldType);
        }
    });
    
    return config;
}

/**
 * Parse command line arguments into config object
 */
export function parseCommandLineArguments(args: string[] = process.argv.slice(2)): Partial<Config> {
    const config: Partial<Config> = {};
    
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        
        if (arg && arg.startsWith('--')) {
            let key: string;
            let value: string | undefined;
            
            // Handle --key=value format
            if (arg.includes('=')) {
                const [argKey, argValue] = arg.split('=', 2) as [string, string | undefined];
                key = argKey;
                value = argValue;
            } 
            // Handle --key value format
            else {
                key = arg;
                if (i + 1 < args.length && !args[i + 1]?.startsWith('--')) {
                    value = args[i + 1];
                    i++; // Skip next argument as it's the value
                }
            }
            
            if (key in ARG_MAPPINGS && value !== undefined) {
                const configKey = ARG_MAPPINGS[key as keyof typeof ARG_MAPPINGS];
                
                if (configKey) {
                    const fieldType = getSchemaFieldType(configKey);
                    (config as any)[configKey] = parseValueByType(value, fieldType);
                }
            }
        }
    }
    
    return config;
}

/**
 * Load and validate configuration from environment variables and command line arguments
 * Command line arguments take priority over environment variables
 */
export function loadConfig(args?: string[]): Config {
    // Start with environment variables
    const envConfig = parseEnvironmentVariables();

    logger.debug(`Parsed environment variables: ${JSON.stringify(envConfig)}`);
    
    // Override with command line arguments (higher priority)
    const argConfig = parseCommandLineArguments(args);

    logger.debug(`Parsed command line arguments: ${JSON.stringify(argConfig)}`);
    
    // Merge configurations (args override env)
    const mergedConfig = {
        ...envConfig,
        ...argConfig
    };
    
    // Apply dynamic defaults for devCommand and devLogsCommand if not provided
    const packageManager = mergedConfig.packageManager || 'yarn';
    if (!mergedConfig.devCommand) {
        mergedConfig.devCommand = getDefaultDevCommand(packageManager as 'yarn' | 'npm' | 'bun' | 'composer');
    }
    if (!mergedConfig.devLogsCommand) {
        mergedConfig.devLogsCommand = getDefaultDevLogsCommand(packageManager as 'yarn' | 'npm' | 'bun' | 'composer');
    }
    // Set default packageManagerCommand if not provided
    if (!mergedConfig.packageManagerCommand) {
        mergedConfig.packageManagerCommand = packageManager;
    }
    
    // Validate and apply defaults
    const result = ConfigSchema.parse(mergedConfig);
    
    // Don't log in production - it interferes with MCP JSON protocol
    // console.log('Loaded configuration:', result);
    return result;
}

/**
 * Get current configuration instance
 */
let configInstance: Config | null = null;

export function getConfig(): Config {
    if (!configInstance) {
        configInstance = loadConfig();
    }
    return configInstance;
}

/**
 * Reset configuration (useful for testing)
 */
export function resetConfig(): void {
    configInstance = null;
}



export const getVersion = async () => {
    // Get the version from the package.json file
    return packageJson.version || 'unknown';
}

/**
 * Generate configuration help dynamically from schema
 */
export async function printConfigHelp(): Promise<void> {
    const version = await getVersion();
    
    logger.debug(`
MCP Server Configuration Help (version ${version}):

Environment Variables:`);
    
    // Manually list the configuration options with their details
    const configOptions = [
        { key: 'MCP_PACKAGE_MANAGER', description: 'Package manager to use for running commands (yarn|npm|bun|composer)', default: 'yarn' },
        { key: 'MCP_PACKAGE_MANAGER_COMMAND', description: 'Custom command to run the package manager (e.g., "lando composer", "ddev composer")', default: 'dynamic (same as package manager)' },
        { key: 'MCP_DEV_COMMAND', description: 'Absolute command to start development server', default: 'dynamic (based on package manager)' },
        { key: 'MCP_DEV_LOGS_COMMAND', description: 'Absolute command to get development server logs', default: 'dynamic (based on package manager)' },
        { key: 'MCP_E2E_TESTS_ENABLED', description: 'Enable end-to-end tests functionality (true|false)', default: 'false' },
        { key: 'MCP_E2E_TEST_COMMAND', description: 'Command to run e2e tests in package.json', default: 'test:e2e' },
        { key: 'MCP_TESTS_ENABLED', description: 'Enable unit tests functionality (true|false)', default: 'false' },
        { key: 'MCP_TEST_COMMAND', description: 'Command to run unit tests in package.json', default: 'test' },
        { key: 'MCP_BANNED_SCRIPTS', description: 'List of package.json scripts that are not allowed to run (comma-separated)', default: 'deploy:prod,dev,add' },
        { key: 'MCP_TYPEORM_ENABLED', description: 'Enable TypeORM migration features (true|false)', default: 'false' },
        { key: 'MCP_MIGRATION_GENERATE_COMMAND', description: 'Command to generate TypeORM migration files', default: 'migration:generate' }
    ];
    
    configOptions.forEach(option => {
        logger.error(`  ${option.key.padEnd(30)} ${option.description}, default: ${option.default}`);
    });
    
    logger.error(`
Command Line Arguments (override environment variables):`);
    
    const argOptions = [
        { arg: '--package-manager', env: 'MCP_PACKAGE_MANAGER' },
        { arg: '--package-manager-command', env: 'MCP_PACKAGE_MANAGER_COMMAND' },
        { arg: '--dev-command', env: 'MCP_DEV_COMMAND' },
        { arg: '--dev-logs-command', env: 'MCP_DEV_LOGS_COMMAND' },
        { arg: '--e2e-tests-enabled', env: 'MCP_E2E_TESTS_ENABLED' },
        { arg: '--e2e-test-command', env: 'MCP_E2E_TEST_COMMAND' },
        { arg: '--tests-enabled', env: 'MCP_TESTS_ENABLED' },
        { arg: '--test-command', env: 'MCP_TEST_COMMAND' },
        { arg: '--banned-scripts', env: 'MCP_BANNED_SCRIPTS' },
        { arg: '--typeorm-enabled', env: 'MCP_TYPEORM_ENABLED' },
        { arg: '--migration-generate-command', env: 'MCP_MIGRATION_GENERATE_COMMAND' }
    ];
    
    argOptions.forEach(option => {
        logger.error(`  ${option.arg.padEnd(35)} Same as ${option.env}`);
    });
    
    logger.error(`
Examples:
  # Using environment variables
  MCP_PACKAGE_MANAGER=npm MCP_E2E_TESTS_ENABLED=false bun run index.ts
  
  # Using command line arguments
  bun run index.ts --package-manager bun --tests-enabled false
  
  # Mixed (args override env)
  MCP_PACKAGE_MANAGER=yarn bun run index.ts --package-manager npm
  
  # Composer project with Lando
  MCP_PACKAGE_MANAGER=composer bun run index.ts
  
  # Lando/DDEV Composer setup
  MCP_PACKAGE_MANAGER=composer MCP_PACKAGE_MANAGER_COMMAND="lando composer" bun run index.ts
  
  # Custom dev commands
  bun run index.ts --dev-command "docker-compose up -d" --dev-logs-command "docker-compose logs -f --tail=100"
  
  # DDEV with custom composer path
  bun run index.ts --package-manager composer --package-manager-command "ddev composer"
  
  # Show help
  bun run index.ts --help
`);
}
