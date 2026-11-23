import { describe, expect, test } from 'bun:test';
import { NextRequest } from 'next/server';
import { proxy } from '../src/proxy';

const SESSION_COOKIE = 'better-auth.session_token=abc.def';

const run = (url: string, { cookie }: { cookie?: string } = {}) => {
  const { host } = new URL(url);
  return proxy(
    new NextRequest(url, {
      headers: { host, ...(cookie && { cookie }) },
    })
  );
};

/** Where a redirect response points, as path + query; null if not a redirect. */
const redirectTarget = (res: Response) => {
  const location = res.headers.get('location');
  if (!location) {
    return null;
  }
  const url = new URL(location);
  return `${url.pathname}${url.search}`;
};

const rewriteTarget = (res: Response) => {
  const rewrite = res.headers.get('x-middleware-rewrite');
  return rewrite ? new URL(rewrite).pathname : null;
};

describe('auth guard', () => {
  test('sends signed-out visitors from the dashboard to sign-up', async () => {
    const res = await run('https://openbio.app/app');
    expect(redirectTarget(res)).toBe('/app/sign-up');
  });

  test('remembers where a signed-out visitor was headed', async () => {
    const res = await run('https://openbio.app/create-link?link=vanxh');
    const location = new URL(res.headers.get('location') ?? '');
    expect(location.pathname).toBe('/app/sign-up');
    expect(location.searchParams.get('redirectUrl')).toBe(
      '/create-link?link=vanxh'
    );
  });

  test('leaves sign-in, sign-up and password reset reachable', async () => {
    for (const path of [
      '/app/sign-in',
      '/app/sign-up',
      '/app/reset-password',
      '/app/reset-password?token=abc',
    ]) {
      const res = await run(`https://openbio.app${path}`);
      expect(redirectTarget(res)).toBeNull();
    }
  });

  test('does not treat profile slugs as protected sections', async () => {
    // Slugs share the root namespace with /app and /create-link.
    for (const path of ['/appleseed', '/application', '/create-linkz']) {
      const res = await run(`https://openbio.app${path}`);
      expect(redirectTarget(res)).toBeNull();
    }
  });

  test('lets signed-in users through', async () => {
    const res = await run('https://openbio.app/app', {
      cookie: SESSION_COOKIE,
    });
    expect(redirectTarget(res)).toBeNull();
  });
});

describe('subdomain routing', () => {
  test('rewrites a profile subdomain to its page', async () => {
    const res = await run('https://vanxh.openbio.app/');
    expect(rewriteTarget(res)).toBe('/vanxh');
  });

  test('passes API and dashboard paths through untouched', async () => {
    for (const path of ['/api/trpc/x', '/app', '/admin']) {
      const res = await run(`https://vanxh.openbio.app${path}`);
      expect(rewriteTarget(res)).toBeNull();
    }
  });

  test('a path that merely starts with "app" is part of the profile', async () => {
    const res = await run('https://vanxh.openbio.app/apple');
    expect(rewriteTarget(res)).toBe('/vanxh/apple');
  });

  test('www and the bare domain are not profiles', async () => {
    for (const host of ['www.openbio.app', 'openbio.app']) {
      const res = await run(`https://${host}/`);
      expect(rewriteTarget(res)).toBeNull();
    }
  });
});

describe('other hosts', () => {
  test('preview deployments are served as the app itself', async () => {
    const res = await run('https://openbio-git-main.vercel.app/');
    expect(rewriteTarget(res)).toBeNull();
    expect(redirectTarget(res)).toBeNull();

    const guarded = await run('https://openbio-git-main.vercel.app/app');
    expect(redirectTarget(guarded)).toBe('/app/sign-up');
  });
});
