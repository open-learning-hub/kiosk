"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import type { PageConfig } from "@/lib/types";

export function useCycleTimer(pages: PageConfig[]) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const enabledPages = useMemo(
    () =>
      pages
        .filter((p) => p.enabled)
        .sort((a, b) => a.displayOrder - b.displayOrder),
    [pages]
  );

  const advance = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % enabledPages.length);
  }, [enabledPages.length]);

  useEffect(() => {
    if (enabledPages.length <= 1) return;

    const currentPage = enabledPages[currentIndex];
    if (!currentPage) return;

    timerRef.current = setTimeout(advance, currentPage.duration * 1000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentIndex, enabledPages, advance]);

  // Clamp index inline instead of using an effect
  const safeIndex =
    enabledPages.length > 0 && currentIndex >= enabledPages.length
      ? 0
      : currentIndex;

  return {
    currentPage: enabledPages[safeIndex] ?? null,
    currentIndex: safeIndex,
    totalPages: enabledPages.length,
  };
}
