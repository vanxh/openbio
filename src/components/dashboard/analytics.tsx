'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { api } from '@/trpc/react';
import { Eye, MousePointerClick } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';

const viewsConfig = {
  views: {
    label: 'Views',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig;

const clicksConfig = {
  clicks: {
    label: 'Clicks',
    color: 'var(--chart-2)',
  },
} satisfies ChartConfig;

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function Analytics({ linkId }: { linkId: string }) {
  const { data, isLoading } = api.profileLink.analytics.useQuery({
    linkId,
    days: 30,
  });

  if (isLoading) {
    return (
      <div className="grid gap-6">
        <div className="grid grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-4 w-20 animate-pulse rounded bg-muted" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="h-[250px] animate-pulse rounded bg-muted" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const viewsData = data.viewsOverTime.map((v) => ({
    date: formatDate(v.date),
    views: v.count,
  }));

  const clicksData = data.clicksOverTime.map((c) => ({
    date: formatDate(c.date),
    clicks: c.count,
  }));

  return (
    <div className="grid gap-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-cal text-3xl">{data.views}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Total Clicks</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-cal text-3xl">{data.clicks}</div>
          </CardContent>
        </Card>
      </div>

      {/* Views over time */}
      <Card>
        <CardHeader>
          <CardTitle className="font-cal">Views</CardTitle>
          <CardDescription>Profile views over the last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          {viewsData.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground text-sm">
              No view data yet
            </p>
          ) : (
            <ChartContainer config={viewsConfig} className="h-[250px] w-full">
              <AreaChart data={viewsData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="views"
                  fill="var(--color-views)"
                  fillOpacity={0.2}
                  stroke="var(--color-views)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Clicks over time */}
      <Card>
        <CardHeader>
          <CardTitle className="font-cal">Clicks</CardTitle>
          <CardDescription>Card clicks over the last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          {clicksData.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground text-sm">
              No click data yet
            </p>
          ) : (
            <ChartContainer config={clicksConfig} className="h-[250px] w-full">
              <AreaChart data={clicksData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="clicks"
                  fill="var(--color-clicks)"
                  fillOpacity={0.2}
                  stroke="var(--color-clicks)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Top cards + referrers side by side */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Top clicked cards */}
        <Card>
          <CardHeader>
            <CardTitle className="font-cal">Top Links</CardTitle>
            <CardDescription>Most clicked cards</CardDescription>
          </CardHeader>
          <CardContent>
            {data.topCards.length === 0 ? (
              <p className="py-6 text-center text-muted-foreground text-sm">
                No click data yet
              </p>
            ) : (
              <div className="space-y-3">
                {data.topCards.map((c) => {
                  const maxCount = data.topCards[0]?.count ?? 1;
                  const pct = Math.round((c.count / maxCount) * 100);
                  let label: string;
                  try {
                    const url = new URL(c.href);
                    label = url.hostname.replace('www.', '') + url.pathname;
                  } catch {
                    label = c.href;
                  }
                  return (
                    <div key={c.bentoId} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="truncate">{label}</span>
                        <span className="shrink-0 text-muted-foreground">
                          {c.count}
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-chart-3 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top referrers */}
        <Card>
          <CardHeader>
            <CardTitle className="font-cal">Top Referrers</CardTitle>
            <CardDescription>Where your visitors come from</CardDescription>
          </CardHeader>
          <CardContent>
            {data.topReferrers.length === 0 ? (
              <p className="py-6 text-center text-muted-foreground text-sm">
                No referrer data yet
              </p>
            ) : (
              <div className="space-y-3">
                {data.topReferrers.map((r) => {
                  const maxCount = data.topReferrers[0]?.count ?? 1;
                  const pct = Math.round((r.count / maxCount) * 100);
                  let label = r.referrer;
                  try {
                    if (label !== 'Direct') {
                      label = new URL(label).hostname.replace('www.', '');
                    }
                  } catch {
                    // keep raw label
                  }
                  return (
                    <div key={r.referrer} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="truncate">{label}</span>
                        <span className="shrink-0 text-muted-foreground">
                          {r.count}
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
