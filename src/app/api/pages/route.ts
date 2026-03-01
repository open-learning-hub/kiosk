import { NextResponse } from "next/server";
import { getPages, addPage, swapPageOrder } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const pages = await getPages();
    return NextResponse.json(pages);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to list pages", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const page = await addPage(body);
    return NextResponse.json(page, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create page", details: String(error) },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { swap } = await request.json();
    if (!Array.isArray(swap) || swap.length !== 2) {
      return NextResponse.json(
        { error: "Expected { swap: [idA, idB] }" },
        { status: 400 }
      );
    }
    const ok = await swapPageOrder(swap[0], swap[1]);
    if (!ok) {
      return NextResponse.json(
        { error: "One or both page IDs not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to swap pages", details: String(error) },
      { status: 500 }
    );
  }
}
