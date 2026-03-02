"use client";

import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface MediaUploadProps {
  onUploadComplete: () => void;
}

export function MediaUpload({ onUploadComplete }: MediaUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);
      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        if (!res.ok) {
          const err = await res.json();
          alert(`Upload failed: ${err.error}`);
        }
      } catch {
        alert(`Upload failed for ${file.name}`);
      }
    }

    setUploading(false);
    onUploadComplete();
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <Card
      className={`border-2 border-dashed p-8 text-center ${
        dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25"
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        handleFiles(e.dataTransfer.files);
      }}
    >
      <div className="flex flex-col items-center gap-2">
        <p className="text-muted-foreground text-sm">
          {uploading
            ? "Uploading..."
            : "Drag & drop files here, or click to browse"}
        </p>
        <p className="text-muted-foreground text-xs">
          Supports: MP4, WebM, JPG, PNG, GIF, WebP
        </p>
        <Button
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          Browse Files
        </Button>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".mp4,.webm,.jpg,.jpeg,.png,.gif,.webp"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
    </Card>
  );
}
