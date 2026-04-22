"use client";

import {
  useState,
  useEffect,
  useCallback,
} from "react";
import { DocumentMetaData } from "@/types/index";
import DropZone from "./DropZone";
import DocumentRow from "./DocumentRow";
import { useDocumentSelection } from "./DocumentSelectionProvider";

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  sessionId: string;
}

export default function DocumentPanel({ sessionId }: Props) {
  const [documents, setDocuments] = useState<DocumentMetaData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<{
    message: string;
    suggestions?: string[];
    errorCode?: string;
  } | null>(null);
  const { selectedDocIds, setSelectedDocIds } = useDocumentSelection();
  const [showDropdown, setShowDropdown] = useState(false);

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await fetch(`/api/documents?sessionId=${sessionId}`);
      if (res.ok) setDocuments(await res.json());
    } catch (err) {
      console.error("Failed to fetch documents:", err);
    }
  }, [sessionId]);

  // Reload documents when session changes
  useEffect(() => {
    setDocuments([]);
    setSelectedDocIds([]);
    fetchDocuments();
  }, [fetchDocuments]);

  const handleFileSelect = async (file: File) => {
    setIsLoading(true);
    setError(null);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("sessionId", sessionId);

    try {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          setUploadProgress((e.loaded / e.total) * 100);
        }
      });

      xhr.addEventListener("load", async () => {
        if (xhr.status === 200) {
          await fetchDocuments();
          setUploadProgress(0);
          setError(null);
        } else {
          try {
            const errData = JSON.parse(xhr.responseText);
            setError({
              message: errData.error || "Upload failed",
              suggestions: errData.suggestions || [],
              errorCode: errData.errorCode,
            });
          } catch {
            setError({
              message: "Upload failed",
              suggestions: ["Please try again"],
            });
          }
        }
        setIsLoading(false);
      });

      xhr.addEventListener("error", () => {
        setError({
          message: "Network error occurred during upload",
          suggestions: [
            "Check your internet connection",
            "Try uploading again",
          ],
        });
        setIsLoading(false);
      });

      xhr.open("POST", "/api/upload");
      xhr.send(formData);
    } catch (err) {
      setError({
        message: err instanceof Error ? err.message : "Unknown error",
        suggestions: ["Please try again"],
      });
      setIsLoading(false);
    }
  };

  const handleDeleteDocument = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    setSelectedDocIds((prev) => prev.filter((did) => did !== id));
  };

  const toggleDocumentSelection = (docId: string) => {
    setSelectedDocIds((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    );
  };

  const selectAll = () => {
    setSelectedDocIds(documents.map((d) => d.id));
    setShowDropdown(false);
  };

  const clearSelection = () => {
    setSelectedDocIds([]);
    setShowDropdown(false);
  };

  const selectedDocs = documents.filter((d) => selectedDocIds.includes(d.id));

  return (
    <div className="flex flex-col h-full bg-slate-900 overflow-hidden">
        {/* Top section */}
        <div className="p-4 border-b border-slate-800 flex-shrink-0 overflow-y-auto max-h-[55vh]">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">
            Documents
          </h2>

          {/* Source selector */}
          {documents.length > 0 && (
            <div className="mb-4">
              <div className="relative">
                <button
                  onClick={() => setShowDropdown((v) => !v)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors border border-slate-700 text-sm"
                >
                  <span>
                    {selectedDocIds.length === 0
                      ? "Select sources"
                      : `${selectedDocIds.length} source${selectedDocIds.length !== 1 ? "s" : ""} selected`}
                  </span>
                  <svg
                    className={`w-4 h-4 transition-transform ${showDropdown ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-h-56 overflow-y-auto">
                    <div className="flex justify-between p-2 border-b border-slate-700">
                      <button onClick={selectAll} className="text-xs text-blue-400 hover:text-blue-300 px-2 py-1">
                        Select all
                      </button>
                      <button onClick={clearSelection} className="text-xs text-slate-400 hover:text-slate-300 px-2 py-1">
                        Clear
                      </button>
                    </div>
                    <div className="p-2 space-y-0.5">
                      {documents.map((doc) => (
                        <label
                          key={doc.id}
                          className="flex items-center gap-2 p-2 rounded hover:bg-slate-700 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedDocIds.includes(doc.id)}
                            onChange={() => toggleDocumentSelection(doc.id)}
                            className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded"
                          />
                          <span className="text-sm text-slate-300 truncate flex-1">
                            {doc.filename}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {selectedDocs.length > 0 && (
                <div className="mt-2 p-2.5 bg-blue-950/30 border border-blue-800/40 rounded-lg">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-blue-300 uppercase">Active sources</span>
                    <button onClick={clearSelection} className="text-xs text-blue-400 hover:text-blue-300">
                      Clear
                    </button>
                  </div>
                  <div className="space-y-1">
                    {selectedDocs.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-800/50 px-2 py-1 rounded"
                      >
                        <svg className="w-3 h-3 text-blue-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="truncate flex-1">{doc.filename}</span>
                        <button
                          onClick={() => toggleDocumentSelection(doc.id)}
                          className="text-slate-500 hover:text-slate-300"
                        >
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DropZone
            onFileSelect={handleFileSelect}
            isLoading={isLoading}
            onError={(message, suggestions) => {
              setError({ message, suggestions });
            }}
          />

          {isLoading && uploadProgress > 0 && (
            <div className="mt-3">
              <div className="w-full bg-slate-700 rounded-full h-1.5">
                <div
                  className="bg-blue-500 h-1.5 rounded-full transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">{Math.round(uploadProgress)}%</p>
            </div>
          )}

          {error && (
            <div className="mt-3 p-3 bg-red-950/50 border border-red-800 rounded-lg">
              <div className="flex items-start gap-2">
                <svg
                  className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-300 mb-1">
                    {error.message}
                  </p>
                  {error.suggestions && error.suggestions.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <p className="text-xs font-semibold text-red-400 uppercase">
                        Suggestions:
                      </p>
                      <ul className="text-xs text-red-300/90 space-y-0.5 list-disc list-inside">
                        {error.suggestions.map((suggestion, idx) => (
                          <li key={idx}>{suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {error.errorCode && (
                    <p className="text-xs text-red-500/70 mt-2">
                      Error code: {error.errorCode}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Document list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 min-h-0">
          {documents.length === 0 ? (
            <p className="text-xs text-slate-600 text-center py-6">
              No documents in this session
            </p>
          ) : (
            documents.map((doc) => (
              <DocumentRow
                key={doc.id}
                document={doc}
                sessionId={sessionId}
                onDelete={handleDeleteDocument}
              />
            ))
          )}
        </div>
      </div>
  );
}
