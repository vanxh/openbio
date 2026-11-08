import { afterAll, beforeEach, describe, expect, mock, test } from 'bun:test';
import { isAdminUser } from '../src/lib/admin-access';
import {
  adminCsv,
  adminDirectorySchema,
  adminPeriodSchema,
  adminUpdateUserSchema,
} from '../src/server/api/schemas/admin';

// Keep authorization tests independent of credentials and external services.
mock.module('@/lib/auth', () => ({
  auth: { api: { getSession: async () => null } },
}));
mock.module('@/server/db/db', () => ({ db: {} }));
const invalidate = mock(async () => 1);
mock.module('@/lib/redis', () => ({ redis: { del: invalidate } }));
const { adminRouter } = await import('../src/server/api/routers/admin');
const originalAllowlist = process.env.ADMIN_USER_IDS;
afterAll(() => {
  if (originalAllowlist === undefined) {
    process.env.ADMIN_USER_IDS = undefined;
  } else {
    process.env.ADMIN_USER_IDS = originalAllowlist;
  }
});
beforeEach(() => {
  process.env.ADMIN_USER_IDS = 'admin-1, admin-2';
  invalidate.mockClear();
});

function caller(id: string | null, db: unknown = {}) {
  return adminRouter.createCaller({
    db,
    req: new Request('http://localhost/api/trpc'),
    session: id ? { user: { id } } : null,
  } as Parameters<typeof adminRouter.createCaller>[0]);
}

const protectedCalls = (client: ReturnType<typeof caller>) => [
  () => client.overview({ days: 7 }),
  () => client.users({}),
  () => client.profiles({}),
  () => client.system(),
  () =>
    client.updateUser({
      id: 'member',
      name: 'Member',
      aiCredits: 5,
      emailVerified: false,
    }),
  () => client.revokeSessions({ id: 'member' }),
  () =>
    client.setDiscovery({
      id: '00000000-0000-4000-8000-000000000000',
      listed: false,
    }),
];

describe('admin authorization', () => {
  test('fails closed without an allowlist and matches whole user IDs', () => {
    process.env.ADMIN_USER_IDS = undefined;
    expect(isAdminUser('admin-1')).toBe(false);
    process.env.ADMIN_USER_IDS = ' admin-1, ,admin-2,admin-1 ';
    expect(isAdminUser(undefined)).toBe(false);
    expect(isAdminUser('')).toBe(false);
    expect(isAdminUser('admin')).toBe(false);
    expect(isAdminUser('ADMIN-1')).toBe(false);
    expect(isAdminUser('admin-1')).toBe(true);
  });

  test('every reporting and mutation endpoint rejects anonymous requests', async () => {
    for (const call of protectedCalls(caller(null))) {
      await expect(call()).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    }
  });

  test('every reporting and mutation endpoint rejects ordinary users before using the database', async () => {
    for (const call of protectedCalls(caller('member'))) {
      await expect(call()).rejects.toMatchObject({ code: 'FORBIDDEN' });
    }
  });

  test('access indicator is computed server-side', async () => {
    expect(await caller('admin-1').access()).toEqual({ allowed: true });
    expect(await caller('member').access()).toEqual({ allowed: false });
    await expect(caller(null).access()).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    });
  });

  test('an admin cannot revoke their own or another admin’s sessions', async () => {
    await expect(
      caller('admin-1').revokeSessions({ id: 'admin-1' })
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    await expect(
      caller('admin-1').revokeSessions({ id: 'admin-2' })
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });

  test('revocation deletes sessions and reports the affected count', async () => {
    const remove = mock(() => ({
      where: () => ({ returning: async () => [{ id: 'one' }, { id: 'two' }] }),
    }));
    expect(
      await caller('admin-1', { delete: remove }).revokeSessions({
        id: 'member',
      })
    ).toEqual({ count: 2 });
    expect(remove).toHaveBeenCalledTimes(1);
  });

  test('user edits cannot change plan, identity, or billing fields', async () => {
    let changes: Record<string, unknown> = {};
    const db = {
      update: () => ({
        set: (value: Record<string, unknown>) => {
          changes = value;
          return {
            where: () => ({ returning: async () => [{ id: 'member' }] }),
          };
        },
      }),
    };
    await caller('admin-1', db).updateUser({
      id: 'member',
      name: ' New Name ',
      aiCredits: 25,
      emailVerified: true,
      plan: 'business',
      email: 'attacker@example.com',
    } as never);
    expect(changes.name).toBe('New Name');
    expect(changes.aiCredits).toBe(25);
    expect(changes.emailVerified).toBe(true);
    expect(changes.updatedAt).toBeInstanceOf(Date);
    expect(changes).not.toHaveProperty('plan');
    expect(changes).not.toHaveProperty('email');
    expect(changes).not.toHaveProperty('id');
  });

  test('missing records return NOT_FOUND', async () => {
    const db = {
      update: () => ({
        set: () => ({ where: () => ({ returning: async () => [] }) }),
      }),
    };
    await expect(
      caller('admin-1', db).updateUser({
        id: 'missing',
        name: 'Missing',
        aiCredits: 0,
        emailVerified: false,
      })
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    await expect(
      caller('admin-1', db).setDiscovery({
        id: '00000000-0000-4000-8000-000000000000',
        listed: false,
      })
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  test('discovery edits invalidate the correct profile cache', async () => {
    const db = {
      update: () => ({
        set: () => ({
          where: () => ({ returning: async () => [{ slug: 'creator' }] }),
        }),
      }),
    };
    await caller('admin-1', db).setDiscovery({
      id: '00000000-0000-4000-8000-000000000000',
      listed: false,
    });
    expect(invalidate).toHaveBeenCalledWith('profile-link:creator');
  });
});

describe('admin input validation and exports', () => {
  test('limits pagination, search size, reporting periods, and filters', () => {
    for (const value of [
      { page: 0 },
      { page: 1.5 },
      { page: 100001 },
      { search: 'x'.repeat(101) },
      { plan: 'admin' },
      { visibility: 'secret' },
    ]) {
      expect(adminDirectorySchema.safeParse(value).success).toBe(false);
    }
    expect(adminDirectorySchema.parse({})).toMatchObject({
      page: 1,
      plan: 'all',
      visibility: 'all',
    });
    expect(adminPeriodSchema.safeParse({ days: 1000 }).success).toBe(false);
    expect(adminPeriodSchema.parse({ days: 90 }).days).toBe(90);
  });

  test('rejects blank names, fractional and negative credits', () => {
    const input = {
      id: 'user',
      name: 'Member',
      aiCredits: 0,
      emailVerified: true,
    };
    for (const value of [
      { name: ' ' },
      { aiCredits: -1 },
      { aiCredits: 0.5 },
      { aiCredits: 100001 },
    ]) {
      expect(
        adminUpdateUserSchema.safeParse({ ...input, ...value }).success
      ).toBe(false);
    }
  });

  test('escapes commas, quotes, line breaks, and spreadsheet formulas', () => {
    expect(
      adminCsv([
        ['Name', 'Count'],
        ['A,"B"\nC', 2],
        [null, '=HYPERLINK("evil")'],
        [' +SUM(1)', '@command'],
      ])
    ).toBe(
      '"Name","Count"\r\n"A,""B""\nC","2"\r\n"","\'=HYPERLINK(""evil"")"\r\n"\' +SUM(1)","\'@command"'
    );
  });
});
