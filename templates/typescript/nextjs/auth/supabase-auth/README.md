# Supabase Authentication for Next.js App Router

This template provides a complete Supabase authentication setup for Next.js 14+ App Router using `@supabase/ssr`.

## Features

- Browser client for client components
- Server client for server components and server actions
- Middleware for session management and route protection
- OAuth callback handler for social logins
- Support for email/password, OAuth providers, and magic links

## Installation

```bash
pnpm add @supabase/supabase-js @supabase/ssr
```

## Environment Variables

Add these to your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

## Setup

### 1. Copy the client files

Copy the following files to your project:

- `client.ts` -> `src/lib/supabase/client.ts`
- `server.ts` -> `src/lib/supabase/server.ts`
- `middleware-client.ts` -> `src/lib/supabase/middleware.ts`
- `middleware.ts` -> `src/middleware.ts`
- `callback-route.ts` -> `src/app/auth/callback/route.ts`

### 2. Configure Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to Authentication > URL Configuration
3. Add your site URL to "Site URL"
4. Add redirect URLs for OAuth (e.g., `http://localhost:3000/auth/callback`)

## Usage

### Server Components

```typescript
import { createClient } from '@/lib/supabase/server';

export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return <div>Hello {user?.email}</div>;
}
```

### Client Components

```typescript
'use client';

import { createClient } from '@/lib/supabase/client';

export function LoginButton() {
  const supabase = createClient();

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return <button onClick={handleLogin}>Sign in with Google</button>;
}
```

### Server Actions

```typescript
'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function signIn(formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  });

  if (error) {
    return { error: error.message };
  }

  redirect('/dashboard');
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
```

### Magic Link Authentication

```typescript
const { error } = await supabase.auth.signInWithOtp({
  email: 'user@example.com',
  options: {
    emailRedirectTo: `${window.location.origin}/auth/callback`,
  },
});
```

## Route Protection

The middleware automatically protects all routes except:

- `/login`
- `/auth/*` (callback routes)
- Static files and images

To customize protected routes, modify the condition in `middleware-client.ts`:

```typescript
// Example: Only protect /dashboard routes
if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
  // redirect to login
}
```

## Supported Auth Methods

- Email/Password
- Magic Link (passwordless email)
- OAuth Providers:
  - Google
  - GitHub
  - Discord
  - And more (configure in Supabase dashboard)

## Related Templates

- `typescript/nextjs/database/prisma-setup` - Database setup with Prisma
