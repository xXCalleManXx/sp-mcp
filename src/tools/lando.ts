import { z } from "zod";
import { runCLI } from "../utils/cli.js";
import { logger } from "../utils/logger.js";

export const landoSchema = {
    projectRoot: z.string().describe('The root directory of the project where package.json or composer.json is located.'),
    command: z.string().describe('The Lando command to run. Could also be a file'),
    args: z.array(z.string()).optional().describe('Optional arguments to pass to the Lando command. If not provided, no additional arguments will be passed.')
};

export const landoHandler = async (params: unknown) => {
    const { projectRoot, command, args = [] } = z.object(landoSchema).parse(params);

    logger.debug(`Running Lando command in project directory: ${projectRoot}`);

    // Construct the full command
    const fullCommand = `lando ${command} ${args.join(' ')}`;
    logger.debug(`Running command: ${fullCommand}`);

    // Run the command using the runCLI function
    const result = await runCLI("lando", [command, ...args], projectRoot);

    return {
        content: [{
            type: "text" as const,
            text: result
        }]
    };
};
