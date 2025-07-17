/**
 * Simple logger that writes to stderr to avoid interfering with MCP JSON protocol on stdout/stdin
 */

const log = (prefix: string, message: string, ...args: any[]) => {
    const totalMessage = message + (args.length > 0 ? ' ' + args.join(' ') : '');
    console.error(`[${prefix}] ${totalMessage}`);
}

export const logger = {
    debug: (message: string, ...args: any[]) => {
        log('DEBUG', message, ...args);
    },

    info: (message: string, ...args: any[]) => {
        log('INFO', message, ...args);
    },

    warn: (message: string, ...args: any[]) => {
        log('WARN', message, ...args);
    },

    error: (message: string, ...args: any[]) => {
        log('ERROR', message, ...args);
    }
};
