'use client';

import { toast } from '@/components/ui/use-toast';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';
import Confetti from 'react-dom-confetti';

function CelebrationInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const upgraded = searchParams.get('upgraded') === 'true';
  const fired = useRef(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (upgraded && !fired.current) {
      fired.current = true;

      // Delay to ensure false → true transition triggers confetti
      requestAnimationFrame(() => {
        setShowConfetti(true);
      });

      toast({
        title: 'Welcome to Pro!',
        description:
          'You now have access to all card types, themes, custom domains, and more.',
      });

      router.replace('/app', { scroll: false });
    }
  }, [upgraded, router]);

  if (!upgraded && !showConfetti) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed top-1/2 left-1/2 z-[100]">
      <Confetti
        active={showConfetti}
        config={{
          elementCount: 200,
          spread: 120,
          startVelocity: 40,
          decay: 0.92,
          duration: 3000,
        }}
      />
    </div>
  );
}

export default function UpgradeCelebration() {
  return (
    <Suspense fallback={null}>
      <CelebrationInner />
    </Suspense>
  );
}
