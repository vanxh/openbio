'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signIn } from '@/lib/auth-client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const result = await signIn.email({ email, password });
    if (result.error) {
      setError(result.error.message ?? 'Something went wrong');
      setLoading(false);
      return;
    }
    router.push('/app');
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-y-6 px-4 py-12">
      <div className="text-center">
        <h1 className="font-cal text-3xl">Welcome back</h1>
        <p className="mt-2 text-muted-foreground text-sm">
          Sign in to your account
        </p>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p className="text-destructive text-sm">{error}</p>}
        <Button type="submit" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>
      <p className="text-center text-muted-foreground text-sm">
        Don&apos;t have an account?{' '}
        <Link href="/app/sign-up" className="text-primary underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
