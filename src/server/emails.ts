'use server';

import { env } from '@/env.mjs';
import type { ReactElement } from 'react';
import { Resend } from 'resend';

const resend = new Resend(env.RESEND_API_KEY);

export interface Email {
  react: ReactElement;
  subject: string;
  to: string[];
  from?: string;
}

export const sendEmail = async (email: Email) => {
  return resend.emails.send({
    from: 'Vanxh <hello@vanxh.dev>',
    ...email,
  });
};
