#!/usr/bin/env tsx
/**
 * Script to validate all templates
 * Run with: pnpm validate-templates
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.resolve(__dirname, '../templates');

const VALID_CATEGORIES = [
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

const VALID_LANGUAGES = ['typescript', 'python'];

interface TemplateMetadata {
  id: string;
  name: string;
  description: string;
  version: string;
  category: string;
  language: string;
  framework: string;
  dependencies: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  envVariables: Array<{
    name: string;
    description: string;
    required: boolean;
    example?: string;
  }>;
  files: Array<{
    path: string;
    description: string;
    isRequired: boolean;
  }>;
  tags: string[];
  usage: {
    installation: string;
    configuration: string;
    example: string;
  };
  relatedTemplates?: string[];
  author: string;
  createdAt: string;
  updatedAt: string;
}

interface ValidationResult {
  templateId: string;
  valid: boolean;
  errors: string[];
  warnings: string[];
}

function validateMetadata(
  metadata: unknown,
  templateId: string
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!metadata || typeof metadata !== 'object') {
    errors.push('metadata.json is not a valid object');
    return { valid: false, errors };
  }

  const m = metadata as Record<string, unknown>;

  // Required string fields
  const requiredStrings = ['id', 'name', 'description', 'version', 'category', 'language', 'framework', 'author', 'createdAt', 'updatedAt'];
  for (const field of requiredStrings) {
    if (typeof m[field] !== 'string' || (m[field] as string).length === 0) {
      errors.push(`${field} is required and must be a non-empty string`);
    }
  }

  // Validate ID format
  if (typeof m.id === 'string' && !/^[a-z]+\/[a-z]+\/[a-z]+\/[a-z0-9-]+$/.test(m.id)) {
    errors.push(`id "${m.id}" doesn't match format: language/framework/category/name`);
  }

  // Validate ID matches path
  if (m.id !== templateId) {
    errors.push(`id "${m.id}" doesn't match directory path "${templateId}"`);
  }

  // Validate version format
  if (typeof m.version === 'string' && !/^\d+\.\d+\.\d+/.test(m.version)) {
    errors.push(`version "${m.version}" doesn't match semver format`);
  }

  // Validate category
  if (typeof m.category === 'string' && !VALID_CATEGORIES.includes(m.category)) {
    errors.push(`category "${m.category}" is not valid. Must be one of: ${VALID_CATEGORIES.join(', ')}`);
  }

  // Validate language
  if (typeof m.language === 'string' && !VALID_LANGUAGES.includes(m.language)) {
    errors.push(`language "${m.language}" is not valid. Must be one of: ${VALID_LANGUAGES.join(', ')}`);
  }

  // Validate date format
  for (const field of ['createdAt', 'updatedAt']) {
    if (typeof m[field] === 'string' && !/^\d{4}-\d{2}-\d{2}$/.test(m[field] as string)) {
      errors.push(`${field} "${m[field]}" doesn't match format: YYYY-MM-DD`);
    }
  }

  // Validate dependencies
  if (typeof m.dependencies !== 'object' || m.dependencies === null) {
    errors.push('dependencies must be an object');
  }

  // Validate envVariables
  if (!Array.isArray(m.envVariables)) {
    errors.push('envVariables must be an array');
  } else {
    for (let i = 0; i < m.envVariables.length; i++) {
      const env = m.envVariables[i] as Record<string, unknown>;
      if (typeof env.name !== 'string') {
        errors.push(`envVariables[${i}].name must be a string`);
      }
      if (typeof env.required !== 'boolean') {
        errors.push(`envVariables[${i}].required must be a boolean`);
      }
    }
  }

  // Validate files
  if (!Array.isArray(m.files) || m.files.length === 0) {
    errors.push('files must be a non-empty array');
  } else {
    for (let i = 0; i < m.files.length; i++) {
      const file = m.files[i] as Record<string, unknown>;
      if (typeof file.path !== 'string') {
        errors.push(`files[${i}].path must be a string`);
      }
      if (typeof file.isRequired !== 'boolean') {
        errors.push(`files[${i}].isRequired must be a boolean`);
      }
    }
  }

  // Validate tags
  if (!Array.isArray(m.tags) || m.tags.length === 0) {
    errors.push('tags must be a non-empty array');
  }

  // Validate usage
  if (typeof m.usage !== 'object' || m.usage === null) {
    errors.push('usage must be an object');
  } else {
    const usage = m.usage as Record<string, unknown>;
    for (const field of ['installation', 'configuration', 'example']) {
      if (typeof usage[field] !== 'string') {
        errors.push(`usage.${field} must be a string`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

async function findTemplates(dir: string): Promise<string[]> {
  const templates: string[] = [];

  async function scan(currentDir: string, depth: number): Promise<void> {
    if (depth > 4) return;

    const entries = await fs.readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const fullPath = path.join(currentDir, entry.name);

      // Check if this is a template directory (has metadata.json)
      const metadataPath = path.join(fullPath, 'metadata.json');
      try {
        await fs.access(metadataPath);
        templates.push(fullPath);
      } catch {
        // Not a template, continue scanning
        await scan(fullPath, depth + 1);
      }
    }
  }

  await scan(dir, 0);
  return templates;
}

async function validateTemplate(templatePath: string): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Get template ID from path
  const relativePath = path.relative(TEMPLATES_DIR, templatePath);
  const templateId = relativePath.replace(/\\/g, '/');

  // 1. Check metadata.json exists and is valid
  const metadataPath = path.join(templatePath, 'metadata.json');
  let metadata: TemplateMetadata | null = null;

  try {
    const content = await fs.readFile(metadataPath, 'utf-8');
    const parsed = JSON.parse(content);

    const validation = validateMetadata(parsed, templateId);
    if (!validation.valid) {
      errors.push(...validation.errors);
    } else {
      metadata = parsed as TemplateMetadata;
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      errors.push('metadata.json not found');
    } else {
      errors.push(`metadata.json parse error: ${(error as Error).message}`);
    }
  }

  // 2. Check files/ directory or template.ts exists
  const filesDir = path.join(templatePath, 'files');
  const templateFile = path.join(templatePath, 'template.ts');

  let hasFiles = false;
  try {
    const stat = await fs.stat(filesDir);
    hasFiles = stat.isDirectory();
  } catch {
    // files/ doesn't exist, check template.ts
    try {
      await fs.access(templateFile);
      hasFiles = true;
    } catch {
      // Neither exists
    }
  }

  if (!hasFiles) {
    errors.push('No code files found (need files/ directory or template.ts)');
  }

  // 3. Verify declared files exist
  if (metadata && hasFiles) {
    try {
      const actualFiles = await fs.readdir(filesDir);

      for (const declaredFile of metadata.files) {
        // Extract just the filename from the path
        const filename = path.basename(declaredFile.path);
        const variations = [
          filename,
          filename.replace('.ts', '.tsx'),
          filename.replace('.tsx', '.ts'),
          filename.replace('route.ts', 'callback-route.ts'),
          filename.replace('middleware.ts', 'middleware-client.ts'),
        ];

        const found = actualFiles.some((f) => variations.includes(f) || f.includes(filename.split('.')[0]));

        if (!found && declaredFile.isRequired) {
          warnings.push(`Declared file may not exist: ${declaredFile.path}`);
        }
      }
    } catch {
      // files/ doesn't exist, that's okay if template.ts exists
    }
  }

  // 4. Check README.md exists
  const readmePath = path.join(templatePath, 'README.md');
  try {
    await fs.access(readmePath);
  } catch {
    warnings.push('README.md not found');
  }

  return {
    templateId,
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

async function main(): Promise<void> {
  console.log('🔍 Validating templates...\n');

  const templatePaths = await findTemplates(TEMPLATES_DIR);

  if (templatePaths.length === 0) {
    console.log('⚠️  No templates found!');
    process.exit(1);
  }

  console.log(`Found ${templatePaths.length} templates\n`);

  const results: ValidationResult[] = [];
  let hasErrors = false;

  for (const templatePath of templatePaths) {
    const result = await validateTemplate(templatePath);
    results.push(result);

    const icon = result.valid ? '✅' : '❌';
    console.log(`${icon} ${result.templateId}`);

    if (result.errors.length > 0) {
      hasErrors = true;
      for (const error of result.errors) {
        console.log(`   ❌ ${error}`);
      }
    }

    if (result.warnings.length > 0) {
      for (const warning of result.warnings) {
        console.log(`   ⚠️  ${warning}`);
      }
    }
  }

  // Summary
  console.log('\n' + '─'.repeat(50));
  const validCount = results.filter((r) => r.valid).length;
  const invalidCount = results.filter((r) => !r.valid).length;
  const warningCount = results.reduce((sum, r) => sum + r.warnings.length, 0);

  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Valid: ${validCount}`);
  console.log(`   ❌ Invalid: ${invalidCount}`);
  console.log(`   ⚠️  Warnings: ${warningCount}`);

  if (hasErrors) {
    console.log('\n❌ Validation failed!');
    process.exit(1);
  } else {
    console.log('\n✅ All templates valid!');
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
