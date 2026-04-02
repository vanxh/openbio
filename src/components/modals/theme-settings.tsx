'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/use-toast';
import { THEME_PRESETS } from '@/lib/themes';
import { cn } from '@/lib/utils';
import { api } from '@/trpc/react';
import { Lock } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { type ReactNode, useState } from 'react';

function showProUpsell() {
  toast({
    title: 'Pro feature',
    description: 'Upgrade to Pro to unlock this feature.',
  });
}

export default function ThemeSettingsModal({
  children,
  isPremium,
}: {
  children: ReactNode;
  isPremium: boolean;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { link } = useParams<{ link: string }>();
  const queryClient = api.useContext();

  const { data: profileLink } = api.profileLink.getByLink.useQuery({ link });

  const [theme, setTheme] = useState(profileLink?.theme ?? 'default');
  const [darkMode, setDarkMode] = useState(profileLink?.darkMode ?? false);
  const [accentColor, setAccentColor] = useState(
    profileLink?.accentColor ?? ''
  );
  const [customFooter, setCustomFooter] = useState(
    profileLink?.customFooter ?? ''
  );

  const { mutateAsync: updateLink } = api.profileLink.update.useMutation({
    onSuccess: () => {
      queryClient.profileLink.getByLink.invalidate({ link });
      router.refresh();
      setOpen(false);
    },
  });

  const save = () => {
    if (!profileLink) {
      return;
    }
    updateLink({
      id: profileLink.id,
      theme,
      darkMode,
      accentColor: accentColor || null,
      customFooter: customFooter || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg" showClose>
        <DialogHeader>
          <DialogTitle className="font-cal">Theme Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Theme Presets */}
          <div className="space-y-2">
            <p className="font-medium text-sm">Theme</p>
            <div className="grid grid-cols-3 gap-2">
              {THEME_PRESETS.map((preset) => {
                const isLocked = preset.pro && !isPremium;
                const isActive = theme === preset.name;
                return (
                  <button
                    type="button"
                    key={preset.name}
                    className={cn(
                      'relative flex items-center gap-2 rounded-xl border-2 px-4 py-3 text-left text-sm transition-colors',
                      isActive ? 'border-primary' : 'border-border'
                    )}
                    onClick={() => {
                      if (isLocked) {
                        showProUpsell();
                        return;
                      }
                      setTheme(preset.name);
                    }}
                  >
                    <span
                      className="h-4 w-4 shrink-0 rounded-full border border-border"
                      style={{
                        background: (darkMode
                          ? preset.colors.dark
                          : preset.colors.light)['--primary'],
                      }}
                    />
                    <span
                      className="h-4 w-4 shrink-0 rounded-full border border-border"
                      style={{
                        background: (darkMode
                          ? preset.colors.dark
                          : preset.colors.light)['--background'],
                      }}
                    />
                    <span className="truncate">{preset.label}</span>
                    {isLocked && (
                      <Lock className="absolute top-1 right-1 h-3 w-3 text-muted-foreground" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dark Mode */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="font-medium text-sm">Dark Mode</p>
                {!isPremium && (
                  <Lock className="h-3 w-3 text-muted-foreground" />
                )}
              </div>
              <Switch
                checked={darkMode}
                onCheckedChange={(checked) => {
                  if (!isPremium) {
                    showProUpsell();
                    return;
                  }
                  setDarkMode(checked);
                }}
                disabled={!isPremium}
              />
            </div>
          </div>

          {/* Accent Color */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <p className="font-medium text-sm">Custom Accent Color</p>
              {!isPremium && <Lock className="h-3 w-3 text-muted-foreground" />}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                className="h-9 w-9 shrink-0 cursor-pointer rounded-xl border border-border bg-transparent disabled:cursor-not-allowed disabled:opacity-50"
                value={accentColor || '#000000'}
                disabled={!isPremium}
                onChange={(e) => {
                  if (!isPremium) {
                    showProUpsell();
                    return;
                  }
                  setAccentColor(e.target.value);
                }}
              />
              <input
                type="text"
                className="h-9 w-full rounded-xl border border-border bg-card px-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="#000000"
                value={accentColor}
                disabled={!isPremium}
                onChange={(e) => {
                  if (!isPremium) {
                    showProUpsell();
                    return;
                  }
                  setAccentColor(e.target.value);
                }}
              />
              {isPremium && accentColor && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => setAccentColor('')}
                >
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Custom Footer */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <p className="font-medium text-sm">Custom Footer Text</p>
              {!isPremium && <Lock className="h-3 w-3 text-muted-foreground" />}
            </div>
            <input
              type="text"
              className="h-9 w-full rounded-xl border border-border bg-card px-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Made with OpenBio"
              value={customFooter}
              disabled={!isPremium}
              maxLength={100}
              onChange={(e) => {
                if (!isPremium) {
                  showProUpsell();
                  return;
                }
                setCustomFooter(e.target.value);
              }}
            />
            <p className="text-muted-foreground text-xs">
              Customize the footer text on your profile page.
            </p>
          </div>

          {/* Save */}
          <Button onClick={save} className="w-full rounded-xl">
            Save Theme
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
