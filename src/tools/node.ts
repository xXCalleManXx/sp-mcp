import { z } from "zod";
import { runCLI } from "../utils/cli.js";

export const nodeSchema = {
    command: z.string().describe('The Node.js command to run. Could also be a file'),
    args: z.array(z.string()).optional().describe('Optional arguments to pass to the Node.js command. If not provided, no additional arguments will be passed.')
};

export const nodeHandler = async ({ command, args = [] }: { command: string, args?: string[] }) => {
    const pwd = process.cwd();
    console.log(`Current working directory: ${pwd}`);

    // Construct the full command
    const fullCommand = `node ${command} ${args.join(' ')}`;
    console.log(`Running command: ${fullCommand}`);

    // Run the command using the runCLI function
    const result = await runCLI("node", [command, ...args]);

    return {
        content: [{
            type: "text" as const,
            text: result
        }]
    };
};
