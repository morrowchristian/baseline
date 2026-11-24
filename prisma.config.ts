import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // SQLite file for local dev. For Neon/Postgres later, change the
    // provider in prisma/schema.prisma and point this at the Neon URL.
    url: env("DATABASE_URL"),
  },
});
