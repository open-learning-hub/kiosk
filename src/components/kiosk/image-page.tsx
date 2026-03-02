"use client";

import type { PageConfig } from "@/lib/types";

interface ImagePageProps {
  page: PageConfig;
}

export function ImagePage({ page }: ImagePageProps) {
  const src = page.mediaFile
    ? `/api/media/${encodeURIComponent(page.mediaFile)}`
    : "";

  const fit = page.imageFit === "cover" ? "object-cover" : "object-contain";

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={page.name} className={`h-full w-full ${fit}`} />
    </div>
  );
}
