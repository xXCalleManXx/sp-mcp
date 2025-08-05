import { Schema, z } from "zod";
import { runCLI } from "../utils/cli.js";
import { runPackageManagerCommand } from "../utils/package-manager.js";
import { getConfig } from "../config.js";
import { logger } from "../utils/logger.js";

// Create the test run schema dynamically based on configuration
const createTestRunSchema = () => {
    const config = getConfig();
    
    let schema = {
        projectRoot: z.string().describe('The root directory of the project where package.json or composer.json is located.'),
        fileName: z.string().optional().describe('Optional file name to run specific tests. If not provided, all tests are run.'),
        testName: z.string().optional().describe('Optional test name to run specific tests. If not provided, all tests are run. Can be a regex string')
    };
    
    // Only add isE2E field if e2e tests are enabled
    if (config.e2eTestsEnabled) {
        (schema as any).isE2E = z.boolean().optional().describe('Optional flag to indicate if the tests are e2e tests. If not provided, it defaults to false.');
    }
    
    return schema;
};

// Export a getter function instead of the schema directly
export const getTestRunSchema = createTestRunSchema;


const getCommandArguments = (testFramework: 'jest' | 'phpunit', config: {fileName?: string, testName?: string}) => {
    if (testFramework === 'jest') {
        const args: string[] = [];
        if (config.fileName) {
            args.push(config.fileName);
        }
        if (config.testName) {
            args.push(`-t`, config.testName);
        }
        return args;
    } else if (testFramework === 'phpunit') {
        const args: string[] = [];
        let filter = '';

        if (config.fileName && config.testName) {
            filter = config.fileName + '::' + config.testName;
        } else if (config.fileName) {
            filter = config.fileName;
        } else if (config.testName) {
            filter = config.testName;
        }

        if (filter.length > 0) {
            args.push(`--filter`, filter);
        }
        return args;
    }
    return [];

}

export const testRunHandler = async (params: unknown) => {
    const schema = createTestRunSchema();
    const parsed = z.object(schema).parse(params);
    logger.debug(`Running tests in project directory: ${JSON.stringify(parsed)} / ${JSON.stringify(params)}`);
    const { projectRoot, fileName, testName } = parsed;
    const isE2E = 'isE2E' in parsed ? parsed.isE2E : undefined;
    const config = getConfig();
    
    // If e2e tests are disabled, ignore the isE2E parameter
    const effectiveIsE2E = config.e2eTestsEnabled ? (isE2E || false) : false;
    
    // Check if tests are enabled
    if (!config.testsEnabled && !effectiveIsE2E) {
        return {
            content: [{
                type: "text" as const,
                text: 'Unit tests are disabled in configuration.'
            }]
        };
    }
    
    if (!config.e2eTestsEnabled && effectiveIsE2E) {
        return {
            content: [{
                type: "text" as const,
                text: 'E2E tests are disabled in configuration.'
            }]
        };
    }

    let _isE2E = effectiveIsE2E;

    let testCommand = config.testCommand;

    if (fileName && typeof fileName === "string") {
        if (fileName.endsWith(".e2e-spec.ts")) {
            _isE2E = true; // If the file is an e2e test, set _isE2E to true
        }
        if (fileName.endsWith(".spec.ts")) {
            _isE2E = false; // If the file is a regular test, set _isE2E to false
        }
    }
    const args = getCommandArguments(config.packageManager === 'composer' ? 'phpunit' : 'jest', { fileName, testName });

    // If isE2E is true, run e2e tests
    if (_isE2E) {
        testCommand = config.e2eTestCommand;
    }

    logger.debug(`Running tests in project directory: ${projectRoot}`);

    const fullArgs = [testCommand];

    if (config.packageManager === 'composer') {
        fullArgs.push('--');
    }
    fullArgs.push(...args);

    // Run the command using the runPackageManagerCommand function
    const result = await runPackageManagerCommand(fullArgs, projectRoot);
    logger.debug(`Command result: ${result}`);

    return {
        content: [{
            type: "text" as const,
            text: result
        }]
    };
};
