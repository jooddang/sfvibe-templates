# Task List for Claude Code

# Vibe Templates MCP Server Implementation

## Instructions for Claude Code

이 문서는 vibe-templates-mcp 프로젝트를 구현하기 위한 상세 태스크 목록입니다.
각 태스크를 순서대로 완료해주세요. PRD.md를 참조하여 구현합니다.

**중요 규칙:**

1. 각 태스크 완료 후 테스트를 실행하여 동작 확인
1. TypeScript strict mode 사용
1. 에러 핸들링 철저히 구현
1. 각 파일에 JSDoc 주석 추가
1. 커밋 단위로 작업 (각 태스크 = 1 커밋)

-----

## Phase 0: Project Setup

### Task 0.1: Initialize Project

```
목표: 프로젝트 기본 구조 생성

작업:
1. 디렉토리 생성: mkdir vibe-templates-mcp && cd vibe-templates-mcp
2. pnpm init
3. 필수 패키지 설치:
   - @modelcontextprotocol/sdk
   - zod (스키마 검증)
   - openai (embeddings)
   - dotenv
   - winston (logging)

4. Dev 패키지 설치:
   - typescript
   - @types/node
   - tsup (빌드)
   - vitest (테스트)
   - @vitest/coverage-v8
   - eslint + prettier

5. tsconfig.json 생성 (strict: true, ES2022, NodeNext)
6. .gitignore, .env.example 생성

예상 결과물:
- package.json
- tsconfig.json
- .gitignore
- .env.example
```

### Task 0.2: Create Project Structure

```
목표: PRD에 명시된 디렉토리 구조 생성

작업:
1. src/ 하위 디렉토리 생성:
   - src/index.ts
   - src/server.ts
   - src/tools/
   - src/resources/
   - src/prompts/
   - src/services/
   - src/types/
   - src/utils/

2. templates/ 디렉토리 구조 생성:
   - templates/typescript/nextjs/auth/
   - templates/typescript/nextjs/payment/
   - templates/typescript/nextjs/email/
   - templates/typescript/nextjs/database/
   - templates/typescript/nextjs/storage/

3. tests/ 디렉토리 생성
4. scripts/ 디렉토리 생성

예상 결과물:
- 전체 디렉토리 구조 완성
```

### Task 0.3: Setup Build & Scripts

```
목표: 빌드 및 개발 환경 설정

작업:
1. tsup.config.ts 생성:
   - entry: ['src/index.ts']
   - format: ['esm']
   - dts: true
   - clean: true

2. package.json scripts 추가:
   {
     "dev": "tsup --watch",
     "build": "tsup",
     "start": "node dist/index.js",
     "test": "vitest",
     "test:coverage": "vitest --coverage",
     "lint": "eslint src/",
     "typecheck": "tsc --noEmit"
   }

3. vitest.config.ts 생성
4. eslint.config.js 생성

예상 결과물:
- 빌드 가능한 프로젝트 (pnpm build 성공)
```

-----

## Phase 1: Core Types & Utilities

### Task 1.1: Define TypeScript Types

```
목표: 핵심 타입 정의

파일: src/types/index.ts

구현할 타입:
1. TemplateMetadata - PRD 3.1 스키마 그대로 구현
2. TemplateCategory (union type)
3. EnvVariable
4. TemplateFile
5. SearchResult
6. ToolResponse

추가 타입:
interface SearchResult {
  templateId: string;
  name: string;
  description: string;
  score: number;
  category: TemplateCategory;
  language: string;
  framework: string;
}

interface ToolResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

테스트:
- 타입 체크만 수행 (tsc --noEmit)
```

### Task 1.2: Create Configuration Module

```
목표: 환경 설정 관리

파일: src/utils/config.ts

구현:
1. dotenv 로드
2. Zod로 환경변수 스키마 검증
3. Config 객체 export

const configSchema = z.object({
  OPENAI_API_KEY: z.string().min(1),
  TEMPLATES_DIR: z.string().default('./templates'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  CACHE_TTL: z.coerce.number().default(3600),
});

export const config = configSchema.parse(process.env);

테스트:
- 환경변수 없을 때 에러 발생 확인
- 기본값 적용 확인
```

### Task 1.3: Create Logger Module

```
목표: 로깅 설정

파일: src/utils/logger.ts

구현:
1. winston 기반 로거
2. 로그 레벨 config에서 가져오기
3. JSON 포맷 + timestamp

사용법:
import { logger } from './utils/logger';
logger.info('Server started', { port: 3000 });

테스트:
- 각 로그 레벨 출력 확인
```

-----

## Phase 2: Template Management

### Task 2.1: Create Template Service

```
목표: 템플릿 CRUD 서비스

파일: src/services/template-service.ts

구현할 메서드:
1. loadTemplate(templateId: string): Promise<TemplateMetadata | null>
   - templates/ 디렉토리에서 metadata.json 읽기
   - 템플릿 코드 파일 읽기

2. listTemplates(filters?: TemplateFilters): Promise<TemplateMetadata[]>
   - 필터링: category, language, framework
   - 디렉토리 순회하여 모든 템플릿 로드

3. getTemplateCode(templateId: string): Promise<string>
   - template.ts 또는 files/ 내용 반환

4. getAllTemplateIds(): Promise<string[]>
   - 모든 템플릿 ID 목록

헬퍼 함수:
- parseTemplateId(id: string): { language, framework, category, name }
- buildTemplatePath(id: string): string

테스트 파일: tests/services/template-service.test.ts
- Mock 템플릿으로 각 메서드 테스트
```

### Task 2.2: Create First Template - NextAuth Credentials

```
목표: 첫 번째 템플릿 생성

디렉토리: templates/typescript/nextjs/auth/nextauth-credentials/

파일 1: metadata.json
{
  "id": "typescript/nextjs/auth/nextauth-credentials",
  "name": "NextAuth.js Credentials Authentication",
  "description": "Email/password authentication with NextAuth.js v5. Includes login, signup, and session management.",
  "version": "1.0.0",
  "category": "auth",
  "language": "typescript",
  "framework": "nextjs",
  "dependencies": {
    "next-auth": "^5.0.0-beta.25",
    "@auth/prisma-adapter": "^2.7.4",
    "bcryptjs": "^2.4.3"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6"
  },
  "envVariables": [
    {
      "name": "AUTH_SECRET",
      "description": "Secret for NextAuth.js session encryption",
      "required": true,
      "example": "openssl rand -base64 32"
    },
    {
      "name": "AUTH_URL",
      "description": "Your app URL",
      "required": true,
      "example": "http://localhost:3000"
    }
  ],
  "files": [
    {
      "path": "src/auth.ts",
      "description": "NextAuth configuration",
      "isRequired": true
    },
    {
      "path": "src/app/api/auth/[...nextauth]/route.ts",
      "description": "NextAuth API route",
      "isRequired": true
    },
    {
      "path": "src/lib/auth-actions.ts",
      "description": "Server actions for auth",
      "isRequired": true
    }
  ],
  "tags": ["auth", "nextauth", "credentials", "email", "password", "login", "signup"],
  "usage": {
    "installation": "pnpm add next-auth@beta @auth/prisma-adapter bcryptjs",
    "configuration": "1. Add AUTH_SECRET and AUTH_URL to .env\n2. Copy auth.ts to src/\n3. Copy API route to src/app/api/auth/[...nextauth]/",
    "example": "See README.md for usage examples"
  },
  "relatedTemplates": [
    "typescript/nextjs/auth/nextauth-google",
    "typescript/nextjs/database/prisma-setup"
  ],
  "author": "vibe-templates",
  "createdAt": "2025-01-28",
  "updatedAt": "2025-01-28"
}

파일 2: files/auth.ts (실제 템플릿 코드)
파일 3: files/route.ts
파일 4: files/auth-actions.ts
파일 5: README.md

테스트:
- template-service로 로드 성공 확인
```

### Task 2.3: Create More Auth Templates

```
목표: 추가 인증 템플릿 생성

1. templates/typescript/nextjs/auth/nextauth-google/
   - Google OAuth with NextAuth.js v5
   - metadata.json, files/, README.md

2. templates/typescript/nextjs/auth/supabase-auth/
   - Supabase Auth with @supabase/ssr
   - metadata.json, files/, README.md

각 템플릿 포함 내용:
- 프로덕션 레디 코드
- 명확한 의존성
- 환경변수 설명
- 사용 예제

테스트:
- 모든 템플릿 로드 가능 확인
```

### Task 2.4: Create Payment Templates

```
목표: 결제 관련 템플릿 생성

1. templates/typescript/nextjs/payment/stripe-checkout/
   - Stripe Checkout Session (one-time payment)
   - webhook 처리 포함

2. templates/typescript/nextjs/payment/stripe-subscription/
   - Stripe Subscriptions
   - Customer Portal
   - Webhook (subscription events)

테스트:
- 템플릿 로드 및 코드 추출 확인
```

### Task 2.5: Create Utility Templates

```
목표: 이메일, DB, 스토리지 템플릿

1. templates/typescript/nextjs/email/resend/
   - Resend로 트랜잭션 이메일 전송
   - React Email 템플릿 예제

2. templates/typescript/nextjs/database/prisma-setup/
   - Prisma 초기 설정
   - schema.prisma 예제
   - DB 연결 유틸리티

3. templates/typescript/nextjs/database/drizzle-setup/
   - Drizzle ORM 설정
   - 스키마 정의 예제

4. templates/typescript/nextjs/storage/s3-upload/
   - AWS S3 presigned URL 업로드
   - 파일 업로드 컴포넌트

테스트:
- 총 10개 템플릿 존재 확인
```

-----

## Phase 3: Search & Embedding

### Task 3.1: Create Embedding Service

```
목표: OpenAI 임베딩 생성 서비스

파일: src/services/embedding-service.ts

구현:
1. OpenAI 클라이언트 초기화
2. generateEmbedding(text: string): Promise<number[]>
   - text-embedding-3-small 모델 사용
3. generateTemplateEmbedding(template: TemplateMetadata): Promise<number[]>
   - name + description + tags 조합하여 임베딩

import OpenAI from 'openai';

export class EmbeddingService {
  private client: OpenAI;
  
  constructor() {
    this.client = new OpenAI({ apiKey: config.OPENAI_API_KEY });
  }
  
  async generateEmbedding(text: string): Promise<number[]> {
    const response = await this.client.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });
    return response.data[0].embedding;
  }
}

테스트:
- Mock OpenAI로 임베딩 생성 테스트
```

### Task 3.2: Create Search Service

```
목표: 시맨틱 검색 서비스

파일: src/services/search-service.ts

구현:
1. 템플릿 임베딩 캐시 (in-memory Map)
2. initializeEmbeddings(): Promise<void>
   - 모든 템플릿 임베딩 생성 및 캐시
3. search(query: string, filters?: SearchFilters): Promise<SearchResult[]>
   - 쿼리 임베딩 생성
   - 코사인 유사도 계산
   - 필터 적용
   - 상위 N개 반환

코사인 유사도 함수:
function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

테스트:
- 검색 쿼리에 대한 관련 템플릿 반환 확인
```

### Task 3.3: Create Embedding Generation Script

```
목표: 사전 임베딩 생성 스크립트

파일: scripts/generate-embeddings.ts

기능:
1. 모든 템플릿 순회
2. 각 템플릿에 대해 임베딩 생성
3. embeddings.json 파일로 저장

사용법:
pnpm run generate-embeddings

출력 파일: templates/embeddings.json
{
  "typescript/nextjs/auth/nextauth-credentials": [0.123, -0.456, ...],
  "typescript/nextjs/auth/nextauth-google": [0.789, -0.012, ...],
  ...
}

package.json script 추가:
"generate-embeddings": "tsx scripts/generate-embeddings.ts"
```

-----

## Phase 4: MCP Server Implementation

### Task 4.1: Create MCP Server Base

```
목표: MCP 서버 기본 구조

파일: src/server.ts

구현:
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

export function createServer() {
  const server = new McpServer({
    name: 'vibe-templates',
    version: '1.0.0',
    capabilities: {
      resources: {},
      tools: {},
      prompts: {},
    },
  });
  
  return server;
}

export async function startServer() {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info('MCP Server started');
}

파일: src/index.ts
import { startServer } from './server';
startServer().catch(console.error);

테스트:
- 서버 시작 성공 확인
```

### Task 4.2: Implement search_templates Tool

```
목표: 템플릿 검색 도구 구현

파일: src/tools/search-templates.ts

구현:
import { z } from 'zod';

export const searchTemplatesSchema = z.object({
  query: z.string().describe('Natural language search query'),
  language: z.enum(['typescript', 'python']).optional(),
  framework: z.string().optional(),
  category: z.enum([...]).optional(),
  limit: z.number().default(5),
});

export async function searchTemplates(
  args: z.infer<typeof searchTemplatesSchema>,
  searchService: SearchService
): Promise<SearchResult[]> {
  const results = await searchService.search(args.query, {
    language: args.language,
    framework: args.framework,
    category: args.category,
  });
  return results.slice(0, args.limit);
}

서버에 등록 (server.ts):
server.tool(
  'search_templates',
  'Search for code templates using natural language',
  searchTemplatesSchema,
  async (args) => {
    const results = await searchTemplates(args, searchService);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(results, null, 2),
      }],
    };
  }
);

테스트:
- "google oauth nextjs" 검색 시 nextauth-google 반환
```

### Task 4.3: Implement get_template Tool

```
목표: 템플릿 조회 도구 구현

파일: src/tools/get-template.ts

구현:
export const getTemplateSchema = z.object({
  templateId: z.string().describe('Template ID'),
  includeExample: z.boolean().default(true),
  format: z.enum(['full', 'code-only', 'metadata-only']).default('full'),
});

export async function getTemplate(
  args: z.infer<typeof getTemplateSchema>,
  templateService: TemplateService
) {
  const metadata = await templateService.loadTemplate(args.templateId);
  if (!metadata) {
    throw new Error(`Template not found: ${args.templateId}`);
  }
  
  const code = await templateService.getTemplateCode(args.templateId);
  
  return {
    metadata,
    code,
    // format에 따라 반환 내용 조정
  };
}

반환 포맷:
{
  "metadata": { ... },
  "code": "// Template code here...",
  "installation": "pnpm add ...",
  "envVariables": [...],
  "usage": "..."
}

테스트:
- 유효한 templateId로 전체 정보 반환
- 잘못된 templateId로 에러 반환
```

### Task 4.4: Implement list_templates Tool

```
목표: 템플릿 목록 도구 구현

파일: src/tools/list-templates.ts

구현:
export const listTemplatesSchema = z.object({
  category: z.string().optional(),
  language: z.string().optional(),
  framework: z.string().optional(),
});

export async function listTemplates(
  args: z.infer<typeof listTemplatesSchema>,
  templateService: TemplateService
) {
  const templates = await templateService.listTemplates(args);
  return templates.map(t => ({
    id: t.id,
    name: t.name,
    description: t.description,
    category: t.category,
    language: t.language,
    framework: t.framework,
  }));
}

테스트:
- 필터 없이 전체 목록 반환
- category='auth' 필터 적용 시 인증 템플릿만 반환
```

### Task 4.5: Implement MCP Resources

```
목표: 템플릿을 MCP Resource로 제공

파일: src/resources/template-resource.ts

구현:
server.resource(
  'template://*',
  async (uri) => {
    // URI: template://typescript/nextjs/auth/nextauth-google
    const templateId = uri.replace('template://', '');
    const metadata = await templateService.loadTemplate(templateId);
    const code = await templateService.getTemplateCode(templateId);
    
    return {
      contents: [{
        uri: uri,
        mimeType: 'text/typescript',
        text: code,
      }],
    };
  }
);

// Resource 목록 제공
server.resourceList(async () => {
  const ids = await templateService.getAllTemplateIds();
  return ids.map(id => ({
    uri: `template://${id}`,
    name: id.split('/').pop(),
    description: `Code template: ${id}`,
    mimeType: 'text/typescript',
  }));
});

테스트:
- Resource 목록 조회
- 특정 Resource 내용 조회
```

### Task 4.6: Implement MCP Prompts

```
목표: 가이드 프롬프트 구현

파일: src/prompts/implement-auth.ts

구현:
server.prompt(
  'implement_auth',
  'Step-by-step guide to implement authentication',
  [
    { name: 'provider', description: 'Auth provider', required: true },
    { name: 'framework', description: 'Framework', required: true },
    { name: 'features', description: 'Additional features', required: false },
  ],
  async (args) => {
    const templateId = findAuthTemplate(args.provider, args.framework);
    const template = await templateService.loadTemplate(templateId);
    
    return {
      messages: [{
        role: 'user',
        content: {
          type: 'text',
          text: generateAuthGuide(template, args.features),
        },
      }],
    };
  }
);

generateAuthGuide 함수:
- 설치 단계
- 환경변수 설정
- 코드 복사 위치
- 사용 예제

추가 프롬프트:
- setup_payment
- add_notification

테스트:
- 프롬프트 목록 조회
- 프롬프트 실행 결과 확인
```

-----

## Phase 5: Testing & Quality

### Task 5.1: Unit Tests for Services

```
목표: 서비스 레이어 단위 테스트

파일: tests/services/template-service.test.ts
- loadTemplate 테스트
- listTemplates 테스트
- getTemplateCode 테스트

파일: tests/services/search-service.test.ts
- search 테스트 (mock embeddings)
- 필터링 테스트

파일: tests/services/embedding-service.test.ts
- generateEmbedding 테스트 (mock OpenAI)

테스트 실행: pnpm test
```

### Task 5.2: Integration Tests

```
목표: MCP 도구 통합 테스트

파일: tests/integration/tools.test.ts

테스트 케이스:
1. search_templates
   - 일반 검색 쿼리
   - 필터 적용 검색
   - 빈 결과

2. get_template
   - 유효한 템플릿 ID
   - 잘못된 템플릿 ID
   - 다양한 format 옵션

3. list_templates
   - 전체 목록
   - 카테고리 필터
   - 다중 필터

테스트 환경:
- 테스트용 템플릿 fixture 사용
```

### Task 5.3: Template Validation Script

```
목표: 템플릿 유효성 검사 스크립트

파일: scripts/validate-templates.ts

검증 항목:
1. metadata.json 스키마 검증 (Zod)
2. 필수 파일 존재 확인
3. 코드 구문 오류 검사 (typescript compile check)
4. 의존성 버전 형식 검증

package.json script 추가:
"validate-templates": "tsx scripts/validate-templates.ts"

CI에서 실행하여 템플릿 품질 보장
```

-----

## Phase 6: Documentation & Publishing

### Task 6.1: Create README.md

```
목표: 프로젝트 README 작성

파일: README.md

내용:
1. 프로젝트 소개 (badges 포함)
2. 주요 기능
3. 설치 방법
   - Cursor
   - Claude Code
   - VS Code
4. 사용 예제
5. 제공 템플릿 목록
6. 템플릿 기여 방법
7. 라이선스

형식: 이모지 활용, 코드 블록, 테이블
```

### Task 6.2: Prepare npm Package

```
목표: npm 배포 준비

작업:
1. package.json 완성
   - name: "vibe-templates-mcp"
   - description
   - keywords
   - repository
   - bin 설정

2. .npmignore 생성
   - tests/
   - scripts/
   - .env*
   - *.test.ts

3. LICENSE 파일 (MIT)

4. 빌드 테스트
   - pnpm build
   - npm pack으로 패키지 확인
```

### Task 6.3: Create CONTRIBUTING.md

```
목표: 기여 가이드 작성

파일: CONTRIBUTING.md

내용:
1. 템플릿 기여 방법
   - 디렉토리 구조
   - metadata.json 작성법
   - 코드 품질 기준

2. 개발 환경 설정
3. 테스트 실행 방법
4. PR 가이드라인
5. 코드 스타일
```

-----

## Phase 7: Final Integration

### Task 7.1: End-to-End Testing

```
목표: 실제 환경에서 전체 플로우 테스트

테스트 시나리오:

1. Cursor에서 테스트:
   - mcp.json 설정
   - "search for google auth template" 실행
   - 템플릿 코드 조회
   - 실제 프로젝트에 적용

2. Claude Code에서 테스트:
   - claude mcp add 실행
   - 검색 및 조회 테스트

체크리스트:
[ ] 서버 시작 성공
[ ] 도구 목록 표시
[ ] 검색 동작
[ ] 템플릿 조회 동작
[ ] Resource 접근 동작
[ ] Prompt 실행 동작
```

### Task 7.2: Performance Optimization

```
목표: 성능 최적화

작업:
1. 임베딩 캐시 최적화
   - 시작 시 embeddings.json 로드
   - 메모리 사용량 확인

2. 템플릿 캐시
   - LRU 캐시 적용
   - config.CACHE_TTL 활용

3. 응답 시간 측정
   - 검색: < 500ms 목표
   - 템플릿 조회: < 100ms 목표

4. 필요시 최적화
   - 병렬 처리
   - 지연 로딩
```

### Task 7.3: Final Review & Release

```
목표: 최종 점검 및 릴리스

체크리스트:
[ ] 모든 테스트 통과 (pnpm test)
[ ] 타입 체크 통과 (pnpm typecheck)
[ ] 린트 통과 (pnpm lint)
[ ] 빌드 성공 (pnpm build)
[ ] README 완성
[ ] 템플릿 10개 이상 존재
[ ] 버전 1.0.0 설정

릴리스:
1. git tag v1.0.0
2. npm publish (--access public)
3. GitHub Release 생성
```

-----

## Summary Checklist

### MVP 완료 기준

- [ ] MCP Server 동작 (Cursor, Claude Code)
- [ ] 3개 Tools 구현 (search, get, list)
- [ ] 10개 템플릿 제공
- [ ] 시맨틱 검색 동작
- [ ] README 및 문서화 완료
- [ ] npm 배포 완료

### 파일 목록 (최종)

```
vibe-templates-mcp/
├── src/
│   ├── index.ts
│   ├── server.ts
│   ├── tools/
│   │   ├── search-templates.ts
│   │   ├── get-template.ts
│   │   └── list-templates.ts
│   ├── resources/
│   │   └── template-resource.ts
│   ├── prompts/
│   │   ├── implement-auth.ts
│   │   ├── setup-payment.ts
│   │   └── add-notification.ts
│   ├── services/
│   │   ├── template-service.ts
│   │   ├── search-service.ts
│   │   └── embedding-service.ts
│   ├── types/
│   │   └── index.ts
│   └── utils/
│       ├── logger.ts
│       └── config.ts
├── templates/
│   ├── typescript/nextjs/auth/nextauth-credentials/
│   ├── typescript/nextjs/auth/nextauth-google/
│   ├── typescript/nextjs/auth/supabase-auth/
│   ├── typescript/nextjs/payment/stripe-checkout/
│   ├── typescript/nextjs/payment/stripe-subscription/
│   ├── typescript/nextjs/email/resend/
│   ├── typescript/nextjs/database/prisma-setup/
│   ├── typescript/nextjs/database/drizzle-setup/
│   ├── typescript/nextjs/storage/s3-upload/
│   └── typescript/nextjs/api/trpc-setup/
├── scripts/
│   ├── generate-embeddings.ts
│   └── validate-templates.ts
├── tests/
│   ├── services/
│   └── integration/
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── vitest.config.ts
├── .env.example
├── .gitignore
├── .npmignore
├── README.md
├── CONTRIBUTING.md
└── LICENSE
```

-----

## Notes for Claude Code

1. **순서 준수**: Task 번호 순서대로 진행
1. **테스트 우선**: 각 Task 완료 후 관련 테스트 실행
1. **커밋 단위**: 각 Task를 하나의 커밋으로
1. **질문**: 불명확한 부분은 구현 전 확인 요청
1. **PRD 참조**: 세부 스펙은 PRD.md 참조

시작 명령어:

```bash
# 프로젝트 시작
mkdir vibe-templates-mcp && cd vibe-templates-mcp
# Task 0.1부터 순차 진행
```
