#!/usr/bin/env bun
import { start } from "./src/server.js";
import { printConfigHelp } from "./src/config.js";

// Check if help is requested
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
    printConfigHelp();
    process.exit(0);
}

start();
