import { createHmac, timingSafeEqual } from 'node:crypto';

const BASE_URL = 'https://openbio.app';

function sign(userId: string, secret: string): string {
  return createHmac('sha256', secret)
    .update(`email-digest-unsubscribe:${userId}`)
    .digest('base64url');
}

/**
 * Token for a user's unsubscribe link: an HMAC of their id under the app
 * secret. Unlike the address-as-token it replaces, it cannot be produced by
 * someone who merely knows the user's id and email.
 */
export function createUnsubscribeToken(
  userId: string,
  secret = process.env.BETTER_AUTH_SECRET
): string {
  if (!secret) {
    throw new Error('BETTER_AUTH_SECRET is required to sign unsubscribe links');
  }
  return sign(userId, secret);
}

export function verifyUnsubscribeToken(
  userId: string,
  token: string,
  secret = process.env.BETTER_AUTH_SECRET
): boolean {
  if (!secret) {
    return false;
  }
  const expected = Buffer.from(sign(userId, secret));
  const given = Buffer.from(token);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

export function getUnsubscribeUrl(userId: string): string {
  const params = new URLSearchParams({
    userId,
    token: createUnsubscribeToken(userId),
  });
  return `${BASE_URL}/api/unsubscribe?${params}`;
}

/**
 * Digests sent before signed tokens existed carry the recipient's email as
 * the token. Those links must keep working for a while (an unsubscribe link
 * that fails is worse than a weak one), but not forever.
 */
export const LEGACY_TOKEN_CUTOFF = new Date('2027-03-01T00:00:00Z');

export function isLegacyTokenAccepted(now = new Date()): boolean {
  return now < LEGACY_TOKEN_CUTOFF;
}
