"use client";

import type { PageConfig } from "@/lib/types";

interface WebsitePageProps {
  page: PageConfig;
}

export function WebsitePage({ page }: WebsitePageProps) {
  return (
    <div className="fixed inset-0 bg-black">
      <iframe
        src={page.url || "about:blank"}
        className="w-full h-full border-0"
        sandbox="allow-scripts allow-same-origin allow-popups"
        loading="eager"
        title={page.name}
      />
    </div>
  );
}
