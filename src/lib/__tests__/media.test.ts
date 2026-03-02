import { describe, it, expect, vi, beforeEach } from "vitest";

const mockMkdir = vi.fn().mockResolvedValue(undefined);
const mockWriteFile = vi.fn().mockResolvedValue(undefined);
const mockUnlink = vi.fn().mockResolvedValue(undefined);
const mockReaddir = vi.fn().mockResolvedValue([]);
const mockStat = vi.fn();

vi.mock("fs", async () => {
  const actual = await vi.importActual<typeof import("fs")>("fs");
  const mockPromises = {
    mkdir: mockMkdir,
    writeFile: mockWriteFile,
    unlink: mockUnlink,
    readdir: mockReaddir,
    stat: mockStat,
  };
  const mod = { ...actual, promises: mockPromises };
  return { ...mod, default: mod };
});

const media = await import("../media");

describe("media", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMkdir.mockResolvedValue(undefined);
    mockWriteFile.mockResolvedValue(undefined);
    mockUnlink.mockResolvedValue(undefined);
    mockReaddir.mockResolvedValue([]);
  });

  describe("getUploadPath", () => {
    it("returns a path under data/uploads", () => {
      const result = media.getUploadPath("my-file.mp4");
      expect(result).toContain("data");
      expect(result).toContain("uploads");
      expect(result).toContain("my-file.mp4");
    });
  });

  describe("getMimeType", () => {
    it.each([
      [".mp4", "video/mp4"],
      [".webm", "video/webm"],
      [".jpg", "image/jpeg"],
      [".jpeg", "image/jpeg"],
      [".png", "image/png"],
      [".gif", "image/gif"],
      [".webp", "image/webp"],
    ])("returns correct MIME type for %s", (ext, expected) => {
      expect(media.getMimeType(`file${ext}`)).toBe(expected);
    });

    it("falls back to application/octet-stream for unknown extensions", () => {
      expect(media.getMimeType("file.txt")).toBe("application/octet-stream");
      expect(media.getMimeType("file.exe")).toBe("application/octet-stream");
    });
  });

  describe("isAllowedFile", () => {
    it("accepts allowed file types", () => {
      expect(media.isAllowedFile("video.mp4")).toBe(true);
      expect(media.isAllowedFile("photo.PNG")).toBe(true);
      expect(media.isAllowedFile("clip.webm")).toBe(true);
      expect(media.isAllowedFile("pic.jpg")).toBe(true);
    });

    it("rejects disallowed file types", () => {
      expect(media.isAllowedFile("doc.pdf")).toBe(false);
      expect(media.isAllowedFile("script.js")).toBe(false);
      expect(media.isAllowedFile("readme.txt")).toBe(false);
    });
  });

  describe("saveUpload", () => {
    it("saves an allowed file and returns metadata", async () => {
      const mockFile = new File(["file content"], "photo.jpg", {
        type: "image/jpeg",
      });

      const result = await media.saveUpload(mockFile);
      expect(result.originalName).toBe("photo.jpg");
      expect(result.mimeType).toBe("image/jpeg");
      expect(result.filename).toMatch(/^\d+-photo\.jpg$/);
      expect(mockWriteFile).toHaveBeenCalled();
    });

    it("sanitizes special characters in filename", async () => {
      const mockFile = new File(["data"], "my photo (1).png", {
        type: "image/png",
      });

      const result = await media.saveUpload(mockFile);
      expect(result.filename).toMatch(/^\d+-my_photo__1_\.png$/);
    });

    it("throws for disallowed file types", async () => {
      const mockFile = new File(["data"], "readme.txt", {
        type: "text/plain",
      });

      await expect(media.saveUpload(mockFile)).rejects.toThrow("not allowed");
    });
  });

  describe("deleteUpload", () => {
    it("returns true on successful delete", async () => {
      const result = await media.deleteUpload("some-file.jpg");
      expect(result).toBe(true);
      expect(mockUnlink).toHaveBeenCalled();
    });

    it("returns false when file does not exist", async () => {
      mockUnlink.mockRejectedValueOnce(new Error("ENOENT"));

      const result = await media.deleteUpload("missing.jpg");
      expect(result).toBe(false);
    });
  });

  describe("listUploads", () => {
    it("returns sorted list of uploaded files", async () => {
      mockReaddir.mockResolvedValueOnce(["1000-old.jpg", "2000-new.png"]);

      mockStat
        .mockResolvedValueOnce({
          size: 1024,
          birthtime: new Date("2024-01-01"),
        })
        .mockResolvedValueOnce({
          size: 2048,
          birthtime: new Date("2024-06-01"),
        });

      const results = await media.listUploads();
      expect(results).toHaveLength(2);
      expect(results[0].filename).toBe("2000-new.png");
      expect(results[1].filename).toBe("1000-old.jpg");
    });

    it("strips timestamp prefix for originalName", async () => {
      mockReaddir.mockResolvedValueOnce(["1234-photo.jpg"]);
      mockStat.mockResolvedValueOnce({
        size: 512,
        birthtime: new Date(),
      });

      const results = await media.listUploads();
      expect(results[0].originalName).toBe("photo.jpg");
    });

    it("skips hidden files", async () => {
      mockReaddir.mockResolvedValueOnce([".DS_Store", "1234-photo.jpg"]);
      mockStat.mockResolvedValueOnce({
        size: 512,
        birthtime: new Date(),
      });

      const results = await media.listUploads();
      expect(results).toHaveLength(1);
      expect(results[0].filename).toBe("1234-photo.jpg");
    });

    it("returns empty array for empty directory", async () => {
      mockReaddir.mockResolvedValueOnce([]);

      const results = await media.listUploads();
      expect(results).toEqual([]);
    });
  });
});
