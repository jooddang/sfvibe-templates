/**
 * MCP Resources for template access
 * @module resources/template-resource
 */

import type { TemplateService } from '../services/template-service.js';
import { logger } from '../utils/logger.js';

/**
 * Template resource URI prefix
 */
export const TEMPLATE_URI_PREFIX = 'template://';

/**
 * Build a template URI from a template ID
 * @param templateId - Template ID
 * @returns Template URI
 */
export function buildTemplateUri(templateId: string): string {
  return `${TEMPLATE_URI_PREFIX}${templateId}`;
}

/**
 * Parse a template ID from a template URI
 * @param uri - Template URI
 * @returns Template ID
 */
export function parseTemplateUri(uri: string): string {
  if (!uri.startsWith(TEMPLATE_URI_PREFIX)) {
    throw new Error(`Invalid template URI: ${uri}`);
  }
  return uri.slice(TEMPLATE_URI_PREFIX.length);
}

/**
 * Resource content interface
 */
export interface ResourceContent {
  uri: string;
  mimeType: string;
  text: string;
}

/**
 * Resource list item interface
 */
export interface ResourceListItem {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}

/**
 * Get resource content for a template
 * @param uri - Template URI
 * @param templateService - Template service instance
 * @returns Resource content
 */
export async function getTemplateResource(
  uri: string,
  templateService: TemplateService
): Promise<ResourceContent[]> {
  const templateId = parseTemplateUri(uri);

  logger.debug('Fetching template resource', { uri, templateId });

  const template = await templateService.getTemplateWithCode(templateId);

  if (!template) {
    throw new Error(`Template not found: ${templateId}`);
  }

  const contents: ResourceContent[] = [];

  // Add each code file as a resource content
  for (const [filePath, code] of Object.entries(template.code)) {
    const extension = filePath.split('.').pop() || 'ts';
    const mimeType = getMimeType(extension);

    contents.push({
      uri: `${uri}/${filePath}`,
      mimeType,
      text: code,
    });
  }

  // If no separate files, return the combined code
  if (contents.length === 0) {
    contents.push({
      uri,
      mimeType: 'text/typescript',
      text: '// No code files found for this template',
    });
  }

  return contents;
}

/**
 * List all available template resources
 * @param templateService - Template service instance
 * @returns List of resource items
 */
export async function listTemplateResources(
  templateService: TemplateService
): Promise<ResourceListItem[]> {
  const templateIds = await templateService.getAllTemplateIds();
  const resources: ResourceListItem[] = [];

  for (const id of templateIds) {
    const metadata = await templateService.loadTemplate(id);
    if (!metadata) continue;

    resources.push({
      uri: buildTemplateUri(id),
      name: metadata.name,
      description: metadata.description,
      mimeType: 'text/typescript',
    });
  }

  return resources;
}

/**
 * Get MIME type for a file extension
 */
function getMimeType(extension: string): string {
  const mimeTypes: Record<string, string> = {
    ts: 'text/typescript',
    tsx: 'text/typescript',
    js: 'text/javascript',
    jsx: 'text/javascript',
    json: 'application/json',
    md: 'text/markdown',
    py: 'text/x-python',
    prisma: 'text/plain',
  };

  return mimeTypes[extension] || 'text/plain';
}
