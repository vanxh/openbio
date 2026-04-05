'use client';

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

  const pastRef = useRef<BentoSnapshot[]>([]);
  const futureRef = useRef<BentoSnapshot[]>([]);
  const [, forceRender] = useState(0);

  const getCurrentBento = useCallback((): BentoSnapshot => {
    return structuredClone(profileLink?.bento ?? []) as BentoSnapshot;
  }, [profileLink]);

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
    },
    [link, utils]
  );

  const undo = useCallback(() => {
    if (pastRef.current.length === 0) {
      return;
    }
    const current = getCurrentBento();
    const previous = pastRef.current.pop();
    if (!previous) {
      return;
    }
    futureRef.current.push(current);
    applySnapshot(previous);
    forceRender((n) => n + 1);
  }, [getCurrentBento, applySnapshot]);

  const redo = useCallback(() => {
    if (futureRef.current.length === 0) {
      return;
    }
    const current = getCurrentBento();
    const next = futureRef.current.pop();
    if (!next) {
      return;
    }
    pastRef.current.push(current);
    applySnapshot(next);
    forceRender((n) => n + 1);
  }, [getCurrentBento, applySnapshot]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) {
        return;
      }
      if (e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo]);

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
