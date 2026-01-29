/**
 * Template service for loading and managing code templates
 * @module services/template-service
 */

import fs from 'node:fs/promises';
import path from 'node:path';

import { logger } from '../utils/logger.js';
import type {
  TemplateMetadata,
  TemplateWithCode,
  TemplateFilters,
  ParsedTemplateId,
  TemplateListItem,
} from '../types/index.js';

/**
 * Custom error for template not found
 */
export class TemplateNotFoundError extends Error {
  constructor(templateId: string) {
    super(`Template not found: ${templateId}`);
    this.name = 'TemplateNotFoundError';
  }
}

/**
 * Custom error for invalid template
 */
export class InvalidTemplateError extends Error {
  constructor(templateId: string, reason: string) {
    super(`Invalid template ${templateId}: ${reason}`);
    this.name = 'InvalidTemplateError';
  }
}

/**
 * Service for loading and managing code templates
 */
export class TemplateService {
  private templatesDir: string;
  private templateCache: Map<string, TemplateMetadata> = new Map();

  /**
   * Create a new TemplateService instance
   * @param templatesDir - Directory containing templates
   */
  constructor(templatesDir: string) {
    this.templatesDir = templatesDir;
  }

  /**
   * Validate a path component to prevent path traversal attacks
   * @param component - Path component to validate
   * @returns true if valid
   */
  private isValidPathComponent(component: string): boolean {
    // Reject empty, dots only, or path traversal attempts
    if (!component || component === '.' || component === '..') {
      return false;
    }
    // Only allow alphanumeric, hyphens, and underscores (safe characters)
    return /^[a-zA-Z0-9_-]+$/.test(component);
  }

  /**
   * Parse a template ID into its components
   * @param id - Template ID (e.g., "typescript/nextjs/auth/nextauth-google")
   * @returns Parsed components
   * @throws InvalidTemplateError if ID format is invalid or contains path traversal
   */
  public parseTemplateId(id: string): ParsedTemplateId {
    const parts = id.split('/');
    if (parts.length !== 4) {
      throw new InvalidTemplateError(id, 'Template ID must have format: language/framework/category/name');
    }

    const [language, framework, category, name] = parts;

    // Security: Validate each component to prevent path traversal
    if (!this.isValidPathComponent(language)) {
      throw new InvalidTemplateError(id, 'Invalid characters in language');
    }
    if (!this.isValidPathComponent(framework)) {
      throw new InvalidTemplateError(id, 'Invalid characters in framework');
    }
    if (!this.isValidPathComponent(category)) {
      throw new InvalidTemplateError(id, 'Invalid characters in category');
    }
    if (!this.isValidPathComponent(name)) {
      throw new InvalidTemplateError(id, 'Invalid characters in name');
    }

    return { language, framework, category, name };
  }

  /**
   * Build the file system path for a template
   * @param id - Template ID
   * @returns Absolute path to the template directory
   */
  public buildTemplatePath(id: string): string {
    const { language, framework, category, name } = this.parseTemplateId(id);
    return path.join(this.templatesDir, language, framework, category, name);
  }

  /**
   * Load a template's metadata by ID
   * @param templateId - Template ID
   * @returns Template metadata or null if not found
   */
  public async loadTemplate(templateId: string): Promise<TemplateMetadata | null> {
    // Check cache first
    if (this.templateCache.has(templateId)) {
      return this.templateCache.get(templateId)!;
    }

    try {
      const templatePath = this.buildTemplatePath(templateId);
      const metadataPath = path.join(templatePath, 'metadata.json');

      const metadataContent = await fs.readFile(metadataPath, 'utf-8');
      const metadata = JSON.parse(metadataContent) as TemplateMetadata;

      // Validate that the ID matches
      if (metadata.id !== templateId) {
        logger.warn('Template ID mismatch', { expected: templateId, actual: metadata.id });
        metadata.id = templateId;
      }

      // Cache the result
      this.templateCache.set(templateId, metadata);

      return metadata;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      logger.error('Error loading template', { templateId, error });
      throw error;
    }
  }

  /**
   * Get template code files
   * @param templateId - Template ID
   * @returns Map of file paths to their content
   */
  public async getTemplateCode(templateId: string): Promise<Record<string, string>> {
    const templatePath = this.buildTemplatePath(templateId);
    const filesDir = path.join(templatePath, 'files');
    const code: Record<string, string> = {};

    try {
      // Check if files directory exists
      const filesExist = await fs.stat(filesDir).catch(() => null);

      if (filesExist && filesExist.isDirectory()) {
        // Load all files from the files directory
        const files = await this.readDirRecursive(filesDir);
        for (const filePath of files) {
          const relativePath = path.relative(filesDir, filePath);
          const content = await fs.readFile(filePath, 'utf-8');
          code[relativePath] = content;
        }
      } else {
        // Check for a single template.ts file
        const singleTemplatePath = path.join(templatePath, 'template.ts');
        const singleTemplateExists = await fs.stat(singleTemplatePath).catch(() => null);

        if (singleTemplateExists) {
          const content = await fs.readFile(singleTemplatePath, 'utf-8');
          code['template.ts'] = content;
        }
      }

      return code;
    } catch (error) {
      logger.error('Error loading template code', { templateId, error });
      throw error;
    }
  }

  /**
   * Get a template with its code
   * @param templateId - Template ID
   * @returns Template with code or null if not found
   */
  public async getTemplateWithCode(templateId: string): Promise<TemplateWithCode | null> {
    const metadata = await this.loadTemplate(templateId);
    if (!metadata) {
      return null;
    }

    const code = await this.getTemplateCode(templateId);

    return {
      ...metadata,
      code,
    };
  }

  /**
   * List all templates with optional filtering
   * @param filters - Optional filters
   * @returns Array of template metadata
   */
  public async listTemplates(filters?: TemplateFilters): Promise<TemplateMetadata[]> {
    const allTemplateIds = await this.getAllTemplateIds();
    const templates: TemplateMetadata[] = [];

    for (const id of allTemplateIds) {
      const metadata = await this.loadTemplate(id);
      if (!metadata) continue;

      // Apply filters
      if (filters) {
        if (filters.category && metadata.category !== filters.category) continue;
        if (filters.language && metadata.language !== filters.language) continue;
        if (filters.framework && metadata.framework !== filters.framework) continue;
      }

      templates.push(metadata);
    }

    return templates;
  }

  /**
   * List all templates as summary items
   * @param filters - Optional filters
   * @returns Array of template list items
   */
  public async listTemplateItems(filters?: TemplateFilters): Promise<TemplateListItem[]> {
    const templates = await this.listTemplates(filters);

    return templates.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      category: t.category,
      language: t.language,
      framework: t.framework,
      tags: t.tags,
    }));
  }

  /**
   * Get all template IDs by scanning the templates directory
   * @returns Array of template IDs
   */
  public async getAllTemplateIds(): Promise<string[]> {
    const ids: string[] = [];

    try {
      // Scan for languages
      const languages = await this.readDirSafe(this.templatesDir);

      for (const language of languages) {
        const languagePath = path.join(this.templatesDir, language);
        const languageStat = await fs.stat(languagePath);
        if (!languageStat.isDirectory()) continue;

        // Scan for frameworks
        const frameworks = await this.readDirSafe(languagePath);

        for (const framework of frameworks) {
          const frameworkPath = path.join(languagePath, framework);
          const frameworkStat = await fs.stat(frameworkPath);
          if (!frameworkStat.isDirectory()) continue;

          // Scan for categories
          const categories = await this.readDirSafe(frameworkPath);

          for (const category of categories) {
            const categoryPath = path.join(frameworkPath, category);
            const categoryStat = await fs.stat(categoryPath);
            if (!categoryStat.isDirectory()) continue;

            // Scan for templates
            const templateNames = await this.readDirSafe(categoryPath);

            for (const templateName of templateNames) {
              const templatePath = path.join(categoryPath, templateName);
              const templateStat = await fs.stat(templatePath);
              if (!templateStat.isDirectory()) continue;

              // Check if metadata.json exists
              const metadataPath = path.join(templatePath, 'metadata.json');
              const metadataExists = await fs.stat(metadataPath).catch(() => null);

              if (metadataExists) {
                ids.push(`${language}/${framework}/${category}/${templateName}`);
              }
            }
          }
        }
      }
    } catch (error) {
      logger.error('Error scanning templates directory', { error });
    }

    return ids;
  }

  /**
   * Clear the template cache
   */
  public clearCache(): void {
    this.templateCache.clear();
  }

  /**
   * Read directory contents safely (returns empty array on error)
   */
  private async readDirSafe(dirPath: string): Promise<string[]> {
    try {
      return await fs.readdir(dirPath);
    } catch {
      return [];
    }
  }

  /**
   * Recursively read all files in a directory
   */
  private async readDirRecursive(dirPath: string): Promise<string[]> {
    const files: string[] = [];
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        const subFiles = await this.readDirRecursive(fullPath);
        files.push(...subFiles);
      } else {
        files.push(fullPath);
      }
    }

    return files;
  }
}
