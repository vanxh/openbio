import { env } from '@/env.mjs';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

export const db = drizzle(neon(env.DATABASE_URL), { schema });
