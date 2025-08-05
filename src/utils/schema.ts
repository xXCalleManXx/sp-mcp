// Utility types for MCP schemas
export interface MCPSchema {
    type: string;
    properties?: Record<string, any>;
    required?: readonly string[];
    additionalProperties?: boolean;
}

// Helper function to create properly typed MCP schemas
export function createMCPSchema<T extends MCPSchema>(schema: T): T {
    return schema;
}
