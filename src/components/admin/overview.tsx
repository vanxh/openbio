'use client';

import {
  ArrowDownToLine,
  ArrowUpRight,
  CircleHelp,
  Globe2,
  Link2,
  MousePointer2,
  Users,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import s from './admin.module.css';
import type { AdminOverview, AdminView } from './preview-data';
import {
  Avatar,
  Empty,
  Panel,
  PlanBadge,
  Trend,
  ViewAll,
  compact,
  date,
  downloadCsv,
  number,
} from './shared';

const TrafficChart = dynamic(() => import('./traffic-chart'), {
  loading: () => <div className={s.chartLoading}>Loading chart…</div>,
  ssr: false,
});

function sparkline(values: number[]) {
  const minimum = Math.min(...values);
  const range = Math.max(...values) - minimum;
  return values
    .map(
      (value, index) =>
        `${(index / Math.max(1, values.length - 1)) * 72},${range ? 32 - ((value - minimum) / range) * 28 : 18}`
    )
    .join(' ');
}

export function MetricCards({
  data,
  days,
}: { data: AdminOverview; days: number }) {
  const metrics = [
    {
      label: 'Total users',
      value: data.users.total,
      current: data.users.current,
      previous: data.users.previous,
      caption: `${number(data.users.current)} new this period`,
      icon: Users,
      line: sparkline(data.daily.map((day) => day.users)),
    },
    {
      label: 'Profile views',
      value: data.views.current,
      current: data.views.current,
      previous: data.views.previous,
      caption: `${compact(data.views.unique)} unique visitor IPs`,
      icon: Globe2,
      line: sparkline(data.daily.map((day) => day.views)),
    },
    {
      label: 'Link clicks',
      value: data.clicks.current,
      current: data.clicks.current,
      previous: data.clicks.previous,
      caption: `Across the last ${days} days`,
      icon: MousePointer2,
      line: sparkline(data.daily.map((day) => day.clicks)),
    },
    {
      label: 'Total profiles',
      value: data.profiles.total,
      caption: `${number(data.profiles.listed)} listed in Explore`,
      icon: Link2,
      line: null,
    },
  ];
  return (
    <div className={s.metrics}>
      {metrics.map((metric) => (
        <div key={metric.label} className={s.metric}>
          <div className={s.metricLabel}>
            <span>{metric.label}</span>
            <metric.icon size={16} strokeWidth={1.6} />
          </div>
          <div className={s.metricValue}>
            {number(metric.value)}
            {metric.line ? (
              <svg viewBox="0 0 74 36" aria-hidden="true">
                <polyline
                  points={metric.line}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <span className={s.listedRatio}>
                {data.profiles.total
                  ? Math.round(
                      (data.profiles.listed / data.profiles.total) * 100
                    )
                  : 0}
                %<small>listed</small>
              </span>
            )}
          </div>
          <div className={s.metricBottom}>
            {metric.current !== undefined && metric.previous !== undefined ? (
              <Trend current={metric.current} previous={metric.previous} />
            ) : (
              <span className={s.smallDot} />
            )}
            <span>{metric.caption}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function TrafficPanel({
  data,
  days,
}: { data: AdminOverview; days: number }) {
  return (
    <Panel
      title="Traffic overview"
      description={`Profile views and link clicks over the last ${days} days · UTC`}
      action={
        <div className={s.chartLegend}>
          <span>
            <i />
            Profile views
          </span>
          <span>
            <i />
            Link clicks
          </span>
        </div>
      }
    >
      <TrafficChart data={data.daily} />
      <div className={s.chartFoot}>
        <span>
          <span className={s.smallDot} />
          Daily traffic · UTC
        </span>
        <button
          type="button"
          className={s.textButton}
          onClick={() =>
            downloadCsv('openbio-traffic.csv', [
              ['Date (UTC)', 'Profile views', 'Link clicks', 'New users'],
              ...data.daily.map((item) => [
                item.day,
                item.views,
                item.clicks,
                item.users,
              ]),
            ])
          }
        >
          <ArrowDownToLine size={13} /> Export data
        </button>
      </div>
    </Panel>
  );
}

export function PlanPanel({
  data,
  onNavigate,
}: { data: AdminOverview; onNavigate: (view: AdminView) => void }) {
  const counts = ['free', 'pro', 'business'].map(
    (plan) => data.plans.find((item) => item.plan === plan)?.count ?? 0
  );
  const total = counts.reduce((sum, value) => sum + value, 0);
  const free = total ? ((counts[0] ?? 0) / total) * 100 : 0;
  const pro = total ? ((counts[1] ?? 0) / total) * 100 : 0;
  return (
    <Panel
      title="Plans"
      description="Your community by plan"
      action={
        <CircleHelp
          size={15}
          className={s.muted}
          aria-label="Plan distribution across all accounts"
        />
      }
    >
      <div className={s.donutWrap}>
        <div
          className={s.donut}
          style={{
            background: total
              ? `conic-gradient(#e5e5e5 0% ${free}%, var(--foreground) ${free}% ${free + pro}%, #a1a1aa ${free + pro}% 100%)`
              : 'var(--muted)',
          }}
        >
          <div>
            <strong>{compact(total)}</strong>
            <span>total users</span>
          </div>
        </div>
      </div>
      <div className={s.planLegend}>
        {['Free', 'Pro', 'Business'].map((plan, i) => (
          <div key={plan}>
            <span>
              <i data-plan={plan.toLowerCase()} />
              {plan}
            </span>
            <strong>{number(counts[i] ?? 0)}</strong>
            <small>
              {total ? Math.round(((counts[i] ?? 0) / total) * 100) : 0}%
            </small>
          </div>
        ))}
      </div>
      <button
        type="button"
        className={s.planLink}
        onClick={() => onNavigate('subscriptions')}
      >
        Explore subscriptions <ArrowUpRight size={14} />
      </button>
    </Panel>
  );
}

export function Overview({
  data,
  days,
  onNavigate,
}: {
  data: AdminOverview;
  days: number;
  onNavigate: (view: AdminView) => void;
}) {
  return (
    <>
      <MetricCards data={data} days={days} />
      <div className={s.overviewGrid}>
        <TrafficPanel data={data} days={days} />
        <PlanPanel data={data} onNavigate={onNavigate} />
      </div>
      <div className={s.bottomGrid}>
        <Panel
          title="Recent users"
          description="The latest accounts created on OpenBio"
          action={<ViewAll onClick={() => onNavigate('users')} />}
        >
          {data.recent.length ? (
            <div className={s.tableScroll}>
              <table className={s.table}>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Plan</th>
                    <th>Status</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recent.map((user, i) => (
                    <tr key={user.id}>
                      <td>
                        <div className={s.person}>
                          <Avatar name={user.name} index={i} />
                          <div>
                            <strong>{user.name}</strong>
                            <small>{user.email}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <PlanBadge plan={user.plan} />
                      </td>
                      <td>
                        <span
                          className={s.status}
                          data-active={user.emailVerified}
                        >
                          <i />
                          {user.emailVerified ? 'Verified' : 'Unverified'}
                        </span>
                      </td>
                      <td className={s.muted}>{date(user.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty />
          )}
        </Panel>
        <Panel
          title="Top profiles"
          description="Most viewed profiles in this period"
          action={<ViewAll onClick={() => onNavigate('profiles')} />}
        >
          {data.topProfiles.length ? (
            <div className={s.topProfiles}>
              {data.topProfiles.map((profile, i) => (
                <div key={profile.id}>
                  <span className={s.rank}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <Avatar name={profile.name} index={i + 2} />
                  <div>
                    <strong>{profile.name}</strong>
                    <small>/{profile.slug}</small>
                  </div>
                  <span className={s.profileViews}>
                    {compact(profile.views)}
                    <small>views</small>
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <Empty title="No profile views yet" />
          )}
        </Panel>
      </div>
    </>
  );
}

const WWW_PREFIX = /^www\./;
const COUNTRY_CODE = /^[A-Z]{2}$/;

function countryName(country: string | null) {
  const code = country?.toUpperCase();
  if (!code || !COUNTRY_CODE.test(code)) {
    return 'Unknown location';
  }
  return new Intl.DisplayNames(['en'], { type: 'region' }).of(code) ?? code;
}

function sourceName(source: string | null) {
  if (!source) {
    return 'Direct / unknown';
  }
  try {
    return new URL(source).hostname.replace(WWW_PREFIX, '');
  } catch {
    return source.slice(0, 70);
  }
}

export function Analytics({
  data,
  days,
}: { data: AdminOverview; days: number }) {
  return (
    <>
      <MetricCards data={data} days={days} />
      <TrafficPanel data={data} days={days} />
      <div className={s.bottomGrid}>
        <Panel
          title="Where your community lives"
          description="Top countries by profile views"
        >
          {data.countries.length ? (
            <div className={s.breakdown}>
              {data.countries.map((item) => (
                <div key={item.country ?? 'unknown'}>
                  <div>
                    <strong>{countryName(item.country)}</strong>
                    <span>
                      {number(item.count)}{' '}
                      <small>
                        {data.views.current
                          ? ((item.count / data.views.current) * 100).toFixed(1)
                          : 0}
                        %
                      </small>
                    </span>
                  </div>
                  <div className={s.progress}>
                    <i
                      style={{
                        width: `${data.views.current ? (item.count / data.views.current) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Empty />
          )}
        </Panel>
        <Panel
          title="How they found you"
          description="Top recorded referring URLs · direct visits include unknown sources"
        >
          {data.referrers.length ? (
            <div className={s.breakdown}>
              {data.referrers.map((item) => (
                <div key={item.referrer ?? 'direct'}>
                  <div>
                    <strong title={item.referrer ?? 'Direct'}>
                      {sourceName(item.referrer)}
                    </strong>
                    <span>
                      {number(item.count)}{' '}
                      <small>
                        {data.views.current
                          ? ((item.count / data.views.current) * 100).toFixed(1)
                          : 0}
                        %
                      </small>
                    </span>
                  </div>
                  <div className={s.progress}>
                    <i
                      style={{
                        width: `${data.views.current ? (item.count / data.views.current) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Empty />
          )}
        </Panel>
      </div>
    </>
  );
}
