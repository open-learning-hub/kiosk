"use client";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PageConfig } from "@/lib/types";

interface PageListProps {
  pages: PageConfig[];
  onEdit: (page: PageConfig) => void;
  onDelete: (page: PageConfig) => void;
  onToggle: (page: PageConfig) => void;
  onMoveUp: (page: PageConfig) => void;
  onMoveDown: (page: PageConfig) => void;
}

const typeIcons: Record<string, string> = {
  video: "🎬",
  image: "🖼️",
  website: "🌐",
};

export function PageList({
  pages,
  onEdit,
  onDelete,
  onToggle,
  onMoveUp,
  onMoveDown,
}: PageListProps) {
  const sorted = [...pages].sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">Order</TableHead>
          <TableHead className="w-12">Type</TableHead>
          <TableHead>Name</TableHead>
          <TableHead className="w-24">Duration</TableHead>
          <TableHead className="w-20">Enabled</TableHead>
          <TableHead className="w-48">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((page, idx) => (
          <TableRow key={page.id}>
            <TableCell>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={idx === 0}
                  onClick={() => onMoveUp(page)}
                  className="h-6 w-6 p-0"
                >
                  ↑
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={idx === sorted.length - 1}
                  onClick={() => onMoveDown(page)}
                  className="h-6 w-6 p-0"
                >
                  ↓
                </Button>
              </div>
            </TableCell>
            <TableCell>{typeIcons[page.type] || "?"}</TableCell>
            <TableCell className="font-medium">{page.name}</TableCell>
            <TableCell>{page.duration}s</TableCell>
            <TableCell>
              <Switch
                checked={page.enabled}
                onCheckedChange={() => onToggle(page)}
              />
            </TableCell>
            <TableCell>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(page)}
                >
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onDelete(page)}
                >
                  Delete
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
        {sorted.length === 0 && (
          <TableRow>
            <TableCell
              colSpan={6}
              className="text-muted-foreground py-8 text-center"
            >
              No pages configured. Click &quot;Add Page&quot; to get started.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
