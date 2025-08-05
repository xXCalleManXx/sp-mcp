import { z } from "zod";
import { runCLI } from "../utils/cli.js";
import { getProjectName } from "../utils/project.js";
import { getConfig } from "../config.js";
import { logger } from "../utils/logger.js";

// Zod schemas for validation and MCP
export const devLogsSchema = {
    projectRoot: z.string().describe('The root directory of the project where package.json or composer.json is located.'),
    lines: z.number().optional().describe('Optional number of lines to fetch from the logs. If not provided, it defaults to 30. Max 200 lines can be fetched.')
};

export const devStartSchema = {
    projectRoot: z.string().describe('The root directory of the project where package.json or composer.json is located.')
};


// Handlers with Zod validation
export const devLogsHandler = async (params: unknown) => {
    // Validate input with Zod and explicitly type the result
    const validated = devLogsSchema.parse(params);
    const projectRoot: string = validated.projectRoot;
    const lines = validated.lines;
    
    const config = getConfig();
    const projectName = await getProjectName(projectRoot);
    const logLines = Math.min(lines || 30, 200);

    // Replace placeholders in the dev logs command
    // devLogsCommand is guaranteed to be set by loadConfig
    const logsCommand = config.devLogsCommand!
        .replaceAll('{{project_name}}', projectName)
        .replaceAll('{{lines}}', logLines.toString());

    logger.debug(`Executing logs command: ${logsCommand}`);

    try {
        // Parse and execute the command
        const commandParts = logsCommand.split(' ');
        const baseCommand = commandParts[0];
        const args = commandParts.slice(1);
        
        const result = await runCLI(baseCommand, args, projectRoot as string);
        
        return {
            content: [{
                type: "text" as const,
                text: result
            }]
        };
    } catch (error: any) {
        return {
            content: [{
                type: "text" as const,
                text: `Error getting logs: ${error.message}`
            }],
            isError: true
        };
    }
};

export const devStartHandler = async (params: unknown) => {
    // Validate input with Zod and explicitly type the result
    const validated = devStartSchema.parse(params);
    const projectRoot: string = validated.projectRoot;
    
    const config = getConfig();
    const projectName = await getProjectName(projectRoot);

    // Replace placeholders in the dev command
    // devCommand is guaranteed to be set by loadConfig
    const devCommand = config.devCommand!.replaceAll('{{project_name}}', projectName);

    logger.debug(`Executing dev command: ${devCommand}`);

    try {
        // Parse and execute the command
        const commandParts = devCommand.split(' ');
        const baseCommand = commandParts[0];
        const args = commandParts.slice(1);
        
        const result = await runCLI(baseCommand, args, projectRoot as string);
        
        return {
            content: [{
                type: "text" as const,
                text: result
            }]
        };
    } catch (error: any) {
        return {
            content: [{
                type: "text" as const,
                text: `Error starting development server: ${error.message}`
            }],
            isError: true
        };
    }
};
