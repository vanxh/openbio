'use client';

import { toast } from '@/components/ui/use-toast';
import { api } from '@/trpc/react';
import type { BentoSchema } from '@/types';
import { useParams } from 'next/navigation';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import type React from 'react';
import type * as z from 'zod';

type BentoSnapshot = z.infer<typeof BentoSchema>[];

interface BentoHistoryContextValue {
  canUndo: boolean;
  canRedo: boolean;
  pushSnapshot: () => void;
  undo: () => void;
  redo: () => void;
}

const BentoHistoryContext = createContext<BentoHistoryContextValue | null>(
  null
);

const MAX_HISTORY = 50;

/** True when the event comes from somewhere the browser has its own undo. */
function isTextEntry(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  return (
    target.isContentEditable ||
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.tagName === 'SELECT'
  );
}

export function BentoHistoryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { link } = useParams<{ link: string }>();
  const { data: profileLink } = api.profileLink.getByLink.useQuery(
    { link },
    { staleTime: 60_000 }
  );
  const utils = api.useUtils();
  const { mutateAsync: setBento } = api.profileLink.setBento.useMutation();
  const isOwner = !!profileLink?.isOwner;

  const pastRef = useRef<BentoSnapshot[]>([]);
  const futureRef = useRef<BentoSnapshot[]>([]);
  const [, forceRender] = useState(0);

  // Saves run one at a time and always send the newest snapshot, so mashing
  // undo cannot let an older state land on the server after a newer one.
  const pendingSave = useRef<BentoSnapshot | null>(null);
  const saving = useRef(false);

  const flushSaves = useCallback(async () => {
    if (saving.current) {
      return;
    }
    saving.current = true;
    try {
      while (pendingSave.current) {
        const snapshot = pendingSave.current;
        pendingSave.current = null;
        await setBento({ link, bento: snapshot });
      }
    } catch {
      pendingSave.current = null;
      toast({
        title: "Couldn't save",
        description: 'That change was not saved, so the saved layout is back.',
        variant: 'destructive',
      });
      await utils.profileLink.getByLink.invalidate({ link });
    } finally {
      saving.current = false;
    }
  }, [link, setBento, utils]);

  const getCurrentBento = useCallback((): BentoSnapshot => {
    return structuredClone(
      utils.profileLink.getByLink.getData({ link })?.bento ?? []
    ) as BentoSnapshot;
  }, [link, utils]);

  const pushSnapshot = useCallback(() => {
    pastRef.current = [
      ...pastRef.current.slice(-(MAX_HISTORY - 1)),
      getCurrentBento(),
    ];
    futureRef.current = [];
    forceRender((n) => n + 1);
  }, [getCurrentBento]);

  const applySnapshot = useCallback(
    (snapshot: BentoSnapshot) => {
      utils.profileLink.getByLink.setData({ link }, (old) => {
        if (!old) {
          return old;
        }
        return { ...old, bento: snapshot };
      });
      pendingSave.current = snapshot;
      flushSaves();
    },
    [link, utils, flushSaves]
  );

  const undo = useCallback(() => {
    const previous = pastRef.current.pop();
    if (!previous) {
      return;
    }
    futureRef.current.push(getCurrentBento());
    applySnapshot(previous);
    forceRender((n) => n + 1);
  }, [getCurrentBento, applySnapshot]);

  const redo = useCallback(() => {
    const next = futureRef.current.pop();
    if (!next) {
      return;
    }
    pastRef.current.push(getCurrentBento());
    applySnapshot(next);
    forceRender((n) => n + 1);
  }, [getCurrentBento, applySnapshot]);

  useEffect(() => {
    if (!isOwner) {
      return;
    }

    const handler = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || isTextEntry(e.target)) {
        return;
      }
      // With Shift held the key arrives as "Z", so compare case-insensitively.
      const key = e.key.toLowerCase();
      if (key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if (key === 'y') {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOwner, undo, redo]);

  return (
    <BentoHistoryContext.Provider
      value={{
        canUndo: pastRef.current.length > 0,
        canRedo: futureRef.current.length > 0,
        pushSnapshot,
        undo,
        redo,
      }}
    >
      {children}
    </BentoHistoryContext.Provider>
  );
}

export function useBentoHistory() {
  const ctx = useContext(BentoHistoryContext);
  if (!ctx) {
    throw new Error('useBentoHistory must be used within BentoHistoryProvider');
  }
  return ctx;
}
