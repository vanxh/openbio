'use client';

import { Button } from '@/components/ui/button';
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
import { toast } from '@/components/ui/use-toast';
import { api } from '@/trpc/react';
import {
  Copy,
  Download,
  Eye,
  Globe,
  Mail,
  Monitor,
  MousePointerClick,
  Users,
} from 'lucide-react';
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

  const { data: subscribers } = api.profileLink.subscribers.useQuery({
    linkId,
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
      <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
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
            <CardTitle className="font-medium text-sm">Unique Views</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-cal text-3xl">{data.uniqueViews}</div>
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Click Rate</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-cal text-3xl">
              {data.views > 0
                ? `${Math.round((data.clicks / data.views) * 100)}%`
                : '0%'}
            </div>
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

      {/* Devices, Browsers & Geography */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Devices */}
        <Card>
          <CardHeader>
            <CardTitle className="font-cal">Devices</CardTitle>
            <CardDescription>Visitor device types</CardDescription>
          </CardHeader>
          <CardContent>
            {data.deviceBreakdown?.devices?.length ? (
              <div className="space-y-3">
                {data.deviceBreakdown.devices.map((d) => {
                  const maxCount = data.deviceBreakdown.devices[0]?.count ?? 1;
                  const pct = Math.round((d.count / maxCount) * 100);
                  return (
                    <div key={d.device} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1.5 capitalize">
                          <Monitor className="h-3.5 w-3.5 text-muted-foreground" />
                          {d.device}
                        </span>
                        <span className="shrink-0 text-muted-foreground">
                          {d.count}
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-chart-4 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="py-6 text-center text-muted-foreground text-sm">
                No device data yet
              </p>
            )}
          </CardContent>
        </Card>

        {/* Browsers */}
        <Card>
          <CardHeader>
            <CardTitle className="font-cal">Browsers</CardTitle>
            <CardDescription>Visitor browsers</CardDescription>
          </CardHeader>
          <CardContent>
            {data.deviceBreakdown?.browsers?.length ? (
              <div className="space-y-3">
                {data.deviceBreakdown.browsers.map((b) => {
                  const maxCount = data.deviceBreakdown.browsers[0]?.count ?? 1;
                  const pct = Math.round((b.count / maxCount) * 100);
                  return (
                    <div key={b.browser} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="truncate">{b.browser}</span>
                        <span className="shrink-0 text-muted-foreground">
                          {b.count}
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-chart-5 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="py-6 text-center text-muted-foreground text-sm">
                No browser data yet
              </p>
            )}
          </CardContent>
        </Card>

        {/* Countries */}
        <Card>
          <CardHeader>
            <CardTitle className="font-cal">Countries</CardTitle>
            <CardDescription>Visitor locations</CardDescription>
          </CardHeader>
          <CardContent>
            {data.geoBreakdown?.length ? (
              <div className="space-y-3">
                {data.geoBreakdown.map((g) => {
                  const maxCount = data.geoBreakdown[0]?.count ?? 1;
                  const pct = Math.round((g.count / maxCount) * 100);
                  return (
                    <div key={g.country} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1.5">
                          <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                          {g.country}
                        </span>
                        <span className="shrink-0 text-muted-foreground">
                          {g.count}
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
            ) : (
              <p className="py-6 text-center text-muted-foreground text-sm">
                No location data yet
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Email Subscribers */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="font-cal">Subscribers</CardTitle>
            <CardDescription>
              {subscribers?.length ?? 0} email{' '}
              {subscribers?.length === 1 ? 'subscriber' : 'subscribers'}
            </CardDescription>
          </div>
          {subscribers && subscribers.length > 0 && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const emails = subscribers.map((s) => s.email).join(', ');
                  navigator.clipboard
                    .writeText(emails)
                    .then(() => {
                      toast({
                        title: 'Copied!',
                        description: `${subscribers.length} emails copied to clipboard.`,
                      });
                    })
                    .catch(() => undefined);
                }}
              >
                <Copy className="mr-1.5 h-3.5 w-3.5" />
                Copy all
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const csv = ['Email,Date']
                    .concat(
                      subscribers.map(
                        (s) =>
                          `${s.email},${new Date(s.createdAt).toLocaleDateString()}`
                      )
                    )
                    .join('\n');
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'subscribers.csv';
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                <Download className="mr-1.5 h-3.5 w-3.5" />
                Export CSV
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {subscribers?.length ? (
            <div className="space-y-2">
              {subscribers.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                >
                  <span className="truncate text-sm">{s.email}</span>
                  <span className="shrink-0 text-muted-foreground text-xs">
                    {new Date(s.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <Mail className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-muted-foreground text-sm">
                No subscribers yet. Add an Email Collect card to your profile.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
