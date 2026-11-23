'use client';

import CardOverlay from '@/components/bento/overlay';
import { useCardSize } from '@/components/bento/use-card-size';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { useSaveBento } from '@/hooks/use-save-bento';
import {
  type PlatformKey,
  describeLink,
  getPlatformKey,
  isFollowable,
} from '@/lib/link-platform';
import type { getMetadata } from '@/lib/metadata';
import { toSafeUrl } from '@/lib/url';
import { cn } from '@/lib/utils';
import { api } from '@/trpc/react';
import type { LinkBentoSchema } from '@/types';
import { Pencil } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type React from 'react';
import { useState } from 'react';
import { BiLogoTelegram } from 'react-icons/bi';
import { BsDiscord, BsTwitterX } from 'react-icons/bs';
import {
  FaGithub,
  FaInstagram,
  FaLinkedinIn,
  FaTwitch,
  FaYoutube,
} from 'react-icons/fa';
import type * as z from 'zod';

type Metadata = Awaited<ReturnType<typeof getMetadata>>;
type BentoData = z.infer<typeof LinkBentoSchema>;

// Sizes that have proper layouts for link cards
export const LINK_CARD_SIZES = ['2x2', '4x1', '4x2'] as const;

type PlatformInfo = {
  icon: React.ReactNode;
  color: string;
  bg: string;
  action: { label: string; className: string };
};

const PLATFORM_MAP: Record<string, PlatformInfo> = {
  twitter: {
    icon: <BsTwitterX size={20} className="text-foreground" />,
    color: '#000000',
    bg: 'bg-foreground/5',
    action: {
      label: 'Follow',
      className:
        'rounded-full bg-foreground text-background hover:bg-foreground/90',
    },
  },
  linkedin: {
    icon: <FaLinkedinIn size={20} className="text-[#0A66C2]" />,
    color: '#0A66C2',
    bg: 'bg-[#0A66C2]/5',
    action: {
      label: 'Connect',
      className: 'rounded-full bg-[#0A66C2] text-white hover:bg-[#004182]',
    },
  },
  github: {
    icon: <FaGithub size={20} className="text-foreground" />,
    color: '#333333',
    bg: 'bg-gray-500/5',
    action: {
      label: 'Follow',
      className: 'rounded-full',
    },
  },
  instagram: {
    icon: <FaInstagram size={20} className="text-[#F56040]" />,
    color: '#F56040',
    bg: 'bg-[#F56040]/5',
    action: {
      label: 'Follow',
      className:
        'rounded-full bg-foreground text-background hover:bg-foreground/90',
    },
  },
  twitch: {
    icon: <FaTwitch size={20} className="text-[#9146FF]" />,
    color: '#9146FF',
    bg: 'bg-[#9146FF]/5',
    action: {
      label: 'Follow',
      className: 'rounded-full bg-[#9146FF] text-white hover:bg-[#7c3aed]',
    },
  },
  telegram: {
    icon: <BiLogoTelegram size={24} className="text-[#0088CC]" />,
    color: '#0088CC',
    bg: 'bg-[#0088CC]/5',
    action: {
      label: 'Message',
      className: 'rounded-full',
    },
  },
  discord: {
    icon: <BsDiscord size={24} className="text-[#5A65EA]" />,
    color: '#5A65EA',
    bg: 'bg-[#5A65EA]/5',
    action: {
      label: 'Join',
      className: 'rounded-full bg-[#5A65EA] text-white hover:bg-[#4752c4]',
    },
  },
  youtube: {
    icon: <FaYoutube size={20} className="text-[#FF0000]" />,
    color: '#FF0000',
    bg: 'bg-[#FF0000]/5',
    action: {
      label: 'Subscribe',
      className: 'rounded-full bg-[#FF0000] text-white hover:bg-[#cc0000]',
    },
  },
};

function getPlatform(url: string): PlatformInfo | null {
  const key = getPlatformKey(url);
  return key ? (PLATFORM_MAP[key] ?? null) : null;
}

function getIcon(url: string) {
  const platform = getPlatform(url);
  if (platform) {
    return platform.icon;
  }
  const { host } = describeLink(url);
  return (
    <Image
      src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=128`}
      alt=""
      width={24}
      height={24}
      className="rounded-md"
      unoptimized
    />
  );
}

const LARGE_ICONS: Record<PlatformKey, React.ReactNode> = {
  twitter: <BsTwitterX size={32} className="text-foreground" />,
  linkedin: <FaLinkedinIn size={32} className="text-[#0A66C2]" />,
  github: <FaGithub size={32} className="text-foreground" />,
  instagram: <FaInstagram size={32} className="text-[#F56040]" />,
  twitch: <FaTwitch size={32} className="text-[#9146FF]" />,
  telegram: <BiLogoTelegram size={36} className="text-[#0088CC]" />,
  discord: <BsDiscord size={36} className="text-[#5A65EA]" />,
  youtube: <FaYoutube size={32} className="text-[#FF0000]" />,
};

function getLargeIcon(url: string) {
  const key = getPlatformKey(url);
  return key ? LARGE_ICONS[key] : null;
}

function getTitle(url: string, metadata?: Metadata) {
  const { title, host } = describeLink(url);
  return title ?? metadata?.title ?? host;
}

function getDescription(url: string, metadata?: Metadata) {
  return describeLink(url).caption ?? metadata?.description ?? null;
}

function getAction(url: string) {
  const platform = getPlatform(url);
  if (!(platform && isFollowable(url))) {
    return null;
  }
  return (
    <Button size="sm" className={platform.action.className}>
      {platform.action.label}
    </Button>
  );
}

function ActionButton({
  url,
  variant = 'default',
}: {
  url: string;
  variant?: 'default' | 'outline';
}) {
  const platform = getPlatform(url);
  if (!(platform && isFollowable(url))) {
    return null;
  }
  return (
    <Button
      size="sm"
      variant={variant}
      className={
        variant === 'outline' ? 'rounded-full' : platform.action.className
      }
    >
      {platform.action.label}
    </Button>
  );
}

// --- Layout Components ---

function CardWrapper({
  bento,
  editable,
  className,
  children,
  onEdit,
}: {
  bento: BentoData;
  editable?: boolean;
  className?: string;
  children: React.ReactNode;
  onEdit?: () => void;
}) {
  const { link: linkSlug } = useParams<{ link: string }>();
  const { data: profileLink } = api.profileLink.getByLink.useQuery(
    { link: linkSlug },
    { enabled: !editable }
  );
  const { mutate: trackClick } = api.profileLink.trackClick.useMutation();

  const handleClick = () => {
    // Owners previewing their own page are not real clicks.
    if (!editable && profileLink && !profileLink.isOwner && bento.href) {
      trackClick({
        linkId: profileLink.id,
        bentoId: bento.id,
        href: bento.href,
      });
    }
  };

  const Comp = editable ? 'div' : Link;
  return (
    <Comp
      href={bento.href ?? ''}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className={cn(
        'group relative z-0 h-full w-full select-none rounded-2xl border border-border bg-card shadow-sm',
        editable
          ? 'transition-transform duration-200 ease-in-out md:cursor-move'
          : 'hover:-translate-y-0.5 cursor-pointer transition-all duration-200 hover:border-border/80 hover:shadow-md',
        className
      )}
    >
      {editable && <CardOverlay bento={bento} allowedSizes={LINK_CARD_SIZES} />}
      {children}
      {editable && onEdit && (
        <button
          type="button"
          className="absolute top-3 right-3 z-50 cursor-pointer rounded-lg border border-border/50 bg-background/90 p-1.5 text-muted-foreground opacity-0 shadow-md backdrop-blur-sm transition-all hover:bg-accent hover:text-accent-foreground group-hover:opacity-100"
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onEdit();
          }}
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      )}
    </Comp>
  );
}

function IconBadge({
  href,
  size = 'md',
}: {
  href: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  return (
    <div
      className={cn(
        'inline-flex shrink-0 items-center justify-center border border-border/60 bg-muted/50',
        size === 'sm' && 'h-8 w-8 rounded-lg',
        size === 'md' && 'h-10 w-10 rounded-xl',
        size === 'lg' && 'h-14 w-14 rounded-2xl'
      )}
    >
      {size === 'lg' ? (getLargeIcon(href) ?? getIcon(href)) : getIcon(href)}
    </div>
  );
}

// 2x2: Compact card
function CompactLayout({
  bento,
  editable,
  title,
  description,
  onEdit,
}: {
  bento: BentoData;
  editable?: boolean;
  title?: string | null;
  description?: string | null;
  onEdit?: () => void;
}) {
  return (
    <CardWrapper
      bento={bento}
      editable={editable}
      className="flex flex-col p-5"
      onEdit={onEdit}
    >
      <IconBadge href={bento.href ?? ''} />
      <div className="mt-auto space-y-1">
        {title && <p className="font-cal text-sm leading-tight">{title}</p>}
        {description && (
          <p className="truncate text-muted-foreground text-xs">
            {description}
          </p>
        )}
        <div className="pt-1">{getAction(bento.href ?? '')}</div>
      </div>
    </CardWrapper>
  );
}

// 4x1: Banner — horizontal icon + title + action
function BannerLayout({
  bento,
  editable,
  title,
  onEdit,
}: {
  bento: BentoData;
  editable?: boolean;
  title?: string | null;
  onEdit?: () => void;
}) {
  return (
    <CardWrapper
      bento={bento}
      editable={editable}
      className="flex items-center gap-x-3 px-5"
      onEdit={onEdit}
    >
      <IconBadge href={bento.href ?? ''} size="sm" />
      <span className="truncate font-cal text-sm">{title}</span>
      <div className="ml-auto shrink-0">{getAction(bento.href ?? '')}</div>
    </CardWrapper>
  );
}

// 4x2: Wide — social cards get branded accent, generic links get OG image
function WideLayout({
  bento,
  editable,
  metadata,
  title,
  description,
  onEdit,
}: {
  bento: BentoData;
  editable?: boolean;
  metadata?: Metadata;
  title?: string | null;
  description?: string | null;
  onEdit?: () => void;
}) {
  const href = bento.href ?? '';
  const platform = getPlatform(href);
  const ogImage = metadata?.image;

  // Generic link with OG image: image on the right
  if (!platform && ogImage) {
    return (
      <CardWrapper
        bento={bento}
        editable={editable}
        className="flex overflow-hidden"
        onEdit={onEdit}
      >
        <div className="flex flex-1 flex-col justify-between p-5">
          <IconBadge href={href} />
          <div className="mt-auto space-y-1">
            {title && <p className="font-cal text-sm leading-tight">{title}</p>}
            {description && (
              <p className="line-clamp-2 text-muted-foreground text-xs">
                {description}
              </p>
            )}
          </div>
        </div>
        <div className="relative w-2/5 shrink-0">
          <Image
            src={ogImage}
            alt={title ?? href}
            fill
            className="object-cover"
          />
        </div>
      </CardWrapper>
    );
  }

  // Social card or generic without OG: branded wide layout
  return (
    <CardWrapper
      bento={bento}
      editable={editable}
      className="flex overflow-hidden"
      onEdit={onEdit}
    >
      {/* Branded icon area */}
      <div
        className={cn(
          'flex w-35 shrink-0 items-center justify-center',
          platform?.bg ?? 'bg-muted/50'
        )}
      >
        <IconBadge href={href} size="lg" />
      </div>

      {/* Content area */}
      <div className="flex flex-1 flex-col justify-center gap-y-1 p-5">
        {title && <p className="font-cal text-base leading-tight">{title}</p>}
        {description && (
          <p className="truncate text-muted-foreground text-xs">
            {description}
          </p>
        )}
        <div className="pt-2">
          <ActionButton url={href} />
        </div>
      </div>
    </CardWrapper>
  );
}

// --- Main Component ---

export default function LinkCard({
  bento,
  editable,
}: {
  bento: BentoData;
  editable?: boolean;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [href, setHref] = useState(bento.href ?? '');

  const { saveBento, isPending } = useSaveBento();
  const cardSize = useCardSize(bento);

  // Profile links are labelled from the URL alone; only other pages need
  // their title and preview image fetched.
  const needsMetadata = !!bento.href && !describeLink(bento.href).handle;
  const { data: metadata } = api.profileLink.getMetadataOfURL.useQuery(
    { url: bento.href ?? '' },
    { enabled: needsMetadata, staleTime: 60 * 60 * 1000 }
  );

  const handleSave = async () => {
    const url = toSafeUrl(href);
    if (!url) {
      toast({
        title: 'Invalid link',
        description: 'Enter a full link, like https://example.com.',
        variant: 'destructive',
      });
      return;
    }

    const saved = await saveBento({ ...bento, href: url });
    if (!saved) {
      return;
    }
    setHref(url);
    setEditOpen(false);
  };

  if (!bento.href) {
    return null;
  }

  const title = getTitle(bento.href, metadata ?? undefined);
  const description = getDescription(bento.href, metadata ?? undefined);
  const onEdit = editable ? () => setEditOpen(true) : undefined;

  const layoutProps = { bento, editable, title, onEdit };

  let layout: React.ReactNode;
  if (cardSize === '4x1') {
    layout = <BannerLayout {...layoutProps} />;
  } else if (cardSize === '4x2') {
    layout = (
      <WideLayout
        {...layoutProps}
        description={description}
        metadata={metadata ?? undefined}
      />
    );
  } else {
    layout = <CompactLayout {...layoutProps} description={description} />;
  }

  return (
    <>
      {layout}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-cal text-xl">Edit Link</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="link-href" className="font-medium text-sm">
                URL
              </Label>
              <Input
                id="link-href"
                placeholder="https://example.com"
                value={href}
                onChange={(e) => setHref(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <Button
              onClick={handleSave}
              disabled={isPending}
              className="w-full rounded-xl"
            >
              {isPending ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
