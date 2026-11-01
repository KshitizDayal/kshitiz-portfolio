---
title: "How I structured the StatOz backend: Express, TypeScript and MongoDB"
date: 2026-11-01T23:00:00+05:30
excerpt: In my backend, routes only wire things up, controllers own HTTP, every error has one shape and the build fails if money moves the wrong way. Here's how I structured it, with the code for every layer so you can copy it.
tags: [Node.js, Express, Architecture, TypeScript]
---

Most Express apps I've seen start as one `index.js`. Then it's a `routes/` folder where every file also queries the database, sends its own error format and does a bit of business logic on the side. A year later, nobody can say for sure where a rule lives or which endpoints are public.

I didn't want that for StatOz. The backend runs on **Express on Node, TypeScript (ESM), MongoDB with Mongoose, Socket.IO for live updates and Vitest for tests**, and this post walks through how I've laid it out and why.

It's the third part of a set. The apps that call this API have their own posts: [the Next.js structure](/blog/nextjs-folder-structure) and [the Flutter structure](/blog/flutter-folder-structure).

## The idea in one sentence

**Every layer has one job, a request passes through them in a fixed order and anything dangerous has exactly one door.**

Everything below is me applying that one rule over and over.

## The repository

Here's the top level of the repo:

```text
my-api/
├── src/                  Application source, compiled to dist/
├── tests/                Vitest suites, helpers and setup
├── scripts/              Build checks and one-off maintenance scripts
├── docs/                 How each feature works
├── .github/workflows/    CI: typecheck, build, tests
├── package.json
├── tsconfig.json         rootDir src → outDir dist
├── tsconfig.test.json    Type-checks tests/ too
├── vitest.config.ts
└── .env                  Local secrets, git-ignored. Never commit it
```

These are the scripts I run every day:

| Script | What it does |
| --- | --- |
| `npm run dev` | `tsx watch src/server.ts`: runs the TypeScript directly, restarts on change |
| `npm run build` | Runs the safety checks (`prebuild`), then `tsc` into `dist/` |
| `npm start` | `node dist/server.js`, for production |
| `npm run typecheck` | `tsc --noEmit` over `src/` and `tests/` |
| `npm test` | `vitest run` |

## `src/` at a glance

```text
src/
├── server.ts        Process entry: check env → connect DB → HTTP + sockets → jobs → listen
├── app.ts           The Express app: security, parsers, health check, routes, error handler
│
├── routes/          One Router per feature: paths + middleware → controller
├── controllers/     Request handlers: check input, do the work, send the response
├── models/          Mongoose schemas, one collection per file
├── middlewares/     Auth, roles, rate limits, uploads, errors
│
├── helpers/         Business rules shared by several controllers
│   └── aggregation/ MongoDB pipelines and reusable stages
├── services/        Other systems: HTTP clients, schedulers, push, payments, storage
├── socket/          The Socket.IO server, its rooms and emitters
│
├── utils/           Generic building blocks: ApiError, ApiResponse, asyncHandler
├── types/           Status enums, shared types, env.d.ts
├── config/          Static data the server trusts: prices, plans
├── db/              The database connection
└── templates/       Email HTML
```

I went **layer-first** here: one folder per kind of code, with a feature spread across them by name. `product.route.ts`, `product.controller.ts` and `product.model.ts` always travel together. My Flutter and Next.js apps are feature-first, but a backend that mostly maps HTTP to a database is easier to navigate this way, because every file in `controllers/` looks the same.

## How a request flows

Every request takes the same path through the app:

```text
HTTP request
   │
   ▼
app.ts                 cors → helmet → rate limit → body parser → cookies
   │
   ▼
routes/product.route.ts
   │                   router.route('/').post(verifyJWT, verifyAdmin, createProduct)
   ▼
middlewares/           verifyJWT → req.user
   │                   verifyAdmin → 403 unless admin
   ▼
controllers/product.controller.ts
   │                   ├─ models/       reads and writes
   │                   ├─ helpers/      shared business rules
   │                   ├─ services/     other systems
   │                   └─ socket/       live pushes
   ▼
res.status(201).json(new ApiResponse(201, product))

on any throw ──► errorHandler → { statusCode, success: false, message, errors }
```

I hold myself to four rules:

- **Routes only wire things up.** Paths and middleware, no logic.
- **Controllers own the HTTP part:** reading `req`, checking input, choosing the status code and building the response.
- **Anything two controllers need** moves to `helpers/` (business rules) or `services/` (other systems).
- **Errors are thrown, never hand-formatted.** One middleware turns every error into the same JSON shape.

## The building blocks in `utils/`

Every controller I write uses these three tiny files. They're what make every endpoint look and fail the same way.

```ts:src/utils/apiError.ts
export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly errors: unknown[] = [],
  ) {
    super(message);
  }
}
```

```ts:src/utils/apiResponse.ts
export class ApiResponse<T> {
  readonly success: boolean;

  constructor(
    public readonly statusCode: number,
    public readonly data: T,
    public readonly message = 'Success',
  ) {
    this.success = statusCode < 400;
  }
}
```

```ts:src/utils/asyncHandler.ts
import type { NextFunction, Request, RequestHandler, Response } from 'express';

// Sends a rejected promise to the error handler instead of leaving the request hanging.
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };
```

On **Express 5**, rejected promises already reach the error handler, so `asyncHandler` is optional. I keep it anyway: it makes the intent obvious and the code works on Express 4 too.

### One place that formats every error

All errors end up in one middleware, and it's the only code that decides what a failure looks like:

```ts:src/middlewares/error.middleware.ts
import type { ErrorRequestHandler } from 'express';
import { ApiError } from '../utils/apiError.js';

const send = (res: Parameters<ErrorRequestHandler>[2], status: number, message: string, errors: unknown[] = []) =>
  res.status(status).json({ statusCode: status, success: false, message, errors });

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ApiError) return void send(res, err.statusCode, err.message, err.errors);
  if (err?.name === 'TokenExpiredError') return void send(res, 401, 'Session expired');
  if (err?.name === 'JsonWebTokenError') return void send(res, 401, 'Invalid token');
  if (err?.name === 'CastError') return void send(res, 400, 'Invalid id');
  if (err?.code === 11000) return void send(res, 409, 'Already exists');

  console.error(err);
  send(res, 500, 'Something went wrong');
};
```

My web and mobile apps rely on that one shape for every failure, and a bad id or an expired token never leaks out as a 500.

## Building one feature

This is how I build a feature, using products as the example, from the bottom up.

### Types: status values in one place

```ts:src/types/product-status.type.ts
export const ProductStatus = { Active: 'active', Archived: 'archived' } as const;
export type ProductStatus = (typeof ProductStatus)[keyof typeof ProductStatus];
```

I use a plain `as const` object instead of a TypeScript `enum`. It works as both a value (for the schema and queries) and a type.

### Model: one collection per file

```ts:src/models/product.model.ts
import { Schema, model, type Types } from 'mongoose';
import { ProductStatus } from '../types/product-status.type.js';

export interface IProduct {
  name: string;
  price: number;
  stock: number;
  status: ProductStatus;
  createdBy: Types.ObjectId;
}

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0 },
    status: { type: String, enum: Object.values(ProductStatus), default: ProductStatus.Active },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

// Indexes live next to the schema, so nobody has to remember to create them.
productSchema.index({ status: 1, createdAt: -1 });

export const Product = model<IProduct>('Product', productSchema);
```

### Controller: the HTTP part

```ts:src/controllers/product.controller.ts
import { Product } from '../models/product.model.js';
import { ProductStatus } from '../types/product-status.type.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const listProducts = asyncHandler(async (_req, res) => {
  const products = await Product.find({ status: ProductStatus.Active }).sort({ createdAt: -1 }).lean();
  res.status(200).json(new ApiResponse(200, products));
});

const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).lean();
  if (!product) throw new ApiError(404, 'Product not found');
  res.status(200).json(new ApiResponse(200, product));
});

const createProduct = asyncHandler(async (req, res) => {
  const { name, price, stock = 0 } = req.body ?? {};
  if (typeof name !== 'string' || !name.trim()) throw new ApiError(400, 'name is required');
  if (typeof price !== 'number' || price < 0) throw new ApiError(400, 'price must be 0 or more');

  const product = await Product.create({ name, price, stock, createdBy: req.user!._id });
  res.status(201).json(new ApiResponse(201, product, 'Product created'));
});

export { createProduct, getProduct, listProducts };
```

Every handler in my codebase reads the same way: check the input, do the work, send an `ApiResponse`. When something's wrong, it throws and stops.

### Middleware: who's allowed in

```ts:src/middlewares/auth.middleware.ts
import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const verifyJWT = asyncHandler(async (req, _res, next) => {
  const token = req.cookies?.accessToken ?? req.header('Authorization')?.replace(/^Bearer /, '');
  if (!token) throw new ApiError(401, 'Not signed in');

  const { sub } = jwt.verify(token, process.env.JWT_SECRET!) as { sub: string };
  const user = await User.findById(sub);
  if (!user) throw new ApiError(401, 'Not signed in');

  req.user = user;
  next();
});

// Always goes after verifyJWT.
export const verifyAdmin: RequestHandler = (req, _res, next) => {
  if (req.user?.role !== 'admin') throw new ApiError(403, 'Admins only');
  next();
};
```

I type `req.user` once, in `types/`:

```ts:src/types/express.d.ts
import type { HydratedDocument } from 'mongoose';
import type { IUser } from '../models/user.model.js';

declare global {
  namespace Express {
    interface Request {
      user?: HydratedDocument<IUser>;
    }
  }
}

export {};
```

### Route: wiring only

```ts:src/routes/product.route.ts
import { Router } from 'express';
import { createProduct, getProduct, listProducts } from '../controllers/product.controller.js';
import { verifyAdmin, verifyJWT } from '../middlewares/auth.middleware.js';
import { writeLimiter } from '../middlewares/rateLimiter.middleware.js';

const router = Router();

router.route('/').get(listProducts).post(verifyJWT, verifyAdmin, writeLimiter, createProduct);
router.route('/:id').get(getProduct);

export default router;
```

I stick to two habits that keep routes safe:

- **Middleware always goes in the same order:** `verifyJWT` → role check → rate limit or upload → handler. When I read a route, I can tell its access level at a glance.
- **Static paths come before `/:id`.** If `/featured` is declared after `/:id`, Express will happily treat "featured" as an id.

## The two entry points

I keep starting the server separate from building the app. `app.ts` builds the app and nothing else, which means my tests can import it without opening a port:

```ts:src/app.ts
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { errorHandler } from './middlewares/error.middleware.js';
import { apiLimiter } from './middlewares/rateLimiter.middleware.js';
import orderRouter from './routes/order.route.js';
import productRouter from './routes/product.route.js';

export const app = express();

app.set('trust proxy', 1);
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
app.use(helmet());
app.use('/api/', apiLimiter);
app.use(express.json({ limit: '16kb' }));
app.use(cookieParser());

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api/v1/products', productRouter);
app.use('/api/v1/orders', orderRouter);

app.use(errorHandler); // always last
```

`server.ts` starts the process, in a fixed order, and refuses to start with a broken config:

```ts:src/server.ts
import 'dotenv/config';
import http from 'node:http';
import { app } from './app.js';
import { connectDB } from './db/db.js';
import { startStockSync } from './services/stockSync.service.js';
import { initializeSocket } from './socket/socket.service.js';
import { validateEnv } from './utils/validateEnv.js';

validateEnv();
await connectDB();

const server = http.createServer(app);
initializeSocket(server);
startStockSync();

const port = Number(process.env.PORT ?? 8000);
server.listen(port, () => console.log(`API listening on :${port}`));
```

```ts:src/utils/validateEnv.ts
const REQUIRED = ['MONGODB_URI', 'JWT_SECRET', 'CORS_ORIGIN'] as const;

export function validateEnv() {
  const missing = REQUIRED.filter(key => !process.env[key]);
  if (missing.length) {
    console.error(`Missing environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }
}
```

I'd much rather the server crash at start-up with "Missing JWT_SECRET" than return a 500 on the first login.

## `helpers/` or `utils/`?

This is the question that comes up most, and I settle it with one rule:

- **If it knows about the business** (orders, balances, stock), it goes in `helpers/`.
- **If it would work in any Express app**, it goes in `utils/`.

`calculateDiscount()` for pricing rules is a helper. `escapeRegex()` is a util. Once my helpers started growing big MongoDB pipelines, I gave those their own `helpers/aggregation/` folder, one file per read model, so controllers call `productListPipeline()` instead of building 60-line pipelines inline.

I keep `services/` for code that talks to **another system** or **runs on its own**: HTTP clients for other APIs (`*.client.ts`), schedulers, push notifications, payment-store checks, file storage.

## One door for anything dangerous

Some values must never drift: a wallet balance, credits, stock counts. If ten controllers can write `user.balance`, one of them eventually forgets the ledger row, or forgets to check for a negative balance.

So in my backend there's exactly **one** function that changes it. It updates the balance and writes the ledger row in the same transaction:

```ts:src/helpers/wallet.helper.ts
import mongoose, { type Types } from 'mongoose';
import { User } from '../models/user.model.js';
import { WalletLedger } from '../models/walletLedger.model.js';
import { ApiError } from '../utils/apiError.js';

/** The only code allowed to change User.balance. Writes the balance and its ledger row together. */
export async function applyBalanceChange(userId: Types.ObjectId, amount: number, reason: string) {
  const session = await mongoose.startSession();
  let balance = 0;
  try {
    await session.withTransaction(async () => {
      const user = await User.findOneAndUpdate(
        { _id: userId, ...(amount < 0 ? { balance: { $gte: -amount } } : {}) },
        { $inc: { balance: amount } },
        { new: true, session },
      );
      if (!user) throw new ApiError(400, 'Insufficient balance');
      await WalletLedger.create([{ user: userId, amount, reason, balanceAfter: user.balance }], { session });
      balance = user.balance;
    });
  } finally {
    await session.endSession();
  }
  return balance;
}
```

A rule like that is easy to forget, so I made it impossible to forget. A small script fails the build if anything else writes the balance:

```js:scripts/check-balance-writes.mjs
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ALLOWED = join('src', 'helpers', 'wallet.helper.ts');
const WRITE = /\$(inc|set):\s*\{[^}]*\bbalance\b|\.balance\s*[+-]?=(?!=)/;

function* files(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) yield* files(path);
    else if (path.endsWith('.ts')) yield path;
  }
}

const offenders = [];
for (const file of files('src')) {
  if (file === ALLOWED) continue;
  readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
    if (WRITE.test(line) && !line.includes('balance-write-ok')) offenders.push(`${file}:${i + 1}`);
  });
}

if (offenders.length) {
  console.error(`Balance changed outside applyBalanceChange():\n${offenders.join('\n')}`);
  process.exit(1);
}
```

It runs before every build through `"prebuild": "node scripts/check-balance-writes.mjs"`. When I genuinely need an exception, like a one-off backfill script, that line gets a `balance-write-ok` comment, so it's visible in review.

Two related habits I follow:

- **Prices come from the server, never the client.** A purchase sends a product id; the amount is looked up in `config/` or the database.
- **Credits that might be retried get an idempotency key**, so a double-tapped button or a retried webhook can't pay out twice.

## Background work and live updates

My schedulers live in `services/` and start from `server.ts`:

```text
server.ts
 └─ startStockSync()          every 60 s
      supplier.client → update Product.stock → emit stock_updated
```

Socket.IO gets its own folder, `socket/`, holding the handshake auth, the rooms (`products`, `user:<id>`) and one emitter function per event. Controllers and schedulers call `emitStockUpdated(product)`. They never touch the `io` object directly, so every event name lives in one file.

> Running schedulers inside the API process is fine with one instance. The moment you scale to two, every job runs twice. That's when it moves to a separate worker or gets a lock.

## Tests that guard the structure

The tests are where I make sure the rules above actually hold:

```text
tests/
├── setup/
│   ├── global-setup.ts    Starts one in-memory MongoDB replica set
│   ├── env.ts             Test env vars, loaded before any model import
│   ├── mocks.ts           Socket emitters as spies, rate limiters as pass-through
│   └── db.ts              Connects, and cleans the database between tests
├── helpers/
│   ├── api.ts             Supertest api() and authAs(user)
│   └── factories.ts       createUser, createAdmin, createProduct… with sensible defaults
├── unit/                  Pure functions, mirroring src/: helpers/, utils/, middlewares/
└── integration/           Real HTTP through the real app and database, one folder per feature
    ├── route-guards.test.ts
    └── __snapshots__/route-access.txt
```

I test against a real MongoDB, started in memory with `mongodb-memory-server`. It runs as a **replica set** because transactions, like the one in `applyBalanceChange`, need one.

Factories keep my tests short. Every field has a sensible default, and a test only spells out what it cares about:

```ts:tests/helpers/factories.ts
import { type IUser, User } from '../../src/models/user.model.js';

let n = 0;

export const createUser = (overrides: Partial<IUser> = {}) =>
  User.create({ name: `User ${++n}`, email: `user${n}@test.dev`, role: 'user', ...overrides });

export const createAdmin = (overrides: Partial<IUser> = {}) => createUser({ role: 'admin', ...overrides });
```

My integration tests go through the real app, so they test the route, the middleware and the controller together:

```ts:tests/integration/products/create-product.test.ts
import { describe, expect, it } from 'vitest';
import { api, authAs } from '../../helpers/api.js';
import { createAdmin, createUser } from '../../helpers/factories.js';

const body = { name: 'Shoe', price: 49 };

describe('POST /api/v1/products', () => {
  it('lets an admin create a product', async () => {
    const res = await authAs(await createAdmin()).post('/api/v1/products').send(body);
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject(body);
  });

  it('rejects a normal user', async () => {
    const res = await authAs(await createUser()).post('/api/v1/products').send(body);
    expect(res.status).toBe(403);
  });

  it('rejects a request without a token', async () => {
    const res = await api().post('/api/v1/products').send(body);
    expect(res.status).toBe(401);
  });
});
```

### A snapshot of who can call what

This is my favourite test in the whole backend. It walks Express's router, lists every mounted route with its access level and compares that list to a file checked into git:

```text:tests/integration/__snapshots__/route-access.txt
GET     /api/v1/products              public
POST    /api/v1/products              admin
GET     /api/v1/products/:id          public
GET     /api/v1/orders                user
POST    /api/v1/orders                user
```

If I add a route, or drop `verifyJWT` from one by accident, the test fails until the file is updated. The change then shows up in the pull request as a one-line diff, like `POST /api/v1/orders  user → public`, which is exactly the line I want a reviewer to stare at. Vitest's `toMatchFileSnapshot()` does the comparing.

A second check in the same file keeps a short allowlist of routes that are **meant** to be public, and fails if any other route has no auth middleware.

## CI

Every pull request runs the same three checks:

```yaml:.github/workflows/ci.yml
name: ci

on:
  pull_request:
  workflow_dispatch:

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - run: npm run typecheck
      - run: npm run build
      - run: npm test
```

`npm run build` runs the balance check first, so CI catches a stray write before it's merged.

## Conventions

These are the conventions I follow across the codebase:

| Topic | Convention |
| --- | --- |
| File names | `<feature>.<layer>.ts`: `product.route.ts`, `product.controller.ts`, `product.model.ts`, `wallet.helper.ts`, `supplier.client.ts` |
| Imports | ESM with `NodeNext`: relative imports end in `.js`, even from `.ts` files |
| Responses | `res.status(n).json(new ApiResponse(n, data, message))` |
| Errors | `throw new ApiError(n, message)`; the error handler formats it |
| Controllers | Handlers wrapped in `asyncHandler`, exported in one `export { … }` block at the end |
| Secrets | Never in git. Every new variable goes in `validateEnv.ts` and `env.d.ts` |
| Comments | Explain *why*. Doc comments on exported functions and non-obvious schema fields |

If you copy this, pick a casing for file names (camelCase or kebab-case) on day one and stick to it. A typo in a file name or a public URL is forever, because renaming it means changing every import and every client that calls it.

## Adding a feature: the checklist

This is the list I go through every time I add a feature:

1. **Model:** `src/models/<feature>.model.ts` with the interface, schema, indexes and export. Status values go in `src/types/`.
2. **Controller:** `src/controllers/<feature>.controller.ts`, handlers in `asyncHandler`, `ApiResponse` and `ApiError`.
3. **Shared logic:** business rules in `helpers/`, pipelines in `helpers/aggregation/`, other systems in `services/`.
4. **Routes:** `src/routes/<feature>.route.ts`, static paths before `/:id`, the right auth and limiter.
5. **Mount:** `app.use('/api/v1/<prefix>', router)` in `app.ts`, before `errorHandler`.
6. **Live updates:** an emitter in `socket/`, and a spy for it in `tests/setup/mocks.ts`.
7. **Env:** new variables in `validateEnv.ts` and `env.d.ts`.
8. **Tests:** factories, integration tests and unit tests for pure logic. Review the `route-access.txt` diff.
9. **Docs:** `docs/<feature>.md` for anything that isn't obvious from the code.

None of these rules are clever. They just make every endpoint in my backend look the same, fail the same and get reviewed the same, which is what I want from the part of the system that holds everyone's data.
