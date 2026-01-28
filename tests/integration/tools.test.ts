/**
 * Integration tests for MCP tools
 */

import { describe, it, expect, beforeAll, vi } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { TemplateService } from '../../src/services/template-service.js';
import { EmbeddingService } from '../../src/services/embedding-service.js';
import { SearchService } from '../../src/services/search-service.js';

import { handleSearchTemplates, searchTemplatesSchema } from '../../src/tools/search-templates.js';
import { handleGetTemplate, getTemplateSchema, formatGetTemplateResponse } from '../../src/tools/get-template.js';
import { handleListTemplates, listTemplatesSchema, formatTemplateList } from '../../src/tools/list-templates.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.resolve(__dirname, '../../templates');

describe('MCP Tools Integration', () => {
  let templateService: TemplateService;
  let embeddingService: EmbeddingService;
  let searchService: SearchService;

  beforeAll(async () => {
    templateService = new TemplateService(TEMPLATES_DIR);
    embeddingService = new EmbeddingService();
    searchService = new SearchService(templateService, embeddingService);

    // Mock embedding service to use keyword search
    vi.spyOn(embeddingService, 'isAvailable').mockReturnValue(false);
    await searchService.initialize();
  });

  describe('search_templates', () => {
    it('should validate input schema', () => {
      const validInput = { query: 'google auth' };
      expect(() => searchTemplatesSchema.parse(validInput)).not.toThrow();

      const invalidInput = { query: '' };
      expect(() => searchTemplatesSchema.parse(invalidInput)).not.toThrow(); // Empty string is valid

      const missingQuery = {};
      expect(() => searchTemplatesSchema.parse(missingQuery)).toThrow();
    });

    it('should search templates', async () => {
      const input = searchTemplatesSchema.parse({ query: 'authentication google' });
      const results = await handleSearchTemplates(input, searchService);

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]).toHaveProperty('templateId');
      expect(results[0]).toHaveProperty('name');
      expect(results[0]).toHaveProperty('score');
    });

    it('should filter by category', async () => {
      const input = searchTemplatesSchema.parse({ query: 'setup', category: 'payment' });
      const results = await handleSearchTemplates(input, searchService);

      expect(results.every((r) => r.category === 'payment')).toBe(true);
    });

    it('should respect limit parameter', async () => {
      const input = searchTemplatesSchema.parse({ query: 'auth', limit: 2 });
      const results = await handleSearchTemplates(input, searchService);

      expect(results.length).toBeLessThanOrEqual(2);
    });
  });

  describe('get_template', () => {
    it('should validate input schema', () => {
      const validInput = { templateId: 'typescript/nextjs/auth/nextauth-google' };
      expect(() => getTemplateSchema.parse(validInput)).not.toThrow();

      const withOptions = {
        templateId: 'typescript/nextjs/auth/nextauth-google',
        format: 'full',
        includeExample: true,
      };
      expect(() => getTemplateSchema.parse(withOptions)).not.toThrow();
    });

    it('should get a template', async () => {
      const input = getTemplateSchema.parse({ templateId: 'typescript/nextjs/auth/nextauth-google' });
      const result = await handleGetTemplate(input, templateService);

      expect(result).toHaveProperty('metadata');
      expect(result).toHaveProperty('code');
      expect(result).toHaveProperty('installation');
      expect(result).toHaveProperty('envVariables');
      expect(result.metadata.id).toBe('typescript/nextjs/auth/nextauth-google');
    });

    it('should throw for non-existent template', async () => {
      const input = getTemplateSchema.parse({ templateId: 'typescript/nextjs/auth/non-existent' });

      await expect(handleGetTemplate(input, templateService)).rejects.toThrow();
    });

    it('should format response correctly', async () => {
      const input = getTemplateSchema.parse({ templateId: 'typescript/nextjs/auth/nextauth-google' });
      const result = await handleGetTemplate(input, templateService);
      const formatted = formatGetTemplateResponse(result, 'full');

      expect(typeof formatted).toBe('string');
      expect(formatted).toContain(result.metadata.name);
      expect(formatted).toContain('Installation');
      expect(formatted).toContain('Code Files');
    });

    it('should exclude code for metadata-only format', async () => {
      const input = getTemplateSchema.parse({
        templateId: 'typescript/nextjs/auth/nextauth-google',
        format: 'metadata-only',
      });
      const result = await handleGetTemplate(input, templateService);

      expect(result.code).toBeUndefined();
    });
  });

  describe('list_templates', () => {
    it('should validate input schema', () => {
      const validInput = {};
      expect(() => listTemplatesSchema.parse(validInput)).not.toThrow();

      const withFilters = { category: 'auth', language: 'typescript' };
      expect(() => listTemplatesSchema.parse(withFilters)).not.toThrow();
    });

    it('should list all templates', async () => {
      const input = listTemplatesSchema.parse({});
      const results = await handleListTemplates(input, templateService);

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]).toHaveProperty('id');
      expect(results[0]).toHaveProperty('name');
      expect(results[0]).toHaveProperty('category');
    });

    it('should filter by category', async () => {
      const input = listTemplatesSchema.parse({ category: 'auth' });
      const results = await handleListTemplates(input, templateService);

      expect(results.length).toBeGreaterThan(0);
      expect(results.every((r) => r.category === 'auth')).toBe(true);
    });

    it('should filter by language', async () => {
      const input = listTemplatesSchema.parse({ language: 'typescript' });
      const results = await handleListTemplates(input, templateService);

      expect(results.every((r) => r.language === 'typescript')).toBe(true);
    });

    it('should format template list', async () => {
      const input = listTemplatesSchema.parse({});
      const results = await handleListTemplates(input, templateService);
      const formatted = formatTemplateList(results);

      expect(typeof formatted).toBe('string');
      expect(formatted).toContain('Available Templates');
    });

    it('should handle empty results', () => {
      const formatted = formatTemplateList([]);

      expect(formatted).toContain('No templates found');
    });
  });
});
