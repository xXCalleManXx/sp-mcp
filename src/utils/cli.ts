import { spawn } from "child_process";
import { logger } from "./logger.js";

export const bufferToUtf8 = (buffer: Buffer): string => {
    return buffer.toString('utf8');
};

export const runCLI = async (baseCommand: string, args: string[], cwd?: string | undefined): Promise<string> => {
    return new Promise((resolve, reject) => {
        try {
            logger.debug(`Running command: ${baseCommand} ${args.join(' ')}${cwd ? ` in ${cwd}` : ''}`);
            
            // Set environment to suppress Node.js warnings
            const env = {
                ...process.env,
                NODE_NO_WARNINGS: '1'
            };
            
            const child = spawn(baseCommand, args, {
                cwd: cwd || process.cwd(),
                env,
                stdio: 'pipe'
            });

            let stdout = '';
            let stderr = '';

            child.stdout?.on('data', (data) => {
                stdout += data.toString();
            });

            child.stderr?.on('data', (data) => {
                stderr += data.toString();
            });

            child.on('close', (code) => {
                const combinedOutput = stdout + stderr;
                
                if (code !== 0) {
                    logger.error("Command failed:", `${baseCommand} ${args.join(' ')}`);
                    logger.error("Exit code:", code);
                    logger.debug("Stdout:", stdout);
                    logger.debug("Stderr:", stderr);
                    
                    resolve(combinedOutput);
                } else {
                    resolve(stdout);
                }
            });

            child.on('error', (error) => {
                logger.error("Error running command:", error);
                reject(new Error(`Command failed: ${baseCommand} - ${error.message}`));
            });

        } catch (error: any) {
            logger.error("Error running command:", error);
            reject(new Error(`Command failed: ${baseCommand}`));
        }
    });
};
