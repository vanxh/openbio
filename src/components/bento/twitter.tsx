'use client';

import CardOverlay from '@/components/bento/overlay';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { extractTweetId } from '@/lib/twitter';
import { cn } from '@/lib/utils';
import { api } from '@/trpc/react';
import type { TwitterBentoSchema } from '@/types';
import { Heart, MessageCircle, Pencil, Repeat2 } from 'lucide-react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { FaXTwitter } from 'react-icons/fa6';
import type * as z from 'zod';

type BentoData = z.infer<typeof TwitterBentoSchema>;

export const TWITTER_CARD_SIZES = ['2x2', '4x2', '4x4'] as const;

function formatCount(n: number): string {
  if (n >= 1_000_000) {
    return `${(n / 1_000_000).toFixed(1)}M`;
  }
  if (n >= 1_000) {
    return `${(n / 1_000).toFixed(1)}K`;
  }
  return n.toLocaleString();
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const hours = diff / (1000 * 60 * 60);
  if (hours < 1) {
    return `${Math.floor(diff / (1000 * 60))}m`;
  }
  if (hours < 24) {
    return `${Math.floor(hours)}h`;
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function CompactTweet({
  tweet,
}: {
  tweet: {
    text: string;
    user: { name: string; screenName: string; profileImageUrl: string };
    createdAt: string;
  };
}) {
  return (
    <div className="flex h-full w-full flex-col justify-between p-5">
      <div className="flex items-center gap-2.5">
        <Image
          src={tweet.user.profileImageUrl}
          alt={tweet.user.name}
          width={28}
          height={28}
          className="rounded-full"
          unoptimized
        />
        <div className="min-w-0 flex-1">
          <p className="truncate font-cal text-xs leading-tight">
            {tweet.user.name}
          </p>
          <p className="truncate text-[10px] text-muted-foreground">
            @{tweet.user.screenName}
          </p>
        </div>
        <FaXTwitter size={12} className="shrink-0 text-muted-foreground" />
      </div>
      <p className="line-clamp-4 text-xs leading-relaxed">{tweet.text}</p>
      <p className="text-[10px] text-muted-foreground">
        {formatDate(tweet.createdAt)}
      </p>
    </div>
  );
}

function WideTweet({
  tweet,
}: {
  tweet: {
    text: string;
    user: {
      name: string;
      screenName: string;
      profileImageUrl: string;
      isVerified: boolean;
    };
    createdAt: string;
    favoriteCount: number;
    retweetCount: number;
    replyCount: number;
  };
}) {
  return (
    <div className="flex h-full w-full flex-col justify-between p-5">
      <div className="flex items-center gap-2.5">
        <Image
          src={tweet.user.profileImageUrl}
          alt={tweet.user.name}
          width={32}
          height={32}
          className="rounded-full"
          unoptimized
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <p className="truncate font-cal text-sm leading-tight">
              {tweet.user.name}
            </p>
          </div>
          <p className="truncate text-muted-foreground text-xs">
            @{tweet.user.screenName} &middot; {formatDate(tweet.createdAt)}
          </p>
        </div>
        <FaXTwitter size={14} className="shrink-0 text-muted-foreground" />
      </div>
      <p className="line-clamp-3 text-sm leading-relaxed">{tweet.text}</p>
      <div className="flex items-center gap-5 text-muted-foreground text-xs">
        <span className="flex items-center gap-1">
          <MessageCircle size={12} />
          {formatCount(tweet.replyCount)}
        </span>
        <span className="flex items-center gap-1">
          <Repeat2 size={12} />
          {formatCount(tweet.retweetCount)}
        </span>
        <span className="flex items-center gap-1">
          <Heart size={12} />
          {formatCount(tweet.favoriteCount)}
        </span>
      </div>
    </div>
  );
}

function LargeTweet({
  tweet,
}: {
  tweet: {
    text: string;
    user: {
      name: string;
      screenName: string;
      profileImageUrl: string;
      isVerified: boolean;
    };
    createdAt: string;
    favoriteCount: number;
    retweetCount: number;
    replyCount: number;
    photos: { url: string; width: number; height: number }[];
  };
}) {
  return (
    <div className="flex h-full w-full flex-col p-5">
      <div className="flex items-center gap-3">
        <Image
          src={tweet.user.profileImageUrl}
          alt={tweet.user.name}
          width={40}
          height={40}
          className="rounded-full"
          unoptimized
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <p className="truncate font-cal text-sm leading-tight">
              {tweet.user.name}
            </p>
          </div>
          <p className="truncate text-muted-foreground text-xs">
            @{tweet.user.screenName}
          </p>
        </div>
        <FaXTwitter size={16} className="shrink-0 text-muted-foreground" />
      </div>
      <p className="mt-3 flex-1 text-sm leading-relaxed">{tweet.text}</p>
      {tweet.photos[0] && (
        <div className="mt-3 overflow-hidden rounded-xl">
          <Image
            src={tweet.photos[0].url}
            alt="Tweet media"
            width={tweet.photos[0].width}
            height={tweet.photos[0].height}
            className="h-auto w-full object-cover"
            unoptimized
          />
        </div>
      )}
      <div className="mt-3 flex items-center justify-between text-muted-foreground text-xs">
        <div className="flex items-center gap-5">
          <span className="flex items-center gap-1">
            <MessageCircle size={13} />
            {formatCount(tweet.replyCount)}
          </span>
          <span className="flex items-center gap-1">
            <Repeat2 size={13} />
            {formatCount(tweet.retweetCount)}
          </span>
          <span className="flex items-center gap-1">
            <Heart size={13} />
            {formatCount(tweet.favoriteCount)}
          </span>
        </div>
        <span>{formatDate(tweet.createdAt)}</span>
      </div>
    </div>
  );
}

export default function TwitterCard({
  bento,
  editable,
}: {
  bento: BentoData;
  editable?: boolean;
}) {
  const params = useParams<{ link: string }>();
  const [editOpen, setEditOpen] = useState(false);
  const [tweetUrl, setTweetUrl] = useState('');

  const { data: tweet } = api.profileLink.getTweet.useQuery(
    { tweetId: bento.tweetId },
    { enabled: !!bento.tweetId, staleTime: 60 * 60 * 1000 }
  );

  const queryClient = api.useContext();
  const { mutateAsync: updateBento, isPending } =
    api.profileLink.updateBento.useMutation();

  const handleSave = async () => {
    const id = extractTweetId(tweetUrl);
    if (!id) {
      return;
    }

    queryClient.profileLink.getByLink.setData({ link: params.link }, (old) => {
      if (!old) {
        return old;
      }
      return {
        ...old,
        bento: old.bento.map((b) =>
          b.id === bento.id ? { ...b, tweetId: id } : b
        ),
      };
    });

    // Prefetch the new tweet so it appears immediately
    queryClient.profileLink.getTweet.prefetch({ tweetId: id });

    await updateBento({
      link: params.link,
      bento: { ...bento, tweetId: id },
    });
    setEditOpen(false);
    setTweetUrl('');
  };

  const mdSize = bento.size.md ?? '2x2';
  const hasTweet = !!bento.tweetId;

  const CardContent = () => {
    if (!hasTweet || !tweet) {
      return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-2xl bg-muted/30">
          <FaXTwitter className="h-8 w-8 text-muted-foreground" />
          <p className="text-muted-foreground text-xs">
            {editable && 'Add a tweet'}
            {!editable && hasTweet && 'Loading...'}
          </p>
        </div>
      );
    }

    if (mdSize === '4x4') {
      return <LargeTweet tweet={tweet} />;
    }
    if (mdSize === '4x2') {
      return <WideTweet tweet={tweet} />;
    }
    return <CompactTweet tweet={tweet} />;
  };

  return (
    <>
      {/* biome-ignore lint/nursery/noStaticElementInteractions: interactive card */}
      <div
        className={cn(
          'group relative z-0 h-full w-full select-none rounded-2xl border border-border bg-card shadow-sm',
          editable
            ? 'transition-transform duration-200 ease-in-out md:cursor-move'
            : 'hover:-translate-y-0.5 cursor-pointer transition-all duration-200 hover:border-border/80 hover:shadow-md'
        )}
        role={!editable && hasTweet ? 'link' : undefined}
        tabIndex={!editable && hasTweet ? 0 : undefined}
        onClick={() => {
          if (!editable && hasTweet) {
            window.open(`https://x.com/i/status/${bento.tweetId}`, '_blank');
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !editable && hasTweet) {
            window.open(`https://x.com/i/status/${bento.tweetId}`, '_blank');
          }
        }}
      >
        {editable && (
          <CardOverlay bento={bento} allowedSizes={TWITTER_CARD_SIZES} />
        )}

        <CardContent />

        {editable && (
          <button
            type="button"
            className="absolute top-3 right-3 z-50 cursor-pointer rounded-lg border border-border/50 bg-background/90 p-1.5 text-muted-foreground opacity-0 shadow-md backdrop-blur-sm transition-all hover:bg-accent hover:text-accent-foreground group-hover:opacity-100"
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              setEditOpen(true);
            }}
          >
            <Pencil className="h-4 w-4" />
          </button>
        )}
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-cal">Edit Tweet Card</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tweet-url" className="font-medium text-sm">
                Tweet URL
              </Label>
              <Input
                id="tweet-url"
                placeholder="https://x.com/user/status/123456789"
                value={tweetUrl}
                onChange={(e) => setTweetUrl(e.target.value)}
                className="rounded-xl"
              />
              <p className="text-[11px] text-muted-foreground">
                Paste a link from twitter.com or x.com
              </p>
            </div>

            {extractTweetId(tweetUrl) && (
              <div className="flex items-center gap-2 rounded-xl border border-border p-3">
                <FaXTwitter size={16} className="text-muted-foreground" />
                <span className="font-cal text-sm">
                  Tweet ID: {extractTweetId(tweetUrl)}
                </span>
              </div>
            )}

            <Button
              onClick={handleSave}
              className="w-full rounded-xl"
              disabled={!extractTweetId(tweetUrl) || isPending}
            >
              {isPending ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
