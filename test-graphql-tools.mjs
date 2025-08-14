import { graphqlCallHandler, graphqlSchemaHandler } from './src/tools/graphql.js';

async function testGraphQLCall() {
    console.log('Testing GraphQL call...');
    
    // Test with a simple GitHub GraphQL API query
    const params = {
        endpoint: 'https://api.github.com/graphql',
        query: `
            query {
                viewer {
                    login
                    name
                }
            }
        `,
        headers: JSON.stringify({
            'User-Agent': 'test-client',
            'Authorization': 'bearer YOUR_TOKEN_HERE'
        })
    };

    try {
        const result = await graphqlCallHandler(params);
        console.log('GraphQL call result:', result);
    } catch (error) {
        console.log('GraphQL call test completed (expected to fail without token):', error.message);
    }
}

async function testGraphQLSchema() {
    console.log('Testing GraphQL schema fetch...');
    
    // Test with a public GraphQL endpoint (SpaceX API)
    const params = {
        endpoint: 'https://api.spacex.land/graphql/',
        saveToLocation: '/tmp/spacex-schema.json'
    };

    try {
        const result = await graphqlSchemaHandler(params);
        console.log('GraphQL schema fetch result:', result);
    } catch (error) {
        console.log('GraphQL schema test error:', error.message);
    }
}

async function runTests() {
    console.log('Running GraphQL tools tests...\n');
    
    await testGraphQLCall();
    console.log('\n---\n');
    await testGraphQLSchema();
    
    console.log('\nTests completed!');
}

runTests().catch(console.error);