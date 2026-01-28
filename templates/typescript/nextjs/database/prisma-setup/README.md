# Prisma ORM Setup for Next.js

A production-ready Prisma ORM setup for Next.js applications with PostgreSQL support.

## Features

- Prisma Client singleton pattern for Next.js (prevents multiple instances in development)
- Pre-configured schema with User, Account, and Session models (NextAuth.js compatible)
- PostgreSQL as the default database provider
- Development query logging enabled

## Installation

```bash
# Install dependencies
pnpm add @prisma/client
pnpm add -D prisma

# Initialize Prisma (if starting fresh)
npx prisma init
```

## Configuration

### 1. Environment Variables

Add to your `.env` file:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/mydb?schema=public"
```

### 2. Generate Prisma Client

```bash
npx prisma generate
```

### 3. Push Schema to Database

For development:
```bash
npx prisma db push
```

For production (with migrations):
```bash
npx prisma migrate dev --name init
```

## Usage

### Import the Prisma Client

```typescript
import { prisma } from '@/lib/prisma';

// Example: Fetch all users
const users = await prisma.user.findMany();

// Example: Create a user
const newUser = await prisma.user.create({
  data: {
    email: 'user@example.com',
    name: 'John Doe',
  },
});

// Example: Find user by email
const user = await prisma.user.findUnique({
  where: { email: 'user@example.com' },
});
```

### In API Routes (App Router)

```typescript
// app/api/users/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const users = await prisma.user.findMany();
  return NextResponse.json(users);
}

export async function POST(request: Request) {
  const body = await request.json();
  const user = await prisma.user.create({
    data: body,
  });
  return NextResponse.json(user, { status: 201 });
}
```

### In Server Components

```typescript
// app/users/page.tsx
import { prisma } from '@/lib/prisma';

export default async function UsersPage() {
  const users = await prisma.user.findMany();

  return (
    <ul>
      {users.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

## Common Commands

```bash
# Generate Prisma Client after schema changes
npx prisma generate

# Push schema changes to database (development)
npx prisma db push

# Create a migration
npx prisma migrate dev --name <migration-name>

# Apply migrations in production
npx prisma migrate deploy

# Open Prisma Studio (database GUI)
npx prisma studio

# Reset database (development only)
npx prisma migrate reset

# Format schema file
npx prisma format

# Validate schema
npx prisma validate

# Pull schema from existing database
npx prisma db pull
```

## Switching Database Providers

### MySQL

```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
```

```env
DATABASE_URL="mysql://user:password@localhost:3306/mydb"
```

### SQLite

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

```env
DATABASE_URL="file:./dev.db"
```

## Schema Customization

### Adding New Models

```prisma
model Post {
  id        String   @id @default(cuid())
  title     String
  content   String?
  published Boolean  @default(false)
  authorId  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  author User @relation(fields: [authorId], references: [id], onDelete: Cascade)
}

// Don't forget to add the relation to User model
model User {
  // ... existing fields
  posts Post[]
}
```

### Adding Indexes

```prisma
model User {
  // ... fields

  @@index([email])
  @@index([createdAt])
}
```

## File Structure

```
your-project/
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── migrations/      # Migration files (after running migrate)
├── src/
│   └── lib/
│       └── prisma.ts    # Prisma client singleton
└── .env                 # Environment variables
```

## Troubleshooting

### "PrismaClient is not defined"

Run `npx prisma generate` to generate the client.

### Multiple Prisma Client Instances Warning

This template uses the singleton pattern to prevent this. Make sure you're importing from `@/lib/prisma`.

### Connection Issues

1. Check your `DATABASE_URL` is correct
2. Ensure your database server is running
3. Check firewall/network settings

## Related Templates

- `typescript/nextjs/auth/nextauth-credentials` - Authentication with credentials
- `typescript/nextjs/database/drizzle-setup` - Alternative ORM setup

## Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma with Next.js](https://www.prisma.io/nextjs)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
