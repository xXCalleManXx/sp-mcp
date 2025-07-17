import { z } from "zod";
import { runCLI } from "../utils/cli.js";
import { logger } from "../utils/logger.js";

export const nodeSchema = {
    projectRoot: z.string().describe('The root directory of the project where package.json is located.'),
    command: z.string().describe('The Node.js command to run. Could also be a file'),
    args: z.array(z.string()).optional().describe('Optional arguments to pass to the Node.js command. If not provided, no additional arguments will be passed.')
};

export const nodeHandler = async ({ projectRoot, command, args = [] }: { projectRoot: string, command: string, args?: string[] }) => {
    logger.debug(`Running Node.js command in project directory: ${projectRoot}`);

    // Construct the full command
    const fullCommand = `node ${command} ${args.join(' ')}`;
    logger.debug(`Running command: ${fullCommand}`);

    // Run the command using the runCLI function
    const result = await runCLI("node", [command, ...args], projectRoot);

    return {
        content: [{
            type: "text" as const,
            text: result
        }]
    };
};
