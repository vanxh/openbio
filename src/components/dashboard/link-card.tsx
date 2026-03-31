'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import type { RouterOutputs } from '@/trpc/react';
import { ExternalLink, Eye, QrCode, Trash2 } from 'lucide-react';
import Link from 'next/link';

type ProfileLink = NonNullable<RouterOutputs['profileLink']['getAll']>[number];

export function DashboardLinkCard({ link }: { link: ProfileLink }) {
  return (
    <div className="group rounded-2xl border border-border/50 bg-card shadow-md transition-all duration-200 hover:scale-[1.02] hover:shadow-lg">
      <div className="flex h-24 items-center justify-center rounded-t-2xl bg-muted">
        <Avatar className="h-14 w-14 ring-4 ring-card">
          <AvatarImage src={link.image ?? undefined} />
          <AvatarFallback className="bg-foreground text-background text-lg">
            {link.name?.charAt(0)?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </div>
      <div className="p-4">
        <h3 className="font-cal text-lg">{link.name}</h3>
        <p className="text-muted-foreground text-sm">openbio.app/{link.link}</p>
        <div className="mt-3 flex items-center gap-x-3 text-muted-foreground text-xs">
          <span className="flex items-center gap-x-1">
            <Eye className="h-3.5 w-3.5" />
            Views
          </span>
        </div>
      </div>
      <div className="flex border-border/50 border-t px-2 py-2">
        <Link href={`/${link.link}`} target="_blank" className="flex-1">
          <Button
            variant="ghost"
            size="sm"
            className="w-full gap-x-1.5 rounded-lg text-xs"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Visit
          </Button>
        </Link>
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 gap-x-1.5 rounded-lg text-xs"
        >
          <QrCode className="h-3.5 w-3.5" />
          QR
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 gap-x-1.5 rounded-lg text-destructive text-xs hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </Button>
      </div>
    </div>
  );
}
