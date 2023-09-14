import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";

import { env } from "@/env.mjs";
import * as schema from "./schema";

neonConfig.fetchConnectionCache = true;

export const db = drizzleNeon(neon(env.DATABASE_URL), {
  schema,
});
