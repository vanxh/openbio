'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from '@/components/ui/use-toast';
import { QRCodeSVG, getQRAsCanvas } from '@/lib/qr';
import { cn } from '@/lib/utils';
import { Check, CircleHelp, Copy, Crown, Download } from 'lucide-react';
import { useParams } from 'next/navigation';
import type React from 'react';
import { useRef, useState } from 'react';
import { HexColorInput, HexColorPicker } from 'react-colorful';

const PRESET_COLORS = [
  '#000000',
  '#C73E33',
  '#DF6547',
  '#F4B3D7',
  '#F6CF54',
  '#49A065',
  '#2146B7',
  '#AE49BF',
] as const;

export default function LinkQRModal({
  children,
  profileLink,
  linkSlug,
}: {
  children: React.ReactNode;
  profileLink: Record<string, unknown> & { isPremium?: boolean | null };
  linkSlug?: string;
}) {
  const [open, setOpen] = useState(false);
  const [showUpgradePopover, setShowUpgradePopover] = useState(false);

  const params = useParams<{ link: string }>();
  const link = linkSlug ?? params.link;

  const downloadRef = useRef<HTMLAnchorElement>(null);
  const [showLogo, setShowLogo] = useState(true);
  const [fgColor, setFgColor] = useState('#000000');

  const qrConfig = {
    value: `https://openbio.app/${link}`,
    size: 140,
    bgColor: '#ffffff',
    fgColor,
    level: 'Q',
    includeMargin: false,
    imageSettings: {
      height: 40,
      width: 40,
      src: 'https://openbio.app/openbio.png',
      excavate: true,
    },
  };

  const downloadQR = async () => {
    const canvas = await getQRAsCanvas(
      {
        ...qrConfig,
        size: 512,
        imageSettings: showLogo
          ? { ...qrConfig.imageSettings, height: 96, width: 96 }
          : undefined,
      },
      'image/png',
      true
    );
    (canvas as HTMLCanvasElement).toBlob((blob) => {
      if (!blob || !downloadRef.current) {
        return;
      }
      const url = URL.createObjectURL(blob);
      downloadRef.current.href = url;
      downloadRef.current.download = `openbio-${link}.png`;
      downloadRef.current.click();
      URL.revokeObjectURL(url);
      toast({
        title: 'Downloaded!',
        description: 'QR code saved as PNG.',
      });
    });
  };

  const copyToClipboard = async () => {
    const canvas = await getQRAsCanvas(
      {
        ...qrConfig,
        size: 512,
        imageSettings: showLogo
          ? { ...qrConfig.imageSettings, height: 96, width: 96 }
          : undefined,
      },
      'image/png',
      true
    );
    (canvas as HTMLCanvasElement).toBlob((blob) => {
      if (!blob) {
        return;
      }
      const item = new ClipboardItem({ 'image/png': blob });
      navigator.clipboard.write([item]);
      toast({
        title: 'Copied!',
        description: 'QR code copied to clipboard.',
      });
    });
  };

  const handleLogoToggle = (checked: boolean) => {
    if (!profileLink.isPremium && checked) {
      setShowUpgradePopover(true);
      return;
    }
    setShowLogo(checked);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <TooltipProvider>
          <DialogHeader>
            <div className="flex items-center gap-2">
              <DialogTitle className="font-cal text-xl">QR Code</DialogTitle>
              <span className="inline-flex items-center gap-1 rounded-md border border-border bg-muted px-2 py-0.5 font-medium text-muted-foreground text-xs">
                <Crown className="h-3 w-3" />
                PRO
              </span>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* QR Code Preview */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-sm">QR Code Preview</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <CircleHelp className="h-3.5 w-3.5 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        This QR code links to your profile at openbio.app/{link}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={downloadQR}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={copyToClipboard}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex h-52 items-center justify-center rounded-xl border border-border/50 bg-[length:8px_8px] bg-[radial-gradient(circle,rgba(0,0,0,0.06)_1px,transparent_1px)] dark:bg-[radial-gradient(circle,rgba(255,255,255,0.06)_1px,transparent_1px)]">
                <QRCodeSVG
                  {...qrConfig}
                  imageSettings={showLogo ? qrConfig.imageSettings : undefined}
                />
              </div>
            </div>

            {/* Logo Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-sm">Logo</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <CircleHelp className="h-3.5 w-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Show the OpenBio logo in the center of the QR code</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="relative">
                <Switch checked={showLogo} onCheckedChange={handleLogoToggle} />
                {showLogo && (
                  <Crown className="pointer-events-none absolute top-0.75 right-0.75 h-3.5 w-3.5 text-blue-500/30" />
                )}
                {showUpgradePopover && (
                  <div className="absolute top-full right-0 z-50 mt-2 w-64 rounded-xl border border-border bg-popover p-4 text-center shadow-md">
                    <p className="text-sm">
                      You need to be on the Pro plan and above to customize your
                      QR Code logo.
                    </p>
                    <Button
                      className="mt-3 w-full rounded-xl"
                      onClick={() => {
                        setShowUpgradePopover(false);
                        window.location.href = '/app?tab=settings';
                      }}
                    >
                      Upgrade to Pro
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* QR Code Color */}
            <div className="space-y-3">
              <span className="font-medium text-sm">QR Code Color</span>
              <div className="flex items-center gap-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="flex shrink-0 items-center overflow-hidden rounded-lg border border-border transition-colors hover:border-foreground/30"
                    >
                      <div
                        className="h-9 w-10 shrink-0"
                        style={{ backgroundColor: fgColor }}
                      />
                      <span className="px-2.5 font-mono text-xs">
                        {fgColor.toUpperCase()}
                      </span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto space-y-3 p-3"
                    side="top"
                    sideOffset={8}
                  >
                    <HexColorPicker color={fgColor} onChange={setFgColor} />
                    <HexColorInput
                      color={fgColor}
                      onChange={setFgColor}
                      prefixed
                      className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-center font-mono text-sm uppercase"
                    />
                  </PopoverContent>
                </Popover>

                <div className="flex flex-1 items-center justify-between">
                  {PRESET_COLORS.map((color) => {
                    const isSelected =
                      fgColor.toUpperCase() === color.toUpperCase();
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFgColor(color)}
                        className={cn(
                          'relative flex h-8 w-8 items-center justify-center rounded-full transition-all',
                          isSelected
                            ? 'ring-1 ring-black ring-offset-2 dark:ring-white'
                            : 'ring-black/10 hover:ring-4 dark:ring-white/10'
                        )}
                        style={{ backgroundColor: color }}
                      >
                        {isSelected && (
                          <Check
                            className="h-3.5 w-3.5"
                            style={{
                              color:
                                color === '#F4B3D7' || color === '#F6CF54'
                                  ? '#000000'
                                  : '#ffffff',
                            }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                className="rounded-xl px-6"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="rounded-xl px-6"
                onClick={() => {
                  toast({
                    title: 'Settings saved!',
                    description: 'Your QR code customization has been saved.',
                  });
                  setOpen(false);
                }}
              >
                Save changes
              </Button>
            </div>
          </div>

          {/* biome-ignore lint/a11y/useAnchorContent: hidden download trigger */}
          {/* biome-ignore lint/a11y/useValidAnchor: programmatic download */}
          <a
            className="hidden"
            download={`openbio-${link}.png`}
            ref={downloadRef}
          />
        </TooltipProvider>
      </DialogContent>
    </Dialog>
  );
}
