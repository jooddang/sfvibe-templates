/**
 * sfvibe-templates-mcp entry point
 * MCP server for reusable code templates
 * @module index
 */

import 'dotenv/config';

import { startServer } from './server.js';

// Start the server
startServer().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
