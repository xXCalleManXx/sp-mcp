import { z } from "zod";
import { runCLI } from "../utils/cli.js";
import { runPackageManagerCommand } from "../utils/package-manager.js";
import { getConfig } from "../config.js";
import { logger } from "../utils/logger.js";

export const yarnRunSchema = {
    projectRoot: z.string().describe('The root directory of the project where package.json or composer.json is located.'),
    command: z.string().describe('The package manager command to run.'),
    args: z.array(z.string()).optional().describe('Optional arguments to pass to the package manager command. If not provided, no additional arguments will be passed.')
};

export const yarnRunHandler = async (params: unknown) => {
    const { projectRoot, command, args = [] } = z.object(yarnRunSchema).parse(params);
    const config = getConfig();
    
    if (config.bannedScripts.includes(command)) {
        return {
            content: [{
                type: "text" as const,
                text: `The command "${command}" is not allowed to be run directly. Please use the appropriate tool for this command.`
            }]
        };
    }

    let result: string;

    // Handle composer differently
    if (config.packageManager === 'composer') {
        // For composer, we run commands directly like "composer install" or "composer update"
        result = await runPackageManagerCommand([command, ...args], projectRoot);
    } else {
        // For npm/yarn/bun, we use the package manager to run scripts
        result = await runPackageManagerCommand([command, ...args], projectRoot);
    }
    
    return {
        content: [{
            type: "text" as const,
            text: result
        }]
    };
};

export const installSchema = {
    projectRoot: z.string().describe('The root directory of the project where package.json or composer.json is located.'),
    packages: z.array(z.string()).describe('Array of package names to install.'),
    dev: z.boolean().optional().describe('Whether to install as development dependencies.')
};

export const installHandler = async (params: unknown) => {
    const { projectRoot, packages, dev } = z.object(installSchema).parse(params);
    const config = getConfig();
    
    if (!packages || packages.length === 0) {
        return {
            content: [{
                type: "text" as const,
                text: "No packages specified to install."
            }]
        };
    }

    let args: string[];

    // Handle composer differently
    if (config.packageManager === 'composer') {
        args = ['require'];
        
        if (dev) {
            args.push('--dev');
        }
        
        args.push(...packages);
    } else {
        // Handle npm/yarn/bun
        args = ['add'];
        
        // Add --dev flag if installing as devDependencies
        if (dev) {
            if (config.packageManager === 'npm') {
                args.push('--save-dev');
            } else {
                args.push('--dev');
            }
        }
        
        // Add all packages to the command
        args.push(...packages);
    }
    
    const result = await runPackageManagerCommand(args, projectRoot);
    
    return {
        content: [{
            type: "text" as const,
            text: result
        }]
    };
};
