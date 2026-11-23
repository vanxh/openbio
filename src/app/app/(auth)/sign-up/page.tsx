'use client';

import { Button } from '@/components/ui/button';
import { GradientButton } from '@/components/ui/gradient-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authClient, signIn, signUp } from '@/lib/auth-client';
import { getSafeRedirect, withRedirect } from '@/lib/redirect';
import OpenBioLogo from '@/public/openbio.png';
import { Loader2, MailCheck } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { type SyntheticEvent, useState } from 'react';

export default function SignUpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Where to land once signed in, e.g. the profile name claimed on the homepage.
  const redirectTo = getSafeRedirect(searchParams.get('redirectUrl'));

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [resendState, setResendState] = useState<'idle' | 'sending' | 'sent'>(
    'idle'
  );

  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const result = await signUp.email({
      name,
      email,
      password,
      callbackURL: redirectTo,
    });
    if (result.error) {
      setError(result.error.message ?? 'Something went wrong');
      setLoading(false);
      return;
    }
    // Email accounts must be verified before a session exists, so there is
    // nowhere to go yet: tell them to check their inbox instead.
    if (!result.data?.token) {
      setSentTo(email);
      setLoading(false);
      return;
    }
    router.push(redirectTo);
  };

  const resend = async () => {
    if (!sentTo) {
      return;
    }
    setResendState('sending');
    const result = await authClient.sendVerificationEmail({
      email: sentTo,
      callbackURL: redirectTo,
    });
    if (result.error) {
      setError(result.error.message ?? 'Something went wrong');
      setResendState('idle');
      return;
    }
    setError('');
    setResendState('sent');
  };

  if (sentTo) {
    return (
      <div className="w-full max-w-md animate-fade-up rounded-2xl border border-border/50 bg-card p-8 text-center shadow-lg">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-violet-500/10">
          <MailCheck className="h-6 w-6 text-violet-600" />
        </div>
        <h1 className="mt-4 font-cal text-2xl">Check your inbox</h1>
        <p className="mt-2 text-muted-foreground text-sm">
          We sent a verification link to{' '}
          <span className="font-medium text-foreground">{sentTo}</span>. Open it
          to finish creating your account.
        </p>
        {error && (
          <p className="mt-4 rounded-xl bg-destructive/10 px-3 py-2 text-destructive text-sm">
            {error}
          </p>
        )}
        <Button
          type="button"
          variant="outline"
          className="mt-6 h-11 w-full rounded-xl"
          onClick={resend}
          disabled={resendState !== 'idle'}
        >
          {resendState === 'sending' && (
            <Loader2 className="h-4 w-4 animate-spin" />
          )}
          {resendState === 'sent' && 'Email sent again'}
          {resendState === 'idle' && 'Resend email'}
        </Button>
        <p className="mt-6 text-muted-foreground text-sm">
          Wrong address?{' '}
          <button
            type="button"
            className="font-medium text-foreground underline underline-offset-4 hover:text-violet-600"
            onClick={() => {
              setSentTo(null);
              setResendState('idle');
              setError('');
            }}
          >
            Go back
          </button>
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md animate-fade-up rounded-2xl border border-border/50 bg-card p-8 shadow-lg">
      <div className="mb-8 flex flex-col items-center">
        <Link href="/">
          <Image src={OpenBioLogo} alt="OpenBio" width={48} height={48} />
        </Link>
        <h1 className="mt-4 font-cal text-2xl">Create your account</h1>
        <p className="mt-1 text-muted-foreground text-sm">
          Get started with OpenBio
        </p>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-y-5">
        <div className="space-y-2">
          <Label htmlFor="name">Display name</Label>
          <Input
            id="name"
            type="text"
            placeholder="John Doe"
            className="h-11 rounded-xl"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
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
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            className="h-11 rounded-xl"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>
        {error && (
          <p className="rounded-xl bg-destructive/10 px-3 py-2 text-destructive text-sm">
            {error}
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
            'Create account'
          )}
        </GradientButton>
      </form>
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-border/50 border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">
            or continue with
          </span>
        </div>
      </div>
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="h-11 flex-1 gap-2 rounded-xl"
          onClick={() =>
            signIn.social({ provider: 'github', callbackURL: redirectTo })
          }
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="currentColor"
            role="img"
            aria-label="GitHub"
          >
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
          GitHub
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-11 flex-1 gap-2 rounded-xl"
          onClick={() =>
            signIn.social({ provider: 'google', callbackURL: redirectTo })
          }
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            role="img"
            aria-label="Google"
          >
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Google
        </Button>
      </div>
      <p className="mt-6 text-center text-muted-foreground text-sm">
        Already have an account?{' '}
        <Link
          href={withRedirect('/app/sign-in', redirectTo)}
          className="font-medium text-foreground underline underline-offset-4 hover:text-violet-600"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
