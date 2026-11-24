import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

// SQLite file for local dev. DATABASE_URL is "file:./dev.db" (resolved
// relative to the repo root, same file `prisma migrate` uses). For the
// Neon/Postgres move, swap this adapter for the Postgres one (see README).
function resolveSqliteUrl(raw: string | undefined): string {
  const fallback = path.join(process.cwd(), "dev.db");
  if (!raw) return `file:${fallback}`;
  const match = raw.match(/^file:(.+)$/);
  if (!match) return raw;
  const p = match[1];
  // Local dev only: a relative file: path is resolved against the repo root
  // (same file `prisma migrate` uses). The ignore comment keeps Turbopack
  // from tracing the whole project for this dynamic path.
  const abs = path.isAbsolute(p)
    ? p
    : path.join(/* turbopackIgnore: true */ process.cwd(), p);
  return `file:${abs}`;
}

const adapter = new PrismaBetterSqlite3({
  url: resolveSqliteUrl(process.env.DATABASE_URL),
});

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
