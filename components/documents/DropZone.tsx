'use client';

import { useState, useRef } from 'react';

interface DropZoneProps {
  onFileSelect: (file: File) => void;
  isLoading?: boolean;
}

export default function DropZone({ onFileSelect, isLoading = false }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (isValidFile(file)) {
        setSelectedFile(file);
        onFileSelect(file);
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (isValidFile(file)) {
        setSelectedFile(file);
        onFileSelect(file);
      }
    }
  };

  const isValidFile = (file: File): boolean => {
    const validTypes = ['.pdf', '.txt', '.md', '.docx'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    return validTypes.includes(fileExtension);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition ${
        isDragging
          ? 'border-blue-500 bg-blue-950/30'
          : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
      } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={() => !isLoading && fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.txt,.md,.docx"
        onChange={handleFileInputChange}
        disabled={isLoading}
        className="hidden"
      />

      <div className="space-y-2">
        <div className="mx-auto h-12 w-12 text-slate-500 flex items-center justify-center text-4xl">
          &#128196;
        </div>
        <p className="text-sm font-medium text-slate-300 truncate" title={selectedFile?.name}>
          {selectedFile ? selectedFile.name : 'Drag and drop a file here'}
        </p>
        {selectedFile && (
          <p className="text-xs text-slate-500">
            {(selectedFile.size / 1024).toFixed(2)} KB
          </p>
        )}
        <p className="text-xs text-slate-500">
          or click to select (PDF, TXT, MD, DOCX)
        </p>
      </div>
    </div>
  );
}
