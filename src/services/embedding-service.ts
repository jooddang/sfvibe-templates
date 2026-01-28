/**
 * Embedding service for generating vector embeddings using OpenAI
 * @module services/embedding-service
 */

import OpenAI from 'openai';

import { logger } from '../utils/logger.js';
import { config, hasEmbeddingsSupport } from '../utils/config.js';
import type { TemplateMetadata } from '../types/index.js';

/**
 * Model used for generating embeddings
 */
const EMBEDDING_MODEL = 'text-embedding-3-small';

/**
 * Dimensions for the embedding vectors
 */
const EMBEDDING_DIMENSIONS = 1536;

/**
 * Service for generating embeddings using OpenAI
 */
export class EmbeddingService {
  private client: OpenAI | null = null;

  /**
   * Create a new EmbeddingService instance
   */
  constructor() {
    if (hasEmbeddingsSupport()) {
      this.client = new OpenAI({
        apiKey: config.OPENAI_API_KEY,
      });
    } else {
      logger.warn('OpenAI API key not configured. Semantic search will be disabled.');
    }
  }

  /**
   * Check if embeddings are available
   */
  public isAvailable(): boolean {
    return this.client !== null;
  }

  /**
   * Generate an embedding for a text string
   * @param text - Text to generate embedding for
   * @returns Embedding vector
   */
  public async generateEmbedding(text: string): Promise<number[]> {
    if (!this.client) {
      throw new Error('OpenAI API key not configured. Cannot generate embeddings.');
    }

    try {
      const response = await this.client.embeddings.create({
        model: EMBEDDING_MODEL,
        input: text,
        dimensions: EMBEDDING_DIMENSIONS,
      });

      return response.data[0].embedding;
    } catch (error) {
      logger.error('Failed to generate embedding', { error });
      throw error;
    }
  }

  /**
   * Generate an embedding for a template based on its metadata
   * @param template - Template metadata
   * @returns Embedding vector
   */
  public async generateTemplateEmbedding(template: TemplateMetadata): Promise<number[]> {
    // Combine relevant fields for embedding
    const text = [
      template.name,
      template.description,
      template.category,
      template.framework,
      template.language,
      ...template.tags,
    ].join(' ');

    return this.generateEmbedding(text);
  }

  /**
   * Generate embeddings for multiple templates
   * @param templates - Array of template metadata
   * @returns Map of template ID to embedding vector
   */
  public async generateBatchEmbeddings(
    templates: TemplateMetadata[]
  ): Promise<Map<string, number[]>> {
    const embeddings = new Map<string, number[]>();

    if (!this.client) {
      logger.warn('Embeddings not available. Skipping batch generation.');
      return embeddings;
    }

    // Process in batches to avoid rate limits
    const batchSize = 10;
    for (let i = 0; i < templates.length; i += batchSize) {
      const batch = templates.slice(i, i + batchSize);

      const promises = batch.map(async (template) => {
        const embedding = await this.generateTemplateEmbedding(template);
        return { id: template.id, embedding };
      });

      const results = await Promise.all(promises);
      for (const result of results) {
        embeddings.set(result.id, result.embedding);
      }

      logger.debug('Processed embedding batch', {
        batch: i / batchSize + 1,
        total: Math.ceil(templates.length / batchSize),
      });
    }

    return embeddings;
  }

  /**
   * Get the embedding model name
   */
  public getModelName(): string {
    return EMBEDDING_MODEL;
  }

  /**
   * Get the embedding dimensions
   */
  public getDimensions(): number {
    return EMBEDDING_DIMENSIONS;
  }
}
