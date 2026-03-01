import { NextResponse } from "next/server";
import { createReadStream, statSync } from "fs";
import { Readable } from "stream";
import { getUploadPath, getMimeType, isAllowedFile } from "@/lib/media";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;

  // Prevent path traversal
  const safeName = path.basename(filename);
  if (safeName !== filename || !isAllowedFile(safeName)) {
    return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
  }

  // Check for sample files in public/sample first
  let filePath = getUploadPath(safeName);
  let stat;
  try {
    stat = statSync(filePath);
  } catch {
    // Try public/sample as fallback for sample assets
    const samplePath = path.join(process.cwd(), "public", "sample", safeName);
    try {
      stat = statSync(samplePath);
      filePath = samplePath;
    } catch {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
  }

  const mimeType = getMimeType(safeName);
  const fileSize = stat.size;
  const rangeHeader = request.headers.get("range");

  if (rangeHeader) {
    const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);
    if (match) {
      const start = parseInt(match[1], 10);
      const end = match[2] ? parseInt(match[2], 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      const stream = createReadStream(filePath, { start, end });
      const webStream = Readable.toWeb(stream) as ReadableStream;

      return new Response(webStream, {
        status: 206,
        headers: {
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": String(chunkSize),
          "Content-Type": mimeType,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }
  }

  const stream = createReadStream(filePath);
  const webStream = Readable.toWeb(stream) as ReadableStream;

  return new Response(webStream, {
    status: 200,
    headers: {
      "Content-Length": String(fileSize),
      "Content-Type": mimeType,
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
