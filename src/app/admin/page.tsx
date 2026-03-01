"use client";

import { useState, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageList } from "@/components/admin/page-list";
import { PageEditor } from "@/components/admin/page-editor";
import { MediaLibrary } from "@/components/admin/media-library";
import type { KioskConfig, PageConfig } from "@/lib/types";
import { toast } from "sonner";

export default function AdminPage() {
  const [config, setConfig] = useState<KioskConfig | null>(null);
  const [editingPage, setEditingPage] = useState<PageConfig | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/config");
    if (res.ok) setConfig(await res.json());
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/config")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && !cancelled) setConfig(data);
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

  const nextOrder = pages.length > 0
    ? Math.max(...pages.map((p) => p.displayOrder)) + 1
    : 0;

  return (
    <div className="space-y-6">
      <Tabs defaultValue="pages">
        <TabsList>
          <TabsTrigger value="pages">Pages</TabsTrigger>
          <TabsTrigger value="media">Media Library</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="pages" className="space-y-4">
          <div className="flex justify-between items-center">
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
                  <p className="text-xs text-muted-foreground">
                    How often the kiosk display checks for config changes
                  </p>
                </div>
                <Button type="submit">Save Settings</Button>
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
