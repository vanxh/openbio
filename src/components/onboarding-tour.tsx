'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

type TourStep = {
  target: string;
  title: string;
  description: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
};

const TOUR_STEPS: TourStep[] = [
  {
    target: '[data-tour="profile-header"]',
    title: 'Your profile',
    description:
      'Click on your name or bio to edit them directly. Tap your avatar to change it.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="preview-toggle"]',
    title: 'Preview mode',
    description:
      'See how visitors see your page. Toggle back to edit mode to make changes.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="viewport-switcher"]',
    title: 'Device preview',
    description: 'Preview your profile on desktop or in a phone frame.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="add-card"]',
    title: 'Add cards',
    description:
      'Build your page with links, images, maps, GitHub stats, countdowns, weather, email collection, and more.',
    placement: 'top',
  },
  {
    target: '[data-tour="theme-settings"]',
    title: 'Make it yours',
    description:
      'Pick a theme, toggle dark mode, set accent colors, and customize your footer text.',
    placement: 'top',
  },
];

const STORAGE_KEY = 'openbio-tour-completed';

function getTargetRect(selector: string): DOMRect | null {
  const el = document.querySelector(selector);
  if (!el) {
    return null;
  }
  return el.getBoundingClientRect();
}

function Spotlight({ rect }: { rect: DOMRect }) {
  const padding = 6;
  const radius = 12;

  return (
    <svg
      className="pointer-events-none fixed inset-0 z-[9998] h-full w-full"
      aria-hidden="true"
    >
      <defs>
        <mask id="tour-mask">
          <rect width="100%" height="100%" fill="white" />
          <rect
            x={rect.left - padding}
            y={rect.top - padding}
            width={rect.width + padding * 2}
            height={rect.height + padding * 2}
            rx={radius}
            fill="black"
          />
        </mask>
      </defs>
      <rect
        width="100%"
        height="100%"
        fill="rgba(0,0,0,0.6)"
        mask="url(#tour-mask)"
      />
    </svg>
  );
}

function Tooltip({
  step,
  rect,
  currentStep,
  totalSteps,
  onNext,
  onSkip,
}: {
  step: TourStep;
  rect: DOMRect;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onSkip: () => void;
}) {
  const placement = step.placement ?? 'bottom';
  const tooltipWidth = 280;

  // biome-ignore lint/correctness/noUndeclaredVariables: React is in scope via JSX transform
  let style: React.CSSProperties = {};

  if (placement === 'bottom') {
    style = {
      top: rect.bottom + 12,
      left: Math.max(8, rect.left + rect.width / 2 - tooltipWidth / 2),
    };
  } else if (placement === 'top') {
    style = {
      bottom: window.innerHeight - rect.top + 12,
      left: Math.max(8, rect.left + rect.width / 2 - tooltipWidth / 2),
    };
  }

  const isLast = currentStep === totalSteps - 1;

  return (
    <div
      className="fixed z-[9999] w-[280px] rounded-xl border border-border bg-card p-4 shadow-xl"
      style={style}
    >
      <button
        type="button"
        onClick={onSkip}
        className="absolute top-3 right-3 text-muted-foreground transition-colors hover:text-foreground"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      <div className="space-y-2">
        <p className="font-cal text-sm">{step.title}</p>
        <p className="text-muted-foreground text-xs leading-relaxed">
          {step.description}
        </p>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex gap-1">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-1.5 rounded-full transition-all',
                i === currentStep
                  ? 'w-4 bg-primary'
                  : 'w-1.5 bg-muted-foreground/30'
              )}
            />
          ))}
        </div>
        <Button
          size="sm"
          className="h-7 rounded-lg px-3 text-xs"
          onClick={onNext}
        >
          {isLast ? 'Done' : 'Next'}
        </Button>
      </div>
    </div>
  );
}

export default function OnboardingTour() {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    // Only show for first-time visitors (profile owners)
    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed) {
      // Wait for layout to stabilize (fonts, images, animations)
      const timer = setTimeout(() => {
        setActive(true);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, []);

  // Continuously track target position to handle layout shifts
  useEffect(() => {
    if (!active || step >= TOUR_STEPS.length) {
      return;
    }
    const tourStep = TOUR_STEPS[step];
    if (!tourStep) {
      return;
    }

    let rafId: number;
    const track = () => {
      const rect = getTargetRect(tourStep.target);
      if (rect) {
        setTargetRect((prev) => {
          if (
            prev &&
            prev.top === rect.top &&
            prev.left === rect.left &&
            prev.width === rect.width &&
            prev.height === rect.height
          ) {
            return prev;
          }
          return rect;
        });
      }
      rafId = requestAnimationFrame(track);
    };
    track();

    return () => cancelAnimationFrame(rafId);
  }, [active, step]);

  const finish = useCallback(() => {
    setActive(false);
    localStorage.setItem(STORAGE_KEY, 'true');
  }, []);

  const next = useCallback(() => {
    if (step >= TOUR_STEPS.length - 1) {
      finish();
    } else {
      setStep((s) => s + 1);
    }
  }, [step, finish]);

  if (!active || !targetRect) {
    return null;
  }

  const currentStep = TOUR_STEPS[step];
  if (!currentStep) {
    return null;
  }

  return createPortal(
    <>
      <Spotlight rect={targetRect} />
      <Tooltip
        step={currentStep}
        rect={targetRect}
        currentStep={step}
        totalSteps={TOUR_STEPS.length}
        onNext={next}
        onSkip={finish}
      />
    </>,
    document.body
  );
}
