# Product Requirements Document (PRD)

# Vibe Templates MCP Server

## 1. Overview

### 1.1 Product Name

**vibe-templates-mcp** - Reusable Code Templates MCP Server for AI Coding Agents

### 1.2 Vision

AI 코딩 에이전트(Cursor, Claude Code, Windsurf 등)가 반복적으로 작성하는 공통 컴포넌트(인증, 결제, 알림 등)를 고품질 템플릿으로 제공하여 개발 시간 단축, 토큰 사용량 감소, 버그 최소화를 달성한다.

### 1.3 Problem Statement

- AI 코딩 에이전트 사용 시 매번 비슷한 boilerplate 코드를 처음부터 생성
- LLM이 outdated API나 잘못된 패턴을 생성하는 hallucination 문제
- 토큰 낭비 및 반복적인 디버깅 시간 소요
- 프로젝트마다 일관성 없는 코드 품질

### 1.4 Solution

MCP(Model Context Protocol) 서버를 통해 프로덕션 레디 코드 템플릿을 AI 에이전트에게 직접 제공. 시맨틱 검색으로 의도에 맞는 템플릿을 찾고, 실제 코드와 사용 가이드를 함께 전달.

### 1.5 Target Users

- Vibe Coders (AI 에이전트로 코딩하는 개발자)
- Indie Hackers / Solo Founders
- 스타트업 개발팀
- 빠른 MVP 개발이 필요한 팀

-----

## 2. Technical Architecture

### 2.1 Tech Stack

```
Runtime: Node.js 20+ (TypeScript)
MCP SDK: @modelcontextprotocol/sdk
Vector DB: Supabase pgvector (또는 로컬 개발용 in-memory)
Embedding: OpenAI text-embedding-3-small
Package Manager: pnpm
Build: tsup
Testing: vitest
```

### 2.2 Project Structure

```
vibe-templates-mcp/
├── src/
│   ├── index.ts              # MCP Server entry point
│   ├── server.ts             # MCP Server configuration
│   ├── tools/                # MCP Tools
│   │   ├── search-template.ts
│   │   ├── get-template.ts
│   │   ├── list-templates.ts
│   │   └── validate-deps.ts
│   ├── resources/            # MCP Resources handlers
│   │   └── template-resource.ts
│   ├── prompts/              # MCP Prompts
│   │   ├── implement-auth.ts
│   │   ├── setup-payment.ts
│   │   └── add-notification.ts
│   ├── services/             # Business logic
│   │   ├── template-service.ts
│   │   ├── search-service.ts
│   │   └── embedding-service.ts
│   ├── types/                # TypeScript types
│   │   └── index.ts
│   └── utils/                # Utilities
│       ├── logger.ts
│       └── config.ts
├── templates/                # Code templates (organized by category)
│   ├── typescript/
│   │   └── nextjs/
│   │       ├── auth/
│   │       │   ├── nextauth-credentials/
│   │       │   │   ├── template.ts
│   │       │   │   ├── metadata.json
│   │       │   │   └── README.md
│   │       │   ├── nextauth-google/
│   │       │   ├── supabase-auth/
│   │       │   └── clerk-auth/
│   │       ├── payment/
│   │       │   ├── stripe-checkout/
│   │       │   ├── stripe-subscription/
│   │       │   └── lemonsqueezy/
│   │       ├── email/
│   │       │   ├── resend/
│   │       │   └── nodemailer/
│   │       ├── database/
│   │       │   ├── prisma-setup/
│   │       │   └── drizzle-setup/
│   │       └── storage/
│   │           ├── s3-upload/
│   │           └── cloudflare-r2/
│   └── python/
│       └── fastapi/
│           └── auth/
├── scripts/                  # Build & utility scripts
│   ├── generate-embeddings.ts
│   └── validate-templates.ts
├── tests/                    # Test files
│   ├── tools/
│   ├── services/
│   └── integration/
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

### 2.3 MCP Protocol Implementation

#### 2.3.1 Resources

템플릿 코드를 URI 기반으로 제공:

```
template://typescript/nextjs/auth/nextauth-google
template://typescript/nextjs/payment/stripe-subscription
template://python/fastapi/auth/jwt
```

#### 2.3.2 Tools

|Tool Name              |Description         |Input                                  |
|-----------------------|--------------------|---------------------------------------|
|`search_templates`     |의도 기반 시맨틱 검색        |query, language?, framework?, category?|
|`get_template`         |특정 템플릿 코드 및 메타데이터 반환|templateId, options?                   |
|`list_templates`       |카테고리별 템플릿 목록        |category?, language?, framework?       |
|`validate_dependencies`|템플릿 의존성 호환성 체크      |templateId, currentDeps                |

#### 2.3.3 Prompts

|Prompt Name       |Description  |Arguments         |
|------------------|-------------|------------------|
|`implement_auth`  |인증 구현 가이드    |provider, features|
|`setup_payment`   |결제 시스템 설정 가이드|provider, type    |
|`add_notification`|알림 시스템 추가 가이드|channel, provider |

-----

## 3. Template Specification

### 3.1 Template Metadata Schema

```typescript
interface TemplateMetadata {
  id: string;                    // "typescript/nextjs/auth/nextauth-google"
  name: string;                  // "NextAuth.js Google OAuth"
  description: string;           // 상세 설명
  version: string;               // "1.0.0"
  category: TemplateCategory;    // "auth" | "payment" | "email" | ...
  language: "typescript" | "python";
  framework: string;             // "nextjs" | "fastapi" | ...
  
  // Dependencies
  dependencies: Record<string, string>;  // { "next-auth": "^5.0.0" }
  peerDependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  
  // Environment variables required
  envVariables: EnvVariable[];
  
  // Files included in this template
  files: TemplateFile[];
  
  // Tags for search
  tags: string[];
  
  // Usage instructions
  usage: {
    installation: string;
    configuration: string;
    example: string;
  };
  
  // Related templates
  relatedTemplates?: string[];
  
  // Metadata
  author: string;
  createdAt: string;
  updatedAt: string;
}

interface EnvVariable {
  name: string;
  description: string;
  required: boolean;
  example?: string;
}

interface TemplateFile {
  path: string;           // "src/auth/[...nextauth]/route.ts"
  description: string;
  isRequired: boolean;
}

type TemplateCategory = 
  | "auth"
  | "payment" 
  | "email"
  | "notification"
  | "database"
  | "storage"
  | "api"
  | "ui"
  | "testing"
  | "deployment";
```

### 3.2 Template Directory Structure

각 템플릿 디렉토리:

```
templates/typescript/nextjs/auth/nextauth-google/
├── metadata.json        # TemplateMetadata
├── template.ts          # Main template code (single file)
├── files/               # Multi-file templates
│   ├── route.ts
│   ├── providers.ts
│   └── types.ts
├── README.md            # Detailed documentation
└── example/             # Usage example (optional)
    └── page.tsx
```

-----

## 4. Core Features (MVP)

### 4.1 Phase 1 - MVP Features

#### F1: Template Search

- **Priority**: P0
- **Description**: 자연어 쿼리로 적합한 템플릿 검색
- **Input**: “I need Google OAuth for my Next.js app”
- **Output**: 관련 템플릿 목록 (relevance score 포함)
- **Implementation**: OpenAI embedding + cosine similarity

#### F2: Template Retrieval

- **Priority**: P0
- **Description**: 템플릿 ID로 전체 코드 및 메타데이터 반환
- **Input**: templateId, options (variant, styling 등)
- **Output**: 코드, 의존성, 환경변수, 사용법

#### F3: Template Listing

- **Priority**: P0
- **Description**: 카테고리/프레임워크별 템플릿 브라우징
- **Input**: filters (category, language, framework)
- **Output**: 템플릿 목록 (id, name, description)

#### F4: Guided Prompts

- **Priority**: P1
- **Description**: 특정 기능 구현을 위한 단계별 가이드
- **Implementation**: MCP Prompts로 워크플로우 제공

### 4.2 Initial Templates (MVP)

최소 10개 템플릿으로 시작:

|Category|Template             |Framework|
|--------|---------------------|---------|
|auth    |NextAuth Credentials |Next.js  |
|auth    |NextAuth Google OAuth|Next.js  |
|auth    |Supabase Auth        |Next.js  |
|payment |Stripe Checkout      |Next.js  |
|payment |Stripe Subscription  |Next.js  |
|email   |Resend Transactional |Next.js  |
|database|Prisma Setup         |Next.js  |
|database|Drizzle Setup        |Next.js  |
|storage |S3 Upload            |Next.js  |
|api     |tRPC Setup           |Next.js  |

-----

## 5. API Specification

### 5.1 MCP Tools Schema

#### search_templates

```typescript
{
  name: "search_templates",
  description: "Search for code templates using natural language. Returns relevant templates based on your requirements.",
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Natural language description of what you need. Example: 'user authentication with Google OAuth'"
      },
      language: {
        type: "string",
        enum: ["typescript", "python"],
        description: "Programming language filter"
      },
      framework: {
        type: "string",
        description: "Framework filter (e.g., 'nextjs', 'fastapi')"
      },
      category: {
        type: "string",
        enum: ["auth", "payment", "email", "notification", "database", "storage", "api", "ui", "testing", "deployment"],
        description: "Category filter"
      },
      limit: {
        type: "number",
        default: 5,
        description: "Maximum number of results"
      }
    },
    required: ["query"]
  }
}
```

#### get_template

```typescript
{
  name: "get_template",
  description: "Get complete template code, dependencies, and usage instructions for a specific template.",
  inputSchema: {
    type: "object",
    properties: {
      templateId: {
        type: "string",
        description: "Template ID (e.g., 'typescript/nextjs/auth/nextauth-google')"
      },
      includeExample: {
        type: "boolean",
        default: true,
        description: "Include usage example code"
      },
      format: {
        type: "string",
        enum: ["full", "code-only", "metadata-only"],
        default: "full",
        description: "Response format"
      }
    },
    required: ["templateId"]
  }
}
```

#### list_templates

```typescript
{
  name: "list_templates",
  description: "List available templates with optional filtering.",
  inputSchema: {
    type: "object",
    properties: {
      category: {
        type: "string",
        description: "Filter by category"
      },
      language: {
        type: "string",
        description: "Filter by language"
      },
      framework: {
        type: "string",
        description: "Filter by framework"
      }
    }
  }
}
```

### 5.2 MCP Resources URI Pattern

```
template://{language}/{framework}/{category}/{template-name}

Examples:
- template://typescript/nextjs/auth/nextauth-google
- template://typescript/nextjs/payment/stripe-subscription
- template://python/fastapi/auth/jwt-auth
```

### 5.3 MCP Prompts Schema

#### implement_auth

```typescript
{
  name: "implement_auth",
  description: "Step-by-step guide to implement authentication in your project",
  arguments: [
    {
      name: "provider",
      description: "Authentication provider (google, github, credentials, magic-link)",
      required: true
    },
    {
      name: "framework",
      description: "Your framework (nextjs, fastapi)",
      required: true
    },
    {
      name: "features",
      description: "Additional features needed (2fa, session-management, role-based-access)",
      required: false
    }
  ]
}
```

-----

## 6. Configuration

### 6.1 Environment Variables

```env
# Required
OPENAI_API_KEY=sk-...          # For embeddings

# Optional (for hosted vector search)
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...

# Server Config
LOG_LEVEL=info                  # debug | info | warn | error
TEMPLATES_DIR=./templates       # Templates directory path
CACHE_TTL=3600                  # Cache TTL in seconds
```

### 6.2 MCP Client Configuration

#### Cursor (~/.cursor/mcp.json)

```json
{
  "mcpServers": {
    "vibe-templates": {
      "command": "npx",
      "args": ["-y", "vibe-templates-mcp"],
      "env": {
        "OPENAI_API_KEY": "sk-..."
      }
    }
  }
}
```

#### Claude Code

```bash
claude mcp add vibe-templates -- npx -y vibe-templates-mcp
```

#### VS Code (settings.json)

```json
{
  "mcp.servers": {
    "vibe-templates": {
      "command": "npx",
      "args": ["-y", "vibe-templates-mcp"]
    }
  }
}
```

-----

## 7. Success Metrics

### 7.1 MVP Success Criteria

- [ ] MCP Server가 Cursor, Claude Code에서 정상 동작
- [ ] 10개 이상의 템플릿 제공
- [ ] 검색 쿼리에 대해 관련 템플릿 반환 (precision > 80%)
- [ ] 템플릿 코드가 즉시 사용 가능 (no syntax errors)
- [ ] README 및 사용 가이드 완성

### 7.2 Key Metrics (Post-Launch)

- Template usage count per template
- Search query to template match rate
- User feedback / star rating
- GitHub stars / npm downloads

-----

## 8. Future Roadmap

### Phase 2 (v1.1)

- [ ] Python/FastAPI 템플릿 추가
- [ ] 템플릿 버전 관리
- [ ] 의존성 충돌 검사 도구
- [ ] 커뮤니티 템플릿 기여 시스템

### Phase 3 (v2.0)

- [ ] Hosted MCP Server (Remote)
- [ ] Pro 템플릿 (유료)
- [ ] 팀 프라이빗 템플릿
- [ ] Analytics Dashboard

-----

## 9. References

- [MCP Specification](https://modelcontextprotocol.io/specification)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Context7 (Similar Product)](https://github.com/upstash/context7)
- [Cursor Rules Documentation](https://docs.cursor.com/context/rules-for-ai)
