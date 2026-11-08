import { mock, test } from 'bun:test';
import assert from 'node:assert/strict';
import { SQL } from 'bun';
import { drizzle } from 'drizzle-orm/pg-proxy';
import * as schema from '../src/server/db/schema';

mock.module('@/lib/auth', () => ({
  auth: { api: { getSession: async () => null } },
}));
mock.module('@/server/db/db', () => ({ db: {} }));
mock.module('@/lib/redis', () => ({ redis: { del: async () => 1 } }));
const { adminRouter } = await import('../src/server/api/routers/admin');
const databaseUrl = process.env.ADMIN_TEST_DATABASE_URL;
test.skipIf(!databaseUrl)(
  'admin queries and mutations against PostgreSQL, including a DST boundary',
  async () => {
    const originalAllowlist = process.env.ADMIN_USER_IDS;
    const databaseUrl = process.env.ADMIN_TEST_DATABASE_URL;
    if (!databaseUrl) {
      throw new Error(
        'Set ADMIN_TEST_DATABASE_URL to a PostgreSQL test database. This script creates and removes its own isolated schema.'
      );
    }
    const pool = new SQL(databaseUrl);
    const sql = await pool.reserve();
    const schemaName = `admin_test_${crypto.randomUUID().replaceAll('-', '')}`;
    await sql.unsafe(`create schema "${schemaName}"`);
    await sql.unsafe(`set search_path to "${schemaName}"`);
    try {
      const statements = [
        `create table "user" (id text primary key, name text not null, email text not null, email_verified boolean default false, image text, plan text default 'free', ai_credits integer default 0, created_at timestamptz default now(), updated_at timestamptz default now(), subscription_id text, subscription_ends_at timestamptz, trial_ends_at timestamptz)`,
        `create table link (id uuid primary key default gen_random_uuid(), name text not null, link text not null, image text, user_id text not null, is_public boolean default true, custom_domain text, created_at timestamptz default now(), updated_at timestamptz default now(), bento json default '[]')`,
        'create table link_view (id uuid primary key default gen_random_uuid(), link_id uuid, created_at timestamptz default now(), ip text, country text, referrer text)',
        'create table link_click (id uuid primary key default gen_random_uuid(), link_id uuid, created_at timestamptz default now())',
        'create table session (id text primary key, user_id text)',
      ];
      for (const statement of statements) {
        await sql.unsafe(statement);
      }
      await sql`insert into "user" (id, name, email, plan, email_verified) values ('admin-1', 'Admin', 'admin@example.com', 'business', true), ('member', 'Maya 100%', 'maya@example.com', 'pro', true), ('old', 'Old', 'old@example.com', 'free', false)`;
      await sql`update "user" set created_at = now() - interval '10 days' where id = 'old'`;
      await sql`insert into link (id, name, link, user_id, bento, custom_domain) values ('00000000-0000-4000-8000-000000000001', 'Maya', 'maya', 'member', '[{},{}]', 'maya.example.com')`;
      await sql`insert into link_view (link_id, ip, country, referrer, created_at) values ('00000000-0000-4000-8000-000000000001', '127.0.0.1', 'US', 'https://example.com', now()), ('00000000-0000-4000-8000-000000000001', '127.0.0.1', 'US', null, now()), ('00000000-0000-4000-8000-000000000001', '127.0.0.2', 'GB', null, now() - interval '10 days')`;
      await sql`insert into link_click (link_id) values ('00000000-0000-4000-8000-000000000001')`;
      await sql`insert into session values ('session-1', 'member'), ('session-2', 'member')`;
      // Serialize the proxy adapter on its reserved connection. Production uses Neon HTTP.
      let pending = Promise.resolve();
      const proxy = drizzle(
        (text, params, method) => {
          const result = pending.then(async () => {
            if (method === 'all') {
              return { rows: await sql.unsafe(text, params).values() };
            }
            return { rows: await sql.unsafe(text, params) };
          });
          pending = result.catch(() => undefined);
          return result;
        },
        { schema }
      );
      const db = new Proxy(proxy, {
        get(target, key) {
          if (key === 'execute') {
            return async (query) => ({ rows: await target.execute(query) });
          }
          const value = Reflect.get(target, key);
          return typeof value === 'function' ? value.bind(target) : value;
        },
      });
      process.env.ADMIN_USER_IDS = 'admin-1';
      const caller = adminRouter.createCaller({
        db,
        session: { user: { id: 'admin-1' } },
        req: new Request('http://localhost'),
      });
      await sql.unsafe("set time zone 'America/New_York'");
      const longPeriod = await caller.overview({ days: 90 });
      assert.equal(longPeriod.daily.length, 90);
      assert.equal(new Set(longPeriod.daily.map((day) => day.day)).size, 90);
      assert.equal(
        longPeriod.daily.reduce((sum, day) => sum + day.views, 0),
        3
      );
      const users = await caller.users({ search: '100%' });
      assert.equal(users.total, 1);
      assert.equal(users.items[0].name, 'Maya 100%');
      assert.equal(users.items[0].profileCount, 1);
      assert.equal((await caller.users({ search: "' or 1=1 --" })).total, 0);
      assert.equal((await caller.users({ plan: 'free' })).total, 1);
      const profiles = await caller.profiles({ visibility: 'listed' });
      assert.equal(profiles.total, 1);
      assert.equal(profiles.items[0].cards, 2);
      assert.equal(profiles.items[0].owner, 'maya@example.com');
      const overview = await caller.overview({ days: 7 });
      assert.equal(overview.daily.length, 7);
      assert.equal(overview.users.total, 3);
      assert.equal(overview.users.current, 2);
      assert.equal(overview.users.previous, 1);
      assert.equal(overview.views.current, 2);
      assert.equal(overview.views.previous, 1);
      assert.equal(overview.views.unique, 1);
      assert.equal(overview.clicks.current, 1);
      assert.equal(overview.topProfiles[0].views, 2);
      assert.equal(overview.profiles.domains, 1);
      assert.equal(
        overview.daily.reduce((sum, day) => sum + day.views, 0),
        2
      );
      assert.equal(
        overview.daily.reduce((sum, day) => sum + day.clicks, 0),
        1
      );
      await caller.updateUser({
        id: 'member',
        name: 'Maya updated',
        aiCredits: 73,
        emailVerified: false,
      });
      const updated = (await caller.users({ search: 'Maya updated' })).items[0];
      assert.equal(updated.aiCredits, 73);
      assert.equal(updated.emailVerified, false);
      assert.equal((await caller.revokeSessions({ id: 'member' })).count, 2);
      await caller.setDiscovery({ id: profiles.items[0].id, listed: false });
      assert.equal((await caller.profiles({ visibility: 'listed' })).total, 0);
      assert.equal(
        (await caller.profiles({ visibility: 'unlisted' })).total,
        1
      );
      assert.equal((await caller.system()).database, true);
    } finally {
      await sql.unsafe('set search_path to public');
      await sql.unsafe(`drop schema "${schemaName}" cascade`);
      sql.release();
      await pool.close();
      if (originalAllowlist === undefined) {
        process.env.ADMIN_USER_IDS = undefined;
      } else {
        process.env.ADMIN_USER_IDS = originalAllowlist;
      }
    }
  },
  30000
);
