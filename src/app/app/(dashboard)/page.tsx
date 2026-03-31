import { EmptyState } from '@/components/dashboard/empty-state';
import { DashboardLinkCard } from '@/components/dashboard/link-card';
import { GradientButton } from '@/components/ui/gradient-button';
import UserSettings from '@/components/user-settings';
import { api } from '@/trpc/server';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';

export default async function Page() {
  const user = await api.user.me();

  if (!user) {
    // This is a hack to make sure the user is created after the first login
    setInterval(() => {
      revalidatePath('/app');
    }, 1000);
    return null;
  }

  const links = await api.profileLink.getAll();

  return (
    <div className="flex w-full flex-col gap-y-12">
      {/* Pages section */}
      <section className="flex flex-col gap-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-cal text-3xl">Your pages</h1>
          <Link href="/claim-link">
            <GradientButton>Create new</GradientButton>
          </Link>
        </div>

        {links.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {links.map((link) => (
              <DashboardLinkCard key={link.id} link={link} />
            ))}
          </div>
        )}
      </section>

      {/* Settings section */}
      <section className="flex flex-col gap-y-6">
        <h2 className="font-cal text-2xl">Settings</h2>
        <UserSettings user={user} />
      </section>
    </div>
  );
}
