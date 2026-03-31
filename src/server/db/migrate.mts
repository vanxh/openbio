import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http';
import { migrate as migrateNeon } from 'drizzle-orm/neon-http/migrator';
import { env } from '../../env.mjs';

const main = async () => {
  await migrateNeon(drizzleNeon(neon(env.DATABASE_URL)), {
    migrationsFolder: 'src/server/db/drizzle',
  });

  process.exit(0);
};

main().catch((_e) => {
  process.exit(1);
});
