import { runCLI } from "./cli.js";

export const getProjectName = async (projectRoot?: string): Promise<string> => {
    try {
        // Try to read package.json first
        const packageJsonRaw = await runCLI("cat", ["package.json"], projectRoot);
        const packageJson = JSON.parse(packageJsonRaw);
        return packageJson.name || "project";
    } catch (error) {
        // If package.json doesn't exist, try composer.json
        try {
            const composerJsonRaw = await runCLI("cat", ["composer.json"], projectRoot);
            const composerJson = JSON.parse(composerJsonRaw);
            return composerJson.name || "project";
        } catch (composerError) {
            // If neither exists, return default
            return "project";
        }
    }
};

/**
 * Detect the package manager based on the project files
 */
export const detectPackageManager = async (projectRoot?: string): Promise<'yarn' | 'npm' | 'bun' | 'composer'> => {
    try {
        // Check for composer.json first
        await runCLI("cat", ["composer.json"], projectRoot);
        return 'composer';
    } catch (error) {
        // Check for package.json
        try {
            await runCLI("cat", ["package.json"], projectRoot);
            
            // Check for lock files to determine package manager
            try {
                await runCLI("ls", ["yarn.lock"], projectRoot);
                return 'yarn';
            } catch (error) {
                try {
                    await runCLI("ls", ["bun.lockb"], projectRoot);
                    return 'bun';
                } catch (error) {
                    return 'npm'; // Default to npm if package.json exists
                }
            }
        } catch (error) {
            return 'yarn'; // Default fallback
        }
    }
};
