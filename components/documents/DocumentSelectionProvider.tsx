"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { Citation, DocumentMetaData } from "@/types/index";

export const DocumentSelectionContext = createContext<{
  selectedDocIds: string[];
  setSelectedDocIds: (ids: string[] | ((prev: string[]) => string[])) => void;
  documents: DocumentMetaData[];
  setDocuments: (docs: DocumentMetaData[] | ((prev: DocumentMetaData[]) => DocumentMetaData[])) => void;
  activeCitations: Citation[];
  setActiveCitations: (citations: Citation[]) => void;
  selectedCitation: Citation | null;
  setSelectedCitation: (citation: Citation | null) => void;
  latestAnswer: string;
  setLatestAnswer: (answer: string) => void;
}>({
  selectedDocIds: [],
  setSelectedDocIds: () => {},
  documents: [],
  setDocuments: () => {},
  activeCitations: [],
  setActiveCitations: () => {},
  selectedCitation: null,
  setSelectedCitation: () => {},
  latestAnswer: "",
  setLatestAnswer: () => {},
});

export const useDocumentSelection = () => useContext(DocumentSelectionContext);

interface Props {
  children: ReactNode;
}

export function DocumentSelectionProvider({ children }: Props) {
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [documents, setDocuments] = useState<DocumentMetaData[]>([]);
  const [activeCitations, setActiveCitations] = useState<Citation[]>([]);
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);
  const [latestAnswer, setLatestAnswer] = useState("");

  return (
    <DocumentSelectionContext.Provider
      value={{
        selectedDocIds,
        setSelectedDocIds,
        documents,
        setDocuments,
        activeCitations,
        setActiveCitations,
        selectedCitation,
        setSelectedCitation,
        latestAnswer,
        setLatestAnswer,
      }}
    >
      {children}
    </DocumentSelectionContext.Provider>
  );
}
