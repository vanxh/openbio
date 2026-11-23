import { describe, expect, test } from 'bun:test';
import { isBentoConfigured } from '../src/lib/bento-configured';
import { getBillingState, getPlanFromProductId } from '../src/lib/billing';
import { getErrorMessage } from '../src/lib/errors';
import { htmlToText, serializeJsonLd } from '../src/lib/html';
import {
  generateInitialBento,
  getGridPosition,
  getSocialUrl,
} from '../src/lib/initial-bento';
import {
  describeLink,
  getPlatformKey,
  getProfileHandle,
  isFollowable,
} from '../src/lib/link-platform';
import { getNextCreditReset } from '../src/lib/plans';
import { getSafeRedirect, withRedirect } from '../src/lib/redirect';
import { WEB_PROTOCOLS, isHostOf, toSafeUrl } from '../src/lib/url';
import { CustomDomainSchema } from '../src/server/api/schemas/profile-link';
import { BentoSchema, ValidLinkSchema } from '../src/types';

describe('toSafeUrl', () => {
  test('keeps full URLs and adds https to bare domains', () => {
    expect(toSafeUrl('https://example.com/a?b=1#c')).toBe(
      'https://example.com/a?b=1#c'
    );
    expect(toSafeUrl('  example.com/page ')).toBe('https://example.com/page');
    expect(toSafeUrl('example.com:8080/x')).toBe('https://example.com:8080/x');
    expect(toSafeUrl('localhost:3000')).toBe('https://localhost:3000/');
  });

  test('allows mailto and tel for links but not for embeds', () => {
    expect(toSafeUrl('mailto:hi@example.com')).toBe('mailto:hi@example.com');
    expect(toSafeUrl('tel:+15551234567')).toBe('tel:+15551234567');
    expect(toSafeUrl('mailto:hi@example.com', WEB_PROTOCOLS)).toBeNull();
  });

  test('rejects script-bearing and non-web schemes', () => {
    for (const bad of [
      'javascript:alert(1)',
      'JaVaScRiPt:alert(1)',
      ' javascript:alert(1)',
      'data:text/html,<script>alert(1)</script>',
      'vbscript:msgbox(1)',
      'file:///etc/passwd',
      'blob:https://example.com/uuid',
      'ftp://example.com',
    ]) {
      expect(toSafeUrl(bad)).toBeNull();
    }
  });

  test('rejects text that is not a URL', () => {
    expect(toSafeUrl('')).toBeNull();
    expect(toSafeUrl('   ')).toBeNull();
    expect(toSafeUrl('hello')).toBeNull();
    expect(toSafeUrl('not a url')).toBeNull();
  });
});

describe('isHostOf', () => {
  test('matches the domain and its subdomains only', () => {
    expect(isHostOf('x.com', 'x.com')).toBe(true);
    expect(isHostOf('mobile.X.com', 'x.com')).toBe(true);
    expect(isHostOf('netflix.com', 'x.com')).toBe(false);
    expect(isHostOf('cal.com.evil.net', 'cal.com')).toBe(false);
    expect(isHostOf('medical.com', 'cal.com')).toBe(false);
  });
});

describe('link platform detection', () => {
  test('does not mistake lookalike hostnames for a platform', () => {
    expect(getPlatformKey('https://netflix.com/title/1')).toBeNull();
    expect(getPlatformKey('https://dropbox.com/s/abc')).toBeNull();
    expect(getPlatformKey('https://wix.com')).toBeNull();
    expect(getPlatformKey('https://about.me/someone')).toBeNull();
    expect(getPlatformKey('not a url')).toBeNull();
  });

  test('recognises real platform hosts', () => {
    expect(getPlatformKey('https://x.com/vanxh')).toBe('twitter');
    expect(getPlatformKey('https://www.twitter.com/vanxh')).toBe('twitter');
    expect(getPlatformKey('https://t.me/vanxh')).toBe('telegram');
    expect(getPlatformKey('https://discord.gg/abc')).toBe('discord');
    expect(getPlatformKey('https://youtu.be/dQw4w9WgXcQ')).toBe('youtube');
    expect(getPlatformKey('https://gist.github.com/vanxh')).toBe('github');
  });

  test('extracts a handle only from profile URLs', () => {
    expect(getProfileHandle('https://github.com/vanxh')).toBe('vanxh');
    expect(getProfileHandle('https://github.com/vanxh/')).toBe('vanxh');
    expect(getProfileHandle('https://www.youtube.com/@vanxh')).toBe('vanxh');
    expect(getProfileHandle('https://youtube.com/c/vanxh')).toBe('vanxh');
    expect(getProfileHandle('https://www.linkedin.com/in/vanxh')).toBe('vanxh');

    // Not profiles: a repo, a video, a post, a company page.
    expect(getProfileHandle('https://github.com/vercel/next.js')).toBeNull();
    expect(getProfileHandle('https://youtube.com/watch?v=abc')).toBeNull();
    expect(getProfileHandle('https://x.com/vanxh/status/123')).toBeNull();
    expect(getProfileHandle('https://linkedin.com/company/acme')).toBeNull();
    expect(getProfileHandle('https://github.com')).toBeNull();
  });

  test('describes links for display', () => {
    expect(describeLink('https://x.com/vanxh')).toMatchObject({
      platform: 'twitter',
      title: '@vanxh',
      caption: 'x.com/vanxh',
    });
    expect(describeLink('https://github.com/vercel/next.js')).toMatchObject({
      platform: 'github',
      title: null,
      caption: null,
      host: 'github.com',
    });
    expect(describeLink('https://www.example.com/blog')).toMatchObject({
      platform: null,
      title: null,
      host: 'example.com',
    });
    expect(isFollowable('https://x.com/vanxh')).toBe(true);
    expect(isFollowable('https://discord.gg/abc')).toBe(true);
    expect(isFollowable('https://youtube.com/watch?v=abc')).toBe(false);
    expect(isFollowable('https://example.com')).toBe(false);
  });
});

describe('initial bento', () => {
  test('creates cards only from social handles', () => {
    const bento = generateInitialBento({
      twitter: '@vanxh',
      github: 'vanxh',
      youtube: '',
      linkedin: undefined,
    });
    expect(bento.map((b) => b.href)).toEqual([
      'https://x.com/vanxh',
      'https://github.com/vanxh',
    ]);
    expect(bento.every((b) => b.type === 'link')).toBe(true);
  });

  test('ignores fields that are not social handles', () => {
    // The create form also submits name and bio; they must never become cards.
    const bento = generateInitialBento({
      name: 'Vansh',
      bio: 'Hello there',
      link: 'vanxh',
      github: 'vanxh',
    } as never);
    expect(bento.map((b) => b.href)).toEqual(['https://github.com/vanxh']);
  });

  test('accepts pasted URLs and rejects unusable input', () => {
    expect(getSocialUrl('github', 'https://github.com/vanxh')).toBe(
      'https://github.com/vanxh'
    );
    expect(getSocialUrl('youtube', '@vanxh')).toBe(
      'https://www.youtube.com/@vanxh'
    );
    expect(getSocialUrl('twitter', 'has space')).toBe(
      'https://x.com/has%20space'
    );
    expect(getSocialUrl('twitter', '   ')).toBeNull();
    expect(getSocialUrl('twitter', '@')).toBeNull();
  });

  test('fills the grid left to right without overlap', () => {
    const positions = Array.from({ length: 6 }, (_, i) => getGridPosition(i));
    expect(positions.map((p) => p.sm)).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 0, y: 2 },
      { x: 1, y: 2 },
    ]);
    expect(positions.map((p) => p.md)).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 3, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
    ]);
  });
});

describe('billing state', () => {
  const env = {
    POLAR_BUSINESS_MONTHLY_PRODUCT_ID: 'biz-m',
    POLAR_BUSINESS_YEARLY_PRODUCT_ID: 'biz-y',
  };
  const jan = new Date('2026-01-31T00:00:00Z');
  const feb = new Date('2026-02-28T00:00:00Z');
  const free = {
    plan: 'free',
    subscriptionId: null,
    subscriptionEndsAt: null,
  } as const;

  test('maps products to plans', () => {
    expect(getPlanFromProductId('biz-y', env)).toBe('business');
    expect(getPlanFromProductId('anything-else', env)).toBe('pro');
  });

  test('a new subscription grants the plan until the period ends', () => {
    expect(
      getBillingState(
        {
          id: 's1',
          status: 'active',
          productId: 'pro-m',
          currentPeriodEnd: jan,
        },
        free,
        env
      )
    ).toEqual({ plan: 'pro', subscriptionId: 's1', subscriptionEndsAt: jan });
  });

  test('a renewal moves the paid-through date forward', () => {
    expect(
      getBillingState(
        {
          id: 's1',
          status: 'active',
          productId: 'pro-m',
          currentPeriodEnd: feb,
        },
        { plan: 'pro', subscriptionId: 's1', subscriptionEndsAt: jan },
        env
      )
    ).toEqual({ plan: 'pro', subscriptionId: 's1', subscriptionEndsAt: feb });
  });

  test('a stale event cannot move the paid-through date backwards', () => {
    expect(
      getBillingState(
        {
          id: 's1',
          status: 'active',
          productId: 'pro-m',
          currentPeriodEnd: jan,
        },
        { plan: 'pro', subscriptionId: 's1', subscriptionEndsAt: feb },
        env
      )?.subscriptionEndsAt
    ).toEqual(feb);
  });

  test('cancelling at period end keeps access (Polar reports it active)', () => {
    expect(
      getBillingState(
        {
          id: 's1',
          status: 'active',
          productId: 'biz-m',
          currentPeriodEnd: feb,
        },
        { plan: 'business', subscriptionId: 's1', subscriptionEndsAt: feb },
        env
      )
    ).toEqual({
      plan: 'business',
      subscriptionId: 's1',
      subscriptionEndsAt: feb,
    });
  });

  test('an ended subscription returns the account to free', () => {
    for (const status of ['canceled', 'unpaid', 'incomplete_expired']) {
      expect(
        getBillingState(
          { id: 's1', status, productId: 'pro-m', currentPeriodEnd: jan },
          { plan: 'pro', subscriptionId: 's1', subscriptionEndsAt: jan },
          env
        )
      ).toEqual(free);
    }
  });

  test('a replaced subscription ending does not downgrade the new one', () => {
    expect(
      getBillingState(
        {
          id: 'old',
          status: 'canceled',
          productId: 'pro-m',
          currentPeriodEnd: jan,
        },
        { plan: 'business', subscriptionId: 'new', subscriptionEndsAt: feb },
        env
      )
    ).toBeNull();
  });

  test('payment retries and unfinished checkouts change nothing', () => {
    for (const status of ['past_due', 'incomplete', 'something_new']) {
      expect(
        getBillingState(
          { id: 's1', status, productId: 'pro-m', currentPeriodEnd: feb },
          { plan: 'pro', subscriptionId: 's1', subscriptionEndsAt: jan },
          env
        )
      ).toBeNull();
    }
  });
});

describe('AI credit reset date', () => {
  test('is the first of the next month, even from a long month end', () => {
    expect(getNextCreditReset(new Date('2026-01-31T23:59:59Z'))).toEqual(
      new Date('2026-02-01T00:00:00Z')
    );
    expect(getNextCreditReset(new Date('2026-03-31T12:00:00Z'))).toEqual(
      new Date('2026-04-01T00:00:00Z')
    );
    expect(getNextCreditReset(new Date('2026-12-15T00:00:00Z'))).toEqual(
      new Date('2027-01-01T00:00:00Z')
    );
  });
});

describe('getSafeRedirect', () => {
  test('keeps same-site paths', () => {
    expect(getSafeRedirect('/create-link?link=vanxh')).toBe(
      '/create-link?link=vanxh'
    );
    expect(getSafeRedirect('/app')).toBe('/app');
  });

  test('falls back for anything that could leave the site', () => {
    for (const bad of [
      null,
      undefined,
      '',
      'https://evil.com',
      '//evil.com',
      '/\\evil.com',
      '/\t/evil.com',
      'javascript:alert(1)',
      'create-link',
    ]) {
      expect(getSafeRedirect(bad)).toBe('/app');
    }
  });

  test('withRedirect encodes the destination', () => {
    expect(withRedirect('/app/sign-up', '/app')).toBe('/app/sign-up');
    const url = new URL(
      withRedirect('/app/sign-up', '/create-link?link=a&x=1'),
      'https://openbio.app'
    );
    expect(url.pathname).toBe('/app/sign-up');
    expect(url.searchParams.get('redirectUrl')).toBe('/create-link?link=a&x=1');
  });
});

describe('html helpers', () => {
  test('htmlToText strips tags, keeps word breaks, decodes entities', () => {
    expect(htmlToText('<p>Design &amp; code</p><p>Based in NYC</p>')).toBe(
      'Design & code Based in NYC'
    );
    expect(htmlToText('<p>a&nbsp;b &lt;3 &#39;hi&#x27;</p>')).toBe(
      "a b <3 'hi'"
    );
    expect(htmlToText('')).toBe('');
  });

  test('serializeJsonLd cannot break out of a script element', () => {
    const data = {
      name: '</script><script>alert(1)</script>',
      note: 'a & b <!-- c',
    };
    const out = serializeJsonLd(data);
    expect(out).not.toContain('<');
    expect(out).not.toContain('>');
    expect(out).not.toContain('&');
    expect(JSON.parse(out)).toEqual(data);
  });
});

describe('schemas', () => {
  const card = {
    id: 'a',
    size: { sm: '2x2', md: '2x2' },
    position: { sm: { x: 0, y: 0 }, md: { x: 0, y: 0 } },
  };

  test('link cards normalise and vet their URL', () => {
    expect(
      BentoSchema.parse({ ...card, type: 'link', href: 'example.com' })
    ).toMatchObject({ href: 'https://example.com/' });
    expect(
      BentoSchema.safeParse({
        ...card,
        type: 'link',
        href: 'javascript:alert(1)',
      }).success
    ).toBe(false);
  });

  test('embed cards accept empty or web URLs only', () => {
    expect(
      BentoSchema.parse({ ...card, type: 'music', url: '' })
    ).toMatchObject({ url: '' });
    expect(
      BentoSchema.parse({ ...card, type: 'calendar', url: 'cal.com/vanxh' })
    ).toMatchObject({ url: 'https://cal.com/vanxh' });
    expect(
      BentoSchema.safeParse({
        ...card,
        type: 'calendar',
        url: 'javascript:alert(1)',
      }).success
    ).toBe(false);
    expect(
      BentoSchema.parse({ ...card, type: 'image', url: '', href: '' })
    ).toMatchObject({ url: '' });
    expect(
      BentoSchema.safeParse({
        ...card,
        type: 'image',
        url: '',
        href: 'data:text/html,x',
      }).success
    ).toBe(false);
  });

  test('custom domains are normalised and never our own', () => {
    expect(CustomDomainSchema.parse(' Bio.Example.com ')).toBe(
      'bio.example.com'
    );
    for (const bad of [
      'openbio.app',
      'evil.openbio.app',
      'example',
      'exa mple.com',
      'example.com/path',
      'example.com?x=1',
      '../etc',
      'https://example.com',
      '-bad.com',
    ]) {
      expect(CustomDomainSchema.safeParse(bad).success).toBe(false);
    }
  });

  test('slugs that collide with routes or hostnames are reserved', () => {
    for (const slug of ['explore', 'www', 'claim-link', 'admin', 'app']) {
      expect(ValidLinkSchema.safeParse(slug).success).toBe(false);
    }
    expect(ValidLinkSchema.safeParse('vanxh').success).toBe(true);
  });
});

describe('getErrorMessage', () => {
  test('prefers validation messages over the raw issue list', () => {
    const zodFailure = Object.assign(new Error('[{"code":"custom"}]'), {
      data: {
        zodError: {
          formErrors: [],
          fieldErrors: { customDomain: ['Enter a valid domain.'] },
        },
      },
    });
    expect(getErrorMessage(zodFailure)).toBe('Enter a valid domain.');
  });

  test('never shows the raw issue list, even with no field message', () => {
    const zodFailure = Object.assign(new Error('[{"code":"custom"}]'), {
      data: { zodError: { formErrors: [], fieldErrors: {} } },
    });
    expect(getErrorMessage(zodFailure, 'Nope')).toBe('Nope');
  });

  test('explains an expired session instead of showing the bare code', () => {
    const unauthorized = Object.assign(new Error('UNAUTHORIZED'), {
      data: { code: 'UNAUTHORIZED', zodError: null },
    });
    expect(getErrorMessage(unauthorized)).toBe(
      'Your session has expired. Please sign in again.'
    );
  });

  test('uses the error message otherwise, then the fallback', () => {
    expect(getErrorMessage(new Error('Domain taken'))).toBe('Domain taken');
    expect(getErrorMessage(null, 'Nope')).toBe('Nope');
    expect(getErrorMessage('boom', 'Nope')).toBe('Nope');
  });
});

describe('isBentoConfigured', () => {
  const base = {
    id: 'a',
    size: { sm: '2x2', md: '2x2' },
    position: { sm: { x: 0, y: 0 }, md: { x: 0, y: 0 } },
  } as const;

  test('hides cards that were added but never filled in', () => {
    const empty = [
      { ...base, type: 'note', text: '' },
      { ...base, type: 'note', text: '<p></p>' },
      { ...base, type: 'image', url: '' },
      { ...base, type: 'music', url: '' },
      { ...base, type: 'calendar', url: '' },
      { ...base, type: 'github', username: ' ' },
      { ...base, type: 'twitter', tweetId: '' },
      { ...base, type: 'countdown', targetDate: '' },
      { ...base, type: 'map', latitude: 0, longitude: 0 },
      { ...base, type: 'weather', latitude: 0, longitude: 0 },
    ] as const;
    for (const card of empty) {
      expect(isBentoConfigured(card)).toBe(false);
    }
  });

  test('shows cards that have content', () => {
    const ready = [
      { ...base, type: 'link', href: 'https://example.com', clicks: 0 },
      { ...base, type: 'note', text: '<p>Hello</p>' },
      { ...base, type: 'image', url: 'https://example.com/a.webp' },
      { ...base, type: 'github', username: 'vanxh' },
      { ...base, type: 'twitter', tweetId: '123' },
      { ...base, type: 'countdown', targetDate: '2030-01-01T00:00:00.000Z' },
      { ...base, type: 'map', latitude: 0, longitude: 51.5 },
      { ...base, type: 'weather', latitude: 40.7, longitude: -74 },
      { ...base, type: 'email-collect' },
      { ...base, type: 'views' },
    ] as const;
    for (const card of ready) {
      expect(isBentoConfigured(card)).toBe(true);
    }
  });
});
