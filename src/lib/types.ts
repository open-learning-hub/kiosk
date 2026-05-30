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

export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const ALL_WEEKDAYS: Weekday[] = [1, 2, 3, 4, 5, 6, 7];

export interface PowerSchedule {
  enabled: boolean;
  onTime: string;
  offTime: string;
  wakeLeadMinutes: number;
  daysOfWeek: Weekday[];
}

export interface KioskConfig {
  version: number;
  pages: PageConfig[];
  settings: {
    defaultDuration: number;
    pollInterval: number;
  };
  schedule: PowerSchedule;
}

export interface MediaFile {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
}
