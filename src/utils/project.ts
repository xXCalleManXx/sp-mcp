import { runCLI } from "./cli.js";

export const getProjectName = async () => {
    const packageJsonRaw = await runCLI("cat", ["package.json"]);
    const packageJson = JSON.parse(packageJsonRaw);
    const projectName = packageJson.name || "project";
    return projectName;
};
