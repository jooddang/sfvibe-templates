/**
 * Search service for semantic template search
 * @module services/search-service
 */

import fs from 'node:fs/promises';
import path from 'node:path';

import { logger } from '../utils/logger.js';
import { config } from '../utils/config.js';
import { EmbeddingService } from './embedding-service.js';
import { TemplateService } from './template-service.js';
import type {
  TemplateMetadata,
  SearchResult,
  SearchFilters,
  EmbeddingCache,
} from '../types/index.js';

/**
 * Default number of search results
 */
const DEFAULT_LIMIT = 5;

/**
 * Calculate cosine similarity between two vectors
 * @param a - First vector
 * @param b - Second vector
 * @returns Cosine similarity (0-1)
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    magnitudeA += a[i] * a[i];
    magnitudeB += b[i] * b[i];
  }

  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Simple keyword matching score
 * @param query - Search query
 * @param template - Template metadata
 * @returns Match score (0-1)
 */
function keywordMatchScore(query: string, template: TemplateMetadata): number {
  const queryTerms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const searchableText = [
    template.name,
    template.description,
    template.category,
    template.framework,
    template.language,
    ...template.tags,
  ]
    .join(' ')
    .toLowerCase();

  let matches = 0;
  for (const term of queryTerms) {
    if (searchableText.includes(term)) {
      matches++;
    }
  }

  return queryTerms.length > 0 ? matches / queryTerms.length : 0;
}

/**
 * Service for semantic template search
 */
export class SearchService {
  private embeddingService: EmbeddingService;
  private templateService: TemplateService;
  private templateEmbeddings: Map<string, number[]> = new Map();
  private templateMetadata: Map<string, TemplateMetadata> = new Map();
  private initialized = false;
  private embeddingsAvailable = false;

  /**
   * Create a new SearchService instance
   * @param templateService - Template service for loading templates
   * @param embeddingService - Embedding service for generating embeddings
   */
  constructor(templateService: TemplateService, embeddingService: EmbeddingService) {
    this.templateService = templateService;
    this.embeddingService = embeddingService;
  }

  /**
   * Initialize the search service by loading embeddings
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    logger.info('Initializing search service...');

    // Load all template metadata first
    const templateIds = await this.templateService.getAllTemplateIds();
    for (const id of templateIds) {
      const metadata = await this.templateService.loadTemplate(id);
      if (metadata) {
        this.templateMetadata.set(id, metadata);
      }
    }

    // Try to load cached embeddings
    const cacheLoaded = await this.loadCachedEmbeddings();

    if (!cacheLoaded && this.embeddingService.isAvailable()) {
      // Generate embeddings for all templates if OpenAI is available
      await this.generateAllEmbeddings();
      this.embeddingsAvailable = true;
    } else if (cacheLoaded) {
      this.embeddingsAvailable = true;
    } else {
      logger.info('Embeddings not available. Using keyword search fallback.');
      this.embeddingsAvailable = false;
    }

    this.initialized = true;
    logger.info('Search service initialized', {
      templateCount: this.templateMetadata.size,
      embeddingsAvailable: this.embeddingsAvailable,
    });
  }

  /**
   * Search for templates using natural language query
   * @param query - Search query
   * @param filters - Optional filters
   * @returns Search results sorted by relevance
   */
  public async search(query: string, filters?: SearchFilters): Promise<SearchResult[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    const limit = filters?.limit ?? DEFAULT_LIMIT;

    // Use semantic search if embeddings are available, otherwise fallback to keyword search
    if (this.embeddingsAvailable && this.templateEmbeddings.size > 0) {
      return this.semanticSearch(query, filters, limit);
    } else {
      return this.keywordSearch(query, filters, limit);
    }
  }

  /**
   * Semantic search using embeddings
   */
  private async semanticSearch(
    query: string,
    filters: SearchFilters | undefined,
    limit: number
  ): Promise<SearchResult[]> {
    // Generate embedding for the query
    const queryEmbedding = await this.embeddingService.generateEmbedding(query);

    // Calculate similarity scores
    const scores: Array<{ id: string; score: number }> = [];

    for (const [templateId, embedding] of this.templateEmbeddings) {
      const metadata = this.templateMetadata.get(templateId);
      if (!metadata) continue;

      // Apply filters
      if (filters?.category && metadata.category !== filters.category) continue;
      if (filters?.language && metadata.language !== filters.language) continue;
      if (filters?.framework && metadata.framework !== filters.framework) continue;

      const score = cosineSimilarity(queryEmbedding, embedding);
      scores.push({ id: templateId, score });
    }

    // Sort by score descending and take top results
    scores.sort((a, b) => b.score - a.score);
    const topResults = scores.slice(0, limit);

    // Build search results
    return this.buildSearchResults(topResults);
  }

  /**
   * Keyword-based search fallback
   */
  private keywordSearch(
    query: string,
    filters: SearchFilters | undefined,
    limit: number
  ): SearchResult[] {
    const scores: Array<{ id: string; score: number }> = [];

    for (const [templateId, metadata] of this.templateMetadata) {
      // Apply filters
      if (filters?.category && metadata.category !== filters.category) continue;
      if (filters?.language && metadata.language !== filters.language) continue;
      if (filters?.framework && metadata.framework !== filters.framework) continue;

      const score = keywordMatchScore(query, metadata);
      if (score > 0) {
        scores.push({ id: templateId, score });
      }
    }

    // Sort by score descending and take top results
    scores.sort((a, b) => b.score - a.score);
    const topResults = scores.slice(0, limit);

    // Build search results
    return this.buildSearchResults(topResults);
  }

  /**
   * Build search results from scores
   */
  private buildSearchResults(
    scores: Array<{ id: string; score: number }>
  ): SearchResult[] {
    const results: SearchResult[] = [];

    for (const { id, score } of scores) {
      const metadata = this.templateMetadata.get(id);
      if (!metadata) continue;

      results.push({
        templateId: id,
        name: metadata.name,
        description: metadata.description,
        score,
        category: metadata.category,
        language: metadata.language,
        framework: metadata.framework,
      });
    }

    return results;
  }

  /**
   * Load cached embeddings from disk
   * @returns True if cache was loaded successfully
   */
  private async loadCachedEmbeddings(): Promise<boolean> {
    const cachePath = path.join(config.TEMPLATES_DIR, 'embeddings.json');

    try {
      const cacheContent = await fs.readFile(cachePath, 'utf-8');
      const cache = JSON.parse(cacheContent) as EmbeddingCache;

      // Load embeddings
      for (const [id, embedding] of Object.entries(cache.embeddings)) {
        this.templateEmbeddings.set(id, embedding);
      }

      logger.info('Loaded cached embeddings', {
        count: this.templateEmbeddings.size,
        generatedAt: cache.generatedAt,
      });

      return true;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        logger.warn('Failed to load embedding cache', { error });
      }
      return false;
    }
  }

  /**
   * Generate embeddings for all templates
   */
  private async generateAllEmbeddings(): Promise<void> {
    logger.info('Generating embeddings for all templates...');

    const templates = Array.from(this.templateMetadata.values());
    const embeddings = await this.embeddingService.generateBatchEmbeddings(templates);
    this.templateEmbeddings = embeddings;

    logger.info('Generated embeddings', { count: embeddings.size });
  }

  /**
   * Clear the embedding cache
   */
  public clearCache(): void {
    this.templateEmbeddings.clear();
    this.templateMetadata.clear();
    this.initialized = false;
    this.embeddingsAvailable = false;
  }

  /**
   * Check if the service is initialized
   */
  public isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Check if semantic search is available
   */
  public hasSemanticSearch(): boolean {
    return this.embeddingsAvailable;
  }
}
