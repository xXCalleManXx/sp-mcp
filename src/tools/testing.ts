import { z } from "zod";
import { runCLI } from "../utils/cli.js";
import { getConfig } from "../config.js";
import { logger } from "../utils/logger.js";

// Create the base schema
const baseSchema = {
    projectRoot: z.string().describe('The root directory of the project where package.json is located.'),
    fileName: z.string().optional().describe('Optional file name to run specific tests. If not provided, all tests are run.'),
    testName: z.string().optional().describe('Optional test name to run specific tests. If not provided, all tests are run. Can be a regex string'),
};

// Conditionally add isE2E field based on configuration
const createTestRunSchema = () => {
    const config = getConfig();
    const schema = { ...baseSchema };
    
    // Only add isE2E field if e2e tests are enabled
    if (config.e2eTestsEnabled) {
        (schema as any).isE2E = z.boolean().optional().describe('Optional flag to indicate if the tests are e2e tests. If not provided, it defaults to false.');
    }
    
    return schema;
};

export const testRunSchema = createTestRunSchema();

export const testRunHandler = async ({ projectRoot, fileName, testName, isE2E }: { projectRoot: string, fileName?: string, testName?: string, isE2E?: boolean }) => {
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

    const baseCommand = config.packageManager;
    const args: string[] = [];

    let testCommand = config.testCommand;

    if (fileName && typeof fileName === "string") {
        // If fileName is provided, run tests for that specific file
        args.push(fileName);

        if (fileName.endsWith(".e2e-spec.ts")) {
            _isE2E = true; // If the file is an e2e test, set _isE2E to true
        }
        if (fileName.endsWith(".spec.ts")) {
            _isE2E = false; // If the file is a regular test, set _isE2E to false
        }
    }
    if (testName && typeof testName === "string") {
        // If testName is provided, run tests for that specific test
        args.push(`-t`);
        args.push(testName);
    }

    // If isE2E is true, run e2e tests
    if (_isE2E) {
        testCommand = config.e2eTestCommand;
    }

    logger.debug(`Running tests in project directory: ${projectRoot}`);

    // Run the command using the runCLI function
    const result = await runCLI(baseCommand, [testCommand, ...args], projectRoot);
    logger.debug(`Command result: ${result}`);

    return {
        content: [{
            type: "text" as const,
            text: result
        }]
    };
};
