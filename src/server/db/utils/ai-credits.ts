import { getAiCreditLimit } from '@/server/db/utils/user';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { user } from '../schema';

/**
 * Get remaining AI credits for a user.
 * Resets credits monthly if reset date has passed.
 */
export async function getAiCredits(userId: string) {
  const found = await db.query.user.findFirst({
    where: (u, { eq }) => eq(u.id, userId),
    columns: {
      plan: true,
      aiCredits: true,
      aiCreditsResetAt: true,
    },
  });

  if (!found) {
    return { remaining: 0, limit: 0 };
  }

  const limit = getAiCreditLimit(found.plan);
  const now = new Date();

  // Reset credits if past the reset date or never set
  if (!found.aiCreditsResetAt || found.aiCreditsResetAt <= now) {
    const nextReset = new Date();
    nextReset.setMonth(nextReset.getMonth() + 1);
    nextReset.setDate(1);
    nextReset.setHours(0, 0, 0, 0);

    await db
      .update(user)
      .set({ aiCredits: 0, aiCreditsResetAt: nextReset })
      .where(eq(user.id, userId));

    return { remaining: limit, limit };
  }

  const remaining = Math.max(0, limit - found.aiCredits);
  return { remaining, limit };
}

/**
 * Consume AI credits. Returns true if successful, false if insufficient.
 */
export async function consumeAiCredits(
  userId: string,
  amount: number
): Promise<boolean> {
  const { remaining } = await getAiCredits(userId);

  if (remaining < amount) {
    return false;
  }

  const current = await db.query.user.findFirst({
    where: (u, { eq }) => eq(u.id, userId),
    columns: { aiCredits: true },
  });

  await db
    .update(user)
    .set({ aiCredits: (current?.aiCredits ?? 0) + amount })
    .where(eq(user.id, userId));

  return true;
}
