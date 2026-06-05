"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import DropZone, { DropZoneHandle } from "./DropZone";
import SourceCard from "@/components/sources/SourceCard";
import { useDocumentSelection } from "./DocumentSelectionProvider";

interface Props {
  sessionId: string;
}

export default function DocumentPanel({ sessionId }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState<"idle" | "uploading" | "processing">("idle");
  const [error, setError] = useState<{
    message: string;
    suggestions?: string[];
    errorCode?: string;
  } | null>(null);
  const { selectedDocIds, setSelectedDocIds, documents, setDocuments } =
    useDocumentSelection();
  const dropZoneRef = useRef<DropZoneHandle>(null);

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await fetch(`/api/documents?sessionId=${sessionId}`);
      if (res.ok) setDocuments(await res.json());
    } catch (err) {
      console.error("Failed to fetch documents:", err);
    }
  }, [sessionId, setDocuments]);

  useEffect(() => {
    setDocuments([]);
    setSelectedDocIds([]);
    fetchDocuments();
  }, [fetchDocuments, setDocuments, setSelectedDocIds]);

  const handleFileSelect = async (file: File) => {
    setIsLoading(true);
    setError(null);
    setUploadProgress(0);
    setUploadStage("uploading");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("sessionId", sessionId);

    try {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          setUploadProgress((e.loaded / e.total) * 90);
        }
      });

      xhr.upload.addEventListener("load", () => {
        setUploadProgress(90);
        setUploadStage("processing");
      });

      xhr.addEventListener("load", async () => {
        if (xhr.status === 200) {
          setUploadProgress(100);
          await fetchDocuments();
          setTimeout(() => {
            setUploadProgress(0);
            setUploadStage("idle");
            setIsLoading(false);
            dropZoneRef.current?.reset();
          }, 600);
          setError(null);
        } else {
          setUploadStage("idle");
          setUploadProgress(0);
          setIsLoading(false);
          try {
            const errData = JSON.parse(xhr.responseText);
            setError({
              message: errData.error || "Upload failed",
              suggestions: errData.suggestions || [],
              errorCode: errData.errorCode,
            });
          } catch {
            setError({ message: "Upload failed", suggestions: ["Please try again"] });
          }
        }
      });

      xhr.addEventListener("error", () => {
        setUploadStage("idle");
        setUploadProgress(0);
        setIsLoading(false);
        setError({
          message: "Network error occurred during upload",
          suggestions: ["Check your internet connection", "Try uploading again"],
        });
      });

      xhr.open("POST", "/api/upload");
      xhr.send(formData);
    } catch (err) {
      setUploadStage("idle");
      setUploadProgress(0);
      setIsLoading(false);
      setError({
        message: err instanceof Error ? err.message : "Unknown error",
        suggestions: ["Please try again"],
      });
    }
  };

  const handleDeleteDocument = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    setSelectedDocIds((prev) => prev.filter((did) => did !== id));
  };

  const selectAll = () => setSelectedDocIds(documents.map((d) => d.id));
  const clearSelection = () => setSelectedDocIds([]);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">
      <div className="panel-header flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="panel-title">Sources</h2>
            <p className="panel-subtitle">
              {documents.length} document{documents.length !== 1 ? "s" : ""} ·{" "}
              {selectedDocIds.length} selected
            </p>
          </div>
          {documents.length > 0 && (
            <div className="flex gap-1">
              <button onClick={selectAll} className="btn-ghost text-xs px-2 text-blue-600">
                All
              </button>
              <button onClick={clearSelection} className="btn-ghost text-xs px-2">
                Clear
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="p-3 border-b border-slate-100 flex-shrink-0">
        <DropZone
          ref={dropZoneRef}
          onFileSelect={handleFileSelect}
          isLoading={isLoading}
          onError={(message, suggestions) => setError({ message, suggestions })}
        />

        {isLoading && (
          <div className="mt-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-slate-500">
                {uploadStage === "processing" ? "Processing…" : "Uploading…"}
              </span>
              <span className="text-xs text-slate-400">
                {uploadProgress < 100 ? `${Math.round(uploadProgress)}%` : "Done"}
              </span>
            </div>
            <div className="progress-track h-1.5">
              <div className="progress-fill h-1.5" style={{ width: `${uploadProgress}%` }} />
            </div>
          </div>
        )}

        {error && (
          <div className="alert-error mt-3 p-3 text-sm">{error.message}</div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
        {documents.length === 0 ? (
          <div className="text-center py-10 px-4">
            <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-slate-100 flex items-center justify-center">
              <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-700">Add your first source</p>
            <p className="text-xs text-slate-500 mt-1">
              Upload PDFs, DOCX, or text files to begin research.
            </p>
          </div>
        ) : (
          documents.map((doc) => (
            <SourceCard
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
