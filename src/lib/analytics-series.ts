/** One day's count as returned by the analytics queries. */
export type DailyCount = { date: string | Date; count: number };

export type DailyStats = { date: string; views: number; clicks: number };

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** `YYYY-MM-DD` in UTC, the calendar the analytics queries group by. */
export function toDayKey(date: string | Date): string {
  return new Date(date).toISOString().slice(0, 10);
}

/**
 * One row per day for the last `days` days, oldest first, with views and
 * clicks side by side. The queries only return days that had activity; the
 * gaps are filled with zeroes so charts and exports show quiet days as quiet
 * rather than skipping them.
 */
export function buildDailySeries(
  views: DailyCount[],
  clicks: DailyCount[],
  days: number,
  now: Date = new Date()
): DailyStats[] {
  const viewsByDay = new Map(views.map((v) => [toDayKey(v.date), v.count]));
  const clicksByDay = new Map(clicks.map((c) => [toDayKey(c.date), c.count]));

  const today = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate()
  );

  const series: DailyStats[] = [];
  for (let offset = days; offset >= 0; offset--) {
    const date = toDayKey(new Date(today - offset * MS_PER_DAY));
    series.push({
      date,
      views: viewsByDay.get(date) ?? 0,
      clicks: clicksByDay.get(date) ?? 0,
    });
  }
  return series;
}
