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
import { Check, Lock, Moon, Paintbrush, Palette, Type } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { type ReactNode, useState } from 'react';

function showProUpsell() {
  toast({
    title: 'Pro feature',
    description: 'Upgrade to Pro to unlock this feature.',
  });
}

function SectionHeader({
  icon,
  title,
  locked,
}: {
  icon: ReactNode;
  title: string;
  locked?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground">{icon}</span>
      <p className="font-medium text-sm">{title}</p>
      {locked && <Lock className="h-3 w-3 text-muted-foreground" />}
    </div>
  );
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
      <DialogContent
        className="max-h-[85vh] overflow-hidden sm:max-w-lg"
        showClose
      >
        <DialogHeader>
          <DialogTitle className="font-cal text-lg">Customize</DialogTitle>
        </DialogHeader>

        <div
          className="-mx-6 overflow-y-auto px-6 pb-1"
          style={{ maxHeight: 'calc(85vh - 120px)' }}
        >
          <div className="space-y-6">
            {/* Theme Presets */}
            <div className="space-y-3">
              <SectionHeader
                icon={<Palette className="h-4 w-4" />}
                title="Theme"
              />
              <div className="grid grid-cols-2 gap-2">
                {THEME_PRESETS.map((preset) => {
                  const isLocked = preset.pro && !isPremium;
                  const isActive = theme === preset.name;
                  const colors = darkMode
                    ? preset.colors.dark
                    : preset.colors.light;
                  return (
                    <button
                      type="button"
                      key={preset.name}
                      className={cn(
                        'relative flex items-center gap-3 rounded-xl border-2 px-3 py-2.5 text-left text-sm transition-all',
                        isActive
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-border/80 hover:bg-muted/30',
                        isLocked && 'opacity-60'
                      )}
                      onClick={() => {
                        if (isLocked) {
                          showProUpsell();
                          return;
                        }
                        setTheme(preset.name);
                      }}
                    >
                      {/* Color preview dots */}
                      <div className="-space-x-1 flex">
                        <span
                          className="h-5 w-5 rounded-full border border-white/20 shadow-sm"
                          style={{ background: colors['--background'] }}
                        />
                        <span
                          className="h-5 w-5 rounded-full border border-white/20 shadow-sm"
                          style={{ background: colors['--primary'] }}
                        />
                        <span
                          className="h-5 w-5 rounded-full border border-white/20 shadow-sm"
                          style={{ background: colors['--card'] }}
                        />
                      </div>
                      <span className="flex-1 truncate font-medium text-xs">
                        {preset.label}
                      </span>
                      {isActive && (
                        <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                      )}
                      {isLocked && (
                        <Lock className="h-3 w-3 shrink-0 text-muted-foreground" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dark Mode */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <SectionHeader
                  icon={<Moon className="h-4 w-4" />}
                  title="Dark Mode"
                  locked={!isPremium}
                />
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
            <div className="space-y-3">
              <SectionHeader
                icon={<Paintbrush className="h-4 w-4" />}
                title="Accent Color"
                locked={!isPremium}
              />
              <div className="flex items-center gap-2">
                <div className="relative">
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
                </div>
                <input
                  type="text"
                  className="h-9 w-full rounded-xl border border-border bg-card px-3 font-mono text-sm disabled:cursor-not-allowed disabled:opacity-50"
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
                    variant="ghost"
                    size="sm"
                    className="shrink-0 rounded-xl text-xs"
                    onClick={() => setAccentColor('')}
                  >
                    Reset
                  </Button>
                )}
              </div>
            </div>

            {/* Custom Footer */}
            <div className="space-y-3">
              <SectionHeader
                icon={<Type className="h-4 w-4" />}
                title="Footer Text"
                locked={!isPremium}
              />
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
                Shown at the bottom of your profile page.
              </p>
            </div>
          </div>
        </div>

        {/* Sticky save button */}
        <div className="border-border border-t pt-4">
          <Button onClick={save} className="w-full rounded-xl">
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
