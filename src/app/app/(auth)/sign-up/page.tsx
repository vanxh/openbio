'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signUp } from '@/lib/auth-client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const result = await signUp.email({ name, email, password });
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
        <h1 className="font-cal text-3xl">Create an account</h1>
        <p className="mt-2 text-muted-foreground text-sm">
          Get started with OpenBio
        </p>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            type="text"
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
            minLength={8}
          />
        </div>
        {error && <p className="text-destructive text-sm">{error}</p>}
        <Button type="submit" disabled={loading}>
          {loading ? 'Creating account...' : 'Create account'}
        </Button>
      </form>
      <p className="text-center text-muted-foreground text-sm">
        Already have an account?{' '}
        <Link href="/app/sign-in" className="text-primary underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
