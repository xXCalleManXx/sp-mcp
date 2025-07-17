import { z } from "zod";
import { join } from "path";
import { runCLI } from "../utils/cli.js";
import { logger } from "../utils/logger.js";

export const deleteProjectFileSchema = {
    projectRoot: z.string().describe('The root directory of the project where package.json is located.'),
    fileName: z.string().describe('The file that must be deleted.'),
};

export const deleteProjectFileHandler = async ({ projectRoot, fileName }: { projectRoot: string, fileName: string }) => {
    logger.debug(`Deleting file in project directory: ${projectRoot}`);

    const fullPath = join(projectRoot, fileName);

    const result = await runCLI("rm", [fullPath]);

    return {
        content: [{
            type: "text" as const,
            text: result
        }]
    };
};
