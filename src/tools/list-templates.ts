/**
 * MCP Tool: list_templates
 * List available templates with optional filtering
 * @module tools/list-templates
 */

import { z } from 'zod';

import type { TemplateService } from '../services/template-service.js';
import type { TemplateListItem, TemplateCategory, TemplateLanguage } from '../types/index.js';

/**
 * Valid template categories
 */
const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  'auth',
  'payment',
  'email',
  'notification',
  'database',
  'storage',
  'api',
  'ui',
  'testing',
  'deployment',
];

/**
 * Input schema for the list_templates tool
 */
export const listTemplatesSchema = z.object({
  category: z.enum(TEMPLATE_CATEGORIES as [TemplateCategory, ...TemplateCategory[]]).optional().describe('Filter by category (auth, payment, email, etc.)'),
  language: z.enum(['typescript', 'python']).optional().describe('Filter by programming language'),
  framework: z.string().optional().describe('Filter by framework (e.g., "nextjs", "fastapi")'),
});

export type ListTemplatesInput = z.infer<typeof listTemplatesSchema>;

/**
 * Handle the list_templates tool call
 * @param input - Tool input
 * @param templateService - Template service instance
 * @returns List of templates
 */
export async function handleListTemplates(
  input: ListTemplatesInput,
  templateService: TemplateService
): Promise<TemplateListItem[]> {
  const templates = await templateService.listTemplateItems({
    category: input.category,
    language: input.language as TemplateLanguage | undefined,
    framework: input.framework,
  });

  return templates;
}

/**
 * Format the template list as a string for display
 */
export function formatTemplateList(templates: TemplateListItem[]): string {
  if (templates.length === 0) {
    return 'No templates found matching the specified filters.';
  }

  const sections: string[] = [];
  sections.push(`# Available Templates (${templates.length})\n`);

  // Group by category
  const byCategory = new Map<string, TemplateListItem[]>();
  for (const template of templates) {
    const existing = byCategory.get(template.category) || [];
    existing.push(template);
    byCategory.set(template.category, existing);
  }

  for (const [category, categoryTemplates] of byCategory) {
    sections.push(`## ${category.charAt(0).toUpperCase() + category.slice(1)}\n`);

    for (const template of categoryTemplates) {
      sections.push(`### ${template.name}`);
      sections.push(`- **ID**: \`${template.id}\``);
      sections.push(`- **Language**: ${template.language}`);
      sections.push(`- **Framework**: ${template.framework}`);
      sections.push(`- **Description**: ${template.description}`);
      sections.push(`- **Tags**: ${template.tags.join(', ')}`);
      sections.push('');
    }
  }

  return sections.join('\n');
}

/**
 * Tool description for AI agents
 */
export const LIST_TEMPLATES_DESCRIPTION = `List available code templates with optional filtering by category, language, or framework.

Use this tool to browse available templates when you're not sure what you're looking for.

Categories: auth, payment, email, notification, database, storage, api, ui, testing, deployment
Languages: typescript, python
Frameworks: nextjs, fastapi, etc.`;
