'use client';

import { UserMenu } from '@/components/dashboard/user-menu';
import { NavbarShell } from '@/components/navbar/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GradientButton } from '@/components/ui/gradient-button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/trpc/react';
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowUpRight,
  ChartNoAxesCombined,
  Check,
  ChevronDown,
  CreditCard,
  LayoutDashboard,
  Link2,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import s from './admin.module.css';
import { ProfileDirectory, UserDirectory } from './directories';
import { Analytics, Overview } from './overview';
import {
  type AdminView,
  previewOverview,
  previewProfiles,
  previewUsers,
} from './preview-data';
import { Avatar, QueryState, downloadCsv } from './shared';
import { System } from './system';

const navigation = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'profiles', label: 'Profiles', icon: Link2 },
  { id: 'analytics', label: 'Analytics', icon: ChartNoAxesCombined },
  { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
  { id: 'system', label: 'System & access', icon: Settings2 },
] as const;
const headings: Record<AdminView, { title: string; description: string }> = {
  overview: {
    title: 'Admin dashboard',
    description: 'Manage OpenBio and see how your community is growing.',
  },
  users: {
    title: 'Users',
    description: 'Manage accounts, email verification, and AI credits.',
  },
  profiles: {
    title: 'Profiles',
    description: 'Manage profiles, custom domains, and Explore visibility.',
  },
  analytics: {
    title: 'Analytics',
    description: 'Track profile views, link clicks, and traffic sources.',
  },
  subscriptions: {
    title: 'Subscriptions',
    description: 'View plans and subscription records from Polar.',
  },
  system: {
    title: 'System & access',
    description: 'Check service configuration and administrator access.',
  },
};

export function AdminPanel({
  demo = false,
  initialView = 'overview',
  name,
}: { demo?: boolean; initialView?: AdminView; name: string }) {
  const [view, setView] = useState<AdminView>(initialView);
  const [days, setDays] = useState<7 | 30 | 90>(30);
  const [search, setSearch] = useState('');
  const [directorySearch, setDirectorySearch] = useState('');
  const [searchKey, setSearchKey] = useState(0);
  const [demoUsers, setDemoUsers] = useState(previewUsers);
  const [demoProfiles, setDemoProfiles] = useState(previewProfiles);
  const [notice, setNotice] = useState<{
    message: string;
    error: boolean;
  } | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const utils = api.useUtils();
  const needsOverview = view === 'overview' || view === 'analytics';
  const overview = api.admin.overview.useQuery(
    { days },
    { enabled: !demo && needsOverview }
  );
  const data = demo
    ? { ...previewOverview(days), recent: demoUsers.slice(0, 5) }
    : overview.data;
  const heading = headings[view];

  useEffect(() => {
    if (!notice) {
      return;
    }
    const timeout = window.setTimeout(() => setNotice(null), 6000);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const notify = (message: string, error = false) =>
    setNotice({ message, error });
  const navigate = (next: AdminView) => {
    setView(next);
    const url = new URL(window.location.href);
    url.searchParams.set('view', next);
    window.history.replaceState(null, '', url);
  };
  const refresh = async () => {
    if (demo) {
      notify('Preview refreshed. You’re viewing sample data.');
      return;
    }
    await utils.admin.invalidate();
    notify('Workspace data refreshed.');
  };

  return (
    <div className={s.root}>
      <NavbarShell className="max-w-6xl">
        <Badge
          variant="secondary"
          className="gap-1 rounded-full font-normal text-xs"
        >
          <ShieldCheck size={12} />
          Admin
        </Badge>
        <Button asChild variant="ghost" size="sm" className="rounded-full">
          <Link
            href={demo ? '/admin' : '/app'}
            aria-label={demo ? 'Exit preview' : 'Back to dashboard'}
          >
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
            <span className={s.backLabel}>
              {demo ? 'Exit preview' : 'Dashboard'}
            </span>
          </Link>
        </Button>
        {demo ? <Avatar name={name} /> : <UserMenu />}
      </NavbarShell>
      <main className={s.content} id="admin-main">
        {demo ? (
          <div className={s.previewBanner}>
            <span>
              <Badge
                variant="secondary"
                className="rounded-full font-normal text-xs"
              >
                Preview
              </Badge>
              Sample data · changes reset on reload
            </span>
            <Link href="/admin">
              Configure access <ArrowUpRight size={14} />
            </Link>
          </div>
        ) : null}
        <div className={s.pageHeading}>
          <div>
            <h1>{heading.title}</h1>
            <p>{heading.description}</p>
          </div>
          <div className={s.pageActions}>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="rounded-full"
              aria-label="Refresh workspace data"
              title="Refresh data"
              disabled={overview.isFetching && !demo}
              onClick={refresh}
            >
              <RefreshCw
                size={15}
                className={overview.isFetching && !demo ? s.spin : ''}
              />
            </Button>
            {needsOverview ? (
              <>
                <label className={s.periodSelect}>
                  <select
                    aria-label="Reporting period"
                    value={days}
                    onChange={(event) =>
                      setDays(Number(event.target.value) as 7 | 30 | 90)
                    }
                  >
                    <option value={7}>Last 7 days</option>
                    <option value={30}>Last 30 days</option>
                    <option value={90}>Last 90 days</option>
                  </select>
                  <ChevronDown size={14} />
                </label>
                <GradientButton
                  type="button"
                  size="sm"
                  className="gap-2"
                  disabled={!data}
                  onClick={() => {
                    if (data) {
                      downloadCsv(`openbio-report-${days}-days.csv`, [
                        ['Date (UTC)', 'Views', 'Clicks', 'New users'],
                        ...data.daily.map((item) => [
                          item.day,
                          item.views,
                          item.clicks,
                          item.users,
                        ]),
                      ]);
                    }
                  }}
                >
                  <ArrowDownToLine size={15} />
                  Export report
                </GradientButton>
              </>
            ) : null}
          </div>
        </div>
        <Tabs
          value={view}
          onValueChange={(next) => navigate(next as AdminView)}
          className="w-full"
        >
          <div className={s.toolsRow}>
            <div className={s.tabsScroll}>
              <TabsList aria-label="Admin navigation">
                {navigation.map((item) => (
                  <TabsTrigger
                    key={item.id}
                    value={item.id}
                    className="gap-x-1.5"
                  >
                    <item.icon className="h-3.5 w-3.5" />
                    {item.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            <form
              className={s.globalSearch}
              onSubmit={(event) => {
                event.preventDefault();
                setDirectorySearch(search);
                setSearchKey((value) => value + 1);
                navigate('users');
              }}
            >
              <Search size={15} />
              <input
                ref={searchRef}
                aria-label="Search community"
                placeholder="Search users…"
                maxLength={100}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <kbd>⌘ K</kbd>
            </form>
          </div>
          <TabsContent value={view} className={s.tabContent}>
            {needsOverview &&
            !demo &&
            (overview.isPending || overview.error) ? (
              <QueryState
                loading={overview.isPending}
                error={overview.error?.message}
                retry={() => overview.refetch()}
              />
            ) : null}
            {view === 'overview' && data && (demo || !overview.error) ? (
              <Overview data={data} days={days} onNavigate={navigate} />
            ) : null}
            {view === 'analytics' && data && (demo || !overview.error) ? (
              <Analytics data={data} days={days} />
            ) : null}
            {view === 'users' || view === 'subscriptions' ? (
              <UserDirectory
                key={`${view}-${searchKey}`}
                demo={demo}
                previewUsers={demoUsers}
                setPreviewUsers={setDemoUsers}
                initialSearch={view === 'users' ? directorySearch : ''}
                subscriptions={view === 'subscriptions'}
                notify={notify}
              />
            ) : null}
            {view === 'profiles' ? (
              <ProfileDirectory
                demo={demo}
                previewProfiles={demoProfiles}
                setPreviewProfiles={setDemoProfiles}
                notify={notify}
              />
            ) : null}
            {view === 'system' ? <System demo={demo} /> : null}
          </TabsContent>
        </Tabs>
        <footer className={s.footer}>
          <Link href="/" className="font-cal text-foreground text-sm">
            OpenBio
          </Link>
          <span>
            Admin panel <span>·</span>{' '}
            {demo ? 'Development preview' : 'Admin access verified'}
          </span>
        </footer>
      </main>
      {notice ? (
        <div
          className={s.notice}
          data-error={notice.error}
          role={notice.error ? 'alert' : 'status'}
        >
          {notice.error ? <ShieldCheck size={17} /> : <Check size={17} />}
          <span>{notice.message}</span>
          <button
            type="button"
            aria-label="Dismiss notification"
            onClick={() => setNotice(null)}
          >
            <X size={14} />
          </button>
        </div>
      ) : null}
    </div>
  );
}
