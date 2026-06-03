# MDLB WMS

A single full-stack [Next.js](https://nextjs.org) (App Router) application for
MDLBEAST warehouse / inventory management. Frontend pages and the backend API
live in the **same** app: React Server Components read from the database
directly, and mutations call internal API routes under `/api/*`. There is no
separate backend service.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Server-side API routes** under `src/app/api/**` for all writes
- **Prisma 7** ORM over **PostgreSQL** (via the `@prisma/adapter-pg` driver)
- **NextAuth** (credentials, JWT sessions) with role-based access (ADMIN / CREW)
- **Tailwind CSS 4**
- Optional **S3 / R2** presigned uploads for product images

## Architecture

```
src/
  app/
    (pages)         admin/, crew/, login/, signout/  → UI (server + client components)
    api/            server-only route handlers (the "backend")
      admin/...     product / variant / request management
      crew/...      crew request submission
      auth/...      NextAuth handler
      storage/...   S3 presign
      health        DB connectivity check
  lib/              prisma client, auth options, rbac guards, inventory + sku logic
  components/       shared UI (SiteHeader)
prisma/
  schema.prisma     data model
  migrations/       SQL migrations
  seed.mjs          size options + bootstrap admin
```

All database access happens **server-side only** (`src/lib/prisma.ts` is marked
`server-only`). The connection string is read from `process.env.DATABASE_URL` and
is never exposed to the browser.

## Local development

Requirements: Node `>=20 <25` and a PostgreSQL database.

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env        # then fill in DATABASE_URL + NEXTAUTH_SECRET

# 3. Apply the schema to your database
npm run db:migrate:deploy   # or: npx prisma migrate dev

# 4. (optional) Seed size options + a bootstrap admin
#    Requires ADMIN_EMAILS and ADMIN_PASSWORD in .env
npm run db:seed

# 5. Run the app (http://localhost:3000)
npm run dev
```

> The Prisma CLI loads variables from `.env` (via dotenv). The Next.js runtime
> also reads `.env.local`. For local work, putting everything in `.env` is
> simplest. Never commit `.env` / `.env.local` — both are gitignored.

Other scripts:

```bash
npm run build   # production build
npm run start   # run the production build
npm run lint    # eslint
npm run test    # vitest unit tests
```

## Deploying to Vercel

1. **Import the repo** into Vercel. The framework is auto-detected as Next.js —
   no `vercel.json` is required.
2. **Add a PostgreSQL database** (Vercel Postgres / Neon integration, or any
   external Postgres). The integration typically injects `DATABASE_URL`
   automatically; otherwise set it manually.
3. **Set environment variables** (Project → Settings → Environment Variables):

   | Variable | Required | Notes |
   |---|---|---|
   | `DATABASE_URL` | ✅ | PostgreSQL connection string (often auto-injected). |
   | `NEXTAUTH_SECRET` | ✅ | `openssl rand -base64 32`. NextAuth requires it in prod. |
   | `ADMIN_EMAILS` | recommended | Comma-separated admin emails (`@mdlbeast.com`). |
   | `ALLOW_CREW_SELF_REGISTER` | optional | `"true"` to let crew self-register. |
   | `NEXTAUTH_URL` | optional | Inferred from request headers if unset. |
   | `AUTH_TRUST_HOST` | optional | `"true"` recommended behind a proxy. |
   | `ADMIN_PASSWORD` | optional | Only used by `npm run db:seed`. |
   | `STORAGE_*` | optional | Only needed for product image uploads. |

   The only strictly required production variables are **`DATABASE_URL`** and
   **`NEXTAUTH_SECRET`**.

4. **Run migrations against the production database** once (locally, pointing
   `DATABASE_URL` at prod, or from a CI step):

   ```bash
   npm run db:migrate:deploy
   npm run db:seed   # optional, to create the first admin
   ```

5. **Deploy.** Vercel runs `npm install` (which triggers `prisma generate` via
   the `postinstall` hook) and `npm run build`.

## Notes

- Login is restricted to `@mdlbeast.com` email addresses (see `src/lib/auth.ts`).
- `/admin/*` is ADMIN-only and `/crew/*` is CREW/ADMIN, enforced by
  `src/middleware.ts`.
- Health check: `GET /api/health` runs `SELECT 1` to verify DB connectivity.
