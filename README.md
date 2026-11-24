# Baseline — Construction Job Costing & Crew Scheduling

A Next.js app for small construction crews to track **job costing** (budget vs.
actual spend) and **crew scheduling** (who is on which job, which day). No auth,
no user accounts — it's a single-crew tool.

> **Sample data:** the seeded jobs, clients, and crew members are fictional
> examples for demonstration, not real client work.

> **Legacy code:** the old Angular 19 (`frontend/`) + Node/Express (`backend/`)
> app from January 2025 is still in this repo, untouched, pending cleanup. The
> Next.js app in this directory is the rebuild and supersedes it. The old
> all-in-one business-manager spec that used to live in this README is
> superseded too — this app intentionally covers only job costing and crew
> scheduling.

## What it does

- **Dashboard** (`/`): active jobs, total budget, total spent, over/under;
  per-job budget-vs-actual with over-budget flags; this week's schedule at a glance.
- **Jobs** (`/jobs`): create jobs (name, client name, job site address, status,
  budget), list them with budget vs. spent, and open a job detail page showing
  budget vs. actual spend (cost entries **plus** labor cost from time logs at
  each crew member's hourly rate), a per-category cost breakdown, and the job's
  cost entries and time logs.
- **Cost entries**: log a cost against a job (category, amount, date,
  description, optional vendor).
- **Time logs**: log hours (crew member, job, date, hours, task). Labor cost is
  computed from the crew member's hourly rate when one is set; hours logged for
  a member with no rate show $0 labor cost.
- **Schedule** (`/schedule`): a Mon–Sun week grid showing which crew members are
  assigned to which job each day, with previous/next week navigation, a form to
  add an assignment (one job per person per day), and crew management (add
  members, set hourly rates).

## Deliberately out of scope

Leads, estimates, contracts, invoices, client portal, CRM features, auth.
Anything that smells like a CRM belongs to RealSync, not Baseline.

## Stack

Next.js 16 (App Router) + TypeScript + Tailwind CSS 4 + Prisma 7 + Postgres
(Neon). One provider and one adapter for dev and prod — no SQLite. Server
components for reads, server actions for creates. No extra UI libraries.

## Getting started

```bash
npm install          # also runs `prisma generate` (postinstall)
cp .env.example .env # DATABASE_URL="postgresql://user:password@host/db?sslmode=require"
npx prisma migrate dev
npm run db:seed      # or: npx prisma db seed
npm run dev          # http://localhost:3000
```

`DATABASE_URL` is the Neon Postgres connection string (create a database
for Baseline in the Neon dashboard). The same variable is set in Vercel
for production — never commit a real value.

Scripts:

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Production build / serve it |
| `npm run db:seed` | Re-seed the database with sample data (wipes existing rows) |
| `npx prisma studio` | Browse the data in Prisma Studio |
| `npx prisma migrate dev --name <name>` | Create a migration after a schema change |

## How the numbers work

- **Total spent** for a job = sum of its cost entries + labor cost from its
  time logs (hours × the crew member's hourly rate, where a rate is set).
- **Over budget** = total spent > budget. The Downtown Café Renovation in the
  seed data is intentionally over budget so the flag is visible.
- **One job per person per day**: the schedule enforces a unique
  (crew member, date) assignment; trying to double-book someone returns a
  friendly error instead of a second row.

## Deploying (Vercel + Neon)

1. Create a Neon database for Baseline and copy its connection string.
2. Import the repo in the Vercel dashboard. Root directory is the repo
   root. Set the `DATABASE_URL` environment variable to the Neon
   connection string.
3. After the first deploy, apply the migration and seed the production
   database once (from a machine with the Neon URL in `.env`):
   ```bash
   npx prisma migrate deploy
   npm run db:seed
   ```
   Later deploys only need `npx prisma migrate deploy` when a new
   migration lands. Never run `prisma migrate dev` against production.

## Troubleshooting

- **Prisma CLI fails to download its engine binary** (e.g. a sandbox or proxy
  resets the connection to `binaries.prisma.sh` and the CLI crashes with
  `ECONNRESET`): download the schema engine manually with curl and place it in
  the Prisma cache and the engines folder, e.g. for engines hash
  `<hash>` and target `debian-openssl-3.0.x`:
  ```bash
  VER=<hash>
  DEST=~/.cache/prisma/master/$VER/debian-openssl-3.0.x
  mkdir -p "$DEST"
  curl -s -o "$DEST/schema-engine.gz" \
    "https://binaries.prisma.sh/all_commits/$VER/debian-openssl-3.0.x/schema-engine.gz"
  gunzip "$DEST/schema-engine.gz" && chmod +x "$DEST/schema-engine"
  printf '%s' "$(sha256sum "$DEST/schema-engine" | awk '{print $1}')" \
    > "$DEST/schema-engine.sha256"
  cp "$DEST/schema-engine" node_modules/@prisma/engines/schema-engine-debian-openssl-3.0.x
  ```
  Find the current engines hash with `npx prisma --version` (it prints
  "Default Engines Hash"). On a normal machine `npm install` downloads the
  engine automatically — this is only for restricted networks.
- **Database connection**: if the app cannot reach Postgres, check that
  `DATABASE_URL` is the Neon connection string and that the migration
  has been applied (`npx prisma migrate deploy`). To start over on a dev
  database, drop and recreate it in Neon, then re-run `npx prisma migrate
  dev` + `npm run db:seed`.
