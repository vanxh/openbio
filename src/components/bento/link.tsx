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

const getIcon = (url: string, metadata?: Metadata) => {
  const hostname = new URL(url).hostname;

  if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
    return <BsTwitterX size={20} className="text-foreground" />;
  }
  if (hostname.includes('linkedin.com')) {
    return <Linkedin size={24} className="text-blue-600" />;
  }
  if (hostname.includes('github.com')) {
    return <Github size={24} className="text-gray-600" />;
  }
  if (hostname.includes('instagram.com')) {
    return <Instagram size={24} className="text-[#F56040]" />;
  }
  if (hostname.includes('twitch.tv')) {
    return <Twitch size={24} className="text-purple-600" />;
  }
  if (hostname.includes('t.me') || hostname.includes('telegram.com')) {
    return <BiLogoTelegram size={24} className="text-[#0088CC]" />;
  }
  if (hostname.includes('discord.com')) {
    return <BsDiscord size={24} className="text-[#5A65EA]" />;
  }
  if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
    return <Youtube size={24} className="text-[#FF0000]" />;
  }

  return (
    <Image
      src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=128`}
      alt={metadata?.title ?? url}
      width={24}
      height={24}
      className="rounded-md"
    />
  );
};

const getTitle = (url: string, metadata?: Metadata) => {
  const urlObj = new URL(url);
  const hostname = urlObj.hostname;
  const pathSegments = urlObj.pathname.split('/');
  const knownHostnames = [
    'twitter.com',
    'x.com',
    'linkedin.com',
    'github.com',
    'instagram.com',
    'twitch.tv',
    't.me',
    'telegram.com',
    'discord.com',
    'youtube.com',
    'youtu.be',
  ];
  let userHandle = pathSegments.pop();
  if (!userHandle) {
    userHandle = pathSegments.pop();
  }

  if (knownHostnames.some((knownHost) => hostname.includes(knownHost))) {
    return userHandle?.startsWith('@') ? userHandle : `@${userHandle}`;
  }

  return metadata?.title;
};

const getDescription = (url: string, metadata?: Metadata) => {
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
  if (hostname.includes('twitch.tv')) {
    return `twitch.tv/${userHandle}`;
  }

  return metadata?.description ?? null;
};

const getAction = (url: string) => {
  const hostname = new URL(url).hostname;

  if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
    return (
      <Button
        size="sm"
        className="rounded-full bg-foreground text-background hover:bg-foreground/90"
      >
        Follow
      </Button>
    );
  }
  if (hostname.includes('github.com')) {
    return (
      <Button size="sm" variant="outline" className="rounded-full font-medium">
        Follow
      </Button>
    );
  }
  if (hostname.includes('linkedin.com')) {
    return (
      <Button
        size="sm"
        className="rounded-full bg-[#0A66C2] text-white hover:bg-[#004182]"
      >
        Connect
      </Button>
    );
  }
  if (hostname.includes('instagram.com')) {
    return (
      <Button
        size="sm"
        className="rounded-full bg-foreground text-background hover:bg-foreground/90"
      >
        Follow
      </Button>
    );
  }
  if (hostname.includes('t.me') || hostname.includes('telegram.com')) {
    return (
      <Button size="sm" variant="outline" className="rounded-full font-medium">
        Message
      </Button>
    );
  }
  if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
    return (
      <Button
        size="sm"
        className="rounded-full bg-[#FF0000] text-white hover:bg-[#cc0000]"
      >
        Subscribe
      </Button>
    );
  }
  if (hostname.includes('twitch.tv')) {
    return (
      <Button
        size="sm"
        className="rounded-full bg-[#9146FF] text-white hover:bg-[#7c3aed]"
      >
        Follow
      </Button>
    );
  }
  if (hostname.includes('discord.com')) {
    return (
      <Button
        size="sm"
        className="rounded-full bg-[#5A65EA] text-white hover:bg-[#4752c4]"
      >
        Join
      </Button>
    );
  }

  return null;
};

// Shared wrapper props
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
      {editable && <CardOverlay bento={bento} />}
      {children}
    </Comp>
  );
}

// Icon badge used across layouts
function IconBadge({
  href,
  metadata,
  size = 'md',
}: { href: string; metadata?: Metadata; size?: 'sm' | 'md' }) {
  return (
    <div
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-xl border border-border/60 bg-muted/50',
        size === 'sm' ? 'h-8 w-8 rounded-lg' : 'h-10 w-10'
      )}
    >
      {getIcon(href, metadata)}
    </div>
  );
}

// Card info block (title + description + action)
function CardInfo({
  href,
  title,
  description,
}: { href: string; title?: string | null; description?: string | null }) {
  return (
    <div className="mt-auto space-y-1">
      {title && <p className="font-cal text-sm leading-tight">{title}</p>}
      {description && (
        <p className="truncate text-muted-foreground text-xs">{description}</p>
      )}
      <div className="pt-1">{getAction(href)}</div>
    </div>
  );
}

// Banner (4x1): horizontal icon + title + action
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

// Wide (4x2) with OG image on right
function WideImageLayout({
  bento,
  editable,
  metadata,
  title,
  description,
  ogImage,
}: {
  bento: BentoData;
  editable?: boolean;
  metadata?: Metadata;
  title?: string | null;
  description?: string | null;
  ogImage: string;
}) {
  return (
    <CardWrapper
      bento={bento}
      editable={editable}
      className="flex overflow-hidden"
    >
      <div className="flex flex-1 flex-col justify-between p-5">
        <IconBadge href={bento.href ?? ''} metadata={metadata} />
        <CardInfo
          href={bento.href ?? ''}
          title={title}
          description={description}
        />
      </div>
      <div className="relative w-2/5 shrink-0">
        <Image
          src={ogImage}
          alt={title ?? bento.href ?? ''}
          fill
          className="object-cover"
        />
      </div>
    </CardWrapper>
  );
}

// Tall (2x4, 4x4) with OG image on top
function TallImageLayout({
  bento,
  editable,
  metadata,
  title,
  description,
  ogImage,
}: {
  bento: BentoData;
  editable?: boolean;
  metadata?: Metadata;
  title?: string | null;
  description?: string | null;
  ogImage: string;
}) {
  return (
    <CardWrapper
      bento={bento}
      editable={editable}
      className="flex flex-col overflow-hidden"
    >
      <div className="relative h-2/5 w-full shrink-0">
        <Image
          src={ogImage}
          alt={title ?? bento.href ?? ''}
          fill
          className="object-cover"
        />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <IconBadge href={bento.href ?? ''} metadata={metadata} />
        <CardInfo
          href={bento.href ?? ''}
          title={title}
          description={description}
        />
      </div>
    </CardWrapper>
  );
}

// Default compact layout (2x2 or large without OG image)
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
      <CardInfo
        href={bento.href ?? ''}
        title={title}
        description={description}
      />
    </CardWrapper>
  );
}

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
  const ogImage = metadata?.image;
  const mdSize = bento.size.md ?? '2x2';

  if (mdSize === '4x1') {
    return (
      <BannerLayout
        bento={bento}
        editable={editable}
        metadata={metadata ?? undefined}
        title={title}
      />
    );
  }

  if (mdSize === '4x2' && ogImage) {
    return (
      <WideImageLayout
        bento={bento}
        editable={editable}
        metadata={metadata ?? undefined}
        title={title}
        description={description}
        ogImage={ogImage}
      />
    );
  }

  if ((mdSize === '2x4' || mdSize === '4x4') && ogImage) {
    return (
      <TallImageLayout
        bento={bento}
        editable={editable}
        metadata={metadata ?? undefined}
        title={title}
        description={description}
        ogImage={ogImage}
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
