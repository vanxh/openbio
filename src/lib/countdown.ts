export type CountdownRepeat = 'none' | 'yearly' | 'monthly' | 'weekly';

export type TimeLeft = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  /** The target day is over (never true for a repeating countdown). */
  isPast: boolean;
  /** The target day is today, in the viewer's timezone. */
  isToday: boolean;
  /** The day being counted down to, at local midnight. */
  occurrence: Date;
};

type CalendarDay = { year: number; month: number; day: number };

const DAY_RE = /^(\d{4})-(\d{2})-(\d{2})/;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * The calendar day a countdown targets.
 *
 * A countdown is to a *day* (a birthday, a launch), chosen with a date
 * picker and stored as that day at midnight UTC. Reading the stored value as
 * an instant makes it end at 4pm the previous day in California and 5:30am in
 * India, so only the date part is used and the day is placed in the viewer's
 * own timezone.
 */
export function parseTargetDay(value: string): CalendarDay | null {
  const match = DAY_RE.exec(value);
  if (!match) {
    return null;
  }
  const [year, month, day] = match.slice(1).map(Number) as [
    number,
    number,
    number,
  ];
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }
  return { year, month, day };
}

/** Local midnight on the given day, with the day clamped to the month's length. */
function localDay(year: number, monthIndex: number, day: number): Date {
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  return new Date(year, monthIndex, Math.min(day, lastDay));
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * The occurrence a countdown should show: the target day itself, or for a
 * repeating countdown the first repeat that is today or later.
 *
 * Each repeat is computed from the original day rather than by stepping a
 * date forward, because stepping drifts: one month after 31 January is
 * 3 March, and every later "monthly" repeat would then land on the 3rd.
 */
export function getOccurrence(
  target: CalendarDay,
  repeat: CountdownRepeat,
  now: Date
): Date {
  const first = localDay(target.year, target.month - 1, target.day);
  const today = startOfDay(now);

  if (repeat === 'none' || first >= today) {
    return first;
  }

  if (repeat === 'yearly') {
    const thisYear = localDay(now.getFullYear(), target.month - 1, target.day);
    return thisYear >= today
      ? thisYear
      : localDay(now.getFullYear() + 1, target.month - 1, target.day);
  }

  if (repeat === 'monthly') {
    const thisMonth = localDay(now.getFullYear(), now.getMonth(), target.day);
    return thisMonth >= today
      ? thisMonth
      : localDay(now.getFullYear(), now.getMonth() + 1, target.day);
  }

  // Weekly: the next day that falls on the same weekday, today included.
  const daysAhead = (first.getDay() - today.getDay() + 7) % 7;
  return new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() + daysAhead
  );
}

/** Time remaining until a countdown's day begins, or null if it has no valid date. */
export function getTimeLeft(
  targetDate: string,
  repeat: CountdownRepeat = 'none',
  now: Date = new Date()
): TimeLeft | null {
  const target = parseTargetDay(targetDate);
  if (!target) {
    return null;
  }

  const occurrence = getOccurrence(target, repeat, now);
  const diff = occurrence.getTime() - now.getTime();

  if (diff <= 0) {
    const isToday = startOfDay(now).getTime() === occurrence.getTime();
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isPast: !isToday,
      isToday,
      occurrence,
    };
  }

  return {
    days: Math.floor(diff / MS_PER_DAY),
    hours: Math.floor((diff / (60 * 60 * 1000)) % 24),
    minutes: Math.floor((diff / (60 * 1000)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    isPast: false,
    isToday: false,
    occurrence,
  };
}
