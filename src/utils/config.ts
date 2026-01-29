/**
 * Configuration module for the sfvibe-templates-mcp server
 * @module utils/config
 */

import { config as dotenvConfig } from 'dotenv';
import { z } from 'zod';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Load .env file
dotenvConfig();

/**
 * Configuration schema with validation
 */
const configSchema = z.object({
  /** OpenAI API key for embeddings (optional) */
  OPENAI_API_KEY: z.string().optional(),
  /** Google Gemini API key for embeddings (optional) */
  GOOGLE_API_KEY: z.string().optional(),
  /** Anthropic Claude API key for embeddings (optional) */
  ANTHROPIC_API_KEY: z.string().optional(),
  /** Directory containing templates */
  TEMPLATES_DIR: z.string().default('./templates'),
  /** Logging level */
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  /** Cache TTL in seconds */
  CACHE_TTL: z.coerce.number().default(3600),
  /** Supabase URL (optional) */
  SUPABASE_URL: z.string().optional(),
  /** Supabase anonymous key (optional) */
  SUPABASE_ANON_KEY: z.string().optional(),
});

/**
 * Configuration type
 */
export type Config = z.infer<typeof configSchema>;

/**
 * Get the project root directory
 */
function getProjectRoot(): string {
  const currentFilePath = fileURLToPath(import.meta.url);
  // Go up from src/utils/config.ts to project root
  return path.resolve(path.dirname(currentFilePath), '..', '..');
}

/**
 * Parse and validate configuration from environment variables
 */
function loadConfig(): Config {
  const result = configSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.issues
      .map((e) => `  - ${String(e.path.join('.'))}: ${e.message}`)
      .join('\n');
    throw new Error(`Configuration validation failed:\n${errors}`);
  }

  // Resolve templates directory relative to project root
  const projectRoot = getProjectRoot();
  const templatesDir = path.isAbsolute(result.data.TEMPLATES_DIR)
    ? result.data.TEMPLATES_DIR
    : path.resolve(projectRoot, result.data.TEMPLATES_DIR);

  return {
    ...result.data,
    TEMPLATES_DIR: templatesDir,
  };
}

/**
 * Application configuration
 */
export const config = loadConfig();

/**
 * Embedding provider types
 */
export type EmbeddingProvider = 'openai' | 'gemini' | 'anthropic';

/**
 * Check if embeddings are available (any API key configured)
 */
export function hasEmbeddingsSupport(): boolean {
  return Boolean(config.OPENAI_API_KEY || config.GOOGLE_API_KEY || config.ANTHROPIC_API_KEY);
}

/**
 * Get the active embedding provider based on configured API keys
 * Priority: OpenAI → Gemini → Anthropic
 */
export function getEmbeddingProvider(): EmbeddingProvider | null {
  if (config.OPENAI_API_KEY) return 'openai';
  if (config.GOOGLE_API_KEY) return 'gemini';
  if (config.ANTHROPIC_API_KEY) return 'anthropic';
  return null;
}

/**
 * Get the project root directory path
 */
export function getProjectRootPath(): string {
  return getProjectRoot();
}
