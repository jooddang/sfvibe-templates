/**
 * MCP Tool: search_templates
 * Search for code templates using natural language
 * @module tools/search-templates
 */

import { z } from 'zod';

import type { SearchService } from '../services/search-service.js';
import type { SearchResult, TemplateCategory, TemplateLanguage } from '../types/index.js';

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
 * Input schema for the search_templates tool
 */
export const searchTemplatesSchema = z.object({
  query: z.string().describe('Natural language description of what you need. Example: "user authentication with Google OAuth"'),
  language: z.enum(['typescript', 'python']).optional().describe('Programming language filter'),
  framework: z.string().optional().describe('Framework filter (e.g., "nextjs", "fastapi")'),
  category: z.enum(TEMPLATE_CATEGORIES as [TemplateCategory, ...TemplateCategory[]]).optional().describe('Category filter'),
  limit: z.number().min(1).max(20).default(5).describe('Maximum number of results'),
});

export type SearchTemplatesInput = z.infer<typeof searchTemplatesSchema>;

/**
 * Handle the search_templates tool call
 * @param input - Tool input
 * @param searchService - Search service instance
 * @returns Search results
 */
export async function handleSearchTemplates(
  input: SearchTemplatesInput,
  searchService: SearchService
): Promise<SearchResult[]> {
  const results = await searchService.search(input.query, {
    language: input.language as TemplateLanguage | undefined,
    framework: input.framework,
    category: input.category,
    limit: input.limit,
  });

  return results;
}

/**
 * Tool description for AI agents
 */
export const SEARCH_TEMPLATES_DESCRIPTION = `Search for code templates using natural language. Returns relevant templates based on your requirements.

Examples:
- "I need Google OAuth authentication for Next.js"
- "Stripe payment integration with subscriptions"
- "Email sending with Resend"
- "Database setup with Prisma"

Results include template ID, name, description, and relevance score.`;
