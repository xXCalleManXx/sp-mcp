#!/usr/bin/env node

// Test script for GraphQL tools
const { createServer } = require('./src/server.js');

async function testGraphQLTools() {
    try {
        console.log('Testing GraphQL tools registration...');
        
        // Set environment variable to enable GraphQL tools
        process.env.MCP_GRAPHQL_ENABLED = 'true';
        
        // Import the config loading function
        const { loadConfig } = require('./src/config.js');
        
        // Load config with GraphQL enabled
        const config = loadConfig(['--graphql-enabled', 'true']);
        console.log('Config loaded:', JSON.stringify(config, null, 2));
        
        // Create server instance
        const server = createServer();
        
        console.log('Server created successfully with GraphQL tools enabled!');
        console.log('Available tools should include: graphql-call, graphql-schema');
        
    } catch (error) {
        console.error('Error testing GraphQL tools:', error);
        process.exit(1);
    }
}

testGraphQLTools();