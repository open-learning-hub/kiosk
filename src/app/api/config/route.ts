import { NextResponse } from "next/server";
import { getConfig, updateSettings } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const config = await getConfig();
    return NextResponse.json(config);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to read config", details: String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const settings = await updateSettings(body);
    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update config", details: String(error) },
      { status: 500 }
    );
  }
}
