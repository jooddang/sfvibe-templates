# tRPC Setup

Type-safe API with tRPC for Next.js App Router. End-to-end type safety from server to client.

## Features

- Full type safety from server to client
- Automatic type inference for API calls
- React Query integration for data fetching
- SuperJSON for rich data serialization (dates, Maps, Sets, etc.)
- Authentication middleware support
- HTTP batching for optimized requests

## Installation

```bash
pnpm add @trpc/server @trpc/client @trpc/react-query @tanstack/react-query superjson
```

## Setup

### 1. Server Configuration

Copy `trpc.ts` to `src/server/trpc.ts`:

```typescript
import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import { auth } from '@/auth';

export const createTRPCContext = async () => {
  const session = await auth();
  return { session };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({ ctx: { ...ctx, session: ctx.session } });
});
```

### 2. Create Root Router

Copy `app-router.ts` to `src/server/routers/_app.ts`:

```typescript
import { router } from '../trpc';
import { userRouter } from './user';

export const appRouter = router({
  user: userRouter,
});

export type AppRouter = typeof appRouter;
```

### 3. Create Example Router

Copy `user-router.ts` to `src/server/routers/user.ts`:

```typescript
import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { prisma } from '@/lib/prisma';

export const userRouter = router({
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return prisma.user.findUnique({
        where: { id: input.id },
        select: { id: true, name: true, email: true, image: true },
      });
    }),

  getMe: protectedProcedure.query(async ({ ctx }) => {
    return prisma.user.findUnique({
      where: { id: ctx.session.user.id },
    });
  }),

  updateProfile: protectedProcedure
    .input(z.object({ name: z.string().min(2).optional() }))
    .mutation(async ({ ctx, input }) => {
      return prisma.user.update({
        where: { id: ctx.session.user.id },
        data: input,
      });
    }),
});
```

### 4. Add API Route Handler

Copy `trpc-route.ts` to `src/app/api/trpc/[trpc]/route.ts`:

```typescript
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@/server/routers/_app';
import { createTRPCContext } from '@/server/trpc';

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: createTRPCContext,
  });

export { handler as GET, handler as POST };
```

### 5. Create Client

Copy `trpc-client.ts` to `src/lib/trpc.ts`:

```typescript
'use client';

import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@/server/routers/_app';

export const trpc = createTRPCReact<AppRouter>();
```

### 6. Add Provider

Copy `trpc-provider.tsx` to `src/providers/trpc-provider.tsx`:

```typescript
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { useState } from 'react';
import superjson from 'superjson';
import { trpc } from '@/lib/trpc';

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: '/api/trpc',
          transformer: superjson,
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
```

### 7. Wrap Your App

Update `src/app/layout.tsx`:

```typescript
import { TRPCProvider } from '@/providers/trpc-provider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <TRPCProvider>{children}</TRPCProvider>
      </body>
    </html>
  );
}
```

## Usage

### Queries

```typescript
'use client';

import { trpc } from '@/lib/trpc';

export function UserProfile({ userId }: { userId: string }) {
  const { data, isLoading, error } = trpc.user.getById.useQuery({ id: userId });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>{data?.name}</h1>
      <p>{data?.email}</p>
    </div>
  );
}
```

### Mutations

```typescript
'use client';

import { trpc } from '@/lib/trpc';

export function UpdateProfileForm() {
  const utils = trpc.useUtils();
  const mutation = trpc.user.updateProfile.useMutation({
    onSuccess: () => {
      utils.user.getMe.invalidate();
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    mutation.mutate({ name: formData.get('name') as string });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" placeholder="Your name" />
      <button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? 'Updating...' : 'Update'}
      </button>
    </form>
  );
}
```

### Prefetching (Server Components)

```typescript
import { createCaller } from '@/server/routers/_app';
import { createTRPCContext } from '@/server/trpc';

export default async function UserPage({ params }: { params: { id: string } }) {
  const ctx = await createTRPCContext();
  const caller = createCaller(ctx);
  const user = await caller.user.getById({ id: params.id });

  return <UserProfile initialData={user} userId={params.id} />;
}
```

## Creating New Routers

1. Create a new router file in `src/server/routers/`:

```typescript
// src/server/routers/post.ts
import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc';

export const postRouter = router({
  list: publicProcedure.query(async () => {
    // Return posts
  }),

  create: protectedProcedure
    .input(z.object({ title: z.string(), content: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Create post
    }),
});
```

2. Add to the app router:

```typescript
// src/server/routers/_app.ts
import { router } from '../trpc';
import { userRouter } from './user';
import { postRouter } from './post';

export const appRouter = router({
  user: userRouter,
  post: postRouter,
});
```

## Error Handling

tRPC provides built-in error codes:

```typescript
import { TRPCError } from '@trpc/server';

throw new TRPCError({
  code: 'NOT_FOUND',
  message: 'User not found',
});
```

Available error codes:
- `UNAUTHORIZED` - 401
- `FORBIDDEN` - 403
- `NOT_FOUND` - 404
- `BAD_REQUEST` - 400
- `INTERNAL_SERVER_ERROR` - 500
- `CONFLICT` - 409
- `PRECONDITION_FAILED` - 412
- `PAYLOAD_TOO_LARGE` - 413
- `METHOD_NOT_SUPPORTED` - 405
- `TIMEOUT` - 408
- `TOO_MANY_REQUESTS` - 429

## File Structure

```
src/
├── app/
│   └── api/
│       └── trpc/
│           └── [trpc]/
│               └── route.ts      # HTTP handler
├── lib/
│   └── trpc.ts                   # Client hooks
├── providers/
│   └── trpc-provider.tsx         # React Query provider
└── server/
    ├── trpc.ts                   # tRPC initialization
    └── routers/
        ├── _app.ts               # Root router
        └── user.ts               # User procedures
```

## Dependencies

- `@trpc/server` - Server-side tRPC
- `@trpc/client` - Client-side tRPC
- `@trpc/react-query` - React Query integration
- `@tanstack/react-query` - Data fetching and caching
- `superjson` - Rich data serialization

## Related Templates

- NextAuth.js Setup - For authentication integration
- Prisma Setup - For database access in procedures
