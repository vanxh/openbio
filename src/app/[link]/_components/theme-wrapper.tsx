'use client';

import { getThemePreset } from '@/lib/themes';
import type { CSSProperties, ReactNode } from 'react';

export default function ThemeWrapper({
  children,
  theme: themeName,
  darkMode,
  accentColor,
}: {
  children: ReactNode;
  theme?: string;
  darkMode?: boolean;
  accentColor?: string | null;
}) {
  const theme = getThemePreset(themeName ?? 'default');
  const isDark = darkMode ?? false;
  const colors = isDark ? theme.colors.dark : theme.colors.light;

  const style: CSSProperties = { ...colors } as CSSProperties;

  if (accentColor) {
    (style as Record<string, string>)['--primary'] = accentColor;
    (style as Record<string, string>)['--accent'] = accentColor;
  }

  return (
    <div className={isDark ? 'dark' : ''} style={style}>
      {children}
    </div>
  );
}
