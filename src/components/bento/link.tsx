import CardOverlay from '@/components/bento/overlay';
import { Button } from '@/components/ui/button';
import type { getMetadata } from '@/lib/metadata';
import { cn } from '@/lib/utils';
import { api } from '@/trpc/react';
import type { LinkBentoSchema } from '@/types';
import { Github, Instagram, Linkedin, Twitch, Youtube } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import type React from 'react';
import { BiLogoTelegram } from 'react-icons/bi';
import { BsDiscord, BsTwitterX } from 'react-icons/bs';
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
    icon: <Linkedin size={24} className="text-[#0A66C2]" />,
    color: '#0A66C2',
    bg: 'bg-[#0A66C2]/5',
    action: {
      label: 'Connect',
      className: 'rounded-full bg-[#0A66C2] text-white hover:bg-[#004182]',
    },
  },
  github: {
    icon: <Github size={24} className="text-gray-800" />,
    color: '#333333',
    bg: 'bg-gray-500/5',
    action: {
      label: 'Follow',
      className: 'rounded-full',
    },
  },
  instagram: {
    icon: <Instagram size={24} className="text-[#F56040]" />,
    color: '#F56040',
    bg: 'bg-[#F56040]/5',
    action: {
      label: 'Follow',
      className:
        'rounded-full bg-foreground text-background hover:bg-foreground/90',
    },
  },
  twitch: {
    icon: <Twitch size={24} className="text-[#9146FF]" />,
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
    icon: <Youtube size={24} className="text-[#FF0000]" />,
    color: '#FF0000',
    bg: 'bg-[#FF0000]/5',
    action: {
      label: 'Subscribe',
      className: 'rounded-full bg-[#FF0000] text-white hover:bg-[#cc0000]',
    },
  },
};

function getPlatform(url: string): PlatformInfo | null | undefined {
  const hostname = new URL(url).hostname;
  if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
    return PLATFORM_MAP.twitter;
  }
  if (hostname.includes('linkedin.com')) {
    return PLATFORM_MAP.linkedin;
  }
  if (hostname.includes('github.com')) {
    return PLATFORM_MAP.github;
  }
  if (hostname.includes('instagram.com')) {
    return PLATFORM_MAP.instagram;
  }
  if (hostname.includes('twitch.tv')) {
    return PLATFORM_MAP.twitch;
  }
  if (hostname.includes('t.me') || hostname.includes('telegram.com')) {
    return PLATFORM_MAP.telegram;
  }
  if (hostname.includes('discord.com')) {
    return PLATFORM_MAP.discord;
  }
  if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
    return PLATFORM_MAP.youtube;
  }
  return null;
}

function getIcon(url: string, metadata?: Metadata) {
  const platform = getPlatform(url);
  if (platform) {
    return platform.icon;
  }
  const hostname = new URL(url).hostname;
  return (
    <Image
      src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=128`}
      alt={metadata?.title ?? url}
      width={24}
      height={24}
      className="rounded-md"
    />
  );
}

function getLargeIcon(url: string) {
  const hostname = new URL(url).hostname;
  if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
    return <BsTwitterX size={32} className="text-foreground" />;
  }
  if (hostname.includes('linkedin.com')) {
    return <Linkedin size={36} className="text-[#0A66C2]" />;
  }
  if (hostname.includes('github.com')) {
    return <Github size={36} className="text-gray-800" />;
  }
  if (hostname.includes('instagram.com')) {
    return <Instagram size={36} className="text-[#F56040]" />;
  }
  if (hostname.includes('twitch.tv')) {
    return <Twitch size={36} className="text-[#9146FF]" />;
  }
  if (hostname.includes('t.me') || hostname.includes('telegram.com')) {
    return <BiLogoTelegram size={36} className="text-[#0088CC]" />;
  }
  if (hostname.includes('discord.com')) {
    return <BsDiscord size={36} className="text-[#5A65EA]" />;
  }
  if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
    return <Youtube size={36} className="text-[#FF0000]" />;
  }
  return null;
}

function getTitle(url: string, metadata?: Metadata) {
  const urlObj = new URL(url);
  const pathSegments = urlObj.pathname.split('/');
  let userHandle = pathSegments.pop();
  if (!userHandle) {
    userHandle = pathSegments.pop();
  }

  if (getPlatform(url)) {
    return userHandle?.startsWith('@') ? userHandle : `@${userHandle}`;
  }
  return metadata?.title;
}

function getDescription(url: string, metadata?: Metadata) {
  const urlObj = new URL(url);
  const hostname = urlObj.hostname;
  const pathSegments = urlObj.pathname.split('/');
  let userHandle = pathSegments.pop();
  if (!userHandle) {
    userHandle = pathSegments.pop();
  }

  if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
    return `x.com/${userHandle}`;
  }
  if (hostname.includes('linkedin.com')) {
    return `linkedin.com/in/${userHandle}`;
  }
  if (hostname.includes('github.com')) {
    return `github.com/${userHandle}`;
  }
  if (hostname.includes('instagram.com')) {
    return `instagr.am/${userHandle}`;
  }
  if (hostname.includes('twitch.tv')) {
    return `twitch.tv/${userHandle}`;
  }
  if (hostname.includes('t.me') || hostname.includes('telegram.com')) {
    return `t.me/${userHandle}`;
  }
  if (hostname.includes('discord.com')) {
    return 'discord.com';
  }
  if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
    return `youtube.com/${userHandle}`;
  }
  return metadata?.description ?? null;
}

function getAction(url: string) {
  const platform = getPlatform(url);
  if (!platform) {
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
  if (!platform) {
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
}: {
  bento: BentoData;
  editable?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const Comp = editable ? 'div' : Link;
  return (
    <Comp
      href={bento.href ?? ''}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'group relative z-0 h-full w-full select-none rounded-2xl border border-border/50 bg-card shadow-sm',
        editable
          ? 'transition-transform duration-200 ease-in-out md:cursor-move'
          : 'cursor-pointer transition-all duration-200 hover:shadow-md',
        className
      )}
    >
      {editable && <CardOverlay bento={bento} allowedSizes={LINK_CARD_SIZES} />}
      {children}
    </Comp>
  );
}

function IconBadge({
  href,
  metadata,
  size = 'md',
}: {
  href: string;
  metadata?: Metadata;
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
      {size === 'lg'
        ? (getLargeIcon(href) ?? getIcon(href, metadata))
        : getIcon(href, metadata)}
    </div>
  );
}

// 2x2: Compact card
function CompactLayout({
  bento,
  editable,
  metadata,
  title,
  description,
}: {
  bento: BentoData;
  editable?: boolean;
  metadata?: Metadata;
  title?: string | null;
  description?: string | null;
}) {
  return (
    <CardWrapper
      bento={bento}
      editable={editable}
      className="flex flex-col p-5"
    >
      <IconBadge href={bento.href ?? ''} metadata={metadata} />
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
  metadata,
  title,
}: {
  bento: BentoData;
  editable?: boolean;
  metadata?: Metadata;
  title?: string | null;
}) {
  return (
    <CardWrapper
      bento={bento}
      editable={editable}
      className="flex items-center gap-x-3 px-5"
    >
      <IconBadge href={bento.href ?? ''} metadata={metadata} size="sm" />
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
}: {
  bento: BentoData;
  editable?: boolean;
  metadata?: Metadata;
  title?: string | null;
  description?: string | null;
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
      >
        <div className="flex flex-1 flex-col justify-between p-5">
          <IconBadge href={href} metadata={metadata} />
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
    >
      {/* Branded icon area */}
      <div
        className={cn(
          'flex w-35 shrink-0 items-center justify-center',
          platform?.bg ?? 'bg-muted/50'
        )}
      >
        <IconBadge href={href} metadata={metadata} size="lg" />
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
  const [metadata] = api.profileLink.getMetadataOfURL.useSuspenseQuery({
    url: bento.href ?? '',
  });

  if (!bento.href) {
    return null;
  }

  const title = getTitle(bento.href, metadata ?? undefined);
  const description = getDescription(bento.href, metadata ?? undefined);
  const smSize = bento.size.sm ?? '2x2';
  const mdSize = bento.size.md ?? '2x2';

  // Banner: render if either breakpoint is 4x1
  if (smSize === '4x1' || mdSize === '4x1') {
    return (
      <BannerLayout
        bento={bento}
        editable={editable}
        metadata={metadata ?? undefined}
        title={title}
      />
    );
  }

  if (mdSize === '4x2') {
    return (
      <WideLayout
        bento={bento}
        editable={editable}
        metadata={metadata ?? undefined}
        title={title}
        description={description}
      />
    );
  }

  return (
    <CompactLayout
      bento={bento}
      editable={editable}
      metadata={metadata ?? undefined}
      title={title}
      description={description}
    />
  );
}
