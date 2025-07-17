import { z } from "zod";
import { join } from "path";
import { runCLI } from "../utils/cli.js";

export const deleteProjectFileSchema = {
    fileName: z.string().describe('The file that must be deleted.'),
};

export const deleteProjectFileHandler = async ({ fileName }: { fileName: string }) => {
    const pwd = process.cwd();
    console.log(`Current working directory: ${pwd}`);

    const fullPath = join(pwd, fileName);

    const result = await runCLI("rm", [fullPath]);

    return {
        content: [{
            type: "text" as const,
            text: result
        }]
    };
};
