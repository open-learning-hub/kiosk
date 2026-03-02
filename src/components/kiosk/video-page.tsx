"use client";

import type { PageConfig } from "@/lib/types";

interface VideoPageProps {
  page: PageConfig;
}

export function VideoPage({ page }: VideoPageProps) {
  const src = page.mediaFile
    ? `/api/media/${encodeURIComponent(page.mediaFile)}`
    : "";

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black">
      <video
        key={src}
        className="h-full w-full object-contain"
        src={src}
        autoPlay
        loop={page.videoLoop !== false}
        playsInline
        preload="auto"
      />
    </div>
  );
}
