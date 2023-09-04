import "dotenv/config";
import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import { migrate as migratePostgres } from "drizzle-orm/postgres-js/migrator";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { migrate as migrateNeon } from "drizzle-orm/neon-http/migrator";
import postgres from "postgres";

import { env } from "../../env.mjs";

neonConfig.fetchConnectionCache = true;

const main = async () => {
  console.log("Migrating database...");

  env.NODE_ENV === "production"
    ? await migrateNeon(drizzleNeon(neon(env.DATABASE_URL)), {
        migrationsFolder: "src/server/db/drizzle",
      })
    : await migratePostgres(drizzlePostgres(postgres(env.DATABASE_URL)), {
        migrationsFolder: "src/server/db/drizzle",
      });

  console.log("Database migrated");

  process.exit(0);
};

main().catch((e) => {
  console.error("Failed to migrate database");
  console.error(e);
  process.exit(1);
});
