import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Postgres (Neon) connection string from DATABASE_URL. The dummy
    // fallback only lets `prisma generate` (postinstall) run on a fresh
    // clone before `.env` exists — any command that touches the database
    // (migrate, seed, studio) needs the real Neon URL in `.env`.
    url:
      process.env.DATABASE_URL ??
      "postgresql://user:password@localhost:5432/baseline",
  },
});
