import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCycleTimer } from "../use-cycle-timer";
import type { PageConfig } from "@/lib/types";

function makePage(overrides: Partial<PageConfig> = {}): PageConfig {
  return {
    id: "page-1",
    name: "Test Page",
    type: "video",
    enabled: true,
    duration: 10,
    displayOrder: 0,
    ...overrides,
  };
}

describe("useCycleTimer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the first enabled page initially", () => {
    const pages = [
      makePage({ id: "a", displayOrder: 0, duration: 5 }),
      makePage({ id: "b", displayOrder: 1, duration: 5 }),
    ];

    const { result } = renderHook(() => useCycleTimer(pages));
    expect(result.current.currentPage?.id).toBe("a");
    expect(result.current.currentIndex).toBe(0);
    expect(result.current.totalPages).toBe(2);
  });

  it("filters out disabled pages", () => {
    const pages = [
      makePage({ id: "a", enabled: false, displayOrder: 0 }),
      makePage({ id: "b", enabled: true, displayOrder: 1 }),
    ];

    const { result } = renderHook(() => useCycleTimer(pages));
    expect(result.current.currentPage?.id).toBe("b");
    expect(result.current.totalPages).toBe(1);
  });

  it("sorts pages by displayOrder", () => {
    const pages = [
      makePage({ id: "b", displayOrder: 1 }),
      makePage({ id: "a", displayOrder: 0 }),
    ];

    const { result } = renderHook(() => useCycleTimer(pages));
    expect(result.current.currentPage?.id).toBe("a");
  });

  it("advances to the next page after duration elapses", () => {
    const pages = [
      makePage({ id: "a", displayOrder: 0, duration: 5 }),
      makePage({ id: "b", displayOrder: 1, duration: 10 }),
    ];

    const { result } = renderHook(() => useCycleTimer(pages));
    expect(result.current.currentPage?.id).toBe("a");

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.currentPage?.id).toBe("b");
  });

  it("wraps around to the first page after the last", () => {
    const pages = [
      makePage({ id: "a", displayOrder: 0, duration: 5 }),
      makePage({ id: "b", displayOrder: 1, duration: 5 }),
    ];

    const { result } = renderHook(() => useCycleTimer(pages));

    act(() => {
      vi.advanceTimersByTime(5000); // a -> b
    });
    expect(result.current.currentPage?.id).toBe("b");

    act(() => {
      vi.advanceTimersByTime(5000); // b -> a (wrap)
    });
    expect(result.current.currentPage?.id).toBe("a");
  });

  it("returns null when no pages are provided", () => {
    const { result } = renderHook(() => useCycleTimer([]));
    expect(result.current.currentPage).toBeNull();
    expect(result.current.totalPages).toBe(0);
  });

  it("does not cycle when only one page exists", () => {
    const pages = [makePage({ id: "solo", duration: 5 })];

    const { result } = renderHook(() => useCycleTimer(pages));
    expect(result.current.currentPage?.id).toBe("solo");

    act(() => {
      vi.advanceTimersByTime(10000);
    });

    // Still on the same page
    expect(result.current.currentPage?.id).toBe("solo");
    expect(result.current.currentIndex).toBe(0);
  });
});
