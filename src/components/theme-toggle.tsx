"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

const emptySubscribe = () => () => {};

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  if (!mounted) return null;

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      {theme === "dark" ? "☀ Light" : "🌙 Dark"}
    </Button>
  );
}
