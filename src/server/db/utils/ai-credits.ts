import { getNextCreditReset } from '@/lib/plans';
import { getAiCreditLimit } from '@/server/db/utils/user';
import { and, eq, sql } from 'drizzle-orm';
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
    await db
      .update(user)
      .set({ aiCredits: 0, aiCreditsResetAt: getNextCreditReset(now) })
      .where(eq(user.id, userId));

    return { remaining: limit, limit };
  }

  const remaining = Math.max(0, limit - found.aiCredits);
  return { remaining, limit };
}

/**
 * Consume AI credits. Returns true if successful, false if insufficient.
 *
 * The check and the increment are one statement, so two requests racing for
 * the last credit cannot both succeed.
 */
export async function consumeAiCredits(
  userId: string,
  amount: number
): Promise<boolean> {
  // Also applies the monthly reset, so the usage compared below is current.
  const { limit } = await getAiCredits(userId);

  const updated = await db
    .update(user)
    .set({ aiCredits: sql`${user.aiCredits} + ${amount}` })
    .where(
      and(eq(user.id, userId), sql`${user.aiCredits} + ${amount} <= ${limit}`)
    )
    .returning({ id: user.id });

  return updated.length > 0;
}

/** Give credits back when the generation they paid for failed. */
export async function refundAiCredits(
  userId: string,
  amount: number
): Promise<void> {
  await db
    .update(user)
    .set({ aiCredits: sql`greatest(${user.aiCredits} - ${amount}, 0)` })
    .where(eq(user.id, userId));
}
