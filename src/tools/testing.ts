import { z } from "zod";
import { runCLI } from "../utils/cli.js";
import { getConfig } from "../config.js";

export const testRunSchema = {
    fileName: z.string().optional().describe('Optional file name to run specific tests. If not provided, all tests are run.'),
    testName: z.string().optional().describe('Optional test name to run specific tests. If not provided, all tests are run. Can be a regex string'),
    isE2E: z.boolean().optional().describe('Optional flag to indicate if the tests are e2e tests. If not provided, it defaults to false.'),
};

export const testRunHandler = async ({ fileName, testName, isE2E }: { fileName?: string, testName?: string, isE2E?: boolean }) => {
    const config = getConfig();
    
    // Check if tests are enabled
    if (!config.testsEnabled && !isE2E) {
        return {
            content: [{
                type: "text" as const,
                text: 'Unit tests are disabled in configuration.'
            }]
        };
    }
    
    if (!config.e2eTestsEnabled && isE2E) {
        return {
            content: [{
                type: "text" as const,
                text: 'E2E tests are disabled in configuration.'
            }]
        };
    }

    let _isE2E = isE2E || false;

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

    const pwd = process.cwd();
    console.log(`Current working directory: ${pwd}`);

    // Run the command using the runCLI function
    const result = await runCLI(baseCommand, [testCommand, ...args]);
    console.log(`Command result: ${result}`);

    return {
        content: [{
            type: "text" as const,
            text: result
        }]
    };
};
