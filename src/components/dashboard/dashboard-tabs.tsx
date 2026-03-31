'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutGrid, Settings } from 'lucide-react';
import type React from 'react';

export function DashboardTabs({
  pages,
  settings,
}: {
  pages: React.ReactNode;
  settings: React.ReactNode;
}) {
  return (
    <Tabs defaultValue="pages" className="w-full">
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
