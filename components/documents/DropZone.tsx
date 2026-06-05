'use client';

import { useState, useRef, useImperativeHandle, forwardRef } from 'react';

interface DropZoneProps {
  onFileSelect: (file: File) => void;
  isLoading?: boolean;
  onError?: (message: string, suggestions: string[]) => void;
}

export interface DropZoneHandle {
  reset: () => void;
}

const DropZone = forwardRef<DropZoneHandle, DropZoneProps>(
  ({ onFileSelect, isLoading = false, onError }, ref) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 10 * 1024 * 1024;

  useImperativeHandle(ref, () => ({
    reset() {
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
  }));

  const validateFile = (file: File): {
    valid: boolean;
    error?: string;
    suggestions?: string[];
  } => {
    const validTypes = ['.pdf', '.txt', '.md', '.docx'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!validTypes.includes(fileExtension)) {
      return {
        valid: false,
        error: `File type "${fileExtension}" is not supported.`,
        suggestions: ['Supported formats: PDF, DOCX, TXT, MD'],
      };
    }

    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File is too large. Maximum size is 10MB.`,
        suggestions: ['Try splitting the document into smaller files'],
      };
    }

    if (file.size === 0) {
      return {
        valid: false,
        error: 'The file appears to be empty.',
        suggestions: ['Try uploading a different file'],
      };
    }

    return { valid: true };
  };

  const processFile = (file: File) => {
    const validation = validateFile(file);
    if (validation.valid) {
      setSelectedFile(file);
      onFileSelect(file);
    } else if (onError && validation.error && validation.suggestions) {
      onError(validation.error, validation.suggestions);
    }
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files.length > 0) processFile(e.dataTransfer.files[0]);
      }}
      onClick={() => !isLoading && fileInputRef.current?.click()}
      className={`rounded-lg p-4 text-center cursor-pointer spring-transition border-2 border-dashed ${
        isDragging
          ? 'border-blue-400 bg-blue-50'
          : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white'
      } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.txt,.md,.docx"
        onChange={(e) => {
          if (e.currentTarget.files?.[0]) processFile(e.currentTarget.files[0]);
        }}
        disabled={isLoading}
        className="hidden"
      />

      <div className="flex items-center justify-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <div className="text-left">
          <p className="text-sm font-medium text-slate-800">
            {selectedFile ? selectedFile.name : 'Add source'}
          </p>
          <p className="text-xs text-slate-500">
            Drop or click · PDF, DOCX, TXT, MD · max 10 MB
          </p>
        </div>
      </div>
    </div>
  );
});

DropZone.displayName = 'DropZone';

export default DropZone;
