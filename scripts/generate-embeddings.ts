#!/usr/bin/env tsx
/**
 * Script to generate and cache template embeddings
 * Run with: pnpm generate-embeddings
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import 'dotenv/config';

import { TemplateService } from '../src/services/template-service.js';
import { EmbeddingService } from '../src/services/embedding-service.js';
import type { EmbeddingCache } from '../src/types/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.resolve(__dirname, '../templates');

async function main(): Promise<void> {
  console.log('🚀 Starting embedding generation...\n');

  // Initialize services
  const templateService = new TemplateService(TEMPLATES_DIR);
  const embeddingService = new EmbeddingService();

  // Get all template IDs
  const templateIds = await templateService.getAllTemplateIds();
  console.log(`📦 Found ${templateIds.length} templates\n`);

  if (templateIds.length === 0) {
    console.log('⚠️  No templates found. Make sure templates are in the templates/ directory.');
    process.exit(1);
  }

  // Load all templates
  const templates = [];
  for (const id of templateIds) {
    const metadata = await templateService.loadTemplate(id);
    if (metadata) {
      templates.push(metadata);
      console.log(`  ✅ Loaded: ${id}`);
    } else {
      console.log(`  ⚠️  Failed to load: ${id}`);
    }
  }

  console.log(`\n🧠 Generating embeddings for ${templates.length} templates...\n`);

  // Generate embeddings
  const embeddings = await embeddingService.generateBatchEmbeddings(templates);

  console.log(`\n✨ Generated ${embeddings.size} embeddings\n`);

  // Convert Map to plain object for JSON serialization
  const embeddingsObject: Record<string, number[]> = {};
  for (const [id, embedding] of embeddings) {
    embeddingsObject[id] = embedding;
  }

  // Create cache object
  const cache: EmbeddingCache = {
    embeddings: embeddingsObject,
    generatedAt: new Date().toISOString(),
    model: embeddingService.getModelName(),
  };

  // Save to file
  const outputPath = path.join(TEMPLATES_DIR, 'embeddings.json');
  await fs.writeFile(outputPath, JSON.stringify(cache, null, 2));

  console.log(`💾 Saved embeddings to: ${outputPath}`);
  console.log('\n✅ Done!');
}

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
