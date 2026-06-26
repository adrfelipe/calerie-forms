"use client";

import { useRef, useState } from "react";

interface FileUploadProps {
  label: string;
  accept?: string;
  maxSizeMB?: number;
  preview: string | null;
  onFileSelect: (file: File | null) => void;
  error?: string;
}

export function FileUpload({
  label,
  accept = "image/jpeg,image/png,image/webp",
  maxSizeMB = 5,
  preview,
  onFileSelect,
  error,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const handleFile = (file: File | null) => {
    setFileError(null);
    if (!file) {
      onFileSelect(null);
      return;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      setFileError(`Arquivo muito grande. Máximo: ${maxSizeMB}MB`);
      onFileSelect(null);
      return;
    }
    if (!accept.split(",").some((t) => file.type === t.trim())) {
      setFileError("Formato não aceito. Use JPEG, PNG ou WebP.");
      onFileSelect(null);
      return;
    }
    onFileSelect(file);
  };

  const displayError = error || fileError;

  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="text-sm font-medium text-foreground">{label}</legend>
      <div
        role="button"
        tabIndex={0}
        aria-label={`Enviar ${label.toLowerCase()}`}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
        className={`relative flex items-center justify-center rounded-lg border-2 border-dashed p-6 transition-all cursor-pointer
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
          ${dragOver ? "border-primary bg-primary-light" : displayError ? "border-destructive" : preview ? "border-success" : "border-input hover:border-primary hover:bg-muted"}
          min-h-[120px]`}
      >
        {preview ? (
          <div className="relative">
            <img src={preview} alt={`Preview ${label}`} className="max-h-28 rounded object-contain" />
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onFileSelect(null); }}
              className="absolute -top-3 -right-3 rounded-full bg-destructive text-destructive-foreground w-6 h-6 flex items-center justify-center text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Remover foto"
            >
              &times;
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <p className="text-sm">Clique para enviar ou arraste a foto</p>
          </div>
        )}
      </div>
      {displayError && (
        <p className="text-sm text-destructive" role="alert">{displayError}</p>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => handleFile(e.target.files?.[0] || null)}
        aria-hidden="true"
      />
    </fieldset>
  );
}
