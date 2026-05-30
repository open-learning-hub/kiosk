import { NextResponse } from "next/server";

import {
  getConfig,
  updateSchedule,
  updateSettings,
  validateScheduleUpdate,
} from "@/lib/config";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const config = await getConfig();
    return NextResponse.json(config);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to read config", details: String(error) },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const hasSchedule = body.schedule !== undefined;
    const hasSettings =
      body.defaultDuration !== undefined || body.pollInterval !== undefined;

    if (hasSchedule) {
      const config = await getConfig();
      const scheduleError = validateScheduleUpdate(
        config.schedule,
        body.schedule,
      );
      if (scheduleError) {
        return NextResponse.json({ error: scheduleError }, { status: 400 });
      }
      try {
        await updateSchedule(body.schedule);
      } catch (error) {
        return NextResponse.json(
          { error: error instanceof Error ? error.message : String(error) },
          { status: 400 },
        );
      }
    }

    if (hasSettings) {
      const settings = await updateSettings({
        ...(body.defaultDuration !== undefined && {
          defaultDuration: body.defaultDuration,
        }),
        ...(body.pollInterval !== undefined && {
          pollInterval: body.pollInterval,
        }),
      });
      if (!hasSchedule) {
        return NextResponse.json(settings);
      }
    } else if (!hasSchedule) {
      const settings = await updateSettings(body);
      return NextResponse.json(settings);
    }

    if (hasSchedule && !hasSettings) {
      const config = await getConfig();
      return NextResponse.json({ schedule: config.schedule });
    }

    const config = await getConfig();
    return NextResponse.json({
      settings: config.settings,
      schedule: config.schedule,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update config", details: String(error) },
      { status: 500 },
    );
  }
}
