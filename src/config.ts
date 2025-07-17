import { z } from "zod";

// Define the configuration schema with descriptions
const ConfigSchema = z.object({
    packageManager: z.enum(['yarn', 'npm', 'bun'])
        .default('yarn')
        .describe('Package manager to use for running commands'),
    e2eTestsEnabled: z.boolean()
        .default(true)
        .describe('Enable end-to-end tests functionality'),
    e2eTestCommand: z.string()
        .default('test:e2e')
        .describe('Command to run e2e tests in package.json'),
    testsEnabled: z.boolean()
        .default(true)
        .describe('Enable unit tests functionality'),
    testCommand: z.string()
        .default('test')
        .describe('Command to run unit tests in package.json'),
    devCommand: z.string()
        .default('dev')
        .describe('Command to start development server in package.json'),
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
function parseCommandLineArguments(args: string[] = process.argv.slice(2)): Partial<Config> {
    const config: Partial<Config> = {};
    
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        
        if (arg && arg in ARG_MAPPINGS) {
            const configKey = ARG_MAPPINGS[arg as keyof typeof ARG_MAPPINGS];
            
            if (configKey && i + 1 < args.length) {
                const value = args[i + 1];
                
                if (value !== undefined) {
                    const fieldType = getSchemaFieldType(configKey);
                    (config as any)[configKey] = parseValueByType(value, fieldType);
                }
                i++; // Skip next argument as it's the value
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
    
    // Override with command line arguments (higher priority)
    const argConfig = parseCommandLineArguments(args);
    
    // Merge configurations (args override env)
    const mergedConfig = {
        ...envConfig,
        ...argConfig
    };
    
    // Validate and apply defaults
    const result = ConfigSchema.parse(mergedConfig);
    
    console.log('Loaded configuration:', result);
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

/**
 * Generate configuration help dynamically from schema
 */
export function printConfigHelp(): void {
    const schemaKeys = Object.keys(ConfigSchema.shape) as Array<keyof Config>;
    
    console.log(`
MCP Server Configuration Help

Environment Variables:`);
    
    schemaKeys.forEach(key => {
        const envKey = `MCP_${key.replace(/([A-Z])/g, '_$1').toUpperCase()}`;
        const field = ConfigSchema.shape[key];
        const description = field.description || 'No description available';
        const defaultValue = field._def.defaultValue ? field._def.defaultValue() : 'none';
        const fieldType = getSchemaFieldType(key);
        
        let typeHint = '';
        if (fieldType === 'boolean') {
            typeHint = ' (true|false)';
        } else if (fieldType === 'array') {
            typeHint = ' (comma-separated list)';
        } else if (fieldType === 'enum') {
            const enumValues = field instanceof z.ZodDefault 
                ? (field._def.innerType as z.ZodEnum<any>)._def.values 
                : (field as z.ZodEnum<any>)._def.values;
            typeHint = ` (${enumValues.join('|')})`;
        }
        
        console.log(`  ${envKey.padEnd(30)} ${description}${typeHint}, default: ${JSON.stringify(defaultValue)}`);
    });
    
    console.log(`
Command Line Arguments (override environment variables):`);
    
    schemaKeys.forEach(key => {
        const argKey = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
        const envKey = `MCP_${key.replace(/([A-Z])/g, '_$1').toUpperCase()}`;
        console.log(`  ${argKey.padEnd(35)} Same as ${envKey}`);
    });
    
    console.log(`
Examples:
  # Using environment variables
  MCP_PACKAGE_MANAGER=npm MCP_E2E_TESTS_ENABLED=false bun run index.ts
  
  # Using command line arguments
  bun run index.ts --package-manager bun --tests-enabled false
  
  # Mixed (args override env)
  MCP_PACKAGE_MANAGER=yarn bun run index.ts --package-manager npm
  
  # Show help
  bun run index.ts --help
`);
}
