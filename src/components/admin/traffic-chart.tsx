'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import s from './admin.module.css';
import type { AdminOverview } from './preview-data';
import { compact, number } from './shared';

export default function TrafficChart({
  data,
}: { data: AdminOverview['daily'] }) {
  return (
    <div
      className={s.chart}
      role="img"
      aria-label={`Daily profile views and link clicks for ${data.length} days. Totals are shown in the metric cards.`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 18, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="admin-views" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor="var(--foreground)"
                stopOpacity={0.14}
              />
              <stop
                offset="100%"
                stopColor="var(--foreground)"
                stopOpacity={0}
              />
            </linearGradient>
          </defs>
          <CartesianGrid
            vertical={false}
            stroke="var(--border)"
            strokeDasharray="3 4"
          />
          <XAxis
            dataKey="day"
            tickFormatter={(day: string) =>
              new Date(`${day}T00:00:00Z`).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                timeZone: 'UTC',
              })
            }
            axisLine={false}
            tickLine={false}
            minTickGap={45}
            tickMargin={15}
            tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
          />
          <YAxis
            tickFormatter={compact}
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
            tickMargin={10}
          />
          <Tooltip
            labelFormatter={(label) =>
              new Date(`${label}T00:00:00Z`).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                timeZone: 'UTC',
              })
            }
            formatter={(value: number) => number(value)}
            contentStyle={{
              background: 'var(--popover)',
              border: '1px solid var(--border)',
              color: 'var(--popover-foreground)',
              borderRadius: 10,
              fontSize: 12,
              boxShadow: '0 6px 24px #00000010',
            }}
          />
          <Area
            name="Profile views"
            type="monotone"
            dataKey="views"
            stroke="var(--foreground)"
            strokeWidth={2.3}
            fill="url(#admin-views)"
            activeDot={{ r: 4, stroke: 'var(--card)', strokeWidth: 3 }}
            isAnimationActive={false}
          />
          <Area
            name="Link clicks"
            type="monotone"
            dataKey="clicks"
            stroke="#a1a1aa"
            strokeWidth={2}
            fill="transparent"
            strokeDasharray="4 4"
            activeDot={{ r: 3 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
