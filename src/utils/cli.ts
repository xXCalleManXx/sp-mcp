import { $ } from "bun";

export const bufferToUtf8 = (buffer: Buffer): string => {
    return buffer.toString('utf8');
};

export const runCLI = async (baseCommand: string, args: string[]) => {
    try {
        console.log(`Running command: ${baseCommand} ${args.join(' ')} 2>&1`);
        const result = await $`${baseCommand} ${args} 2>&1`;
        return result.text();
    } catch (error: any) {
        console.error("Error running command:", error);
        // If the error is a ShellError, it contains the command and exit code
        if ('stderr' in error || 'stdout' in error) {
            const stdoutText = bufferToUtf8(error.stdout as Buffer);
            const stderrText = bufferToUtf8(error.stderr as Buffer);

            console.error("Command failed:", error.command);
            console.error("Exit code:", error.exitCode);
            console.error("Stdout:", stdoutText);
            console.error("Stderr:", stderrText);

            // Combine them nicely
            const combinedOutput = `${stdoutText}\n${stderrText}`;

            // Optionally: throw error or just return
            return combinedOutput;
        }
        console.error("Error running command:", typeof error);
        throw new Error(`Command failed: ${baseCommand}`);
    }
};
