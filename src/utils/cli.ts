import { $ } from "bun";
import { logger } from "./logger.js";

export const bufferToUtf8 = (buffer: Buffer): string => {
    return buffer.toString('utf8');
};

export const runCLI = async (baseCommand: string, args: string[]) => {
    try {
        logger.debug(`Running command: ${baseCommand} ${args.join(' ')}`);
        
        // Set environment to suppress Node.js warnings
        const env = {
            ...process.env,
            NODE_NO_WARNINGS: '1'
        };
        
        const result = await $`${baseCommand} ${args}`.env(env).quiet();
        return result.text();
    } catch (error: any) {
        logger.error("Error running command:", error);
        // If the error is a ShellError, it contains the command and exit code
        if ('stderr' in error || 'stdout' in error) {
            const stdoutText = bufferToUtf8(error.stdout as Buffer);
            const stderrText = bufferToUtf8(error.stderr as Buffer);

            logger.error("Command failed:", error.command);
            logger.error("Exit code:", error.exitCode);
            logger.debug("Stdout:", stdoutText);
            logger.debug("Stderr:", stderrText);

            // Combine them nicely
            const combinedOutput = `${stdoutText}\n${stderrText}`;

            // Optionally: throw error or just return
            return combinedOutput;
        }
        logger.error("Error running command:", typeof error);
        throw new Error(`Command failed: ${baseCommand}`);
    }
};
