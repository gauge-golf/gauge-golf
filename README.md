# Gauge Golf

A universal performance golf glove. Built in public.

## Stack

- Next.js 15 (App Router) · React 19
- Tailwind CSS v4 (CSS-first `@theme`)
- Neon Postgres (`@neondatabase/serverless`, no ORM)
- Server Actions for the reserve form
- Vercel deployment

## Local setup

```bash
npm install
cp .env.example .env.local         # paste your Neon DATABASE_URL
psql "$DATABASE_URL" -f lib/schema.sql
npm run dev
```

## Deploy (Vercel)

1. Push to GitHub.
2. Import the repo into Vercel.
3. Add env var `DATABASE_URL` (Neon → Connection Details → **Pooled** connection).
4. Deploy.

## Architecture

```
app/
  layout.tsx          fonts + SEO
  page.tsx            landing
  globals.css         design tokens (@theme)
  actions.ts          reserve() server action
components/site/      sections (hero, journey, problem, ...)
lib/
  db.ts               neon client
  schema.sql          single table: leads
```

## Contact

[hello@gauge-golf.com](mailto:hello@gauge-golf.com)
