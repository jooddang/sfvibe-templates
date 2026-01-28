# vibe-templates-mcp

Reusable code templates MCP server for AI coding agents.

[![npm version](https://badge.fury.io/js/vibe-templates-mcp.svg)](https://www.npmjs.com/package/vibe-templates-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

**vibe-templates-mcp** provides production-ready code templates to AI coding agents (Cursor, Claude Code, Windsurf, etc.) via the Model Context Protocol (MCP). Stop generating boilerplate from scratch - get high-quality, tested templates instantly.

## Why vibe-templates? (vs Documentation Fetchers)

| Aspect | vibe-templates | Documentation Fetchers (e.g., Context7) |
|--------|----------------|----------------------------------------|
| **Token Usage** | ~500-1,500 tokens per template | ~3,000-15,000+ tokens per doc page |
| **Response Type** | Curated, production-ready code | Raw documentation (needs interpretation) |
| **Latency** | Instant (local templates) | Variable (API + parsing) |
| **Accuracy** | 100% tested, working code | May need adaptation |
| **Offline** | Works offline | Requires internet |
| **Cost** | No API calls for templates | API costs per request |

### Token Efficiency Example

**Task: "Add Google OAuth to my Next.js app"**

```
Documentation Fetcher approach:
├─ Search query → 200 tokens
├─ Doc page fetch → 8,000+ tokens (NextAuth docs)
├─ LLM interpretation → 2,000 tokens
├─ Code generation → 1,500 tokens
└─ Total: ~12,000+ tokens

vibe-templates approach:
├─ Search query → 200 tokens
├─ Template fetch → 800 tokens (exact code needed)
├─ Copy & configure → 0 tokens
└─ Total: ~1,000 tokens

Savings: ~90% fewer tokens = faster & cheaper
```

### Features

- **10x Token Efficient**: Pre-curated templates vs raw documentation
- **Semantic Search**: Find templates using natural language queries
- **10+ Templates**: Auth, payment, email, database, storage, and more
- **Production Ready**: All templates are tested and ready to use
- **Zero Hallucination**: Exact code, not LLM-generated approximations
- **Framework Support**: Next.js, with more frameworks coming soon
- **MCP Native**: Works with any MCP-compatible AI coding tool

## Installation

### Cursor

Add to `~/.cursor/mcp.json`:

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

### Claude Code

```bash
claude mcp add vibe-templates -- npx -y vibe-templates-mcp
```

### VS Code (Copilot)

Add to your settings.json:

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

## Available Templates

| Category | Template | Description |
|----------|----------|-------------|
| Auth | NextAuth Credentials | Email/password auth with NextAuth.js v5 |
| Auth | NextAuth Google | Google OAuth with NextAuth.js v5 |
| Auth | Supabase Auth | Supabase Auth with @supabase/ssr |
| Payment | Stripe Checkout | One-time payments with Stripe |
| Payment | Stripe Subscription | Subscription billing with Stripe |
| Email | Resend | Transactional emails with Resend |
| Database | Prisma Setup | Prisma ORM configuration |
| Database | Drizzle Setup | Drizzle ORM configuration |
| Storage | S3 Upload | AWS S3 file uploads |
| API | tRPC Setup | Type-safe API with tRPC |

## MCP Tools

### search_templates

Search for templates using natural language:

```
Input: "I need Google authentication for my Next.js app"
Output: List of relevant templates with scores
```

### get_template

Get complete template code and setup instructions:

```
Input: templateId = "typescript/nextjs/auth/nextauth-google"
Output: Code files, dependencies, env vars, usage guide
```

### list_templates

Browse available templates:

```
Input: category = "auth" (optional)
Output: List of templates in the category
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| OPENAI_API_KEY | No* | For semantic search (falls back to keyword search) |
| TEMPLATES_DIR | No | Custom templates directory |
| LOG_LEVEL | No | debug, info, warn, error (default: info) |

*Semantic search provides better results but requires an OpenAI API key. Without it, keyword search is used.

## Development

### Setup

```bash
# Clone the repository
git clone https://github.com/your-username/vibe-templates-mcp.git
cd vibe-templates-mcp

# Install dependencies
pnpm install

# Build
pnpm build

# Run tests
pnpm test
```

### Scripts

```bash
pnpm dev          # Watch mode
pnpm build        # Production build
pnpm test         # Run tests
pnpm typecheck    # Type checking
pnpm lint         # Linting
```

### Testing with MCP Inspector

```bash
npx @anthropic-ai/mcp-inspector dist/index.js
```

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Adding a Template

1. Create a directory under `templates/{language}/{framework}/{category}/{template-name}/`
2. Add `metadata.json` with template metadata
3. Add code files under `files/`
4. Add `README.md` with documentation
5. Run `pnpm validate-templates` to check
6. Submit a PR

## License

MIT - see [LICENSE](LICENSE) for details.

## Links

- [MCP Specification](https://modelcontextprotocol.io/)
- [Report Issues](https://github.com/your-username/vibe-templates-mcp/issues)
