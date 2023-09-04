import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import postgres from "postgres";

import { env } from "@/env.mjs";
import * as schema from "./schema";

neonConfig.fetchConnectionCache = true;

export const db =
  env.NODE_ENV === "production"
    ? drizzleNeon(neon(env.DATABASE_URL), {
        schema,
      })
    : drizzlePostgres(postgres(env.DATABASE_URL), { schema });
