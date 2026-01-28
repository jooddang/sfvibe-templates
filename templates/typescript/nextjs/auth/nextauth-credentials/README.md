# NextAuth.js Credentials Authentication

Email/password authentication for Next.js using NextAuth.js v5.

## Prerequisites

- Next.js 14+ with App Router
- Prisma ORM configured
- Database with User model

## Installation

```bash
pnpm add next-auth@beta @auth/prisma-adapter bcryptjs
pnpm add -D @types/bcryptjs
```

## Setup

1. Add to `.env`:
```env
AUTH_SECRET=your-secret-key
AUTH_URL=http://localhost:3000
```

2. Add User model to Prisma schema:
```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  password      String?
  name          String?
  emailVerified DateTime?
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}
```

3. Copy template files to your project.

## Usage

```typescript
// Get session
import { auth } from '@/auth';
const session = await auth();

// Sign in
import { signInAction } from '@/lib/auth-actions';
<form action={signInAction}>...</form>

// Sign out
import { signOutAction } from '@/lib/auth-actions';
<form action={signOutAction}>...</form>
```
