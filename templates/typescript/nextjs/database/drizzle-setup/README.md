# Drizzle ORM Setup for Next.js

Type-safe SQL queries with Drizzle ORM and PostgreSQL (Neon) for Next.js applications.

## Features

- **Type-safe queries**: Full TypeScript support with inferred types
- **Serverless-ready**: Optimized for Neon PostgreSQL serverless
- **Relations**: Declarative relation definitions
- **Migrations**: Built-in migration support with Drizzle Kit
- **Schema-first**: Define your schema in TypeScript

## Installation

```bash
pnpm add drizzle-orm @neondatabase/serverless
pnpm add -D drizzle-kit
```

## Setup

### 1. Environment Variables

Add your database connection string to `.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/mydb"
```

For Neon PostgreSQL:
```env
DATABASE_URL="postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require"
```

### 2. Copy Template Files

Copy the template files to your project:

- `files/index.ts` -> `src/db/index.ts`
- `files/schema.ts` -> `src/db/schema.ts`
- `files/drizzle.config.ts` -> `drizzle.config.ts` (project root)

### 3. Push Schema to Database

```bash
npx drizzle-kit push
```

Or generate and run migrations:

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

## Usage

### Basic Queries

```typescript
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

// Select all users
const allUsers = await db.select().from(users);

// Select with condition
const user = await db.select().from(users).where(eq(users.email, 'test@example.com'));

// Insert
const newUser = await db.insert(users).values({
  email: 'new@example.com',
  name: 'New User',
}).returning();

// Update
await db.update(users)
  .set({ name: 'Updated Name' })
  .where(eq(users.id, 'user-id'));

// Delete
await db.delete(users).where(eq(users.id, 'user-id'));
```

### With Relations

```typescript
import { db } from '@/db';

// Query with relations (requires schema passed to drizzle)
const usersWithAccounts = await db.query.users.findMany({
  with: {
    accounts: true,
    sessions: true,
  },
});

// Find first with relation
const user = await db.query.users.findFirst({
  where: eq(users.email, 'test@example.com'),
  with: {
    accounts: true,
  },
});
```

### In Server Actions (Next.js)

```typescript
// app/actions/user.ts
'use server';

import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function createUser(formData: FormData) {
  const email = formData.get('email') as string;
  const name = formData.get('name') as string;

  await db.insert(users).values({ email, name });
  revalidatePath('/users');
}

export async function getUsers() {
  return db.select().from(users);
}
```

### In API Routes

```typescript
// app/api/users/route.ts
import { db } from '@/db';
import { users } from '@/db/schema';
import { NextResponse } from 'next/server';

export async function GET() {
  const allUsers = await db.select().from(users);
  return NextResponse.json(allUsers);
}

export async function POST(request: Request) {
  const body = await request.json();
  const newUser = await db.insert(users).values(body).returning();
  return NextResponse.json(newUser[0], { status: 201 });
}
```

## Drizzle Kit Commands

```bash
# Push schema changes directly (development)
npx drizzle-kit push

# Generate migration files
npx drizzle-kit generate

# Run migrations
npx drizzle-kit migrate

# Open Drizzle Studio (database GUI)
npx drizzle-kit studio

# Drop all tables (use with caution!)
npx drizzle-kit drop
```

## Extending the Schema

Add new tables to `src/db/schema.ts`:

```typescript
export const posts = pgTable('posts', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content'),
  published: boolean('published').default(false),
  authorId: text('author_id').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

export const postsRelations = relations(posts, ({ one }) => ({
  author: one(users, { fields: [posts.authorId], references: [users.id] }),
}));

// Update users relations
export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  posts: many(posts), // Add this
}));
```

## Type Inference

```typescript
import { users, type User, type NewUser } from '@/db/schema';

// User type includes all fields (for select)
const user: User = {
  id: '...',
  email: 'test@example.com',
  name: 'Test',
  // ... all other fields
};

// NewUser type for inserts (optional fields are optional)
const newUser: NewUser = {
  email: 'test@example.com', // required
  name: 'Test', // optional
};
```

## Resources

- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Drizzle Kit Documentation](https://orm.drizzle.team/kit-docs/overview)
- [Neon PostgreSQL](https://neon.tech/)
- [Drizzle with Next.js Guide](https://orm.drizzle.team/docs/tutorials/drizzle-nextjs-neon)
