import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient();
export const { signIn, signUp, signOut, useSession } = authClient;
export const forgetPassword = authClient.requestPasswordReset;
export const resetPassword = authClient.resetPassword;
