import { GradientButton } from '@/components/ui/gradient-button';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="animate-fade-up text-center">
        <span className="text-6xl">😢</span>
        <h1 className="mt-6 font-cal text-4xl">Page not found</h1>
        <p className="mt-2 text-muted-foreground">
          This page doesn&apos;t exist or has been removed
        </p>
        <Link href="/" className="mt-8 inline-block">
          <GradientButton>Go home</GradientButton>
        </Link>
      </div>
    </div>
  );
}
