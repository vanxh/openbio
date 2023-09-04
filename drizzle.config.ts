import "dotenv/config";
import type { Config } from "drizzle-kit";

import { env } from "@/env.mjs";

export default {
  schema: "./src/server/db/schema/index.ts",
  out: "./src/server/db/drizzle",
  dbCredentials: {
    connectionString: env.DATABASE_URL,
  },
  driver: "pg",
  strict: true,
} satisfies Config;
