'use client';

import type React from 'react';
import { createContext, useContext, useState } from 'react';

const PreviewContext = createContext<{
  preview: boolean;
  setPreview: (v: boolean) => void;
}>({
  preview: false,
  setPreview: () => {},
});

export function PreviewProvider({ children }: { children: React.ReactNode }) {
  const [preview, setPreview] = useState(false);
  return (
    <PreviewContext.Provider value={{ preview, setPreview }}>
      {children}
    </PreviewContext.Provider>
  );
}

export function usePreview() {
  return useContext(PreviewContext);
}
