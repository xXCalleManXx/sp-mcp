import { runCLI } from "./cli.js";

export interface PM2Process {
    name: string;
    isRunning: boolean;
    pmID: number;
}

export const getPM2List = async (): Promise<PM2Process[]> => {
    const result = await runCLI("pm2", ["jlist"]);

    const pm2List = JSON.parse(result);
    return pm2List.map((process: any) => ({
        name: process.name,
        isRunning: process.pm2_env.status === 'online',
        pmID: process.pm2_env.pm_id
    }));
};

export const getPM2Process = async (name: string): Promise<PM2Process | null> => {
    const pm2List = await getPM2List();
    const process = pm2List.find((p) => p.name === name);
    return process || null;
};
