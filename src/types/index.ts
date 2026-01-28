/**
 * Core types for the sfvibe-templates-mcp server
 * @module types
 */

/**
 * Available template categories
 */
export type TemplateCategory =
  | 'auth'
  | 'payment'
  | 'email'
  | 'notification'
  | 'database'
  | 'storage'
  | 'api'
  | 'ui'
  | 'testing'
  | 'deployment';

/**
 * Supported programming languages
 */
export type TemplateLanguage = 'typescript' | 'python';

/**
 * Environment variable definition for a template
 */
export interface EnvVariable {
  /** Environment variable name */
  name: string;
  /** Description of what this variable is for */
  description: string;
  /** Whether this variable is required */
  required: boolean;
  /** Example value */
  example?: string;
}

/**
 * File included in a template
 */
export interface TemplateFile {
  /** Relative path where the file should be placed */
  path: string;
  /** Description of what this file does */
  description: string;
  /** Whether this file is required for the template to work */
  isRequired: boolean;
}

/**
 * Usage instructions for a template
 */
export interface TemplateUsage {
  /** Installation command(s) */
  installation: string;
  /** Configuration steps */
  configuration: string;
  /** Usage example */
  example: string;
}

/**
 * Complete template metadata
 */
export interface TemplateMetadata {
  /** Unique template ID (e.g., "typescript/nextjs/auth/nextauth-google") */
  id: string;
  /** Human-readable template name */
  name: string;
  /** Detailed description of the template */
  description: string;
  /** Semantic version */
  version: string;
  /** Template category */
  category: TemplateCategory;
  /** Programming language */
  language: TemplateLanguage;
  /** Framework (e.g., "nextjs", "fastapi") */
  framework: string;
  /** Production dependencies with versions */
  dependencies: Record<string, string>;
  /** Development dependencies with versions */
  devDependencies?: Record<string, string>;
  /** Peer dependencies with versions */
  peerDependencies?: Record<string, string>;
  /** Required and optional environment variables */
  envVariables: EnvVariable[];
  /** Files included in this template */
  files: TemplateFile[];
  /** Tags for search optimization */
  tags: string[];
  /** Usage instructions */
  usage: TemplateUsage;
  /** IDs of related templates */
  relatedTemplates?: string[];
  /** Template author */
  author: string;
  /** Creation date (ISO 8601) */
  createdAt: string;
  /** Last update date (ISO 8601) */
  updatedAt: string;
}

/**
 * Template with loaded code content
 */
export interface TemplateWithCode extends TemplateMetadata {
  /** Map of file paths to their content */
  code: Record<string, string>;
}

/**
 * Search result for a template
 */
export interface SearchResult {
  /** Template ID */
  templateId: string;
  /** Template name */
  name: string;
  /** Template description */
  description: string;
  /** Relevance score (0-1) */
  score: number;
  /** Template category */
  category: TemplateCategory;
  /** Programming language */
  language: TemplateLanguage;
  /** Framework */
  framework: string;
}

/**
 * Filters for listing templates
 */
export interface TemplateFilters {
  /** Filter by category */
  category?: TemplateCategory;
  /** Filter by language */
  language?: TemplateLanguage;
  /** Filter by framework */
  framework?: string;
}

/**
 * Filters for searching templates
 */
export interface SearchFilters extends TemplateFilters {
  /** Maximum number of results */
  limit?: number;
}

/**
 * Generic tool response wrapper
 */
export interface ToolResponse<T> {
  /** Whether the operation succeeded */
  success: boolean;
  /** Response data (if successful) */
  data?: T;
  /** Error message (if failed) */
  error?: string;
}

/**
 * Parsed template ID components
 */
export interface ParsedTemplateId {
  /** Programming language */
  language: string;
  /** Framework */
  framework: string;
  /** Category */
  category: string;
  /** Template name */
  name: string;
}

/**
 * Cached embedding data
 */
export interface EmbeddingCache {
  /** Template ID to embedding vector mapping */
  embeddings: Record<string, number[]>;
  /** When the cache was generated */
  generatedAt: string;
  /** Model used for embeddings */
  model: string;
}

/**
 * Template listing item (summary without full code)
 */
export interface TemplateListItem {
  /** Template ID */
  id: string;
  /** Template name */
  name: string;
  /** Template description */
  description: string;
  /** Template category */
  category: TemplateCategory;
  /** Programming language */
  language: TemplateLanguage;
  /** Framework */
  framework: string;
  /** Tags */
  tags: string[];
}
