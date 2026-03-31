import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

const steps = ['Profile', 'Socials', 'Preview'];

export function WizardProgress({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center gap-x-2">
      {steps.map((label, i) => (
        <div key={label} className="flex items-center gap-x-2">
          <div className="flex flex-col items-center gap-y-1">
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full font-medium text-sm transition-all',
                i < currentStep && 'bg-foreground text-background',
                i === currentStep &&
                  'bg-foreground text-background ring-4 ring-foreground/10',
                i > currentStep &&
                  'border-2 border-border text-muted-foreground'
              )}
            >
              {i < currentStep ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <span
              className={cn(
                'text-xs',
                i <= currentStep
                  ? 'font-medium text-foreground'
                  : 'text-muted-foreground'
              )}
            >
              {label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={cn(
                'mb-5 h-0.5 w-12',
                i < currentStep ? 'bg-foreground' : 'bg-border'
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}
