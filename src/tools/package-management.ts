import { z } from "zod";
import { runCLI } from "../utils/cli.js";
import { getConfig } from "../config.js";

export const yarnRunSchema = {
    command: z.string().describe('The package manager command to run.'),
    args: z.array(z.string()).optional().describe('Optional arguments to pass to the package manager command. If not provided, no additional arguments will be passed.')
};

export const yarnRunHandler = async ({ command, args = [] }: { command: string, args?: string[] }) => {
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
    console.log(`Running command: ${fullCommand}`);
    
    const result = await runCLI(config.packageManager, [command, ...args]);
    
    return {
        content: [{
            type: "text" as const,
            text: result
        }]
    };
};

export const installSchema = {
    packages: z.array(z.string()),
    dev: z.boolean().optional()
};

export const installHandler = async ({ packages, dev }: { packages: string[], dev?: boolean }) => {
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
    console.log(`Installing packages: ${command}`);
    
    const result = await runCLI(config.packageManager, args);
    
    return {
        content: [{
            type: "text" as const,
            text: result
        }]
    };
};
