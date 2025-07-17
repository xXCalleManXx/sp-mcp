import { z } from "zod";
import { runCLI } from "../utils/cli.js";
import { getConfig } from "../config.js";
import { logger } from "../utils/logger.js";

export const yarnRunSchema = {
    projectRoot: z.string().describe('The root directory of the project where package.json is located.'),
    command: z.string().describe('The package manager command to run.'),
    args: z.array(z.string()).optional().describe('Optional arguments to pass to the package manager command. If not provided, no additional arguments will be passed.')
};

export const yarnRunHandler = async ({ projectRoot, command, args = [] }: { projectRoot: string, command: string, args?: string[] }) => {
    const config = getConfig();
    
    if (config.bannedScripts.includes(command)) {
        return {
            content: [{
                type: "text" as const,
                text: `The command "${command}" is not allowed to be run directly. Please use the appropriate tool for this command.`
            }]
        };
    }

    const fullCommand = `${config.packageManager} ${command} ${args.join(' ')}`;
    logger.debug(`Running command: ${fullCommand} in ${projectRoot}`);
    
    const result = await runCLI(config.packageManager, [command, ...args], projectRoot);
    
    return {
        content: [{
            type: "text" as const,
            text: result
        }]
    };
};

export const installSchema = {
    projectRoot: z.string().describe('The root directory of the project where package.json is located.'),
    packages: z.array(z.string()),
    dev: z.boolean().optional()
};

export const installHandler = async ({ projectRoot, packages, dev }: { projectRoot: string, packages: string[], dev?: boolean }) => {
    const config = getConfig();
    
    if (!packages || packages.length === 0) {
        return {
            content: [{
                type: "text" as const,
                text: "No packages specified to install."
            }]
        };
    }

    const args = ['add'];
    
    // Add --dev flag if installing as devDependencies
    if (dev) {
        args.push('--dev');
    }
    
    // Add all packages to the command
    args.push(...packages);
    
    const command = `${config.packageManager} ${args.join(' ')}`;
    logger.debug(`Installing packages: ${command} in ${projectRoot}`);
    
    const result = await runCLI(config.packageManager, args, projectRoot);
    
    return {
        content: [{
            type: "text" as const,
            text: result
        }]
    };
};
