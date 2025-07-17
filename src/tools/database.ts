import { z } from "zod";
import { runCLI } from "../utils/cli.js";
import { getConfig } from "../config.js";

export const migrationsGenerateSchema = {
    name: z.string().describe('Name of migration file.'),    
};

export const migrationsGenerateHandler = async ({ name }: { name: string }) => {
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
    const result = await runCLI(config.packageManager, [config.migrationGenerateCommand, path])
    return {
        content: [{
            type: "text" as const,
            text: result
        }]
    };
};
