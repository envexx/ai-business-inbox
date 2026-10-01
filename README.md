# Switchboard

AI business inbox and task automation. Incoming messages are read, classified by
intent, measured against policy, routed to a department, and either handled
automatically or held for human approval.

This is a personal demonstration project. It is not client work, and all data in
the demo is generated.

## What makes it a system, not a chatbot

- A real pipeline: receive, classify, apply policy, draft, act or approve, audit.
- Human in the loop by design. High risk work cannot be sent until a person
  approves it, and the approval is recorded.
- Decisions are transparent: every classification stores intent, confidence,
  policy, and reasoning, and appears on the AI decisions page.
- It works without an OpenAI key. Without a key the pipeline uses a deterministic
  classifier, so the demo never breaks.

## Stack

- Next.js 16 (App Router) and React 19
- Tailwind CSS v4
- Prisma 6 with PostgreSQL (Prisma Postgres or any Postgres)
- OpenAI for classification and drafting, with a deterministic fallback
- Radix primitives for tabs, dialog, and switch

## Pipeline

```
receive -> classify (AI) -> structured data -> policy and risk
        -> decision -> action -> verify -> audit
```

Risk tiers:

- Low: the system executes and logs it (FAQ, scheduling).
- Medium: the system executes, creates a task, and notifies the owner.
- High: nothing is sent. The reply is drafted and waits in Approvals.

Policy rules (configurable in Settings):

- Refunds always require human approval.
- Duplicate charge billing issues require approval.
- Complaints and partnerships require approval by default.
- FAQ replies and spam archiving can run automatically.

## Project structure

```
prisma/
  schema.prisma        data model
  seed.ts              demo data loader
src/
  core/                reusable automation engine
    ai/provider.ts     OpenAI classification with deterministic fallback
    ai/heuristic.ts    rule based classifier
    ai/draft.ts        reply drafting
    policy.ts          risk and approval rules
    settings.ts        policy config
    engine.ts          orchestrator and approval decisions
    seed.ts            demo data definitions
  server/queries.ts    read queries
  components/          UI kit and feature components
  app/                 routes, API handlers
    api/messages            POST intake, GET list
    api/messages/[id]/run   POST re-run
    api/tasks/[id]          PATCH complete
    api/approvals/[id]      POST approve or reject
    api/settings            GET and POST policy
    api/webhooks/message    POST inbound webhook
    api/seed                POST demo data
```

## Local setup

1. Create a Postgres database. Prisma Postgres is the shortest path.
2. Copy `.env.example` to `.env` and set `DATABASE_URL`.

```
DATABASE_URL="<your postgres url>"
OPENAI_API_KEY=""            # optional, falls back to the deterministic engine
OPENAI_MODEL="gpt-4o-mini"
```

3. Install, push the schema, seed, and run.

```bash
pnpm install
pnpm exec prisma db push
pnpm db:seed
pnpm dev
```

Open http://localhost:3000.

### Pooled and serverless hosts

If your provider pools connections (Prisma Postgres, Neon, Supabase pgbouncer),
append pooling flags to the URL so Prisma does not reuse prepared statements:

```
...?sslmode=require&pgbouncer=true&connection_limit=1
```

Symptom without them: `prepared statement "s0" already exists`.

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import it in Vercel. The framework is detected automatically.
3. Add environment variables in the Vercel project: `DATABASE_URL`, and
   optionally `OPENAI_API_KEY` and `OPENAI_MODEL`.
4. Deploy. The build runs `prisma generate` before `next build`.
5. After the first deploy, seed the database from the deployed app by calling
   `POST /api/seed`, or run `pnpm db:seed` locally against the same URL.

## API

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/messages` | List messages, optional `status`, `risk`, `q` |
| POST | `/api/messages` | Create a message and run the pipeline |
| POST | `/api/messages/:id/run` | Re-run the pipeline for a message |
| PATCH | `/api/tasks/:id` | Mark a task open or done |
| POST | `/api/approvals/:id` | Approve or reject a held action |
| GET | `/api/settings` | Read the policy config |
| POST | `/api/settings` | Update the policy config |
| POST | `/api/webhooks/message` | Inbound message webhook |
| POST | `/api/seed` | Load demo data (`?reset=false` to append) |

## Scripts

| Script | Action |
| --- | --- |
| `pnpm dev` | Development server |
| `pnpm build` | `prisma generate` then production build |
| `pnpm start` | Production server |
| `pnpm db:push` | Sync schema to the database |
| `pnpm db:seed` | Load demo messages and runs |
| `pnpm db:studio` | Prisma Studio |

## Design

See `DESIGN.md` for the direction, palette, typography, and the reasons behind
each choice.
