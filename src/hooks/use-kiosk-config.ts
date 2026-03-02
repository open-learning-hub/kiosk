"use client";

import { useCallback, useEffect, useState } from "react";

import type { KioskConfig } from "@/lib/types";

export function useKioskConfig(initialConfig: KioskConfig) {
  const [config, setConfig] = useState<KioskConfig>(initialConfig);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/config");
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      }
    } catch {
      // Silently fail — keep using last known config
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(refresh, config.settings.pollInterval * 1000);
    return () => clearInterval(interval);
  }, [config.settings.pollInterval, refresh]);

  return config;
}
