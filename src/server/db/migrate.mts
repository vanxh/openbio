import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { migrate as migrateNeon } from "drizzle-orm/neon-http/migrator";
import { env } from "../../env.mjs";

const main = async () => {
  console.log("Migrating database...");

  await migrateNeon(drizzleNeon(neon(env.DATABASE_URL)), {
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
