'use client';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { adminCsv } from '@/server/api/schemas/admin';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Inbox,
  RefreshCw,
} from 'lucide-react';
import type { ReactNode } from 'react';
import s from './admin.module.css';

export const number = (value: number) =>
  new Intl.NumberFormat('en-US').format(value);
export const compact = (value: number) =>
  new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
export const date = (value: Date | string | null) =>
  value
    ? new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(new Date(value))
    : '—';
export const initials = (name: string) =>
  name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

export function Avatar({ name, index = 0 }: { name: string; index?: number }) {
  return (
    <span className={s.avatar} data-tone={index % 5}>
      {initials(name)}
    </span>
  );
}

export function PlanBadge({ plan }: { plan: string }) {
  return (
    <Badge
      variant={plan === 'free' ? 'secondary' : 'outline'}
      className={s.planBadge}
    >
      {{ business: 'Business', pro: 'Pro' }[plan] ?? 'Free'}
    </Badge>
  );
}

export function Trend({
  current,
  previous,
}: { current: number; previous: number }) {
  if (!previous) {
    return (
      <span className={s.neutralTrend}>
        {current ? 'New activity' : 'No change'}
      </span>
    );
  }
  const change = ((current - previous) / previous) * 100;
  return (
    <span className={s.trend} data-negative={change < 0}>
      {change < 0 ? <ArrowDown size={12} /> : <ArrowUp size={12} />}
      {Math.abs(change).toFixed(1)}%
    </span>
  );
}

export function Panel({
  title,
  description,
  action,
  children,
  className = '',
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={`${s.panel} ${className}`}>
      <div className={s.panelHeading}>
        <div>
          <h2>{title}</h2>
          {description ? <p>{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </Card>
  );
}

export function Empty({
  title = 'Nothing here yet',
  children,
}: { title?: string; children?: ReactNode }) {
  return (
    <div className={s.empty}>
      <Inbox size={27} strokeWidth={1.4} />
      <h3>{title}</h3>
      <p>{children ?? 'Data will appear here as your community grows.'}</p>
    </div>
  );
}

export function QueryState({
  error,
  retry,
  loading,
}: { error?: string; retry: () => void; loading?: boolean }) {
  if (error) {
    return (
      <div className={s.error} role="alert">
        <h3>We couldn’t load this data.</h3>
        <p>{error}</p>
        <button type="button" className={s.secondaryButton} onClick={retry}>
          <RefreshCw size={14} /> Try again
        </button>
      </div>
    );
  }
  if (loading) {
    return (
      <output className={s.loading}>
        <RefreshCw size={19} className={s.spin} /> Loading your workspace…
      </output>
    );
  }
  return null;
}

export function Pagination({
  page,
  total,
  pageSize,
  onChange,
}: {
  page: number;
  total: number;
  pageSize: number;
  onChange: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className={s.pagination}>
      <span>
        {total
          ? `${number((page - 1) * pageSize + 1)}–${number(Math.min(page * pageSize, total))} of ${number(total)}`
          : '0 results'}
      </span>
      <div>
        <button
          type="button"
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          <ChevronLeft size={16} />
        </button>
        <span>
          Page {page} of {pages}
        </span>
        <button
          type="button"
          aria-label="Next page"
          disabled={page >= pages}
          onClick={() => onChange(page + 1)}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

export function downloadCsv(
  filename: string,
  rows: (string | number | null)[][]
) {
  const blob = new Blob(['\uFEFF', adminCsv(rows)], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function ViewAll({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className={s.textButton} onClick={onClick}>
      View all <ArrowUpRight size={14} />
    </button>
  );
}
