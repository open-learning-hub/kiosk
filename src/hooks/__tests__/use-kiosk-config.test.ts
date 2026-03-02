import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { KioskConfig } from "@/lib/types";

import { useKioskConfig } from "../use-kiosk-config";

function makeConfig(overrides?: Partial<KioskConfig>): KioskConfig {
  return {
    version: 1,
    pages: [],
    settings: {
      defaultDuration: 15,
      pollInterval: 10,
    },
    ...overrides,
  };
}

describe("useKioskConfig", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns the initial config immediately", () => {
    const initial = makeConfig();
    const { result } = renderHook(() => useKioskConfig(initial));
    expect(result.current).toEqual(initial);
  });

  it("updates config after polling", async () => {
    // Use a very short poll interval (real timers) so the test completes quickly
    const initial = makeConfig({
      settings: { defaultDuration: 15, pollInterval: 0.05 },
    });
    const updated = makeConfig({
      version: 2,
      settings: { defaultDuration: 20, pollInterval: 0.05 },
    });

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => updated,
    } as Response);

    const { result } = renderHook(() => useKioskConfig(initial));

    await waitFor(() => {
      expect(result.current.version).toBe(2);
    });

    expect(global.fetch).toHaveBeenCalledWith("/api/config");
  });

  it("keeps the last known config on fetch failure", async () => {
    const initial = makeConfig({
      settings: { defaultDuration: 15, pollInterval: 0.05 },
    });

    vi.mocked(global.fetch).mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useKioskConfig(initial));

    // Wait for at least one poll cycle to fire
    await new Promise((r) => setTimeout(r, 100));

    expect(result.current).toEqual(initial);
    expect(global.fetch).toHaveBeenCalled();
  });

  it("keeps the last known config when response is not ok", async () => {
    const initial = makeConfig({
      settings: { defaultDuration: 15, pollInterval: 0.05 },
    });

    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      json: async () => ({}),
    } as Response);

    const { result } = renderHook(() => useKioskConfig(initial));

    await new Promise((r) => setTimeout(r, 100));

    expect(result.current).toEqual(initial);
    expect(global.fetch).toHaveBeenCalled();
  });
});
