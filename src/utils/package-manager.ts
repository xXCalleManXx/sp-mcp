import { runCLI } from "./cli.js";
import { getConfig } from "../config.js";
import { logger } from "./logger.js";

/**
 * Run a package manager command using the configured package manager command
 * This handles cases where the package manager needs to be run through Docker, Lando, DDEV, etc.
 * 
 * @param args - Arguments to pass to the package manager
 * @param projectRoot - Optional project root directory
 * @returns Promise<string> - Command output
 */
export const runPackageManagerCommand = async (args: string[], projectRoot?: string): Promise<string> => {
    const config = getConfig();
    
    // Get the package manager command (e.g., "composer", "lando composer", "ddev composer")
    const packageManagerCommand = config.packageManagerCommand || config.packageManager;
    
    // Split the command to handle cases like "lando composer" or "ddev composer"
    const commandParts = packageManagerCommand.split(' ');
    logger.debug(`Running package manager command: ${packageManagerCommand} with args: ${args.join(' ')}`);
    const baseCommand = commandParts[0];
    if (!baseCommand) {
        throw new Error("Package manager command is not configured properly.");
    }
    const baseArgs = commandParts.slice(1);
    
    // Combine base args with provided args
    const allArgs = [...baseArgs, ...args];
    
    const fullCommand = `${baseCommand} ${allArgs.join(' ')}`;
    logger.debug(`Running package manager command: ${fullCommand}${projectRoot ? ` in ${projectRoot}` : ''}`);
    
    return await runCLI(baseCommand, allArgs, projectRoot || undefined);
};
