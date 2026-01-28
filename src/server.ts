/**
 * MCP Server configuration and setup
 * @module server
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { logger } from './utils/logger.js';
import { config } from './utils/config.js';
import { TemplateService } from './services/template-service.js';
import { EmbeddingService } from './services/embedding-service.js';
import { SearchService } from './services/search-service.js';

// Tools
import {
  searchTemplatesSchema,
  handleSearchTemplates,
  SEARCH_TEMPLATES_DESCRIPTION,
} from './tools/search-templates.js';
import {
  getTemplateSchema,
  handleGetTemplate,
  formatGetTemplateResponse,
  GET_TEMPLATE_DESCRIPTION,
} from './tools/get-template.js';
import {
  listTemplatesSchema,
  handleListTemplates,
  formatTemplateList,
  LIST_TEMPLATES_DESCRIPTION,
} from './tools/list-templates.js';

// Resources
import {
  getTemplateResource,
  TEMPLATE_URI_PREFIX,
} from './resources/template-resource.js';

// Prompts
import {
  IMPLEMENT_AUTH_PROMPT,
  generateAuthGuide,
} from './prompts/implement-auth.js';

/**
 * Server dependencies
 */
interface ServerDependencies {
  templateService: TemplateService;
  embeddingService: EmbeddingService;
  searchService: SearchService;
}

/**
 * Create and configure the MCP server
 */
export function createServer(deps: ServerDependencies): McpServer {
  const server = new McpServer({
    name: 'vibe-templates',
    version: '1.0.0',
  });

  // Register tools
  registerTools(server, deps);

  // Register resources
  registerResources(server, deps);

  // Register prompts
  registerPrompts(server, deps);

  return server;
}

/**
 * Register MCP tools
 */
function registerTools(server: McpServer, deps: ServerDependencies): void {
  // search_templates tool
  server.tool(
    'search_templates',
    SEARCH_TEMPLATES_DESCRIPTION,
    searchTemplatesSchema.shape,
    async (args) => {
      try {
        const input = searchTemplatesSchema.parse(args);
        const results = await handleSearchTemplates(input, deps.searchService);

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(results, null, 2),
            },
          ],
        };
      } catch (error) {
        logger.error('search_templates error', { error });
        return {
          content: [
            {
              type: 'text' as const,
              text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // get_template tool
  server.tool(
    'get_template',
    GET_TEMPLATE_DESCRIPTION,
    getTemplateSchema.shape,
    async (args) => {
      try {
        const input = getTemplateSchema.parse(args);
        const result = await handleGetTemplate(input, deps.templateService);
        const formatted = formatGetTemplateResponse(result, input.format);

        return {
          content: [
            {
              type: 'text' as const,
              text: formatted,
            },
          ],
        };
      } catch (error) {
        logger.error('get_template error', { error });
        return {
          content: [
            {
              type: 'text' as const,
              text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // list_templates tool
  server.tool(
    'list_templates',
    LIST_TEMPLATES_DESCRIPTION,
    listTemplatesSchema.shape,
    async (args) => {
      try {
        const input = listTemplatesSchema.parse(args);
        const results = await handleListTemplates(input, deps.templateService);
        const formatted = formatTemplateList(results);

        return {
          content: [
            {
              type: 'text' as const,
              text: formatted,
            },
          ],
        };
      } catch (error) {
        logger.error('list_templates error', { error });
        return {
          content: [
            {
              type: 'text' as const,
              text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  logger.info('Registered MCP tools', {
    tools: ['search_templates', 'get_template', 'list_templates'],
  });
}

/**
 * Register MCP resources
 */
function registerResources(server: McpServer, deps: ServerDependencies): void {
  // List all template resources
  server.resource(
    `${TEMPLATE_URI_PREFIX}*`,
    'Code template resources',
    async (uri) => {
      try {
        const contents = await getTemplateResource(uri.href, deps.templateService);

        return {
          contents: contents.map((c) => ({
            uri: c.uri,
            mimeType: c.mimeType,
            text: c.text,
          })),
        };
      } catch (error) {
        logger.error('Resource fetch error', { uri: uri.href, error });
        throw error;
      }
    }
  );

  logger.info('Registered MCP resources');
}

/**
 * Register MCP prompts
 */
function registerPrompts(server: McpServer, deps: ServerDependencies): void {
  // implement_auth prompt
  server.prompt(
    IMPLEMENT_AUTH_PROMPT.name,
    IMPLEMENT_AUTH_PROMPT.description,
    IMPLEMENT_AUTH_PROMPT.argsSchema.shape,
    async (args) => {
      try {
        const parsedArgs = IMPLEMENT_AUTH_PROMPT.argsSchema.parse(args);
        const guide = await generateAuthGuide(
          {
            provider: parsedArgs.provider,
            framework: parsedArgs.framework,
            features: parsedArgs.features,
          },
          deps.templateService
        );

        return {
          messages: [
            {
              role: 'user' as const,
              content: {
                type: 'text' as const,
                text: guide,
              },
            },
          ],
        };
      } catch (error) {
        logger.error('implement_auth prompt error', { error });
        throw error;
      }
    }
  );

  logger.info('Registered MCP prompts', {
    prompts: ['implement_auth'],
  });
}

/**
 * Initialize services
 */
async function initializeServices(): Promise<ServerDependencies> {
  logger.info('Initializing services...');

  const templateService = new TemplateService(config.TEMPLATES_DIR);
  const embeddingService = new EmbeddingService();
  const searchService = new SearchService(templateService, embeddingService);

  // Initialize search service (loads embeddings)
  await searchService.initialize();

  logger.info('Services initialized');

  return {
    templateService,
    embeddingService,
    searchService,
  };
}

/**
 * Start the MCP server
 */
export async function startServer(): Promise<void> {
  logger.info('Starting vibe-templates MCP server...');

  try {
    // Initialize services
    const deps = await initializeServices();

    // Create server
    const server = createServer(deps);

    // Connect to stdio transport
    const transport = new StdioServerTransport();
    await server.connect(transport);

    logger.info('MCP server started successfully');
  } catch (error) {
    logger.error('Failed to start MCP server', { error });
    throw error;
  }
}
