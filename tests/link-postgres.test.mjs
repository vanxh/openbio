import { afterAll, beforeAll, expect, mock, test } from 'bun:test';
import { SQL } from 'bun';
import { drizzle } from 'drizzle-orm/pg-proxy';
import { MAX_BENTO_CARDS } from '../src/lib/bento-limits';
import * as schema from '../src/server/db/schema';

// Exercises the profile/bento write helpers against a real PostgreSQL server,
// because their correctness lives in SQL (JSON rewrites, concurrent updates).
//
//   LINK_TEST_DATABASE_URL=postgresql://localhost/postgres bun run test:link:postgres
//
// The connecting role must be allowed to create databases. The test creates a
// uniquely named database, and drops it again when it finishes.

const adminUrl = process.env.LINK_TEST_DATABASE_URL;
const databaseName = `link_test_${crypto.randomUUID().replaceAll('-', '')}`;

const AT_MOST_RE = /at most/;
const UPGRADE_RE = /upgrade/i;
const PRO_RE = /Pro/;
const ALREADY_CONNECTED_RE = /already connected/;
const NOT_FOUND_RE = /not found/i;
const NOT_COLLECTING_RE = /not collecting/;

/** In-memory stand-in for Upstash, so cache invalidation can be asserted. */
const cache = new Map();
const redis = {
  get: (key) => Promise.resolve(cache.get(key) ?? null),
  set: (key, value) => {
    cache.set(key, structuredClone(value));
    return Promise.resolve('OK');
  },
  del: (key) => Promise.resolve(cache.delete(key) ? 1 : 0),
};

/** Calls made to the (mocked) Vercel domains API. */
const vercelCalls = [];

let admin;
let pool;
let utils;
let db;
let createCaller;

/** A tRPC caller for the profile router, signed in as `userId` (or nobody). */
const callerFor = (userId) =>
  createCaller({
    db,
    session: userId ? { user: { id: userId } } : null,
    req: { headers: new Headers() },
  });

const seedUser = async (id, { plan = 'free', paidUntil = null } = {}) => {
  await pool`insert into "user" (id, name, email, plan, subscription_ends_at) values (${id}, ${id}, ${`${id}@example.com`}, ${plan}, ${paidUntil}) on conflict (id) do update set plan = excluded.plan, subscription_ends_at = excluded.subscription_ends_at`;
};

const position = (x, y) => ({ sm: { x, y }, md: { x, y } });
const note = (id, text = id) => ({
  id,
  type: 'note',
  text,
  size: { sm: '2x2', md: '2x2' },
  position: position(0, 0),
});

const storedBento = async (slug) => {
  const rows = await pool`select bento from link where link = ${slug}`;
  return rows[0]?.bento;
};

const seedProfile = async (slug, bento = []) => {
  cache.clear();
  await pool`delete from link where link = ${slug}`;
  const rows =
    await pool`insert into link (link, name, user_id, bento) values (${slug}, ${slug}, 'user-1', ${JSON.stringify(bento)}::text::json) returning id`;
  return rows[0].id;
};

beforeAll(async () => {
  if (!adminUrl) {
    return;
  }

  admin = new SQL(adminUrl);
  await admin.unsafe(`create database "${databaseName}"`);

  const url = new URL(adminUrl);
  url.pathname = `/${databaseName}`;
  pool = new SQL({ url: url.toString(), max: 8 });

  // Mirrors src/server/db/schema for the tables these helpers touch.
  const statements = [
    `create table "user" (
      id text primary key,
      name text not null,
      email text not null unique,
      email_verified boolean not null default false,
      image text,
      plan text not null default 'free',
      polar_customer_id text unique,
      subscription_id text,
      subscription_ends_at timestamptz,
      trial_ends_at timestamptz,
      ai_credits integer not null default 0,
      ai_credits_reset_at timestamptz,
      email_digest boolean not null default true,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )`,
    `create table link (
      id uuid primary key default gen_random_uuid(),
      link text not null unique,
      image text,
      name text not null,
      bio text,
      bento json not null default '[]',
      custom_domain text unique,
      theme text not null default 'default',
      accent_color text,
      dark_mode boolean not null default false,
      custom_footer text,
      is_public boolean not null default true,
      created_at timestamptz default now(),
      updated_at timestamptz default now(),
      user_id text not null
    )`,
    `create table link_view (
      id uuid primary key default gen_random_uuid(),
      ip text not null,
      user_agent text not null,
      referrer text,
      country varchar(2),
      created_at timestamptz default now(),
      updated_at timestamptz default now(),
      link_id uuid not null
    )`,
    `create table email_subscriber (
      id uuid primary key default gen_random_uuid(),
      email text not null,
      link_id uuid not null,
      created_at timestamptz not null default now()
    )`,
    `create table link_click (
      id uuid primary key default gen_random_uuid(),
      bento_id text not null,
      href text not null,
      ip text not null,
      user_agent text not null,
      referrer text,
      created_at timestamptz default now(),
      link_id uuid not null
    )`,
  ];
  for (const statement of statements) {
    await pool.unsafe(statement);
  }

  db = drizzle(
    async (text, params, method) => {
      const query = pool.unsafe(text, params);
      return { rows: method === 'all' ? await query.values() : await query };
    },
    { schema }
  );

  mock.module('@/server/db/db', () => ({ db }));
  mock.module('@/lib/redis', () => ({ redis }));
  mock.module('@/lib/auth', () => ({
    auth: { api: { getSession: () => Promise.resolve(null) } },
  }));
  mock.module('@/lib/ratelimit', () => {
    const allow = { limit: () => Promise.resolve({ success: true }) };
    return { generalLimit: allow, subscribeLimit: allow, fetchLimit: allow };
  });
  mock.module('@/lib/vercel', () => ({
    addDomainToVercel: (domain) => {
      vercelCalls.push(['add', domain]);
      return Promise.resolve({ success: true });
    },
    removeDomainFromVercel: (domain) => {
      vercelCalls.push(['remove', domain]);
      return Promise.resolve({ success: true });
    },
    getDomainConfig: () => Promise.resolve({ misconfigured: false }),
    verifyDomain: () => Promise.resolve({ verified: true, verification: [] }),
  }));

  utils = await import('../src/server/db/utils/link');
  const { profileLinkRouter } = await import(
    '../src/server/api/routers/profile-link'
  );
  const { createCallerFactory } = await import('../src/server/api/trpc');
  createCaller = createCallerFactory(profileLinkRouter);
});

afterAll(async () => {
  if (!adminUrl) {
    return;
  }
  await pool?.close();
  await admin.unsafe(`drop database if exists "${databaseName}" with (force)`);
  await admin.close();
});

test.skipIf(!adminUrl)(
  'adds, edits, moves and deletes cards in place',
  async () => {
    await seedProfile('cards', [note('a'), note('b'), note('c')]);

    const afterAdd = await utils.addProfileLinkBento('cards', note('d'));
    expect(afterAdd.map((b) => b.id)).toEqual(['a', 'b', 'c', 'd']);

    await utils.updateProfileLinkBento('cards', note('b', 'edited'));
    let bento = await storedBento('cards');
    expect(bento.map((b) => b.id)).toEqual(['a', 'b', 'c', 'd']);
    expect(bento.find((b) => b.id === 'b').text).toBe('edited');
    expect(bento.find((b) => b.id === 'a').text).toBe('a');

    await utils.updateProfileLinkBentoPositions('cards', {
      a: position(1, 2),
      c: position(3, 4),
      missing: position(9, 9),
    });
    bento = await storedBento('cards');
    expect(bento.map((b) => b.id)).toEqual(['a', 'b', 'c', 'd']);
    expect(bento.find((b) => b.id === 'a').position).toEqual(position(1, 2));
    expect(bento.find((b) => b.id === 'c').position).toEqual(position(3, 4));
    // Untouched cards, and untouched fields of moved cards, are preserved.
    expect(bento.find((b) => b.id === 'b').position).toEqual(position(0, 0));
    expect(bento.find((b) => b.id === 'b').text).toBe('edited');
    expect(bento.find((b) => b.id === 'a')).toMatchObject({
      type: 'note',
      text: 'a',
      size: { sm: '2x2', md: '2x2' },
    });

    await utils.deleteProfileLinkBento('cards', 'b');
    bento = await storedBento('cards');
    expect(bento.map((b) => b.id)).toEqual(['a', 'c', 'd']);

    await utils.setProfileLinkBento('cards', [note('z')]);
    expect((await storedBento('cards')).map((b) => b.id)).toEqual(['z']);
  }
);

test.skipIf(!adminUrl)(
  'deleting the last card leaves an empty array, not null',
  async () => {
    await seedProfile('last-card', [note('only')]);
    await utils.deleteProfileLinkBento('last-card', 'only');
    expect(await storedBento('last-card')).toEqual([]);

    // Editing or moving cards on an empty profile must not null the column.
    await utils.updateProfileLinkBento('last-card', note('ghost'));
    await utils.updateProfileLinkBentoPositions('last-card', {
      ghost: position(1, 1),
    });
    expect(await storedBento('last-card')).toEqual([]);
  }
);

test.skipIf(!adminUrl)(
  'overlapping writes do not lose each other',
  async () => {
    await seedProfile('race', [note('seed')]);

    const ids = Array.from({ length: 24 }, (_, i) => `card-${i}`);
    await Promise.all(
      ids.map((id) => utils.addProfileLinkBento('race', note(id)))
    );
    let bento = await storedBento('race');
    expect(bento).toHaveLength(25);
    expect(new Set(bento.map((b) => b.id))).toEqual(new Set(['seed', ...ids]));

    // A text edit, a move and deletions landing together must all survive.
    await Promise.all([
      utils.updateProfileLinkBento('race', {
        ...note('card-0', 'edited'),
        position: position(7, 7),
      }),
      utils.updateProfileLinkBentoPositions('race', {
        'card-1': position(5, 5),
      }),
      utils.deleteProfileLinkBento('race', 'card-2'),
      utils.deleteProfileLinkBento('race', 'card-3'),
      utils.addProfileLinkBento('race', note('late')),
    ]);
    bento = await storedBento('race');
    const byId = new Map(bento.map((b) => [b.id, b]));
    expect(byId.get('card-0').text).toBe('edited');
    expect(byId.get('card-1').position).toEqual(position(5, 5));
    expect(byId.has('card-2')).toBe(false);
    expect(byId.has('card-3')).toBe(false);
    expect(byId.has('late')).toBe(true);
    expect(bento).toHaveLength(24);
  }
);

test.skipIf(!adminUrl)('caps the number of cards on a profile', async () => {
  const full = Array.from({ length: MAX_BENTO_CARDS }, (_, i) =>
    note(`card-${i}`)
  );
  await seedProfile('full', full);

  await expect(
    utils.addProfileLinkBento('full', note('extra'))
  ).rejects.toThrow(AT_MOST_RE);
  expect(await storedBento('full')).toHaveLength(MAX_BENTO_CARDS);
});

test.skipIf(!adminUrl)('writes invalidate the cached profile', async () => {
  await seedProfile('cached', [note('a')]);

  const first = await utils.getProfileLinkByLink('cached');
  expect(first.bento).toHaveLength(1);
  expect(cache.has('profile-link:cached')).toBe(true);

  await utils.addProfileLinkBento('cached', note('b'));
  expect(cache.has('profile-link:cached')).toBe(false);
  expect((await utils.getProfileLinkByLink('cached')).bento).toHaveLength(2);

  const before = await pool`select updated_at from link where link = 'cached'`;
  const updated = await utils.updateProfileLink({
    id: first.id,
    name: 'Renamed',
  });
  expect(updated.name).toBe('Renamed');
  expect(updated.link).toBe('cached');
  expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(
    new Date(before[0].updated_at).getTime()
  );
  expect(cache.has('profile-link:cached')).toBe(false);
});

test.skipIf(!adminUrl)('creating a taken slug fails cleanly', async () => {
  await seedProfile('taken');
  await expect(
    utils.createProfileLink({
      link: 'taken',
      name: 'Other',
      userId: 'user-2',
      bento: [],
    })
  ).rejects.toThrow('This profile link is not available');

  const created = await utils.createProfileLink({
    link: 'fresh',
    name: 'Fresh',
    userId: 'user-2',
    bento: [note('a')],
  });
  expect(created.link).toBe('fresh');
  expect(created.userId).toBe('user-2');
});

test.skipIf(!adminUrl)(
  'deleting a profile removes its analytics rows',
  async () => {
    const id = await seedProfile('doomed', [note('a')]);
    const otherId = await seedProfile('survivor');
    await pool`insert into link_view (link_id, ip, user_agent) values (${id}, '1.1.1.1', 'ua'), (${otherId}, '1.1.1.1', 'ua')`;
    await pool`insert into link_click (link_id, bento_id, href, ip, user_agent) values (${id}, 'a', 'https://example.com', '1.1.1.1', 'ua'), (${otherId}, 'a', 'https://example.com', '1.1.1.1', 'ua')`;

    const removed = await utils.deleteProfileLink('doomed');
    expect(removed.id).toBe(id);

    const count = async (table, linkId) =>
      Number(
        (
          await pool.unsafe(
            `select count(*) from ${table} where link_id = $1`,
            [linkId]
          )
        )[0].count
      );
    expect(await count('link_view', id)).toBe(0);
    expect(await count('link_click', id)).toBe(0);
    expect(await count('link_view', otherId)).toBe(1);
    expect(await count('link_click', otherId)).toBe(1);

    expect(await utils.deleteProfileLink('doomed')).toBeNull();
  }
);

// --- Router ---------------------------------------------------------------

test.skipIf(!adminUrl)(
  'a new profile gets cards for its socials only',
  async () => {
    await seedUser('creator');
    await pool`delete from link where user_id = 'creator'`;

    const created = await callerFor('creator').create({
      link: 'newbie',
      name: 'New <b>Person</b>',
      bio: 'I <3 design & code',
      twitter: '@newbie',
      github: 'newbie',
    });
    expect(created.name).toBe('New <b>Person</b>');
    // Plain text from the form is stored as escaped HTML for the bio editor.
    expect(created.bio).toBe('<p>I &lt;3 design &amp; code</p>');

    // Bun's SQL client encodes a string bound to a json column a second time,
    // so this one insert reads back as a JSON string here. Neon's driver, used
    // in production, sends it as text and stores the array itself.
    const stored = await storedBento('newbie');
    const bento = typeof stored === 'string' ? JSON.parse(stored) : stored;
    expect(bento.map((b) => b.href)).toEqual([
      'https://x.com/newbie',
      'https://github.com/newbie',
    ]);
    expect(bento.map((b) => b.position.md)).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
    ]);

    // Free accounts get one page.
    await expect(
      callerFor('creator').create({ link: 'second-page', name: 'Again' })
    ).rejects.toThrow(UPGRADE_RE);
  }
);

test.skipIf(!adminUrl)(
  'free accounts can save free themes but not Pro settings',
  async () => {
    await seedUser('free-user');
    const id = await seedProfile('free-page');
    await pool`update link set user_id = 'free-user' where id = ${id}`;
    const caller = callerFor('free-user');

    // Exactly what the theme dialog sends for a free account.
    const saved = await caller.update({
      id,
      theme: 'default',
      darkMode: false,
      accentColor: null,
      customFooter: null,
    });
    expect(saved.theme).toBe('default');

    const { THEME_PRESETS } = await import('../src/lib/themes');
    const proTheme = THEME_PRESETS.find((t) => t.pro).name;
    const freeTheme = THEME_PRESETS.find((t) => !t.pro && t.name !== 'default');
    if (freeTheme) {
      expect((await caller.update({ id, theme: freeTheme.name })).theme).toBe(
        freeTheme.name
      );
    }

    for (const change of [
      { theme: proTheme },
      { darkMode: true },
      { accentColor: '#ff0000' },
      { customFooter: 'Made by me' },
      { customDomain: 'bio.example.com' },
    ]) {
      await expect(caller.update({ id, ...change })).rejects.toThrow(PRO_RE);
    }

    // Someone else's profile is never editable.
    await seedUser('stranger');
    await expect(
      callerFor('stranger').update({ id, name: 'Hijacked' })
    ).rejects.toThrow();
    await expect(
      callerFor(null).update({ id, name: 'Anon' })
    ).rejects.toThrow();
  }
);

test.skipIf(!adminUrl)(
  'Pro settings survive a lapse and can still be cleared',
  async () => {
    const future = new Date(Date.now() + 86_400_000);
    await seedUser('pro-user', { plan: 'pro', paidUntil: future });
    const id = await seedProfile('pro-page');
    await pool`update link set user_id = 'pro-user' where id = ${id}`;
    const caller = callerFor('pro-user');

    vercelCalls.length = 0;
    const { THEME_PRESETS } = await import('../src/lib/themes');
    const proTheme = THEME_PRESETS.find((t) => t.pro).name;
    await caller.update({
      id,
      theme: proTheme,
      darkMode: true,
      accentColor: '#7c3aed',
      customFooter: 'Made by me',
    });
    await caller.update({ id, customDomain: 'Bio.Example.com' });
    expect(vercelCalls).toEqual([['add', 'bio.example.com']]);
    expect(
      (await pool`select custom_domain from link where id = ${id}`)[0]
        .custom_domain
    ).toBe('bio.example.com');

    // Another profile cannot take a domain that is already connected.
    await seedUser('rival', { plan: 'pro', paidUntil: future });
    const rivalId = await seedProfile('rival-page');
    await pool`update link set user_id = 'rival' where id = ${rivalId}`;
    vercelCalls.length = 0;
    await expect(
      callerFor('rival').update({
        id: rivalId,
        customDomain: 'bio.example.com',
      })
    ).rejects.toThrow(ALREADY_CONNECTED_RE);
    expect(vercelCalls).toEqual([]);
    await expect(
      callerFor('rival').checkDomain({ domain: 'bio.example.com' })
    ).rejects.toThrow(NOT_FOUND_RE);
    expect(
      (await caller.checkDomain({ domain: 'bio.example.com' })).verified
    ).toBe(true);

    // Subscription lapses: existing values may be re-saved, and removed.
    await seedUser('pro-user', { plan: 'free' });
    await caller.update({
      id,
      theme: proTheme,
      darkMode: true,
      accentColor: '#7c3aed',
      customFooter: 'Made by me',
    });
    vercelCalls.length = 0;
    const cleared = await caller.update({ id, customDomain: null });
    expect(cleared.customDomain).toBeNull();
    expect(vercelCalls).toEqual([['remove', 'bio.example.com']]);
    await expect(
      caller.update({ id, customDomain: 'other.example.com' })
    ).rejects.toThrow(PRO_RE);
  }
);

test.skipIf(!adminUrl)(
  'explore pages through every public profile exactly once',
  async () => {
    await pool`delete from link`;
    const base = Date.UTC(2026, 0, 1);
    // Two profiles share a timestamp, to exercise the id tie-break.
    const offsets = [0, 1, 2, 2, 3, 4, 5];
    for (const [i, offset] of offsets.entries()) {
      await pool`insert into link (link, name, user_id, created_at) values (${`public-${i}`}, ${`P${i}`}, 'user-1', ${new Date(base + offset * 60_000)})`;
    }
    await pool`insert into link (link, name, user_id, is_public) values ('hidden', 'Hidden', 'user-1', false)`;

    const caller = callerFor(null);
    const seen = [];
    let cursor;
    for (let page = 0; page < 10; page++) {
      const result = await caller.listPublic({ limit: 3, cursor });
      seen.push(...result.profiles.map((p) => p.link));
      cursor = result.nextCursor;
      if (!cursor) {
        break;
      }
    }

    expect(seen).toHaveLength(7);
    expect(new Set(seen).size).toBe(7);
    expect(seen).not.toContain('hidden');
    // Newest first; the two tied profiles may come in either order.
    expect(seen[0]).toBe('public-6');
    expect(seen[1]).toBe('public-5');
    expect(seen[2]).toBe('public-4');
    expect(new Set(seen.slice(3, 5))).toEqual(
      new Set(['public-2', 'public-3'])
    );
    expect(seen.slice(5)).toEqual(['public-1', 'public-0']);
  }
);

test.skipIf(!adminUrl)(
  'card procedures reject other accounts and unsafe links',
  async () => {
    await seedUser('owner');
    await seedUser('intruder');
    const id = await seedProfile('guarded', [note('a')]);
    await pool`update link set user_id = 'owner' where id = ${id}`;
    cache.clear();

    const intruder = callerFor('intruder');
    await expect(
      intruder.createBento({ link: 'guarded', bento: note('x') })
    ).rejects.toThrow();
    await expect(
      intruder.setBento({ link: 'guarded', bento: [] })
    ).rejects.toThrow();
    await expect(
      intruder.updateBentoPositions({
        link: 'guarded',
        positions: { a: position(1, 1) },
      })
    ).rejects.toThrow();
    await expect(
      intruder.deleteBento({ link: 'guarded', id: 'a' })
    ).rejects.toThrow();
    expect((await storedBento('guarded')).map((b) => b.id)).toEqual(['a']);

    const owner = callerFor('owner');
    await expect(
      owner.createBento({
        link: 'guarded',
        bento: {
          id: 'bad',
          type: 'link',
          href: 'javascript:alert(1)',
          size: { sm: '2x2', md: '2x2' },
          position: position(0, 0),
        },
      })
    ).rejects.toThrow();

    await owner.createBento({
      link: 'guarded',
      bento: {
        id: 'good',
        type: 'link',
        href: 'example.com',
        size: { sm: '2x2', md: '2x2' },
        position: position(0, 0),
      },
    });
    await owner.updateBentoPositions({
      link: 'guarded',
      positions: { good: position(2, 3) },
    });
    const bento = await storedBento('guarded');
    expect(bento.find((b) => b.id === 'good')).toMatchObject({
      href: 'https://example.com/',
      position: position(2, 3),
    });

    await owner.delete({ link: 'guarded' });
    expect(await storedBento('guarded')).toBeUndefined();
  }
);

test.skipIf(!adminUrl)(
  'public tracking only records what the profile really has',
  async () => {
    const linkCard = {
      id: 'site',
      type: 'link',
      href: 'https://example.com/',
      clicks: 0,
      size: { sm: '2x2', md: '2x2' },
      position: position(0, 0),
    };
    const id = await seedProfile('tracked', [linkCard, note('a')]);
    const visitor = callerFor(null);
    const clicks = async () =>
      pool`select bento_id, href from link_click where link_id = ${id}`;

    // A card that is not on the profile, and a card that is not a link.
    await visitor.trackClick({
      linkId: id,
      bentoId: 'invented',
      href: 'https://spam.example',
    });
    await visitor.trackClick({
      linkId: id,
      bentoId: 'a',
      href: 'https://spam.example',
    });
    expect(await clicks()).toHaveLength(0);

    // A real card is recorded under its own URL, whatever the caller claims.
    await visitor.trackClick({
      linkId: id,
      bentoId: 'site',
      href: 'https://spam.example',
    });
    const recorded = await clicks();
    expect(recorded).toHaveLength(1);
    expect(recorded[0].bento_id).toBe('site');
    expect(recorded[0].href).toBe('https://example.com/');

    // No sign-up card on the profile: nothing is collected.
    await expect(
      visitor.subscribe({ linkId: id, email: 'fan@example.com' })
    ).rejects.toThrow(NOT_COLLECTING_RE);

    const collectingId = await seedProfile('collecting', [
      {
        id: 'signup',
        type: 'email-collect',
        size: { sm: '2x2', md: '2x2' },
        position: position(0, 0),
      },
    ]);
    expect(
      await visitor.subscribe({
        linkId: collectingId,
        email: ' Fan@Example.com ',
      })
    ).toEqual({ subscribed: true });
    await visitor.subscribe({ linkId: collectingId, email: 'fan@example.com' });
    const subscribers =
      await pool`select email from email_subscriber where link_id = ${collectingId}`;
    expect(subscribers.map((s) => s.email)).toEqual(['fan@example.com']);
  }
);
