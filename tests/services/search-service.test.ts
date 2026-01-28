/**
 * Tests for SearchService
 */

import { describe, it, expect, beforeAll, vi } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { TemplateService } from '../../src/services/template-service.js';
import { EmbeddingService } from '../../src/services/embedding-service.js';
import { SearchService } from '../../src/services/search-service.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.resolve(__dirname, '../../templates');

describe('SearchService', () => {
  let templateService: TemplateService;
  let embeddingService: EmbeddingService;
  let searchService: SearchService;

  beforeAll(() => {
    templateService = new TemplateService(TEMPLATES_DIR);
    embeddingService = new EmbeddingService();
    searchService = new SearchService(templateService, embeddingService);
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      await searchService.initialize();

      expect(searchService.isInitialized()).toBe(true);
    });

    it('should not reinitialize if already initialized', async () => {
      await searchService.initialize();
      await searchService.initialize();

      expect(searchService.isInitialized()).toBe(true);
    });
  });

  describe('keyword search (fallback)', () => {
    it('should find templates matching query keywords', async () => {
      // Clear to force keyword search (no embeddings)
      searchService.clearCache();

      // Mock the embedding service to be unavailable
      vi.spyOn(embeddingService, 'isAvailable').mockReturnValue(false);

      await searchService.initialize();

      const results = await searchService.search('google auth nextjs');

      expect(results.length).toBeGreaterThan(0);
      // Results should contain auth-related templates
      const hasAuthTemplate = results.some(
        (r) => r.category === 'auth' || r.templateId.includes('auth')
      );
      expect(hasAuthTemplate).toBe(true);

      vi.restoreAllMocks();
    });

    it('should filter by category', async () => {
      searchService.clearCache();
      vi.spyOn(embeddingService, 'isAvailable').mockReturnValue(false);
      await searchService.initialize();

      const results = await searchService.search('setup', { category: 'database' });

      expect(results.every((r) => r.category === 'database')).toBe(true);

      vi.restoreAllMocks();
    });

    it('should filter by language', async () => {
      searchService.clearCache();
      vi.spyOn(embeddingService, 'isAvailable').mockReturnValue(false);
      await searchService.initialize();

      const results = await searchService.search('auth', { language: 'typescript' });

      expect(results.every((r) => r.language === 'typescript')).toBe(true);

      vi.restoreAllMocks();
    });

    it('should filter by framework', async () => {
      searchService.clearCache();
      vi.spyOn(embeddingService, 'isAvailable').mockReturnValue(false);
      await searchService.initialize();

      const results = await searchService.search('auth', { framework: 'nextjs' });

      expect(results.every((r) => r.framework === 'nextjs')).toBe(true);

      vi.restoreAllMocks();
    });

    it('should respect limit', async () => {
      searchService.clearCache();
      vi.spyOn(embeddingService, 'isAvailable').mockReturnValue(false);
      await searchService.initialize();

      const results = await searchService.search('auth', { limit: 2 });

      expect(results.length).toBeLessThanOrEqual(2);

      vi.restoreAllMocks();
    });
  });

  describe('clearCache', () => {
    it('should clear the search cache', async () => {
      await searchService.initialize();
      searchService.clearCache();

      expect(searchService.isInitialized()).toBe(false);
    });
  });
});
