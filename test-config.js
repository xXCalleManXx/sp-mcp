#!/usr/bin/env node

import { loadConfig, printConfigHelp } from "./src/config.js";

// Check if help is requested
if (process.argv.includes('--help') || process.argv.includes('-h')) {
    printConfigHelp();
    process.exit(0);
}

// Load and print config for testing
console.log('Testing configuration system...\n');

try {
    const config = loadConfig();
    console.log('✅ Configuration loaded successfully!');
    console.log('Current configuration:');
    console.log(JSON.stringify(config, null, 2));
} catch (error) {
    console.error('❌ Failed to load configuration:', error);
    process.exit(1);
}
