"use client";

import { createContext, useContext, useState, ReactNode } from "react";

// ── Context ───────────────────────────────────────────────────────────────────

export const DocumentSelectionContext = createContext<{
  selectedDocIds: string[];
  setSelectedDocIds: (ids: string[] | ((prev: string[]) => string[])) => void;
}>({ selectedDocIds: [], setSelectedDocIds: () => {} });

export const useDocumentSelection = () => useContext(DocumentSelectionContext);

// ── Provider ──────────────────────────────────────────────────────────────────

interface Props {
  children: ReactNode;
}

export function DocumentSelectionProvider({ children }: Props) {
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);

  return (
    <DocumentSelectionContext.Provider value={{ selectedDocIds, setSelectedDocIds }}>
      {children}
    </DocumentSelectionContext.Provider>
  );
}
