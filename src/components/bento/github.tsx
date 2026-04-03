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
import { cn } from '@/lib/utils';
import { api } from '@/trpc/react';
import type { GithubBentoSchema } from '@/types';
import { Pencil } from 'lucide-react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FaGithub } from 'react-icons/fa';
import type * as z from 'zod';

type BentoData = z.infer<typeof GithubBentoSchema>;

export const GITHUB_CARD_SIZES = ['2x2', '4x2', '4x4'] as const;

type GitHubStats = {
  avatar: string;
  name: string;
  bio: string;
  publicRepos: number;
  followers: number;
  stars: number;
};

function useGitHubStats(username: string) {
  const [stats, setStats] = useState<GitHubStats | null>(null);

  useEffect(() => {
    if (!username) {
      return;
    }
    let cancelled = false;

    Promise.all([
      fetch(`https://api.github.com/users/${username}`).then((r) => r.json()),
      fetch(
        `https://api.github.com/users/${username}/repos?per_page=100&sort=updated`
      ).then((r) => r.json()),
    ])
      .then(([user, repos]) => {
        if (cancelled) {
          return;
        }
        const totalStars = Array.isArray(repos)
          ? repos.reduce(
              (sum: number, r: { stargazers_count?: number }) =>
                sum + (r.stargazers_count ?? 0),
              0
            )
          : 0;
        setStats({
          avatar: user.avatar_url ?? '',
          name: user.name ?? username,
          bio: user.bio ?? '',
          publicRepos: user.public_repos ?? 0,
          followers: user.followers ?? 0,
          stars: totalStars,
        });
      })
      .catch(() => {
        // GitHub API may fail for invalid usernames
      });

    return () => {
      cancelled = true;
    };
  }, [username]);

  return stats;
}

function GitHubContribGraph({ username }: { username: string }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border/40 bg-muted/20 p-2">
      <Image
        src={`https://ghchart.rshah.org/${username}`}
        alt={`${username}'s contributions`}
        width={720}
        height={100}
        className="w-full"
        unoptimized
      />
    </div>
  );
}

function CompactGitHub({
  username,
  stats,
}: { username: string; stats: GitHubStats | null }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-4 text-center">
      {stats?.avatar ? (
        <Image
          src={stats.avatar}
          alt={username}
          width={48}
          height={48}
          className="rounded-full border-2 border-border/60"
        />
      ) : (
        <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-border/60 bg-muted/50">
          <FaGithub size={22} className="text-foreground" />
        </div>
      )}
      <div className="space-y-0.5">
        <div className="flex items-center justify-center gap-1.5">
          <FaGithub size={11} className="shrink-0 text-muted-foreground" />
          <p className="font-cal text-sm leading-tight">
            {stats?.name ?? username}
          </p>
        </div>
        <p className="text-muted-foreground text-xs">@{username}</p>
      </div>
      {stats && (
        <div className="flex items-center gap-4 text-xs">
          <div className="text-center">
            <span className="font-cal text-foreground">{stats.followers}</span>
            <span className="ml-1 text-muted-foreground">followers</span>
          </div>
          <div className="text-center">
            <span className="font-cal text-foreground">
              {stats.publicRepos}
            </span>
            <span className="ml-1 text-muted-foreground">repos</span>
          </div>
        </div>
      )}
    </div>
  );
}

function WideGitHub({
  username,
  stats,
}: { username: string; stats: GitHubStats | null }) {
  return (
    <div className="flex h-full w-full items-stretch overflow-hidden rounded-2xl">
      {/* Left: profile info */}
      <div className="flex flex-1 flex-col justify-between p-5">
        <div className="flex items-center gap-3">
          {stats?.avatar ? (
            <Image
              src={stats.avatar}
              alt={username}
              width={40}
              height={40}
              className="rounded-full border border-border/60"
            />
          ) : (
            <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border/60 bg-muted/50">
              <FaGithub size={18} className="text-foreground" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-1.5">
              <FaGithub size={12} className="shrink-0 text-muted-foreground" />
              <p className="font-cal text-sm leading-tight">
                {stats?.name ?? username}
              </p>
            </div>
            <p className="text-muted-foreground text-xs">@{username}</p>
          </div>
        </div>
        <div className="overflow-hidden">
          <GitHubContribGraph username={username} />
        </div>
      </div>
    </div>
  );
}

function LargeGitHub({
  username,
  stats,
}: { username: string; stats: GitHubStats | null }) {
  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-2xl p-5">
      {/* Header */}
      <div className="flex items-center gap-4">
        {stats?.avatar ? (
          <Image
            src={stats.avatar}
            alt={username}
            width={56}
            height={56}
            className="rounded-full border-2 border-border/60"
          />
        ) : (
          <div className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-border/60 bg-muted/50">
            <FaGithub size={26} className="text-foreground" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <FaGithub size={14} className="shrink-0 text-muted-foreground" />
            <p className="font-cal text-lg leading-tight">
              {stats?.name ?? username}
            </p>
          </div>
          <p className="text-muted-foreground text-sm">@{username}</p>
          {stats?.bio && (
            <p className="mt-1 line-clamp-2 text-muted-foreground text-xs leading-relaxed">
              {stats.bio}
            </p>
          )}
        </div>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="mt-5 grid grid-cols-3 gap-3">
          <div className="flex flex-col items-center gap-1 rounded-xl border border-border/40 bg-muted/20 py-3">
            <span className="font-cal text-lg">
              {stats.publicRepos.toLocaleString()}
            </span>
            <span className="text-[11px] text-muted-foreground">Repos</span>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-xl border border-border/40 bg-muted/20 py-3">
            <span className="font-cal text-lg">
              {stats.followers.toLocaleString()}
            </span>
            <span className="text-[11px] text-muted-foreground">Followers</span>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-xl border border-border/40 bg-muted/20 py-3">
            <span className="font-cal text-lg">
              {stats.stars.toLocaleString()}
            </span>
            <span className="text-[11px] text-muted-foreground">Stars</span>
          </div>
        </div>
      )}

      {/* Contrib graph */}
      <div className="mt-auto">
        <GitHubContribGraph username={username} />
      </div>
    </div>
  );
}

export default function GitHubCard({
  bento,
  editable,
}: {
  bento: BentoData;
  editable?: boolean;
}) {
  const params = useParams<{ link: string }>();
  const [editOpen, setEditOpen] = useState(false);
  const [username, setUsername] = useState(bento.username || '');
  const stats = useGitHubStats(bento.username);

  const queryClient = api.useContext();
  const { mutateAsync: updateBento, isPending } =
    api.profileLink.updateBento.useMutation();

  const handleSave = async () => {
    if (!username.trim()) {
      return;
    }

    queryClient.profileLink.getByLink.setData({ link: params.link }, (old) => {
      if (!old) {
        return old;
      }
      return {
        ...old,
        bento: old.bento.map((b) =>
          b.id === bento.id ? { ...b, username: username.trim() } : b
        ),
      };
    });

    await updateBento({
      link: params.link,
      bento: { ...bento, username: username.trim() },
    });
    setEditOpen(false);
  };

  const mdSize = bento.size.md ?? '2x2';
  const hasUsername = !!bento.username;

  const CardContent = () => {
    if (!hasUsername) {
      return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-2xl bg-muted/30">
          <FaGithub className="h-8 w-8 text-muted-foreground" />
          <p className="text-muted-foreground text-xs">
            {editable ? 'Set username' : ''}
          </p>
        </div>
      );
    }

    if (mdSize === '4x4') {
      return <LargeGitHub username={bento.username} stats={stats} />;
    }
    if (mdSize === '4x2') {
      return <WideGitHub username={bento.username} stats={stats} />;
    }
    return <CompactGitHub username={bento.username} stats={stats} />;
  };

  return (
    <>
      {/* biome-ignore lint/nursery/noStaticElementInteractions: interactive card with role/tabIndex set conditionally */}
      <div
        className={cn(
          'group relative z-0 h-full w-full select-none rounded-2xl border border-border bg-card shadow-sm',
          editable
            ? 'transition-transform duration-200 ease-in-out md:cursor-move'
            : 'cursor-pointer transition-all duration-200 hover:shadow-md'
        )}
        role={!editable && hasUsername ? 'link' : undefined}
        tabIndex={!editable && hasUsername ? 0 : undefined}
        onClick={() => {
          if (!editable && hasUsername) {
            window.open(`https://github.com/${bento.username}`, '_blank');
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !editable && hasUsername) {
            window.open(`https://github.com/${bento.username}`, '_blank');
          }
        }}
      >
        {editable && (
          <CardOverlay bento={bento} allowedSizes={GITHUB_CARD_SIZES} />
        )}

        <CardContent />

        {editable && (
          <button
            type="button"
            className="absolute top-3 right-3 z-50 cursor-pointer rounded-full bg-primary p-2 text-primary-foreground opacity-0 shadow transition-opacity group-hover:opacity-100"
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
            <DialogTitle className="font-cal">Edit GitHub Card</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="gh-username" className="font-medium text-sm">
                GitHub Username
              </Label>
              <Input
                id="gh-username"
                placeholder="vanxh"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="rounded-xl"
              />
            </div>

            {username.trim() && (
              <div className="overflow-hidden rounded-xl border border-border p-4">
                <div className="flex items-center gap-3">
                  <FaGithub size={20} />
                  <span className="font-cal text-sm">@{username.trim()}</span>
                </div>
                <div className="mt-3">
                  <GitHubContribGraph username={username.trim()} />
                </div>
              </div>
            )}

            <Button onClick={handleSave} disabled={isPending} className="w-full rounded-xl">
              {isPending ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
