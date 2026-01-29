# Contributing to sfvibe-templates

We welcome contributions from the community! Help us build the best collection of production-ready templates for AI coding agents.

## Contributor Levels

We have a leveling system to recognize and reward contributors. As you contribute more, you level up and gain additional privileges.

| Level | Title | Requirements | Privileges |
|-------|-------|--------------|------------|
| 1 | **Newcomer** | First PR merged | Name in Contributors list |
| 2 | **Contributor** | 3+ templates merged | "Contributor" badge, priority review |
| 3 | **Regular** | 10+ templates merged | Can review PRs, suggest improvements |
| 4 | **Expert** | 25+ templates, high quality | "Expert" badge, template category ownership |
| 5 | **Maintainer** | Invited by owner | Can merge PRs, manage issues |

### How Levels Work

- **Quality matters**: Well-documented, tested templates count more
- **Variety bonus**: Templates across different categories earn extra credit
- **Community help**: Helping others in issues/discussions contributes too
- **Reviews count**: Quality PR reviews help you level up

### Badges

Contributors at Level 2+ get badges displayed in the README:
- Level 2: `Contributor`
- Level 3: `Regular Contributor`
- Level 4: `Expert Contributor`
- Level 5: `Maintainer`

## Adding a Template

### Step 1: Choose a Template

Pick something useful! Good templates are:
- Commonly needed (auth, payments, email, etc.)
- Hard to set up from scratch
- Framework-specific best practices

Check [existing templates](./templates) to avoid duplicates.

### Step 2: Create Template Structure

```
templates/{language}/{framework}/{category}/{template-name}/
├── metadata.json     # Template metadata (required)
├── files/            # Template code files (required)
│   ├── src/
│   │   └── ...
│   └── ...
└── README.md         # Template documentation (optional but recommended)
```

### Step 3: Write metadata.json

```json
{
  "id": "typescript/nextjs/auth/clerk-auth",
  "name": "Clerk Authentication",
  "description": "Complete authentication with Clerk for Next.js App Router. Includes middleware, sign-in/sign-up pages, and user management.",
  "version": "1.0.0",
  "category": "auth",
  "language": "typescript",
  "framework": "nextjs",
  "dependencies": {
    "@clerk/nextjs": "^5.0.0"
  },
  "devDependencies": {},
  "envVariables": [
    {
      "name": "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
      "description": "Clerk publishable key from dashboard",
      "required": true,
      "example": "pk_test_..."
    },
    {
      "name": "CLERK_SECRET_KEY",
      "description": "Clerk secret key from dashboard",
      "required": true,
      "example": "sk_test_..."
    }
  ],
  "files": [
    {
      "path": "src/middleware.ts",
      "description": "Clerk authentication middleware",
      "isRequired": true
    },
    {
      "path": "src/app/sign-in/[[...sign-in]]/page.tsx",
      "description": "Sign-in page",
      "isRequired": true
    }
  ],
  "tags": ["auth", "clerk", "nextjs", "app-router", "middleware"],
  "usage": {
    "installation": "pnpm add @clerk/nextjs",
    "configuration": "1. Create Clerk account\\n2. Copy API keys to .env.local\\n3. Add middleware.ts\\n4. Wrap app with ClerkProvider",
    "example": "import { auth } from '@clerk/nextjs/server'\\nconst { userId } = await auth()"
  },
  "relatedTemplates": ["typescript/nextjs/auth/nextauth-google"],
  "author": "your-github-username",
  "createdAt": "2025-01-29",
  "updatedAt": "2025-01-29"
}
```

### Step 4: Add Template Files

Put actual code files in the `files/` directory:

```
files/
├── src/
│   ├── middleware.ts
│   └── app/
│       ├── sign-in/
│       │   └── [[...sign-in]]/
│       │       └── page.tsx
│       └── sign-up/
│           └── [[...sign-up]]/
│               └── page.tsx
└── .env.example
```

### Step 5: Validate Your Template

```bash
# Clone the repo
git clone https://github.com/jooddang/sfvibe-templates.git
cd sfvibe-templates

# Install dependencies
pnpm install

# Validate all templates (including yours)
pnpm validate-templates
```

### Step 6: Submit PR

1. Fork the repository
2. Create a branch: `git checkout -b add-template-clerk-auth`
3. Add your template
4. Commit: `git commit -m "feat: Add Clerk authentication template"`
5. Push and create PR

## Template Guidelines

### Code Quality

- **Working code**: Templates must work out of the box
- **TypeScript**: Use strict TypeScript with proper types
- **Best practices**: Follow framework conventions
- **No secrets**: Never include real API keys or secrets

### Documentation

- **Clear description**: Explain what the template does
- **Environment variables**: Document all required env vars with examples
- **Usage instructions**: Step-by-step setup guide
- **Tags**: Add relevant tags for search

### Categories

| Category | Description |
|----------|-------------|
| `auth` | Authentication & authorization |
| `payment` | Payment processing |
| `email` | Email sending |
| `database` | Database setup & ORM |
| `storage` | File storage |
| `api` | API setup (REST, GraphQL, tRPC) |
| `ui` | UI components & styling |
| `testing` | Testing setup |
| `deployment` | Deployment configurations |
| `notification` | Push notifications, SMS |

### Supported Frameworks

Currently supported:
- **Next.js** (App Router) - TypeScript

Coming soon:
- React (Vite)
- FastAPI (Python)
- Express.js

## Other Ways to Contribute

### Report Issues

Found a bug or have a suggestion?
- [Open an issue](https://github.com/jooddang/sfvibe-templates/issues)

### Improve Existing Templates

- Fix bugs in templates
- Update dependencies
- Improve documentation
- Add missing env variable examples

### Review PRs

Help review other contributors' PRs:
- Test the template works
- Check code quality
- Verify documentation

## Code of Conduct

- Be respectful and inclusive
- Give constructive feedback
- Help newcomers get started
- Credit others' work appropriately

## Questions?

- Open a [Discussion](https://github.com/jooddang/sfvibe-templates/discussions)
- Check existing issues first

---

Thank you for contributing! Every template helps developers build faster.
