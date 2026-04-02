import { db } from '../db';
import { emailSubscriber } from '../schema';

export const addEmailSubscriber = async (linkId: string, email: string) => {
  const existing = await db.query.emailSubscriber.findFirst({
    where: (s, { and, eq }) => and(eq(s.linkId, linkId), eq(s.email, email)),
  });

  if (existing) {
    return existing;
  }

  const result = await db
    .insert(emailSubscriber)
    .values({ linkId, email })
    .returning()
    .execute();

  return result[0];
};

export const getEmailSubscribers = async (linkId: string) => {
  return db.query.emailSubscriber.findMany({
    where: (s, { eq }) => eq(s.linkId, linkId),
    orderBy: (s, { desc }) => desc(s.createdAt),
  });
};
