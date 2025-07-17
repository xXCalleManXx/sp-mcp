import { runCLI } from "./cli.js";

export const getProjectName = async (projectRoot?: string) => {
    const packageJsonRaw = await runCLI("cat", ["package.json"], projectRoot);
    const packageJson = JSON.parse(packageJsonRaw);
    const projectName = packageJson.name || "project";
    return projectName;
};
