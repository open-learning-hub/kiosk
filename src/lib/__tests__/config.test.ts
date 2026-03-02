import { describe, it, expect, vi, beforeEach } from "vitest";
import type { KioskConfig, PageConfig } from "../types";

const mockMkdir = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
const mockReadFile = vi.fn();
const mockWriteFile = vi
  .fn<() => Promise<void>>()
  .mockResolvedValue(undefined);
const mockRandomUUID = vi.fn().mockReturnValue("test-uuid-1234");

vi.mock("fs", async () => {
  const actual = await vi.importActual<typeof import("fs")>("fs");
  const mockPromises = {
    mkdir: mockMkdir,
    readFile: mockReadFile,
    writeFile: mockWriteFile,
  };
  const mod = { ...actual, promises: mockPromises };
  return { ...mod, default: mod };
});

vi.mock("crypto", async () => {
  const actual = await vi.importActual<typeof import("crypto")>("crypto");
  const mod = { ...actual, randomUUID: mockRandomUUID };
  return { ...mod, default: mod };
});

// Force re-import to pick up the mocks
const config = await import("../config");

function makeConfig(overrides?: Partial<KioskConfig>): KioskConfig {
  return {
    version: 1,
    pages: [
      {
        id: "page-1",
        name: "Video Page",
        type: "video",
        enabled: true,
        duration: 30,
        displayOrder: 0,
        mediaFile: "video.mp4",
        videoLoop: true,
      },
      {
        id: "page-2",
        name: "Image Page",
        type: "image",
        enabled: true,
        duration: 10,
        displayOrder: 1,
        mediaFile: "image.jpg",
        imageFit: "contain",
      },
      {
        id: "page-3",
        name: "Website Page",
        type: "website",
        enabled: false,
        duration: 15,
        displayOrder: 2,
        url: "https://example.com",
      },
    ],
    settings: {
      defaultDuration: 15,
      pollInterval: 30,
    },
    ...overrides,
  };
}

describe("config", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMkdir.mockResolvedValue(undefined);
    mockWriteFile.mockResolvedValue(undefined);
    mockRandomUUID.mockReturnValue("test-uuid-1234");
  });

  describe("getConfig", () => {
    it("reads and parses existing config file", async () => {
      const cfg = makeConfig();
      mockReadFile.mockResolvedValueOnce(JSON.stringify(cfg));

      const result = await config.getConfig();
      expect(result).toEqual(cfg);
      expect(mockMkdir).toHaveBeenCalled();
    });

    it("creates default config when file does not exist", async () => {
      mockReadFile.mockRejectedValueOnce(new Error("ENOENT"));

      const result = await config.getConfig();
      expect(result.version).toBe(1);
      expect(result.pages).toHaveLength(3);
      expect(result.settings.defaultDuration).toBe(15);
      expect(mockWriteFile).toHaveBeenCalled();
    });
  });

  describe("saveConfig", () => {
    it("writes config as formatted JSON", async () => {
      const cfg = makeConfig();
      await config.saveConfig(cfg);

      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.stringContaining("config.json"),
        JSON.stringify(cfg, null, 2),
        "utf-8"
      );
    });
  });

  describe("getPages", () => {
    it("returns pages sorted by displayOrder", async () => {
      const cfg = makeConfig();
      cfg.pages[0].displayOrder = 2;
      cfg.pages[2].displayOrder = 0;
      mockReadFile.mockResolvedValueOnce(JSON.stringify(cfg));

      const pages = await config.getPages();
      expect(pages[0].id).toBe("page-3");
      expect(pages[1].id).toBe("page-2");
      expect(pages[2].id).toBe("page-1");
    });
  });

  describe("getPage", () => {
    it("returns the page matching the given ID", async () => {
      mockReadFile.mockResolvedValueOnce(JSON.stringify(makeConfig()));

      const page = await config.getPage("page-2");
      expect(page).toBeDefined();
      expect(page!.name).toBe("Image Page");
    });

    it("returns undefined for a non-existent ID", async () => {
      mockReadFile.mockResolvedValueOnce(JSON.stringify(makeConfig()));

      const page = await config.getPage("does-not-exist");
      expect(page).toBeUndefined();
    });
  });

  describe("addPage", () => {
    it("adds a page with a generated ID and saves", async () => {
      mockReadFile.mockResolvedValueOnce(JSON.stringify(makeConfig()));

      const newPage: Omit<PageConfig, "id"> = {
        name: "New Page",
        type: "website",
        enabled: true,
        duration: 20,
        displayOrder: 3,
        url: "https://new.example.com",
      };

      const result = await config.addPage(newPage);
      expect(result.id).toBe("test-uuid-1234");
      expect(result.name).toBe("New Page");
      expect(mockWriteFile).toHaveBeenCalled();
    });
  });

  describe("updatePage", () => {
    it("merges updates into the existing page", async () => {
      mockReadFile.mockResolvedValueOnce(JSON.stringify(makeConfig()));

      const result = await config.updatePage("page-1", {
        name: "Updated Video",
      });
      expect(result).not.toBeNull();
      expect(result!.name).toBe("Updated Video");
      expect(result!.id).toBe("page-1");
    });

    it("returns null for a non-existent page", async () => {
      mockReadFile.mockResolvedValueOnce(JSON.stringify(makeConfig()));

      const result = await config.updatePage("missing", { name: "Nope" });
      expect(result).toBeNull();
    });
  });

  describe("deletePage", () => {
    it("removes the page and re-indexes displayOrder", async () => {
      mockReadFile.mockResolvedValueOnce(JSON.stringify(makeConfig()));

      const result = await config.deletePage("page-2");
      expect(result).toBe(true);

      const savedConfig = JSON.parse(
        mockWriteFile.mock.calls[0][1] as string
      ) as KioskConfig;
      expect(savedConfig.pages).toHaveLength(2);
      expect(savedConfig.pages[0].displayOrder).toBe(0);
      expect(savedConfig.pages[1].displayOrder).toBe(1);
    });

    it("returns false for a non-existent page", async () => {
      mockReadFile.mockResolvedValueOnce(JSON.stringify(makeConfig()));

      const result = await config.deletePage("missing");
      expect(result).toBe(false);
    });
  });

  describe("swapPageOrder", () => {
    it("swaps displayOrder of two pages", async () => {
      mockReadFile.mockResolvedValueOnce(JSON.stringify(makeConfig()));

      const result = await config.swapPageOrder("page-1", "page-3");
      expect(result).toBe(true);

      const savedConfig = JSON.parse(
        mockWriteFile.mock.calls[0][1] as string
      ) as KioskConfig;
      const pageA = savedConfig.pages.find((p) => p.id === "page-1")!;
      const pageB = savedConfig.pages.find((p) => p.id === "page-3")!;
      expect(pageA.displayOrder).toBe(2);
      expect(pageB.displayOrder).toBe(0);
    });

    it("returns false if either page is missing", async () => {
      mockReadFile.mockResolvedValueOnce(JSON.stringify(makeConfig()));

      const result = await config.swapPageOrder("page-1", "missing");
      expect(result).toBe(false);
    });
  });

  describe("updateSettings", () => {
    it("merges partial settings and saves", async () => {
      mockReadFile.mockResolvedValueOnce(JSON.stringify(makeConfig()));

      const result = await config.updateSettings({ pollInterval: 60 });
      expect(result.pollInterval).toBe(60);
      expect(result.defaultDuration).toBe(15);
    });
  });
});
