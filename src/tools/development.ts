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
    const validated = z.object(devLogsSchema).parse(params);
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
        // Special handling for bash -c commands
        if (logsCommand.startsWith('bash -c ')) {
            // Extract the script part after "bash -c "
            const scriptPart = logsCommand.substring(8); // Remove "bash -c" (note: 8 chars, not 9)
            
            // Remove outer quotes (single or double) if present
            let cleanScript = scriptPart.trim();
            if ((cleanScript.startsWith("'") && cleanScript.endsWith("'")) ||
                (cleanScript.startsWith('"') && cleanScript.endsWith('"'))) {
                cleanScript = cleanScript.slice(1, -1);
            }
            
            const result = await runCLI('bash', ['-c', cleanScript], projectRoot as string);
            return {
                content: [{
                    type: "text" as const,
                    text: result
                }]
            };
        }
        
        // Parse and execute regular commands
        const commandParts = logsCommand.split(' ');
        const baseCommand = commandParts[0];
        if (!baseCommand) {
            throw new Error("No command specified in devLogsCommand.");
        }
        
        // Extract arguments if any
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
    const validated = z.object(devStartSchema).parse(params);
    const projectRoot: string = validated.projectRoot;
    
    const config = getConfig();
    const projectName = await getProjectName(projectRoot);

    // Replace placeholders in the dev command
    // devCommand is guaranteed to be set by loadConfig
    const devCommand = config.devCommand!.replaceAll('{{project_name}}', projectName);

    logger.debug(`Executing dev command: ${devCommand}`);

    try {
        // Special handling for bash -c commands
        if (devCommand.startsWith('bash -c ')) {
            // Extract the script part after "bash -c "
            const scriptPart = devCommand.substring(8); // Remove "bash -c" (note: 8 chars, not 9)
            
            // Remove outer quotes (single or double) if present
            let cleanScript = scriptPart.trim();
            if ((cleanScript.startsWith("'") && cleanScript.endsWith("'")) ||
                (cleanScript.startsWith('"') && cleanScript.endsWith('"'))) {
                cleanScript = cleanScript.slice(1, -1);
            }
            
            const result = await runCLI('bash', ['-c', cleanScript], projectRoot as string);
            return {
                content: [{
                    type: "text" as const,
                    text: result
                }]
            };
        }
        
        // Parse and execute regular commands
        const commandParts = devCommand.split(' ');
        const baseCommand = commandParts[0];
        if (!baseCommand) {
            throw new Error("No command specified in devCommand.");
        }
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
