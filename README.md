# Baseline — Construction Job Costing & Crew Scheduling

A Next.js app for small construction crews to track **job costing** (budget vs.
actual spend) and **crew scheduling** (who is on which job, which day).

**Live demo:** https://baseline-omega-ochre.vercel.app

> **Sample data:** the seeded jobs, clients, and crew members are fictional
> examples for demonstration, not real client work.

> **Legacy code:** the old Angular 19 (`frontend/`) + Node/Express (`backend/`)
> app from January 2025 is still in this repo, untouched, pending cleanup. The
> Next.js app in this directory is the rebuild and supersedes it. The old
> all-in-one business-manager spec that used to live in this README is
> superseded too — this app intentionally covers only job costing and crew
> scheduling.

## What it does

The app is a **single-page dashboard** — the journal is the dashboard. There
are no separate pages and no navbar menu; everything lives on `/`.

- **Overview:** KPI cards (Active Jobs, Spent vs. Budget, Jobs Over Budget),
  a yellow alert banner for jobs over budget, a "Budget by Job" donut with
  per-job progress bars and status pills (Over Budget / At Risk / On Track),
  and a "Jobs at a Glance" table.
- **Journal tabs** (Jobs | Costs | Time Logs | Crew | Schedule, plus Users
  for the Owner): the tabbed explorer is the dashboard itself. Job detail
  opens as a panel on the dashboard — the URL stays `/`.
- **Jobs:** create jobs (name, client name, job site address, status,
  budget), list them with budget vs. spent, and open a job to see budget vs.
  actual spend (cost entries **plus** labor cost from time logs at each crew
  member's hourly rate), a per-category cost breakdown, and the job's cost
  entries and time logs.
- **Cost entries:** log a cost against a job (category, amount, date,
  description, optional vendor). Log Cost opens as a modal from the header.
- **Time logs:** log hours (crew member, job, date, hours, task). Labor cost
  is computed from the crew member's hourly rate when one is set; hours
  logged for a member with no rate show $0 labor cost. Log Hours opens as a
  modal from the header.
- **Schedule:** a week view showing which crew members are assigned to which
  job each day, with a form to add an assignment (one job per person per
  day) and crew management (add members, set hourly rates).
- **Users** (Owner only): list users, change roles, link accounts to crew
  members.

## Auth & roles

Sign-in is required — there is no public or auth-free mode. Email + password
via Auth.js (Credentials provider, JWT sessions, bcrypt password hashing).
Sign in at `/signin`, sign up at `/signup`.

- **The first account to sign up becomes the Owner.** Later sign-ups default
  to Crew; the Owner upgrades them from the Users tab.
- Sign-up optionally links the account to a crew member ("I am…") so the
  account sees that person's schedule and hours.

| Role | Can do |
| --- | --- |
| **Owner** | Everything, plus users and roles (cannot change their own role) |
| **Project Manager** | Create/edit jobs, add costs, manage the schedule and assignments, view all time logs; sees budgets and costs; no user admin, no crew hourly rates |
| **Crew Member** | Own schedule and assigned jobs only; logs own time; no budgets, costs, or others' rates |
| **Viewer** | Read-only job status/progress and schedule; no costs, rates, or editing |

Role checks run server-side. A role change takes effect after the user signs
in again (the role is carried in the session token).

## Deliberately out of scope

Leads, estimates, contracts, invoices, client portal, CRM features.
Anything that smells like a CRM belongs to RealSync, not Baseline.

## Stack

Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS 4 + Prisma 7
+ Postgres (Neon). Auth.js v5 for auth. One provider and one adapter for dev
and prod — no SQLite. Server components for reads, server actions for
creates. No extra UI libraries.

## Getting started

```bash
npm install          # also runs `prisma generate` (postinstall)
cp .env.example .env # DATABASE_URL=<Neon connection string>, AUTH_SECRET=<generated secret>
npx prisma migrate dev
npm run db:seed      # or: npm run seed
npm run dev          # http://localhost:3000
```

`DATABASE_URL` is the Neon Postgres connection string (create a database
for Baseline in the Neon dashboard; strip `channel_binding=require` — Prisma
does not support SCRAM channel binding). `AUTH_SECRET` signs the session JWT
— generate one with `openssl rand -base64 32`. Never commit a real value.

Scripts:

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Production build / serve it |
| `npm run db:seed` | Re-seed the database with sample data (wipes the sample job data — jobs, costs, time logs, crew, assignments; user accounts are untouched) |
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

The seed loads 6 crew, 5 jobs, 24 cost entries, 45 time logs, and 20
assignments: 3 active jobs, $299,500 total budget, $197,260 spent, $102,240
under budget overall — with Downtown Café $7,338 over budget on purpose so
the alert is visible. Seed dates are relative to today, so the schedule week
always shows assignments on first run.

## Deploying (Vercel + Neon)

1. Create a Neon database for Baseline and copy its connection string
   (pooled; strip `channel_binding=require`).
2. Import the repo in the Vercel dashboard. Root directory is the repo
   root. Set the environment variables: `DATABASE_URL` (Neon connection
   string), `AUTH_SECRET` (generate with `openssl rand -base64 32`), and
   `AUTH_TRUST_HOST=true`.
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
- **Sign-in fails at runtime**: check that `AUTH_SECRET` is set (and
  `AUTH_TRUST_HOST=true` in Vercel). Without `AUTH_SECRET`, Auth.js cannot
  sign sessions and sign-in will fail.
