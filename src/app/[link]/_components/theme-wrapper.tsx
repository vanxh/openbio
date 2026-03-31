'use client';

import { getThemePreset } from '@/lib/themes';
import { api } from '@/trpc/react';
import { useParams } from 'next/navigation';
import type { CSSProperties, ReactNode } from 'react';

export default function ThemeWrapper({ children }: { children: ReactNode }) {
  const { link } = useParams<{ link: string }>();

  const [profileLink] = api.profileLink.getByLink.useSuspenseQuery({
    link,
  });

  const theme = getThemePreset(profileLink?.theme ?? 'default');
  const isDark = profileLink?.darkMode ?? false;
  const colors = isDark ? theme.colors.dark : theme.colors.light;

  const style: CSSProperties = { ...colors } as CSSProperties;

  if (profileLink?.accentColor) {
    (style as Record<string, string>)['--primary'] = profileLink.accentColor;
    (style as Record<string, string>)['--accent'] = profileLink.accentColor;
  }

  return (
    <div className={isDark ? 'dark' : ''} style={style}>
      {children}
    </div>
  );
}
