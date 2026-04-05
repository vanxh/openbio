import { DashboardTabs } from '@/components/dashboard/dashboard-tabs';
import { EmptyState } from '@/components/dashboard/empty-state';
import { DashboardLinkCard } from '@/components/dashboard/link-card';
import UpgradeCelebration from '@/components/dashboard/upgrade-celebration';
import { GradientButton } from '@/components/ui/gradient-button';
import { Skeleton } from '@/components/ui/skeleton';
import UserSettings from '@/components/user-settings';
import { api } from '@/trpc/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

export default async function Page() {
  const user = await api.user.me();

  if (!user) {
    redirect('/app/sign-in');
  }

  const links = await api.profileLink.getAll();

  return (
    <div className="flex w-full flex-col gap-y-6">
      <UpgradeCelebration />
      <div className="flex items-center justify-between">
        <h1 className="font-cal text-3xl">Dashboard</h1>
        {user.plan === 'pro' || links.length === 0 ? (
          <Link href="/claim-link">
            <GradientButton>Create new</GradientButton>
          </Link>
        ) : (
          <GradientButton disabled className="text-xs opacity-50 sm:text-sm">
            Pro required
          </GradientButton>
        )}
      </div>

      <DashboardTabs
        pages={
          links.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {links.map((link) => (
                <DashboardLinkCard key={link.id} link={link} />
              ))}
            </div>
          )
        }
        settings={
          <Suspense
            fallback={
              <div className="flex flex-col gap-y-6 rounded-lg border border-border bg-background p-6">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-8 w-32" />
              </div>
            }
          >
            <UserSettings user={user} />
          </Suspense>
        }
      />
    </div>
  );
}
