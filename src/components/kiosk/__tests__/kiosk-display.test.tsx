import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { KioskDisplay } from "../kiosk-display";
import type { KioskConfig, PageConfig } from "@/lib/types";

// Mock child components to isolate KioskDisplay logic
vi.mock("../video-page", () => ({
  VideoPage: ({ page }: { page: PageConfig }) => (
    <div data-testid="video-page">{page.name}</div>
  ),
}));

vi.mock("../image-page", () => ({
  ImagePage: ({ page }: { page: PageConfig }) => (
    <div data-testid="image-page">{page.name}</div>
  ),
}));

vi.mock("../website-page", () => ({
  WebsitePage: ({ page }: { page: PageConfig }) => (
    <div data-testid="website-page">{page.name}</div>
  ),
}));

// Mock useKioskConfig to return config as-is
vi.mock("@/hooks/use-kiosk-config", () => ({
  useKioskConfig: (config: KioskConfig) => config,
}));

// Mock useCycleTimer to return the first enabled page
vi.mock("@/hooks/use-cycle-timer", () => ({
  useCycleTimer: (pages: PageConfig[]) => ({
    currentPage: pages[0] ?? null,
    currentIndex: 0,
    totalPages: pages.length,
  }),
}));

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

function makeConfig(pages: PageConfig[]): KioskConfig {
  return {
    version: 1,
    pages,
    settings: {
      defaultDuration: 15,
      pollInterval: 30,
    },
  };
}

describe("KioskDisplay", () => {
  it("renders VideoPage for video type", () => {
    const config = makeConfig([makePage({ type: "video", name: "My Video" })]);
    render(<KioskDisplay initialConfig={config} />);
    expect(screen.getByTestId("video-page")).toHaveTextContent("My Video");
  });

  it("renders ImagePage for image type", () => {
    const config = makeConfig([makePage({ type: "image", name: "My Image" })]);
    render(<KioskDisplay initialConfig={config} />);
    expect(screen.getByTestId("image-page")).toHaveTextContent("My Image");
  });

  it("renders WebsitePage for website type", () => {
    const config = makeConfig([
      makePage({ type: "website", name: "My Website" }),
    ]);
    render(<KioskDisplay initialConfig={config} />);
    expect(screen.getByTestId("website-page")).toHaveTextContent("My Website");
  });

  it("shows 'No pages configured' when there are no enabled pages", () => {
    const config = makeConfig([]);
    render(<KioskDisplay initialConfig={config} />);
    expect(screen.getByText("No pages configured")).toBeInTheDocument();
  });

  it("shows 'No pages configured' when all pages are disabled", () => {
    const config = makeConfig([
      makePage({ enabled: false }),
    ]);
    render(<KioskDisplay initialConfig={config} />);
    expect(screen.getByText("No pages configured")).toBeInTheDocument();
  });

  describe("singlePage mode", () => {
    const pages = [
      makePage({ id: "vid-1", name: "Marketing Video", type: "video", displayOrder: 0 }),
      makePage({ id: "img-1", name: "Product Photo", type: "image", displayOrder: 1 }),
      makePage({ id: "web-1", name: "Wikipedia", type: "website", displayOrder: 2 }),
    ];

    it("finds page by ID", () => {
      const config = makeConfig(pages);
      render(<KioskDisplay initialConfig={config} singlePage="img-1" />);
      expect(screen.getByTestId("image-page")).toHaveTextContent("Product Photo");
    });

    it("finds page by type", () => {
      const config = makeConfig(pages);
      render(<KioskDisplay initialConfig={config} singlePage="website" />);
      expect(screen.getByTestId("website-page")).toHaveTextContent("Wikipedia");
    });

    it("finds page by name (case-insensitive)", () => {
      const config = makeConfig(pages);
      render(<KioskDisplay initialConfig={config} singlePage="marketing video" />);
      expect(screen.getByTestId("video-page")).toHaveTextContent("Marketing Video");
    });

    it("supports A/B/C shortcuts", () => {
      const config = makeConfig(pages);

      const { unmount } = render(<KioskDisplay initialConfig={config} singlePage="A" />);
      expect(screen.getByTestId("video-page")).toHaveTextContent("Marketing Video");
      unmount();

      const { unmount: unmount2 } = render(<KioskDisplay initialConfig={config} singlePage="B" />);
      expect(screen.getByTestId("image-page")).toHaveTextContent("Product Photo");
      unmount2();

      render(<KioskDisplay initialConfig={config} singlePage="C" />);
      expect(screen.getByTestId("website-page")).toHaveTextContent("Wikipedia");
    });
  });
});
