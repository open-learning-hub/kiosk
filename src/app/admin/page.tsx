"use client";

import { useCallback, useEffect, useState } from "react";

import { toast } from "sonner";

import { MediaLibrary } from "@/components/admin/media-library";
import { PageEditor } from "@/components/admin/page-editor";
import { PageList } from "@/components/admin/page-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { KioskConfig, PageConfig, Weekday } from "@/lib/types";
import { ALL_WEEKDAYS } from "@/lib/types";

const WEEKDAY_OPTIONS: { label: string; value: Weekday }[] = [
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
  { label: "Sun", value: 7 },
];

export default function AdminPage() {
  const [config, setConfig] = useState<KioskConfig | null>(null);
  const [editingPage, setEditingPage] = useState<PageConfig | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [selectedDays, setSelectedDays] = useState<Weekday[]>([
    ...ALL_WEEKDAYS,
  ]);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/config");
    if (res.ok) {
      const data = await res.json();
      setConfig(data);
      setScheduleEnabled(data.schedule?.enabled ?? false);
      setSelectedDays(data.schedule?.daysOfWeek ?? [...ALL_WEEKDAYS]);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/config")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && !cancelled) {
          setConfig(data);
          setScheduleEnabled(data.schedule?.enabled ?? false);
          setSelectedDays(data.schedule?.daysOfWeek ?? [...ALL_WEEKDAYS]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!config) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const pages = config.pages;

  async function handleToggle(page: PageConfig) {
    await fetch(`/api/pages/${page.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !page.enabled }),
    });
    refresh();
  }

  async function handleDelete(page: PageConfig) {
    if (!confirm(`Delete "${page.name}"?`)) return;
    await fetch(`/api/pages/${page.id}`, { method: "DELETE" });
    toast.success(`Deleted "${page.name}"`);
    refresh();
  }

  async function handleMove(page: PageConfig, direction: "up" | "down") {
    const sorted = [...pages].sort((a, b) => a.displayOrder - b.displayOrder);
    const idx = sorted.findIndex((p) => p.id === page.id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;

    const swapPage = sorted[swapIdx];
    await fetch("/api/pages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ swap: [page.id, swapPage.id] }),
    });
    refresh();
  }

  async function handleSaveSettings(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    await fetch("/api/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        defaultDuration: parseInt(form.get("defaultDuration") as string) || 15,
        pollInterval: parseInt(form.get("pollInterval") as string) || 30,
      }),
    });
    toast.success("Settings saved");
    refresh();
  }

  function toggleDay(day: Weekday) {
    setSelectedDays((prev) => {
      const next = prev.includes(day)
        ? prev.filter((d) => d !== day)
        : [...prev, day];
      return next.sort((a, b) => a - b) as Weekday[];
    });
  }

  async function handleSaveSchedule(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (scheduleEnabled && selectedDays.length === 0) {
      toast.error("Select at least one day when scheduled power is enabled");
      return;
    }
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        schedule: {
          enabled: scheduleEnabled,
          onTime: (form.get("onTime") as string) || "09:00",
          offTime: (form.get("offTime") as string) || "17:00",
          wakeLeadMinutes:
            parseInt(form.get("wakeLeadMinutes") as string, 10) || 1,
          daysOfWeek: selectedDays,
        },
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(
        (data as { error?: string }).error ?? "Failed to save power schedule",
      );
      return;
    }
    toast.success("Power schedule saved");
    refresh();
  }

  const nextOrder =
    pages.length > 0 ? Math.max(...pages.map((p) => p.displayOrder)) + 1 : 0;

  return (
    <div className="space-y-6">
      <Tabs defaultValue="pages">
        <TabsList>
          <TabsTrigger value="pages">Pages</TabsTrigger>
          <TabsTrigger value="media">Media Library</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="pages" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Display Pages</h2>
            <Button
              onClick={() => {
                setEditingPage(null);
                setShowEditor(true);
              }}
            >
              Add Page
            </Button>
          </div>
          <PageList
            pages={pages}
            onEdit={(page) => {
              setEditingPage(page);
              setShowEditor(true);
            }}
            onDelete={handleDelete}
            onToggle={handleToggle}
            onMoveUp={(page) => handleMove(page, "up")}
            onMoveDown={(page) => handleMove(page, "down")}
          />
        </TabsContent>

        <TabsContent value="media" className="space-y-4">
          <h2 className="text-xl font-semibold">Media Library</h2>
          <MediaLibrary />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <h2 className="text-xl font-semibold">Global Settings</h2>
          <Card>
            <CardHeader>
              <CardTitle>Kiosk Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="defaultDuration">
                    Default Page Duration (seconds)
                  </Label>
                  <Input
                    id="defaultDuration"
                    name="defaultDuration"
                    type="number"
                    min={1}
                    defaultValue={config.settings.defaultDuration}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pollInterval">
                    Config Poll Interval (seconds)
                  </Label>
                  <Input
                    id="pollInterval"
                    name="pollInterval"
                    type="number"
                    min={5}
                    defaultValue={config.settings.pollInterval}
                  />
                  <p className="text-muted-foreground text-xs">
                    How often the kiosk display checks for config changes
                  </p>
                </div>
                <div className="flex justify-center">
                  <Button type="submit">Save Settings</Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Power Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveSchedule} className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="scheduleEnabled">
                      Enable scheduled power
                    </Label>
                    <p className="text-muted-foreground text-xs">
                      Pi powers fully off outside this window and wakes via the
                      RTC (Pi 5, mains connected).
                    </p>
                  </div>
                  <Switch
                    id="scheduleEnabled"
                    checked={scheduleEnabled}
                    onCheckedChange={setScheduleEnabled}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="onTime">On time</Label>
                    <Input
                      id="onTime"
                      name="onTime"
                      type="time"
                      defaultValue={config.schedule.onTime}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="offTime">Off time</Label>
                    <Input
                      id="offTime"
                      name="offTime"
                      type="time"
                      defaultValue={config.schedule.offTime}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Days of week</Label>
                  <p className="text-muted-foreground text-xs">
                    Disabled days keep the Pi powered off all day.
                  </p>
                  <div className="grid grid-cols-4 gap-3 sm:grid-cols-7">
                    {WEEKDAY_OPTIONS.map(({ label, value }) => (
                      <div
                        key={value}
                        className="flex flex-col items-center gap-1.5"
                      >
                        <Switch
                          id={`day-${value}`}
                          checked={selectedDays.includes(value)}
                          onCheckedChange={() => toggleDay(value)}
                        />
                        <Label
                          htmlFor={`day-${value}`}
                          className="text-muted-foreground text-xs font-normal"
                        >
                          {label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wakeLeadMinutes">
                    Wake lead (minutes before on time)
                  </Label>
                  <Input
                    id="wakeLeadMinutes"
                    name="wakeLeadMinutes"
                    type="number"
                    min={0}
                    max={60}
                    defaultValue={config.schedule.wakeLeadMinutes}
                  />
                  <p className="text-muted-foreground text-xs">
                    Cold boot takes ~30s; wake early so the kiosk is ready by on
                    time.
                  </p>
                </div>
                <div className="flex justify-center">
                  <Button type="submit">Save Power Schedule</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <PageEditor
        key={editingPage?.id ?? "new"}
        page={editingPage}
        open={showEditor}
        onClose={() => setShowEditor(false)}
        onSave={refresh}
        nextOrder={nextOrder}
      />
    </div>
  );
}
