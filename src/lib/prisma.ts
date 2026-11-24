import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

// Postgres (Neon) everywhere — dev and prod share one provider and one
// adapter. DATABASE_URL is the Neon connection string, e.g.
// "postgresql://user:password@host/db?sslmode=require" (see .env.example).
// The pool connects lazily on first query; constructing it never touches
// the network, so `next build` works without a live database.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
