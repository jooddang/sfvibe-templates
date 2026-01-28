/**
 * MCP Tool: get_template
 * Get complete template code, dependencies, and usage instructions
 * @module tools/get-template
 */

import { z } from 'zod';

import type { TemplateService } from '../services/template-service.js';
import type { TemplateMetadata } from '../types/index.js';
import { TemplateNotFoundError } from '../services/template-service.js';

/**
 * Response format options
 */
export type ResponseFormat = 'full' | 'code-only' | 'metadata-only';

/**
 * Input schema for the get_template tool
 */
export const getTemplateSchema = z.object({
  templateId: z.string().describe('Template ID (e.g., "typescript/nextjs/auth/nextauth-google")'),
  includeExample: z.boolean().default(true).describe('Include usage example code'),
  format: z.enum(['full', 'code-only', 'metadata-only']).default('full').describe('Response format'),
});

export type GetTemplateInput = z.infer<typeof getTemplateSchema>;

/**
 * Full template response
 */
export interface GetTemplateResponse {
  metadata: TemplateMetadata;
  code?: Record<string, string>;
  installation: string;
  envVariables: Array<{
    name: string;
    description: string;
    required: boolean;
    example?: string;
  }>;
  usage: {
    installation: string;
    configuration: string;
    example: string;
  };
  relatedTemplates?: string[];
}

/**
 * Handle the get_template tool call
 * @param input - Tool input
 * @param templateService - Template service instance
 * @returns Template with code and metadata
 */
export async function handleGetTemplate(
  input: GetTemplateInput,
  templateService: TemplateService
): Promise<GetTemplateResponse> {
  const template = await templateService.getTemplateWithCode(input.templateId);

  if (!template) {
    throw new TemplateNotFoundError(input.templateId);
  }

  // Build response based on format
  const response: GetTemplateResponse = {
    metadata: {
      id: template.id,
      name: template.name,
      description: template.description,
      version: template.version,
      category: template.category,
      language: template.language,
      framework: template.framework,
      dependencies: template.dependencies,
      devDependencies: template.devDependencies,
      peerDependencies: template.peerDependencies,
      envVariables: template.envVariables,
      files: template.files,
      tags: template.tags,
      usage: template.usage,
      relatedTemplates: template.relatedTemplates,
      author: template.author,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    },
    installation: template.usage.installation,
    envVariables: template.envVariables,
    usage: template.usage,
    relatedTemplates: template.relatedTemplates,
  };

  // Include code unless metadata-only is requested
  if (input.format !== 'metadata-only') {
    response.code = template.code;
  }

  return response;
}

/**
 * Format the response as a string for the MCP tool response
 */
export function formatGetTemplateResponse(
  response: GetTemplateResponse,
  format: ResponseFormat
): string {
  const sections: string[] = [];

  // Header
  sections.push(`# ${response.metadata.name}`);
  sections.push(`\n${response.metadata.description}\n`);

  // Metadata section
  if (format !== 'code-only') {
    sections.push('## Installation\n');
    sections.push('```bash');
    sections.push(response.installation);
    sections.push('```\n');

    // Dependencies
    if (Object.keys(response.metadata.dependencies).length > 0) {
      sections.push('## Dependencies\n');
      sections.push('```json');
      sections.push(JSON.stringify(response.metadata.dependencies, null, 2));
      sections.push('```\n');
    }

    // Environment Variables
    if (response.envVariables.length > 0) {
      sections.push('## Environment Variables\n');
      for (const env of response.envVariables) {
        const required = env.required ? '(required)' : '(optional)';
        sections.push(`- \`${env.name}\` ${required}: ${env.description}`);
        if (env.example) {
          sections.push(`  - Example: \`${env.example}\``);
        }
      }
      sections.push('');
    }
  }

  // Code section
  if (format !== 'metadata-only' && response.code) {
    sections.push('## Code Files\n');
    for (const [filePath, content] of Object.entries(response.code)) {
      const extension = filePath.split('.').pop() || 'ts';
      sections.push(`### ${filePath}\n`);
      sections.push('```' + extension);
      sections.push(content);
      sections.push('```\n');
    }
  }

  // Usage section
  if (format !== 'code-only') {
    sections.push('## Configuration\n');
    sections.push(response.usage.configuration);
    sections.push('');

    sections.push('## Usage Example\n');
    sections.push('```typescript');
    sections.push(response.usage.example);
    sections.push('```\n');

    // Related templates
    if (response.relatedTemplates && response.relatedTemplates.length > 0) {
      sections.push('## Related Templates\n');
      for (const related of response.relatedTemplates) {
        sections.push(`- ${related}`);
      }
    }
  }

  return sections.join('\n');
}

/**
 * Tool description for AI agents
 */
export const GET_TEMPLATE_DESCRIPTION = `Get complete template code, dependencies, and usage instructions for a specific template.

Use this tool after searching for templates to get the full implementation details.

The response includes:
- Template code files
- Dependencies to install
- Environment variables to configure
- Step-by-step setup instructions
- Usage examples`;
