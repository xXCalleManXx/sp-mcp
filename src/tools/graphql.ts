import { z } from "zod";
import { logger } from "../utils/logger.js";
import * as fs from "fs";
import * as path from "path";

// Schema for GraphQL call tool
export const graphqlCallSchema = {
    endpoint: z.string().describe('Full GraphQL endpoint URL'),
    query: z.string().describe('GraphQL query or mutation'),
    variables: z.string().optional().describe('JSON string of variables for the GraphQL query'),
    headers: z.string().optional().describe('JSON string of headers to include in the request'),
    username: z.string().optional().describe('Username for Basic authentication'),
    password: z.string().optional().describe('Password for Basic authentication')
};

// Schema for GraphQL schema fetch tool
export const graphqlSchemaSchema = {
    endpoint: z.string().describe('Full GraphQL endpoint URL'),
    saveToLocation: z.string().describe('File path where the GraphQL schema should be saved'),
    username: z.string().optional().describe('Username for Basic authentication'),
    password: z.string().optional().describe('Password for Basic authentication')
};

// Helper function to create Basic Auth header
function createBasicAuthHeader(username: string, password: string): string {
    const credentials = Buffer.from(`${username}:${password}`).toString('base64');
    return `Basic ${credentials}`;
}

// Helper function to parse JSON safely
function parseJSON(jsonString: string, fieldName: string): any {
    try {
        return JSON.parse(jsonString);
    } catch (error) {
        throw new Error(`Invalid JSON in ${fieldName}: ${error}`);
    }
}

// GraphQL call handler
export const graphqlCallHandler = async (params: unknown) => {
    const { endpoint, query, variables, headers, username, password } = z.object(graphqlCallSchema).parse(params);

    logger.debug(`Making GraphQL request to: ${endpoint}`);

    // Parse variables if provided
    let parsedVariables: any = undefined;
    if (variables) {
        parsedVariables = parseJSON(variables, 'variables');
    }

    // Parse headers if provided
    let parsedHeaders: Record<string, string> = {
        'Content-Type': 'application/json'
    };
    if (headers) {
        const customHeaders = parseJSON(headers, 'headers');
        parsedHeaders = { ...parsedHeaders, ...customHeaders };
    }

    // Add Basic Auth if username and password are provided
    if (username && password) {
        parsedHeaders['Authorization'] = createBasicAuthHeader(username, password);
    }

    // Prepare GraphQL request body
    const requestBody = {
        query,
        variables: parsedVariables
    };

    try {
        // Make the GraphQL request
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: parsedHeaders,
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        
        logger.debug(`GraphQL request completed successfully`);

        return {
            content: [{
                type: "text" as const,
                text: JSON.stringify(result, null, 2)
            }]
        };
    } catch (error: any) {
        logger.error("Error making GraphQL request:", error);
        throw new Error(`GraphQL request failed: ${error.message}`);
    }
};

// GraphQL schema handler
export const graphqlSchemaHandler = async (params: unknown) => {
    const { endpoint, saveToLocation, username, password } = z.object(graphqlSchemaSchema).parse(params);

    logger.debug(`Fetching GraphQL schema from: ${endpoint}`);

    // Prepare headers
    let headers: Record<string, string> = {
        'Content-Type': 'application/json'
    };

    // Add Basic Auth if username and password are provided
    if (username && password) {
        headers['Authorization'] = createBasicAuthHeader(username, password);
    }

    // GraphQL introspection query
    const introspectionQuery = `
        query IntrospectionQuery {
            __schema {
                types {
                    ...FullType
                }
                queryType { name }
                mutationType { name }
                subscriptionType { name }
                directives {
                    name
                    description
                    locations
                    args {
                        ...InputValue
                    }
                }
            }
        }

        fragment FullType on __Type {
            kind
            name
            description
            fields(includeDeprecated: true) {
                name
                description
                args {
                    ...InputValue
                }
                type {
                    ...TypeRef
                }
                isDeprecated
                deprecationReason
            }
            inputFields {
                ...InputValue
            }
            interfaces {
                ...TypeRef
            }
            enumValues(includeDeprecated: true) {
                name
                description
                isDeprecated
                deprecationReason
            }
            possibleTypes {
                ...TypeRef
            }
        }

        fragment InputValue on __InputValue {
            name
            description
            type { ...TypeRef }
            defaultValue
        }

        fragment TypeRef on __Type {
            kind
            name
            ofType {
                kind
                name
                ofType {
                    kind
                    name
                    ofType {
                        kind
                        name
                        ofType {
                            kind
                            name
                            ofType {
                                kind
                                name
                                ofType {
                                    kind
                                    name
                                    ofType {
                                        kind
                                        name
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    `;

    // Prepare request body
    const requestBody = {
        query: introspectionQuery
    };

    try {
        // Make the GraphQL introspection request
        const response = await fetch(endpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json() as { data?: any; errors?: any[] };
        
        if (result.errors) {
            throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
        }

        // Ensure the directory exists
        const dir = path.dirname(saveToLocation);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        // Save the schema to the specified location
        fs.writeFileSync(saveToLocation, JSON.stringify(result.data, null, 2));
        
        logger.debug(`GraphQL schema saved to: ${saveToLocation}`);

        return {
            content: [{
                type: "text" as const,
                text: `GraphQL schema successfully fetched and saved to: ${saveToLocation}`
            }]
        };
    } catch (error: any) {
        logger.error("Error fetching GraphQL schema:", error);
        throw new Error(`GraphQL schema fetch failed: ${error.message}`);
    }
};