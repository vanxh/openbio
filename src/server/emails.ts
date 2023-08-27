"use server";

import type { ReactElement } from "react";
import { Resend } from "resend";

import { env } from "@/env.mjs";

const resend = new Resend(env.RESEND_API_KEY);

export interface Email {
  react: ReactElement;
  subject: string;
  to: string[];
  from?: string;
}

export const sendEmail = (email: Email) => {
  return resend.emails.send({
    from: "Vanxh <hello@vanxh.dev>",
    ...email,
  });
};
