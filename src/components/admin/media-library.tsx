"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { MediaFile } from "@/lib/types";

import { MediaUpload } from "./media-upload";

interface MediaLibraryProps {
  onSelect?: (filename: string) => void;
  selectable?: boolean;
}

export function MediaLibrary({ onSelect, selectable }: MediaLibraryProps) {
  const [files, setFiles] = useState<MediaFile[]>([]);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/upload");
    if (res.ok) setFiles(await res.json());
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/upload")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && !cancelled) setFiles(data);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleDelete(filename: string) {
    if (!confirm(`Delete ${filename}?`)) return;
    await fetch("/api/upload", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename }),
    });
    refresh();
  }

  function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  const isImage = (mime: string) => mime.startsWith("image/");

  return (
    <div className="space-y-4">
      <MediaUpload onUploadComplete={refresh} />

      {files.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center text-sm">
          No files uploaded yet
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {files.map((file) => (
            <Card key={file.filename} className="overflow-hidden">
              <div className="bg-muted flex aspect-video items-center justify-center">
                {isImage(file.mimeType) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`/api/media/${encodeURIComponent(file.filename)}`}
                    alt={file.originalName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="text-3xl">🎬</div>
                )}
              </div>
              <div className="space-y-1 p-2">
                <p className="truncate text-xs font-medium">
                  {file.originalName}
                </p>
                <p className="text-muted-foreground text-xs">
                  {formatSize(file.size)}
                </p>
                <div className="flex gap-1">
                  {selectable && onSelect && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => onSelect(file.filename)}
                    >
                      Select
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    size="sm"
                    className="text-xs"
                    onClick={() => handleDelete(file.filename)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
