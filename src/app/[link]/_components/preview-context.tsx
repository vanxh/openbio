'use client';

import type React from 'react';
import { createContext, useContext, useState } from 'react';

const PreviewContext = createContext<{
  preview: boolean;
  setPreview: (v: boolean) => void;
  modalOpen: boolean;
  setModalOpen: (v: boolean) => void;
}>({
  preview: false,
  setPreview: () => {},
  modalOpen: false,
  setModalOpen: () => {},
});

export function PreviewProvider({ children }: { children: React.ReactNode }) {
  const [preview, setPreview] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  return (
    <PreviewContext.Provider
      value={{ preview, setPreview, modalOpen, setModalOpen }}
    >
      {children}
    </PreviewContext.Provider>
  );
}

export function usePreview() {
  return useContext(PreviewContext);
}
