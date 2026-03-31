'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { signOut, useSession } from '@/lib/auth-client';
import { LogOut, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function UserMenu() {
  const { data: session } = useSession();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="rounded-full outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Avatar className="h-9 w-9 cursor-pointer transition-transform hover:scale-105">
            <AvatarImage src={session?.user?.image ?? undefined} />
            <AvatarFallback className="bg-linear-to-br from-violet-500 to-pink-500 text-sm text-white">
              {session?.user?.name?.charAt(0)?.toUpperCase() ?? '?'}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 rounded-xl">
        <DropdownMenuItem
          onClick={() => router.push('/app#settings')}
          className="cursor-pointer gap-x-2 rounded-lg"
        >
          <Settings className="h-4 w-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleSignOut}
          className="cursor-pointer gap-x-2 rounded-lg text-destructive"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
