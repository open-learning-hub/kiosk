import { NextResponse } from "next/server";

import { deleteUpload, listUploads, saveUpload } from "@/lib/media";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const files = await listUploads();
    return NextResponse.json(files);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to list uploads", details: String(error) },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const mediaFile = await saveUpload(file);
    return NextResponse.json(mediaFile, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to upload file", details: String(error) },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { filename } = await request.json();
    if (!filename) {
      return NextResponse.json(
        { error: "No filename provided" },
        { status: 400 },
      );
    }
    const deleted = await deleteUpload(filename);
    if (!deleted) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete file", details: String(error) },
      { status: 500 },
    );
  }
}
