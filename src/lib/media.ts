import { promises as fs } from "fs";
import path from "path";
import type { MediaFile } from "./types";

const UPLOADS_DIR = path.join(process.cwd(), "data", "uploads");

const ALLOWED_TYPES: Record<string, string> = {
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
};

async function ensureUploadsDir() {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
}

export function getUploadPath(filename: string): string {
  return path.join(UPLOADS_DIR, filename);
}

export function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  return ALLOWED_TYPES[ext] || "application/octet-stream";
}

export function isAllowedFile(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  return ext in ALLOWED_TYPES;
}

export async function saveUpload(file: File): Promise<MediaFile> {
  await ensureUploadsDir();

  const ext = path.extname(file.name).toLowerCase();
  if (!ALLOWED_TYPES[ext]) {
    throw new Error(`File type ${ext} is not allowed`);
  }

  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filename = `${timestamp}-${safeName}`;
  const filePath = path.join(UPLOADS_DIR, filename);

  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(filePath, buffer);

  return {
    filename,
    originalName: file.name,
    mimeType: ALLOWED_TYPES[ext] || "application/octet-stream",
    size: file.size,
    uploadedAt: new Date().toISOString(),
  };
}

export async function deleteUpload(filename: string): Promise<boolean> {
  try {
    await fs.unlink(path.join(UPLOADS_DIR, filename));
    return true;
  } catch {
    return false;
  }
}

export async function listUploads(): Promise<MediaFile[]> {
  await ensureUploadsDir();
  const files = await fs.readdir(UPLOADS_DIR);
  const results: MediaFile[] = [];

  for (const filename of files) {
    if (filename.startsWith(".")) continue;
    const filePath = path.join(UPLOADS_DIR, filename);
    try {
      const stat = await fs.stat(filePath);
      results.push({
        filename,
        originalName: filename.replace(/^\d+-/, ""),
        mimeType: getMimeType(filename),
        size: stat.size,
        uploadedAt: stat.birthtime.toISOString(),
      });
    } catch {
      // skip files that can't be stat'd
    }
  }

  return results.sort(
    (a, b) =>
      new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
  );
}
