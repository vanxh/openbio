'use client';

import CardOverlay from '@/components/bento/overlay';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { api } from '@/trpc/react';
import type { CountdownBentoSchema } from '@/types';
import { Pencil } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import type * as z from 'zod';

type BentoData = z.infer<typeof CountdownBentoSchema>;

export const COUNTDOWN_CARD_SIZES = ['2x2', '4x2', '4x4'] as const;

type TimeLeft = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
};

function getNextOccurrence(
  targetDate: string,
  repeat: string
): Date {
  const target = new Date(targetDate);
  const now = new Date();

  if (repeat === 'yearly') {
    while (target <= now) {
      target.setFullYear(target.getFullYear() + 1);
    }
  } else if (repeat === 'monthly') {
    while (target <= now) {
      target.setMonth(target.getMonth() + 1);
    }
  } else if (repeat === 'weekly') {
    while (target <= now) {
      target.setDate(target.getDate() + 7);
    }
  }

  return target;
}

function getTimeLeft(
  targetDate: string,
  repeat = 'none'
): TimeLeft {
  const effectiveTarget =
    repeat !== 'none'
      ? getNextOccurrence(targetDate, repeat)
      : new Date(targetDate);
  const diff = effectiveTarget.getTime() - Date.now();

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
  }
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    isPast: false,
  };
}

function useCountdown(targetDate: string, repeat = 'none') {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() =>
    getTimeLeft(targetDate, repeat)
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getTimeLeft(targetDate, repeat));
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate, repeat]);

  return timeLeft;
}

function TimeUnit({
  value,
  label,
  compact,
}: {
  value: number;
  label: string;
  compact?: boolean;
}) {
  return (
    <div className="flex flex-col items-center">
      <span
        className={cn(
          'font-cal tabular-nums',
          compact ? 'text-2xl' : 'text-3xl'
        )}
      >
        {String(value).padStart(2, '0')}
      </span>
      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
        {label}
      </span>
    </div>
  );
}

function CompactCountdown({
  bento,
  timeLeft,
}: {
  bento: BentoData;
  timeLeft: TimeLeft;
}) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-4 text-center">
      {bento.emoji && <span className="text-2xl">{bento.emoji}</span>}
      {bento.title && (
        <p className="font-cal text-xs leading-tight">{bento.title}</p>
      )}
      {timeLeft.isPast ? (
        <p className="font-cal text-primary text-sm">Time's up!</p>
      ) : (
        <div className="flex items-center gap-3">
          <TimeUnit value={timeLeft.days} label="d" compact />
          <span className="font-cal text-muted-foreground text-xl">:</span>
          <TimeUnit value={timeLeft.hours} label="h" compact />
          <span className="font-cal text-muted-foreground text-xl">:</span>
          <TimeUnit value={timeLeft.minutes} label="m" compact />
        </div>
      )}
    </div>
  );
}

function WideCountdown({
  bento,
  timeLeft,
}: {
  bento: BentoData;
  timeLeft: TimeLeft;
}) {
  return (
    <div className="flex h-full w-full flex-col justify-center gap-4 p-6">
      <div className="flex items-center gap-2">
        {bento.emoji && <span className="text-xl">{bento.emoji}</span>}
        {bento.title && <p className="font-cal text-sm">{bento.title}</p>}
      </div>
      {timeLeft.isPast ? (
        <p className="font-cal text-lg text-primary">Time's up!</p>
      ) : (
        <div className="flex items-center gap-4">
          <TimeUnit value={timeLeft.days} label="days" />
          <div className="font-cal text-2xl text-muted-foreground/40">:</div>
          <TimeUnit value={timeLeft.hours} label="hrs" />
          <div className="font-cal text-2xl text-muted-foreground/40">:</div>
          <TimeUnit value={timeLeft.minutes} label="min" />
          <div className="font-cal text-2xl text-muted-foreground/40">:</div>
          <TimeUnit value={timeLeft.seconds} label="sec" />
        </div>
      )}
    </div>
  );
}

function LargeCountdown({
  bento,
  timeLeft,
}: {
  bento: BentoData;
  timeLeft: TimeLeft;
}) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-5 p-6 text-center">
      {bento.emoji && <span className="text-4xl">{bento.emoji}</span>}
      {bento.title && <p className="font-cal text-lg">{bento.title}</p>}
      {timeLeft.isPast ? (
        <p className="font-cal text-2xl text-primary">Time's up!</p>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {[
            { value: timeLeft.days, label: 'Days' },
            { value: timeLeft.hours, label: 'Hours' },
            { value: timeLeft.minutes, label: 'Minutes' },
            { value: timeLeft.seconds, label: 'Seconds' },
          ].map((item) => (
            <div
              key={item.label}
              className="flex flex-col items-center gap-1 rounded-xl border border-border/40 bg-muted/20 px-3 py-4"
            >
              <span className="font-cal text-2xl tabular-nums">
                {String(item.value).padStart(2, '0')}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      )}
      <p className="text-muted-foreground text-xs">
        {new Date(bento.targetDate).toLocaleDateString(undefined, {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
      </p>
    </div>
  );
}

export default function CountdownCard({
  bento,
  editable,
}: {
  bento: BentoData;
  editable?: boolean;
}) {
  const params = useParams<{ link: string }>();
  const [editOpen, setEditOpen] = useState(false);
  const [title, setTitle] = useState(bento.title ?? '');
  const [targetDate, setTargetDate] = useState(bento.targetDate || '');
  const [emoji, setEmoji] = useState(bento.emoji ?? '');
  const [repeat, setRepeat] = useState(bento.repeat ?? 'none');

  const timeLeft = useCountdown(bento.targetDate, bento.repeat);

  const queryClient = api.useContext();
  const { mutateAsync: updateBento } =
    api.profileLink.updateBento.useMutation();

  const handleSave = async () => {
    if (!targetDate) {
      return;
    }

    queryClient.profileLink.getByLink.setData({ link: params.link }, (old) => {
      if (!old) {
        return old;
      }
      return {
        ...old,
        bento: old.bento.map((b) =>
          b.id === bento.id
            ? {
                ...b,
                title: title || undefined,
                targetDate,
                emoji: emoji || undefined,
                repeat,
              }
            : b
        ),
      };
    });

    await updateBento({
      link: params.link,
      bento: {
        ...bento,
        title: title || undefined,
        targetDate,
        emoji: emoji || undefined,
        repeat,
      },
    });
    setEditOpen(false);
  };

  const mdSize = bento.size.md ?? '2x2';

  const CardContent = () => {
    if (!bento.targetDate) {
      return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-2xl bg-muted/30">
          <span className="text-2xl">⏰</span>
          <p className="text-muted-foreground text-xs">
            {editable ? 'Set date' : ''}
          </p>
        </div>
      );
    }

    if (mdSize === '4x4') {
      return <LargeCountdown bento={bento} timeLeft={timeLeft} />;
    }
    if (mdSize === '4x2') {
      return <WideCountdown bento={bento} timeLeft={timeLeft} />;
    }
    return <CompactCountdown bento={bento} timeLeft={timeLeft} />;
  };

  return (
    <>
      <div
        className={cn(
          'group relative z-0 h-full w-full select-none rounded-2xl border border-border bg-card shadow-sm',
          editable
            ? 'transition-transform duration-200 ease-in-out md:cursor-move'
            : 'transition-all duration-200 hover:shadow-md'
        )}
      >
        {editable && (
          <CardOverlay bento={bento} allowedSizes={COUNTDOWN_CARD_SIZES} />
        )}

        <CardContent />

        {editable && (
          <button
            type="button"
            className="absolute top-3 right-3 z-50 cursor-pointer rounded-full bg-primary p-2 text-primary-foreground opacity-0 shadow transition-opacity group-hover:opacity-100"
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              setEditOpen(true);
            }}
          >
            <Pencil className="h-4 w-4" />
          </button>
        )}
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-cal">Edit Countdown</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cd-emoji" className="font-medium text-sm">
                Emoji
              </Label>
              <Input
                id="cd-emoji"
                placeholder="🎉"
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                className="rounded-xl"
                maxLength={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cd-title" className="font-medium text-sm">
                Title
              </Label>
              <Input
                id="cd-title"
                placeholder="My Birthday"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cd-date" className="font-medium text-sm">
                Target Date
              </Label>
              <Input
                id="cd-date"
                type="datetime-local"
                value={targetDate ? targetDate.slice(0, 16) : ''}
                onChange={(e) =>
                  setTargetDate(new Date(e.target.value).toISOString())
                }
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cd-repeat" className="font-medium text-sm">
                Repeat
              </Label>
              <select
                id="cd-repeat"
                value={repeat}
                onChange={(e) => setRepeat(e.target.value as typeof repeat)}
                className="h-9 w-full rounded-xl border border-border bg-card px-3 text-sm"
              >
                <option value="none">Don&apos;t repeat</option>
                <option value="weekly">Every week</option>
                <option value="monthly">Every month</option>
                <option value="yearly">Every year</option>
              </select>
            </div>

            <Button onClick={handleSave} className="w-full rounded-xl">
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
