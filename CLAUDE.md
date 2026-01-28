# CLAUDE.md

# Project Context for Claude Code

## Project Overview

**vibe-templates-mcp** - AI 코딩 에이전트를 위한 재사용 가능한 코드 템플릿 MCP 서버

이 프로젝트는 Cursor, Claude Code, Windsurf 등 AI 코딩 도구에서 사용할 수 있는
고품질 코드 템플릿을 제공하는 MCP(Model Context Protocol) 서버입니다.

## Key Documents

- `PRD.md` - 제품 요구사항 문서 (아키텍처, API 스펙, 템플릿 스키마)
- `TASKS.md` - 구현 태스크 목록 (순서대로 진행)

## Tech Stack

- **Runtime**: Node.js 20+
- **Language**: TypeScript (strict mode)
- **MCP SDK**: @modelcontextprotocol/sdk
- **Validation**: Zod
- **Embedding**: OpenAI text-embedding-3-small
- **Build**: tsup
- **Test**: vitest
- **Package Manager**: pnpm

## Coding Standards

### TypeScript

- strict mode 필수
- 모든 함수에 명시적 반환 타입
- JSDoc 주석으로 public API 문서화
- `any` 타입 사용 금지 (unknown 사용)

### File Naming

- 파일명: kebab-case (예: `template-service.ts`)
- 클래스명: PascalCase (예: `TemplateService`)
- 함수/변수명: camelCase (예: `loadTemplate`)
- 상수: UPPER_SNAKE_CASE (예: `DEFAULT_LIMIT`)

### Error Handling

```typescript
// Good: 명시적 에러 타입
class TemplateNotFoundError extends Error {
  constructor(templateId: string) {
    super(`Template not found: ${templateId}`);
    this.name = 'TemplateNotFoundError';
  }
}

// Good: Result 패턴 (선택적)
type Result<T, E = Error> = { success: true; data: T } | { success: false; error: E };
```

### Import Order

```typescript
// 1. Node.js built-ins
import fs from 'node:fs/promises';
import path from 'node:path';

// 2. External packages
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

// 3. Internal modules (absolute)
import { config } from './utils/config.js';
import { logger } from './utils/logger.js';

// 4. Types
import type { TemplateMetadata } from './types/index.js';
```

### MCP Tool Implementation Pattern

```typescript
// src/tools/example-tool.ts
import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

// 1. Schema 정의
export const exampleToolSchema = z.object({
  param1: z.string().describe('Parameter description'),
  param2: z.number().optional().default(10),
});

export type ExampleToolInput = z.infer<typeof exampleToolSchema>;

// 2. 핸들러 함수 (순수 함수로 분리)
export async function handleExampleTool(
  input: ExampleToolInput,
  deps: { service: SomeService }
): Promise<SomeResult> {
  // Implementation
}

// 3. 서버에 등록하는 함수
export function registerExampleTool(server: McpServer, deps: Dependencies) {
  server.tool(
    'example_tool',
    'Tool description for AI to understand',
    exampleToolSchema.shape,
    async (args) => {
      const result = await handleExampleTool(args, deps);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
  );
}
```

### Template Metadata Schema

```typescript
// 모든 템플릿은 이 스키마를 따름
interface TemplateMetadata {
  id: string;                    // "typescript/nextjs/auth/nextauth-google"
  name: string;
  description: string;
  version: string;
  category: TemplateCategory;
  language: 'typescript' | 'python';
  framework: string;
  dependencies: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  envVariables: EnvVariable[];
  files: TemplateFile[];
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
```

## Directory Structure

```
src/
├── index.ts              # Entry point
├── server.ts             # MCP Server setup
├── tools/                # MCP Tools (search, get, list)
├── resources/            # MCP Resources (template URIs)
├── prompts/              # MCP Prompts (guided workflows)
├── services/             # Business logic
├── types/                # TypeScript types
└── utils/                # Utilities (config, logger)

templates/
└── {language}/{framework}/{category}/{template-name}/
    ├── metadata.json     # TemplateMetadata
    ├── files/            # Template code files
    └── README.md         # Documentation
```

## Common Commands

```bash
# Development
pnpm dev          # Watch mode
pnpm build        # Production build
pnpm test         # Run tests
pnpm typecheck    # Type checking
pnpm lint         # Linting

# Scripts
pnpm generate-embeddings   # Generate template embeddings
pnpm validate-templates    # Validate all templates

# Testing with MCP Inspector
npx @anthropic-ai/mcp-inspector dist/index.js
```

## Testing Guidelines

- 각 서비스에 대한 단위 테스트 필수
- Mock을 사용하여 외부 의존성 격리
- 테스트 파일 위치: `tests/{module}/{file}.test.ts`

```typescript
// 테스트 예시
import { describe, it, expect, vi } from 'vitest';
import { TemplateService } from '../../src/services/template-service.js';

describe('TemplateService', () => {
  it('should load template by id', async () => {
    const service = new TemplateService('./fixtures/templates');
    const result = await service.loadTemplate('typescript/nextjs/auth/test');
    expect(result).toBeDefined();
    expect(result?.id).toBe('typescript/nextjs/auth/test');
  });
});
```

## Environment Variables

```env
# Required
OPENAI_API_KEY=sk-...

# Optional
TEMPLATES_DIR=./templates
LOG_LEVEL=info
CACHE_TTL=3600
```

## Git Commit Convention

```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 변경
refactor: 코드 리팩토링
test: 테스트 추가/수정
chore: 빌드, 설정 변경
```

## Important Notes

1. **MCP SDK 버전**: @modelcontextprotocol/sdk 최신 버전 사용
1. **ESM Only**: CommonJS 사용 금지, package.json에 “type”: “module”
1. **Node.js 20+**: Top-level await, fs/promises 사용
1. **템플릿 품질**: 모든 템플릿은 실제 프로덕션에서 바로 사용 가능해야 함

## Workflow

1. TASKS.md에서 현재 진행할 Task 확인
1. Task 구현
1. 테스트 작성 및 실행
1. 타입 체크 및 린트 통과 확인
1. 커밋
1. 다음 Task로 이동

## Questions?

구현 중 불명확한 부분이 있으면:

1. PRD.md 확인
1. TASKS.md의 해당 Task 세부 내용 확인
1. 그래도 불명확하면 구현 전 질문

-----

**시작하려면**: `TASKS.md`의 Task 0.1부터 순서대로 진행하세요.
