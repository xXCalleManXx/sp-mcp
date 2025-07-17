import { z } from "zod";
import { runCLI } from "../utils/cli.js";
import { getConfig } from "../config.js";

export const migrationsGenerateSchema = {
    projectRoot: z.string().describe('The root directory of the project where package.json is located.'),
    name: z.string().describe('Name of migration file.'),    
};

export const migrationsGenerateHandler = async ({ projectRoot, name }: { projectRoot: string, name: string }) => {
    const config = getConfig();
    
    if (!config.typeormEnabled) {
        return {
            content: [{
                type: "text" as const,
                text: 'TypeORM is disabled in configuration. Enable it to use migration features.'
            }]
        };
    }
    
    const path = './src/migrations/' + name;
    const result = await runCLI(config.packageManager, [config.migrationGenerateCommand, path], projectRoot)
    return {
        content: [{
            type: "text" as const,
            text: result
        }]
    };
};
