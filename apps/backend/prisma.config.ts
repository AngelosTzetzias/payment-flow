import "dotenv/config";
import { defineConfig } from "prisma/config";

// Prisma 7 central config. Env vars are no longer auto-loaded by the CLI, so we
// load .env explicitly above. The connection URL lives here (no longer in the
// schema datasource block) and is used by Migrate; the runtime client connects
// via the @prisma/adapter-pg driver adapter (see src/prisma/prisma.service.ts).
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL,
  },
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
