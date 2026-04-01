'use client';

import type React from 'react';
import { createContext, useContext, useState } from 'react';

export type Viewport = 'desktop' | 'mobile';

const PreviewContext = createContext<{
  preview: boolean;
  setPreview: (v: boolean) => void;
  viewport: Viewport;
  setViewport: (v: Viewport) => void;
}>({
  preview: false,
  setPreview: () => {},
  viewport: 'desktop',
  setViewport: () => {},
});

export function PreviewProvider({ children }: { children: React.ReactNode }) {
  const [preview, setPreview] = useState(false);
  const [viewport, setViewport] = useState<Viewport>('desktop');
  return (
    <PreviewContext.Provider
      value={{ preview, setPreview, viewport, setViewport }}
    >
      {children}
    </PreviewContext.Provider>
  );
}

export function usePreview() {
  return useContext(PreviewContext);
}
