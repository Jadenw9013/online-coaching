# Coach Platform (MVP) — Project Context

## Goal
Cross-platform web + PWA coaching platform:
- Clients submit weekly check-ins (metrics + photos)
- Coaches review, leave feedback, and publish updated macro targets + meal plans
- Plans are versioned by week

## Tech Stack
- Next.js (App Router) + TypeScript
- Auth: Clerk (coach/client roles)
- DB: Postgres (Neon) + Prisma
- Storage: Supabase Storage
- Email (later): Resend
- Deploy: Vercel

## Security Rules
- NEVER hardcode secrets. Use environment variables only.
- Do not print or log secret env vars.
- Service role keys server-side only.
