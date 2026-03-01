"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { MediaLibrary } from "./media-library";
import type { PageConfig, PageType } from "@/lib/types";

interface PageEditorProps {
  page?: PageConfig | null;
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  nextOrder: number;
}

export function PageEditor({
  page,
  open,
  onClose,
  onSave,
  nextOrder,
}: PageEditorProps) {
  const [name, setName] = useState(page?.name || "");
  const [type, setType] = useState<PageType>(page?.type || "image");
  const [duration, setDuration] = useState(page?.duration || 15);
  const [enabled, setEnabled] = useState(page?.enabled ?? true);
  const [mediaFile, setMediaFile] = useState(page?.mediaFile || "");
  const [url, setUrl] = useState(page?.url || "");
  const [videoLoop, setVideoLoop] = useState(page?.videoLoop ?? true);
  const [imageFit, setImageFit] = useState<"contain" | "cover">(
    page?.imageFit || "contain"
  );
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const body: Partial<PageConfig> = {
      name,
      type,
      duration,
      enabled,
      displayOrder: page?.displayOrder ?? nextOrder,
    };

    if (type === "video" || type === "image") {
      body.mediaFile = mediaFile;
    }
    if (type === "video") {
      body.videoLoop = videoLoop;
    }
    if (type === "image") {
      body.imageFit = imageFit;
    }
    if (type === "website") {
      body.url = url;
    }

    const endpoint = page ? `/api/pages/${page.id}` : "/api/pages";
    const method = page ? "PUT" : "POST";

    await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setSaving(false);
    onSave();
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{page ? "Edit Page" : "Add Page"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Page name"
            />
          </div>

          <div className="space-y-2">
            <Label>Type</Label>
            <Select
              value={type}
              onValueChange={(v) => setType(v as PageType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="image">Image</SelectItem>
                <SelectItem value="website">Website</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Duration (seconds)</Label>
            <Input
              type="number"
              min={1}
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value) || 15)}
            />
          </div>

          <div className="flex items-center gap-2">
            <Switch checked={enabled} onCheckedChange={setEnabled} />
            <Label>Enabled</Label>
          </div>

          {(type === "video" || type === "image") && (
            <div className="space-y-2">
              <Label>Media File</Label>
              <div className="flex gap-2 items-center">
                <Input
                  value={mediaFile}
                  onChange={(e) => setMediaFile(e.target.value)}
                  placeholder="Filename"
                  readOnly
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMediaPicker(!showMediaPicker)}
                >
                  {showMediaPicker ? "Hide" : "Browse"}
                </Button>
              </div>
              {showMediaPicker && (
                <MediaLibrary
                  selectable
                  onSelect={(filename) => {
                    setMediaFile(filename);
                    setShowMediaPicker(false);
                  }}
                />
              )}
            </div>
          )}

          {type === "video" && (
            <div className="flex items-center gap-2">
              <Switch checked={videoLoop} onCheckedChange={setVideoLoop} />
              <Label>Loop Video</Label>
            </div>
          )}

          {type === "image" && (
            <div className="space-y-2">
              <Label>Image Fit</Label>
              <Select
                value={imageFit}
                onValueChange={(v) =>
                  setImageFit(v as "contain" | "cover")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contain">Contain</SelectItem>
                  <SelectItem value="cover">Cover</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {type === "website" && (
            <div className="space-y-2">
              <Label>URL</Label>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !name}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
