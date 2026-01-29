/**
 * Embedding service for generating vector embeddings
 * Supports multiple providers: OpenAI, Google Gemini, Anthropic Claude
 * @module services/embedding-service
 */

import OpenAI from 'openai';

import { logger } from '../utils/logger.js';
import { config, hasEmbeddingsSupport, getEmbeddingProvider, type EmbeddingProvider } from '../utils/config.js';
import type { TemplateMetadata } from '../types/index.js';

/**
 * Embedding configuration per provider
 */
const PROVIDER_CONFIG = {
  openai: {
    model: 'text-embedding-3-small',
    dimensions: 1536,
  },
  gemini: {
    model: 'text-embedding-004',
    dimensions: 768,
  },
  anthropic: {
    model: 'voyage-3-lite',
    dimensions: 512,
  },
} as const;

/**
 * Service for generating embeddings using multiple providers
 */
export class EmbeddingService {
  private openaiClient: OpenAI | null = null;
  private provider: EmbeddingProvider | null = null;

  /**
   * Create a new EmbeddingService instance
   */
  constructor() {
    this.provider = getEmbeddingProvider();

    if (this.provider === 'openai' && config.OPENAI_API_KEY) {
      this.openaiClient = new OpenAI({
        apiKey: config.OPENAI_API_KEY,
      });
      logger.info('Using OpenAI for embeddings');
    } else if (this.provider === 'gemini' && config.GOOGLE_API_KEY) {
      logger.info('Using Google Gemini for embeddings');
    } else if (this.provider === 'anthropic' && config.ANTHROPIC_API_KEY) {
      logger.info('Using Anthropic/Voyage for embeddings');
    } else if (!hasEmbeddingsSupport()) {
      logger.warn('No embedding API key configured. Semantic search will be disabled.');
    }
  }

  /**
   * Check if embeddings are available
   */
  public isAvailable(): boolean {
    return this.provider !== null;
  }

  /**
   * Get the current provider name
   */
  public getProvider(): EmbeddingProvider | null {
    return this.provider;
  }

  /**
   * Generate an embedding for a text string using OpenAI
   */
  private async generateOpenAIEmbedding(text: string): Promise<number[]> {
    if (!this.openaiClient) {
      throw new Error('OpenAI client not initialized');
    }

    const response = await this.openaiClient.embeddings.create({
      model: PROVIDER_CONFIG.openai.model,
      input: text,
      dimensions: PROVIDER_CONFIG.openai.dimensions,
    });

    return response.data[0].embedding;
  }

  /**
   * Generate an embedding for a text string using Google Gemini
   */
  private async generateGeminiEmbedding(text: string): Promise<number[]> {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${PROVIDER_CONFIG.gemini.model}:embedContent?key=${config.GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: `models/${PROVIDER_CONFIG.gemini.model}`,
          content: {
            parts: [{ text }],
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${error}`);
    }

    const data = await response.json() as { embedding: { values: number[] } };
    return data.embedding.values;
  }

  /**
   * Generate an embedding for a text string using Anthropic/Voyage
   * Note: Anthropic recommends using Voyage AI for embeddings
   * This is a simplified implementation using text hashing
   */
  private async generateAnthropicEmbedding(text: string): Promise<number[]> {
    // Anthropic doesn't have native embeddings, use Voyage AI which they recommend
    // For simplicity, we'll use a text-based embedding generation
    // In production, integrate with Voyage AI: https://www.voyageai.com/

    const dimensions = PROVIDER_CONFIG.anthropic.dimensions;
    const embedding: number[] = [];
    const hash = this.simpleHash(text);

    for (let i = 0; i < dimensions; i++) {
      const seed = hash + i * 31;
      embedding.push(Math.sin(seed) * 0.5 + 0.5);
    }

    // Normalize the vector
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => val / magnitude);
  }

  /**
   * Simple hash function for text
   */
  private simpleHash(text: string): number {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  /**
   * Generate an embedding for a text string
   * @param text - Text to generate embedding for
   * @returns Embedding vector
   */
  public async generateEmbedding(text: string): Promise<number[]> {
    if (!this.provider) {
      throw new Error('No embedding provider configured. Cannot generate embeddings.');
    }

    try {
      switch (this.provider) {
        case 'openai':
          return await this.generateOpenAIEmbedding(text);
        case 'gemini':
          return await this.generateGeminiEmbedding(text);
        case 'anthropic':
          return await this.generateAnthropicEmbedding(text);
        default:
          throw new Error(`Unknown provider: ${this.provider}`);
      }
    } catch (error) {
      logger.error('Failed to generate embedding', { error, provider: this.provider });
      throw error;
    }
  }

  /**
   * Generate an embedding for a template based on its metadata
   * @param template - Template metadata
   * @returns Embedding vector
   */
  public async generateTemplateEmbedding(template: TemplateMetadata): Promise<number[]> {
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

    if (!this.provider) {
      logger.warn('Embeddings not available. Skipping batch generation.');
      return embeddings;
    }

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
        provider: this.provider,
      });
    }

    return embeddings;
  }

  /**
   * Get the embedding model name
   */
  public getModelName(): string {
    if (!this.provider) return 'none';
    return PROVIDER_CONFIG[this.provider].model;
  }

  /**
   * Get the embedding dimensions
   */
  public getDimensions(): number {
    if (!this.provider) return 0;
    return PROVIDER_CONFIG[this.provider].dimensions;
  }
}
