'use client';

import { GradientButton } from '@/components/ui/gradient-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { forgetPassword, resetPassword } from '@/lib/auth-client';
import OpenBioLogo from '@/public/openbio.png';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, type SyntheticEvent, useState } from 'react';

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestReset = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const result = await forgetPassword({
      email,
      redirectTo: '/app/reset-password',
    });

    if (result.error) {
      setError(result.error.message ?? 'Something went wrong');
      setLoading(false);
      return;
    }

    setSuccess('Check your email for a password reset link.');
    setLoading(false);
  };

  const handleResetPassword = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');

    const result = await resetPassword({
      newPassword,
      token: token ?? '',
    });

    if (result.error) {
      setError(result.error.message ?? 'Something went wrong');
      setLoading(false);
      return;
    }

    setSuccess('Your password has been reset. You can now sign in.');
    setLoading(false);
  };

  return (
    <div className="w-full max-w-md animate-fade-up rounded-2xl border border-border/50 bg-card p-8 shadow-lg">
      <div className="mb-8 flex flex-col items-center">
        <Link href="/">
          <Image src={OpenBioLogo} alt="OpenBio" width={48} height={48} />
        </Link>
        <h1 className="mt-4 font-cal text-2xl">
          {token ? 'Choose a new password' : 'Reset your password'}
        </h1>
        <p className="mt-1 text-muted-foreground text-sm">
          {token
            ? 'Enter your new password below'
            : "We'll send you a link to reset your password"}
        </p>
      </div>

      {token ? (
        <form onSubmit={handleResetPassword} className="flex flex-col gap-y-5">
          <div className="space-y-2">
            <Label htmlFor="newPassword">New password</Label>
            <Input
              id="newPassword"
              type="password"
              placeholder="••••••••"
              className="h-11 rounded-xl"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm new password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              className="h-11 rounded-xl"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>
          {error && (
            <p className="rounded-xl bg-destructive/10 px-3 py-2 text-destructive text-sm">
              {error}
            </p>
          )}
          {success && (
            <p className="rounded-xl bg-green-500/10 px-3 py-2 text-green-600 text-sm">
              {success}
            </p>
          )}
          <GradientButton
            type="submit"
            disabled={loading}
            className="mt-1 w-full"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Reset password'
            )}
          </GradientButton>
          {success && (
            <Link
              href="/app/sign-in"
              className="text-center text-muted-foreground text-sm underline underline-offset-4 hover:text-foreground"
            >
              Go to sign in
            </Link>
          )}
        </form>
      ) : (
        <form onSubmit={handleRequestReset} className="flex flex-col gap-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              className="h-11 rounded-xl"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          {error && (
            <p className="rounded-xl bg-destructive/10 px-3 py-2 text-destructive text-sm">
              {error}
            </p>
          )}
          {success && (
            <p className="rounded-xl bg-green-500/10 px-3 py-2 text-green-600 text-sm">
              {success}
            </p>
          )}
          <GradientButton
            type="submit"
            disabled={loading}
            className="mt-1 w-full"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Send reset link'
            )}
          </GradientButton>
        </form>
      )}

      <p className="mt-6 text-center text-muted-foreground text-sm">
        Remember your password?{' '}
        <Link
          href="/app/sign-in"
          className="font-medium text-foreground underline underline-offset-4 hover:text-violet-600"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
