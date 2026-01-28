/**
 * Tests for TemplateService
 */

import { describe, it, expect, beforeAll } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { TemplateService } from '../../src/services/template-service.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.resolve(__dirname, '../../templates');

describe('TemplateService', () => {
  let service: TemplateService;

  beforeAll(() => {
    service = new TemplateService(TEMPLATES_DIR);
  });

  describe('parseTemplateId', () => {
    it('should parse a valid template ID', () => {
      const result = service.parseTemplateId('typescript/nextjs/auth/nextauth-google');

      expect(result).toEqual({
        language: 'typescript',
        framework: 'nextjs',
        category: 'auth',
        name: 'nextauth-google',
      });
    });

    it('should throw for invalid template ID format', () => {
      expect(() => service.parseTemplateId('invalid-id')).toThrow();
      expect(() => service.parseTemplateId('only/two/parts')).toThrow();
    });
  });

  describe('buildTemplatePath', () => {
    it('should build correct path for a template ID', () => {
      const result = service.buildTemplatePath('typescript/nextjs/auth/nextauth-google');

      expect(result).toContain('templates');
      expect(result).toContain('typescript');
      expect(result).toContain('nextjs');
      expect(result).toContain('auth');
      expect(result).toContain('nextauth-google');
    });
  });

  describe('loadTemplate', () => {
    it('should load an existing template', async () => {
      const template = await service.loadTemplate('typescript/nextjs/auth/nextauth-google');

      expect(template).not.toBeNull();
      expect(template?.id).toBe('typescript/nextjs/auth/nextauth-google');
      expect(template?.name).toBeDefined();
      expect(template?.category).toBe('auth');
      expect(template?.language).toBe('typescript');
      expect(template?.framework).toBe('nextjs');
    });

    it('should return null for non-existent template', async () => {
      const template = await service.loadTemplate('typescript/nextjs/auth/non-existent');

      expect(template).toBeNull();
    });

    it('should cache loaded templates', async () => {
      await service.loadTemplate('typescript/nextjs/auth/nextauth-google');
      const template2 = await service.loadTemplate('typescript/nextjs/auth/nextauth-google');

      expect(template2).not.toBeNull();
    });
  });

  describe('getTemplateCode', () => {
    it('should load code files for a template', async () => {
      const code = await service.getTemplateCode('typescript/nextjs/auth/nextauth-google');

      expect(code).toBeDefined();
      expect(Object.keys(code).length).toBeGreaterThan(0);
    });
  });

  describe('listTemplates', () => {
    it('should list all templates', async () => {
      const templates = await service.listTemplates();

      expect(templates.length).toBeGreaterThan(0);
    });

    it('should filter templates by category', async () => {
      const templates = await service.listTemplates({ category: 'auth' });

      expect(templates.length).toBeGreaterThan(0);
      expect(templates.every((t) => t.category === 'auth')).toBe(true);
    });

    it('should filter templates by language', async () => {
      const templates = await service.listTemplates({ language: 'typescript' });

      expect(templates.length).toBeGreaterThan(0);
      expect(templates.every((t) => t.language === 'typescript')).toBe(true);
    });

    it('should filter templates by framework', async () => {
      const templates = await service.listTemplates({ framework: 'nextjs' });

      expect(templates.length).toBeGreaterThan(0);
      expect(templates.every((t) => t.framework === 'nextjs')).toBe(true);
    });
  });

  describe('getAllTemplateIds', () => {
    it('should return all template IDs', async () => {
      const ids = await service.getAllTemplateIds();

      expect(ids.length).toBeGreaterThan(0);
      expect(ids).toContain('typescript/nextjs/auth/nextauth-google');
    });
  });

  describe('getTemplateWithCode', () => {
    it('should return template with code', async () => {
      const template = await service.getTemplateWithCode('typescript/nextjs/auth/nextauth-google');

      expect(template).not.toBeNull();
      expect(template?.code).toBeDefined();
      expect(Object.keys(template?.code || {}).length).toBeGreaterThan(0);
    });

    it('should return null for non-existent template', async () => {
      const template = await service.getTemplateWithCode('typescript/nextjs/auth/non-existent');

      expect(template).toBeNull();
    });
  });

  describe('clearCache', () => {
    it('should clear the template cache', async () => {
      await service.loadTemplate('typescript/nextjs/auth/nextauth-google');
      service.clearCache();

      // After clearing, it should still work (reload from disk)
      const template = await service.loadTemplate('typescript/nextjs/auth/nextauth-google');
      expect(template).not.toBeNull();
    });
  });
});
