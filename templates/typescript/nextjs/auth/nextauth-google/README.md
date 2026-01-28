# NextAuth.js Google OAuth

Google OAuth authentication for Next.js using NextAuth.js v5.

## Prerequisites

- Next.js 14+ with App Router
- Google Cloud Console project with OAuth credentials

## Installation

```bash
pnpm add next-auth@beta @auth/prisma-adapter
```

## Setup

1. Create OAuth credentials at [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   - Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`

2. Add to `.env`:
```env
AUTH_SECRET=your-secret-key
AUTH_GOOGLE_ID=your-client-id.apps.googleusercontent.com
AUTH_GOOGLE_SECRET=your-client-secret
```

3. Copy template files to your project.

## Usage

```typescript
// Server Component
import { auth } from '@/auth';

export default async function Page() {
  const session = await auth();
  if (!session) redirect('/login');
  return <div>Welcome {session.user.name}</div>;
}

// Client Component
import { SignInButton, SignOutButton } from '@/components/auth-buttons';
```
