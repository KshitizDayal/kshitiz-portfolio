---
title: "A Next.js folder structure that still makes sense at 200 files"
date: 2026-11-01T21:00:00+05:30
excerpt: Routes in app/, business logic in features/, the API in core/, and imports that only ever point one way. Here's the App Router structure I use, with the code for every layer so you can copy it.
tags: [Next.js, Architecture, TypeScript]
---

Every Next.js project I've worked on starts tidy. Then a `components/` folder hits 80 files, a page component quietly starts fetching data, and someone imports a button from the middle of another screen's folder. Nothing breaks on the day it happens. It just gets harder to change anything.

This is the structure I use for the StatOz web app, a Next.js App Router project with React, TypeScript and zod. (Building in Flutter? Here's [the Flutter version](/blog/flutter-folder-structure).)

## The idea in one sentence

**Every folder has one job, and imports only ever point one way.**

That's it. The rest of this post is what those jobs are, which way the arrows point, and the code I put in each layer.

## The top level

```text
src/
├── app/        Routing only: pages, layouts, metadata, global CSS
├── features/   Business features: their screens, components, data hooks, adapters
├── lib/        Shared UI used by more than one feature
├── core/       The API layer and the models of what the API sends
├── hooks/      Hooks used across features
├── config/     Static app data: navigation, image paths, options
├── styles/     Design tokens, in TypeScript and CSS
└── utils/      Pure helper functions
```

I set up a path alias so every import starts from `src/`:

```json:tsconfig.json
{
  "compilerOptions": {
    "paths": { "@/*": ["./src/*"] }
  }
}
```

## The full tree

```text
src/
├── app/
│   ├── layout.tsx                 # root layout: fonts, metadata, nav shell
│   ├── page.tsx                   # "/"
│   ├── globals.css
│   └── (shop)/                    # route group: shares a layout, adds no URL segment
│       ├── products/page.tsx
│       ├── products/[id]/page.tsx
│       └── cart/page.tsx
│
├── features/
│   ├── products/
│   │   ├── screens/
│   │   │   ├── products-screen.tsx
│   │   │   └── product-screen.tsx
│   │   ├── components/            # UI only this feature uses
│   │   ├── queries.ts             # data hooks: useProducts, useProduct
│   │   ├── adapters.ts            # API models → view models
│   │   ├── types.ts               # the view models
│   │   └── index.ts               # what other code may import
│   └── cart/
│       └── …same shape
│
├── lib/
│   ├── ui/                        # button, badge, tabs, skeleton, empty and error states
│   ├── layout/                    # app shell: nav bar, top bar
│   ├── screens/                   # full screens shared by many routes (e.g. "coming soon")
│   └── icons/
│
├── core/
│   ├── api/
│   │   ├── client.ts              # fetch, response envelope, errors, validation
│   │   ├── endpoints.ts           # every path, in one place
│   │   ├── api.ts                 # every call, each with its response schema
│   │   ├── resources.ts           # each call paired with a cache key
│   │   └── index.ts               # the public surface
│   ├── models/                    # one zod schema + inferred type per entity
│   └── env.ts
│
├── hooks/use-resource.ts          # shared data hook
├── config/                        # navigation.ts, images.ts
├── styles/                        # tokens.ts, tokens.css
└── utils/                         # format.ts, dates.ts
```

## What each folder is for

I care about the "never holds" column as much as the first one. It's what stops my folders from slowly turning into junk drawers.

| Folder | Holds | Never holds |
| --- | --- | --- |
| `app/` | Routes, layouts, metadata, global CSS. Each `page.tsx` is a few lines | Business logic, data fetching, components |
| `features/<name>/` | One feature's screens, components, data hooks, adapters and view models | Code another feature reaches into |
| `lib/` | Shared UI: primitives, the app shell, shared screens, icons | Non-UI code, or UI only one feature uses |
| `core/api/` | Everything that talks to the backend | UI, or feature-specific shaping of data |
| `core/models/` | What the API sends: a schema per entity, with its type | View models, or anything the UI invents |
| `hooks/` | React hooks shared across features | Hooks only one feature uses |
| `config/` | Static data any layer can read | Logic, or values that come from the API |
| `styles/` | Design tokens as TypeScript values and CSS variables | Components |
| `utils/` | Pure functions: formatters, date helpers | Anything with React, styling or state |

### Inside a feature

I give every feature the same shape, so I always know where to look:

| File | Role |
| --- | --- |
| `screens/` | What a route renders. The only thing `app/` imports |
| `components/` | UI used only by this feature |
| `queries.ts` | Hooks that ask `core/api` for data |
| `adapters.ts` | Pure functions that turn API models into view models |
| `types.ts` | The view models: the exact shapes the components render |
| `index.ts` | The feature's public surface |

When a feature grows, I turn `adapters.ts` into an `adapters/` folder and `types.ts` into `types/`. The roles stay the same.

## The dependency rules

I let each folder import from the folders below it in this list, and never from one above:

```text
app/        →  features/, lib/
features/   →  lib/, hooks/, core/, config/, styles/, utils/
lib/        →  hooks/, core/, config/, styles/, utils/
hooks/      →  core/, utils/
core/       →  config/
config/  styles/  utils/   →  nothing in src/
```

Four rules I hold myself to do most of the work:

1. **Shared code never imports from `features/`.** That covers `lib/`, `core/`, `hooks/`, `config/`, `styles/` and `utils/`.
2. **A feature never imports another feature's internals.** If two features need something, it moves down into `lib/` or `core/`.
3. **Inside `core/`, `api/` depends on `models/`, never the other way round.**
4. **Screens can only reach the backend through `resources`.** The raw fetch function isn't even exported.

## How data reaches a screen

Here's one request, end to end. I keep each step in a separate file with one job:

```text
ProductsScreen
  └─ useProducts()                 features/products/queries.ts
       └─ useResource(resource)    hooks/use-resource.ts      → returns cached data if it's fresh
            └─ resource.load()     core/api/resources.ts      → { key: "products", load }
                 └─ api.products() core/api/api.ts            → path + schema
                      └─ get()     core/api/client.ts         → fetch, check, validate
ProductsScreen
  └─ toProductCard(product)        features/products/adapters.ts → what the UI renders
```

I'll build it from the bottom up.

### 1. Models: what the API sends

I write one file per entity. The schema is the source of truth, and I infer the type from it, so the two can never drift apart:

```ts:src/core/models/product.ts
import { z } from 'zod';

export const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number(),
  stock: z.number(),
  status: z.enum(['active', 'archived']),
});

export type Product = z.infer<typeof ProductSchema>;
```

### 2. A list that survives one bad item

If a single record in a list of 50 is malformed, I don't want the whole screen to fail. So I use this helper: it drops bad items and logs them, and only fails if *every* item is bad, because then it's the schema that's wrong, not the data:

```ts:src/core/models/list-of.ts
import { z } from 'zod';

export function listOf<T extends z.ZodType>(item: T) {
  return z.array(z.unknown()).transform((items, ctx) => {
    const good: z.output<T>[] = [];
    for (const raw of items) {
      const result = item.safeParse(raw);
      if (result.success) good.push(result.data);
      else console.warn('Dropped an invalid item', result.error.issues[0]);
    }
    if (items.length && !good.length) {
      ctx.addIssue({ code: 'custom', message: 'Every item failed validation' });
      return z.NEVER;
    }
    return good;
  });
}
```

### 3. The client: the only place that calls `fetch`

It knows about HTTP, my backend's response envelope and errors. It doesn't know a single path:

```ts:src/core/api/client.ts
import { z } from 'zod';
import { API_BASE_URL } from '../env';

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

// Change this to match how your backend wraps responses.
const Envelope = z.object({
  success: z.boolean(),
  data: z.unknown(),
  message: z.string().optional(),
});

export async function get<T>(path: string, schema: z.ZodType<T>): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`);
  const envelope = Envelope.safeParse(await res.json().catch(() => null));

  if (!envelope.success) throw new ApiError(`Unexpected response from ${path}`, res.status);
  if (!res.ok || !envelope.data.success) {
    throw new ApiError(envelope.data.message ?? `Request to ${path} failed`, res.status);
  }

  const parsed = schema.safeParse(envelope.data.data);
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path.join('.') || 'root';
    throw new ApiError(`Invalid response from ${path} at "${field}"`, res.status);
  }
  return parsed.data;
}
```

I validate every response, so a backend change shows up as one clear error naming the field, not as `undefined` three components deep.

### 4. Endpoints, calls and resources

I split this into three small files, each knowing one thing:

```ts:src/core/api/endpoints.ts
export const ENDPOINTS = {
  products: '/products',
  product: (id: string) => `/products/${id}`,
};
```

```ts:src/core/api/api.ts
import { ProductSchema } from '../models/product';
import { listOf } from '../models/list-of';
import { get } from './client';
import { ENDPOINTS } from './endpoints';

export const api = {
  products: () => get(ENDPOINTS.products, listOf(ProductSchema)),
  product: (id: string) => get(ENDPOINTS.product(id), ProductSchema),
};
```

```ts:src/core/api/resources.ts
import type { Product } from '../models/product';
import { api } from './api';

export type Resource<T> = { key: string; load: () => Promise<T> };

export const resources = {
  products: (): Resource<Product[]> => ({ key: 'products', load: api.products }),
  product: (id: string): Resource<Product> => ({ key: `products/${id}`, load: () => api.product(id) }),
};
```

Then the barrel decides what the rest of the app can see. I leave a few things out on purpose:

```ts:src/core/api/index.ts
export { ApiError } from './client';
export { resources } from './resources';
export type { Resource } from './resources';
// Not exported: get, ENDPOINTS, api. Screens can't bypass the cache.
```

### 5. One shared data hook

Two components asking for the same key share one request, and a value is reused while it's fresh. This is the minimal version I use, built on `useSyncExternalStore`:

```ts:src/hooks/use-resource.ts
'use client';

import { useEffect, useSyncExternalStore } from 'react';
import type { Resource } from '@/core/api';

type Entry = { data?: unknown; error?: unknown; at: number; loading?: Promise<void> };

const FRESH_MS = 30_000;
const store = new Map<string, Entry>();
const listeners = new Set<() => void>();

const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
const emit = () => listeners.forEach(fn => fn());

function load<T>({ key, load }: Resource<T>) {
  const entry = store.get(key);
  if (entry?.loading || (entry && Date.now() - entry.at < FRESH_MS)) return;
  const loading = load()
    .then(
      data => { store.set(key, { data, at: Date.now() }); },
      error => { store.set(key, { data: entry?.data, error, at: Date.now() }); },
    )
    .finally(emit);
  store.set(key, { ...entry, at: entry?.at ?? 0, loading });
}

export function useResource<T>(resource: Resource<T>) {
  const entry = useSyncExternalStore(subscribe, () => store.get(resource.key), () => undefined);
  useEffect(() => load(resource), [resource.key]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    data: entry?.data as T | undefined,
    error: entry?.error,
    isLoading: entry?.data === undefined && !entry?.error,
  };
}
```

> If I'd rather use a library, I swap this one file for TanStack Query or SWR. `resources.ts` already gives a key and a loader, which is exactly what they want. Nothing else in the structure changes.

### 6. The feature: queries, adapters, screen

I keep the feature's data hooks to one-liners:

```ts:src/features/products/queries.ts
import { resources } from '@/core/api';
import { useResource } from '@/hooks/use-resource';

export const useProducts = () => useResource(resources.products());
export const useProduct = (id: string) => useResource(resources.product(id));
```

Adapters turn the API's shape into the UI's shape. They're pure functions, which makes them the easiest and most valuable thing in the app for me to unit test:

```ts:src/features/products/adapters.ts
import type { Product } from '@/core/models/product';
import { formatPrice } from '@/utils/format';
import type { ProductCard } from './types';

export const toProductCard = (p: Product): ProductCard => ({
  id: p.id,
  title: p.name,
  price: formatPrice(p.price),
  inStock: p.stock > 0,
});
```

The screen wires them together. My components never see a raw API model, only view models:

```tsx:src/features/products/screens/products-screen.tsx
'use client';

import { EmptyState, ErrorState, Skeleton } from '@/lib/ui';
import { toProductCard } from '../adapters';
import { ProductGrid } from '../components/product-grid';
import { useProducts } from '../queries';

export function ProductsScreen() {
  const { data, error, isLoading } = useProducts();

  if (isLoading) return <Skeleton rows={6} />;
  if (error) return <ErrorState />;
  if (!data?.length) return <EmptyState title="No products yet" />;
  return <ProductGrid cards={data.map(toProductCard)} />;
}
```

```ts:src/features/products/index.ts
export { ProductsScreen } from './screens/products-screen';
export { ProductScreen } from './screens/product-screen';
```

### 7. The route: a few lines, nothing else

```tsx:src/app/(shop)/products/page.tsx
import { ProductsScreen } from '@/features/products';

export const metadata = { title: 'Products' };

export default function Page() {
  return <ProductsScreen />;
}
```

Because pages only render screens, I can move a URL, rename a route or put a screen behind a different layout without touching any feature code.

## Where does a new file go?

When I'm not sure where something belongs, I ask these questions in order and stop at the first yes:

1. **Is it a route, layout or page metadata?** → `app/`
2. **Does it describe what the backend sends?** → `core/models/`
3. **Does it call the backend or name a path?** → `core/api/`
4. **Is it UI?** Used by more than one feature → `lib/`. Otherwise → `features/<name>/components/`
5. **Is it a React hook?** Used by more than one feature → `hooks/`. Otherwise → `features/<name>/`
6. **Is it static data?** → `config/`. **A design token?** → `styles/`
7. **None of the above?** It should be a pure function → `utils/`

Two rules of thumb I follow:

- **I start inside the feature and promote it later.** Code moves to `lib/` or `core/` only when a second feature actually needs it. Guessing early fills `lib/` with things only one screen uses.
- **A new endpoint touches four files, and I add them in order:** the schema in `core/models/`, the path in `endpoints.ts`, the call in `api.ts`, and the key in `resources.ts`. The feature then uses it from its `queries.ts`.

## Conventions that keep it boring

These are the conventions I stick to:

| Topic | Convention |
| --- | --- |
| File names | kebab-case everywhere: `product-card.tsx`, `use-resource.ts` |
| Styles | A CSS module next to its component; global tokens in `styles/tokens.css` |
| Images | Every path lives in `config/images.ts`, never hardcoded in components |
| Barrels | One `index.ts` per shared folder. Inside a folder, import the specific file to avoid cycles |
| Models | One file per entity: schema, inferred type, status enums |

## Where it breaks in real life

The rules are easy to agree with and easy to break on a busy day. These are the leaks I've actually seen, and the fix for each:

- **The nav bar imports the auth session from `features/auth`.** Shared UI now depends on a feature. Things almost every screen needs, like the session, belong in `core/auth/`.
- **One feature borrows another's loading and empty states.** If two features want it, it was never feature-specific. Move it to `lib/ui/`.
- **The same component is copy-pasted into two features.** Promote one copy to `lib/ui/` and delete the other, along with any duplicated types.
- **A feature is named after a screen** (`home`, `dashboard`) and slowly absorbs three different domains. Leave it until a second screen needs one of those domains, then split by domain: `home` keeps the layout, and the domains become their own features.

## Let ESLint enforce it

Conventions drift, so I make the two most important rules fail the build. With ESLint's flat config:

```js:eslint.config.mjs
export default [
  // ...your existing config

  // Shared code can't import from features/.
  {
    files: ['src/{lib,core,hooks,config,styles,utils}/**'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [{ group: ['@/features', '@/features/**'], message: 'Shared code must not depend on a feature.' }],
      }],
    },
  },

  // Features import each other only through their index.ts.
  {
    files: ['src/features/**'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [{ group: ['@/features/*/**'], message: "Import from the feature's index.ts, not its internals." }],
      }],
    },
  },
];
```

The second rule means files inside a feature import each other with relative paths (`../queries`), and anything outside uses `@/features/products`. I like that as a signal when I'm reading code: a relative import stays inside the feature, and an `@/` import crosses a boundary.

## When to bend it

- **Tiny app?** I skip `features/` until there's a second one. `app/`, `lib/`, `core/` and `utils/` are plenty for a handful of pages.
- **Fetching on the server?** The same layers work in Server Components. I move `core/api/` to `server/api/`, add `import 'server-only'` at the top of each file, and keep `core/models/` where it is, because both the server and the browser use it.
- **Adding login?** I keep one shared request function in `client.ts` and put authenticated calls in their own file next to `api.ts`. The rest of the structure doesn't notice.

None of this is clever, and that's the point. When every file has an obvious home, I spend my time on the product instead of on where things go.
