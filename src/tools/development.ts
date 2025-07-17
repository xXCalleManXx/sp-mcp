import { z } from "zod";
import { runCLI } from "../utils/cli.js";
import { getProjectName } from "../utils/project.js";
import { getPM2Process } from "../utils/pm2.js";
import { getConfig } from "../config.js";
import { logger } from "../utils/logger.js";

export const devLogsSchema = {
    projectRoot: z.string().describe('The root directory of the project where package.json is located.'),
    lines: z.number().optional().describe('Optional number of lines to fetch from the logs. If not provided, it defaults to 30. Max 200 lines can be fetched.'),
};

export const devLogsHandler = async ({ projectRoot, lines }: { projectRoot: string, lines?: number }) => {
    const projectName = await getProjectName(projectRoot);

    const pm2Process = await getPM2Process(projectName);
    if (!pm2Process) {
        return {
            content: [{
                type: "text" as const,
                text: 'Development server is not running.'
            }]
        };
    }

    const logLines = Math.min(lines || 30, 200);
    const result = await runCLI("pm2", ['logs', pm2Process.pmID.toString(), '--lines', logLines.toString(), '--nostream']);

    logger.debug(`PM2 logs for ${pm2Process.name}:`);
    return {
        content: [{
            type: "text" as const,
            text: result
        }]
    };
};

export const devStartSchema = {
    projectRoot: z.string().describe('The root directory of the project where package.json is located.'),
};

export const devStartHandler = async ({ projectRoot }: { projectRoot: string }) => {
    const config = getConfig();
    const projectName = await getProjectName(projectRoot);

    const existingProcess = await getPM2Process(projectName);
    if (!existingProcess) {
        const result = await runCLI("pm2", ['start', config.packageManager, '--name', projectName, '--', config.devCommand], projectRoot);
        return {
            content: [{
                type: "text" as const,
                text: 'Server started successfully.'
            }]
        }
    }

    if (!existingProcess.isRunning) {
        const result = await runCLI("pm2", ['start', existingProcess.pmID.toString()], projectRoot);
        return {
            content: [{
                type: "text" as const,
                text: 'Server started successfully.'
            }]
        }
    }
    return {
        content: [{
            type: "text" as const,
            text: 'Server is already running.'
        }]
    };
};
