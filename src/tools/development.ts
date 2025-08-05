import { z } from "zod";
import { runCLI } from "../utils/cli.js";
import { getProjectName } from "../utils/project.js";
import { getConfig } from "../config.js";
import { logger } from "../utils/logger.js";

export const devLogsSchema = {
    projectRoot: z.string().describe('The root directory of the project where package.json or composer.json is located.'),
    lines: z.number().optional().describe('Optional number of lines to fetch from the logs. If not provided, it defaults to 30. Max 200 lines can be fetched.'),
};

export const devLogsHandler = async ({ projectRoot, lines }: { projectRoot: string, lines?: number }) => {
    const config = getConfig();
    const projectName = await getProjectName(projectRoot);
    const logLines = Math.min(lines || 30, 200);

    // Replace placeholders in the dev logs command
    let logsCommand = config.devLogsCommand || 'pm2 logs <projectName> --lines <lines> --nostream';
    logsCommand = logsCommand
        .replace('<projectName>', projectName)
        .replace('<lines>', logLines.toString());

    logger.debug(`Running logs command: ${logsCommand} in ${projectRoot}`);

    try {
        // Parse and execute the command
        const commandParts = logsCommand.split(' ');
        const baseCommand = commandParts[0];
        const args = commandParts.slice(1);
        
        const result = await runCLI(baseCommand, args, projectRoot);
        
        return {
            content: [{
                type: "text" as const,
                text: result
            }]
        };
    } catch (error) {
        logger.error(`Failed to get development logs: ${error}`);
        return {
            content: [{
                type: "text" as const,
                text: `Failed to get development server logs. Command: ${logsCommand}\nError: ${error}`
            }]
        };
    }
};

export const devStartSchema = {
    projectRoot: z.string().describe('The root directory of the project where package.json or composer.json is located.'),
};

export const devStartHandler = async ({ projectRoot }: { projectRoot: string }) => {
    const config = getConfig();
    const projectName = await getProjectName(projectRoot);

    // Replace placeholders in the dev command
    let devCommand = config.devCommand || `pm2 start ${config.packageManager} --name <projectName> -- dev`;
    devCommand = devCommand
        .replace('<projectName>', projectName)
        .replace('<packageManager>', config.packageManager);

    logger.debug(`Running dev start command: ${devCommand} in ${projectRoot}`);

    try {
        // Parse and execute the command
        const commandParts = devCommand.split(' ');
        const baseCommand = commandParts[0];
        const args = commandParts.slice(1);
        
        const result = await runCLI(baseCommand, args, projectRoot);
        
        return {
            content: [{
                type: "text" as const,
                text: 'Development server started successfully.'
            }]
        };
    } catch (error) {
        logger.error(`Failed to start development server: ${error}`);
        return {
            content: [{
                type: "text" as const,
                text: `Failed to start development server. Command: ${devCommand}\nError: ${error}`
            }]
        };
    }
};
