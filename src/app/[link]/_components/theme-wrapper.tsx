'use client';

import { getThemePreset } from '@/lib/themes';
import { type CSSProperties, type ReactNode, useEffect } from 'react';

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

  // Apply theme CSS vars + dark class on body so portaled content (dialogs,
  // toasts, etc.) that renders outside this component's DOM tree still picks
  // up the themed values.
  useEffect(() => {
    const el = document.body;
    const vars = Object.entries(style) as [string, string][];

    for (const [key, value] of vars) {
      el.style.setProperty(key, value);
    }
    if (isDark) {
      el.classList.add('dark');
    }

    return () => {
      for (const [key] of vars) {
        el.style.removeProperty(key);
      }
      el.classList.remove('dark');
    };
  }, [style, isDark]);

  return (
    <div
      className={`${isDark ? 'dark ' : ''}w-full bg-background text-foreground`}
      style={style}
    >
      <div className="fixed inset-0 z-0 bg-background" />
      <div className="relative z-10 w-full">{children}</div>
    </div>
  );
}
