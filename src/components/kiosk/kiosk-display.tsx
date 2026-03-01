"use client";

import type { KioskConfig } from "@/lib/types";
import { useKioskConfig } from "@/hooks/use-kiosk-config";
import { useCycleTimer } from "@/hooks/use-cycle-timer";
import { VideoPage } from "./video-page";
import { ImagePage } from "./image-page";
import { WebsitePage } from "./website-page";

interface KioskDisplayProps {
  initialConfig: KioskConfig;
  singlePage?: string | null;
}

export function KioskDisplay({ initialConfig, singlePage }: KioskDisplayProps) {
  const config = useKioskConfig(initialConfig);
  const enabledPages = config.pages
    .filter((p) => p.enabled)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  // If a single page is requested via query param, find it
  const targetPage = singlePage
    ? enabledPages.find(
        (p) =>
          p.id === singlePage ||
          p.type === singlePage ||
          p.name.toLowerCase() === singlePage.toLowerCase() ||
          // Support ?page=A, ?page=B, ?page=C shortcuts
          (singlePage.toUpperCase() === "A" && p.displayOrder === 0) ||
          (singlePage.toUpperCase() === "B" && p.displayOrder === 1) ||
          (singlePage.toUpperCase() === "C" && p.displayOrder === 2)
      )
    : null;

  // If showing a single page, don't cycle
  const pagesToCycle = targetPage ? [] : enabledPages;
  const { currentPage } = useCycleTimer(pagesToCycle);

  const activePage = targetPage || currentPage;

  if (!activePage) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <p className="text-white/30 text-2xl">No pages configured</p>
      </div>
    );
  }

  switch (activePage.type) {
    case "video":
      return <VideoPage page={activePage} />;
    case "image":
      return <ImagePage page={activePage} />;
    case "website":
      return <WebsitePage page={activePage} />;
    default:
      return null;
  }
}
