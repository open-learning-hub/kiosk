export type PageType = "video" | "image" | "website";

export interface PageConfig {
  id: string;
  name: string;
  type: PageType;
  enabled: boolean;
  duration: number;
  displayOrder: number;
  mediaFile?: string;
  url?: string;
  videoLoop?: boolean;
  imageFit?: "contain" | "cover";
}

export interface KioskConfig {
  version: number;
  pages: PageConfig[];
  settings: {
    defaultDuration: number;
    pollInterval: number;
  };
}

export interface MediaFile {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
}
