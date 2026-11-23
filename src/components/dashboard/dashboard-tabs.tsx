'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutGrid, Settings } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type React from 'react';

const TABS = ['pages', 'settings'] as const;
type Tab = (typeof TABS)[number];

export function DashboardTabs({
  pages,
  settings,
}: {
  pages: React.ReactNode;
  settings: React.ReactNode;
}) {
  // The open tab lives in the URL (`/app?tab=settings`), so links elsewhere in
  // the app can open Settings directly and a reload stays where you were.
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const requested = searchParams.get('tab');
  const tab: Tab = TABS.includes(requested as Tab)
    ? (requested as Tab)
    : 'pages';

  const selectTab = (next: string) => {
    const params = new URLSearchParams(searchParams);
    if (next === 'pages') {
      params.delete('tab');
    } else {
      params.set('tab', next);
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  };

  return (
    <Tabs value={tab} onValueChange={selectTab} className="w-full">
      <TabsList>
        <TabsTrigger value="pages" className="gap-x-1.5">
          <LayoutGrid className="h-3.5 w-3.5" />
          Pages
        </TabsTrigger>
        <TabsTrigger value="settings" className="gap-x-1.5">
          <Settings className="h-3.5 w-3.5" />
          Settings
        </TabsTrigger>
      </TabsList>

      <TabsContent value="pages" className="mt-6">
        {pages}
      </TabsContent>

      <TabsContent value="settings" className="mt-6">
        {settings}
      </TabsContent>
    </Tabs>
  );
}
