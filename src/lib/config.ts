import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";

import type { KioskConfig, PageConfig } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const CONFIG_PATH = path.join(DATA_DIR, "config.json");

function defaultConfig(): KioskConfig {
  return {
    version: 1,
    pages: [
      {
        id: randomUUID(),
        name: "Marketing Video",
        type: "video",
        enabled: true,
        duration: 30,
        displayOrder: 0,
        mediaFile: "sample-video.mp4",
        videoLoop: true,
      },
      {
        id: randomUUID(),
        name: "Product Photo",
        type: "image",
        enabled: true,
        duration: 10,
        displayOrder: 1,
        mediaFile: "sample-image.jpg",
        imageFit: "contain",
      },
      {
        id: randomUUID(),
        name: "Wikipedia",
        type: "website",
        enabled: true,
        duration: 15,
        displayOrder: 2,
        url: "https://www.wikipedia.org",
      },
    ],
    settings: {
      defaultDuration: 15,
      pollInterval: 30,
    },
  };
}

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

export async function getConfig(): Promise<KioskConfig> {
  await ensureDataDir();
  try {
    const raw = await fs.readFile(CONFIG_PATH, "utf-8");
    return JSON.parse(raw) as KioskConfig;
  } catch {
    const config = defaultConfig();
    await saveConfig(config);
    return config;
  }
}

export async function saveConfig(config: KioskConfig): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8");
}

export async function getPages(): Promise<PageConfig[]> {
  const config = await getConfig();
  return config.pages.sort((a, b) => a.displayOrder - b.displayOrder);
}

export async function getPage(id: string): Promise<PageConfig | undefined> {
  const config = await getConfig();
  return config.pages.find((p) => p.id === id);
}

export async function addPage(
  page: Omit<PageConfig, "id">,
): Promise<PageConfig> {
  const config = await getConfig();
  const newPage: PageConfig = { ...page, id: randomUUID() };
  config.pages.push(newPage);
  await saveConfig(config);
  return newPage;
}

export async function updatePage(
  id: string,
  updates: Partial<PageConfig>,
): Promise<PageConfig | null> {
  const config = await getConfig();
  const idx = config.pages.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  config.pages[idx] = { ...config.pages[idx], ...updates, id };
  await saveConfig(config);
  return config.pages[idx];
}

export async function deletePage(id: string): Promise<boolean> {
  const config = await getConfig();
  const before = config.pages.length;
  config.pages = config.pages.filter((p) => p.id !== id);
  if (config.pages.length === before) return false;
  // Re-index display order
  config.pages
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .forEach((p, i) => (p.displayOrder = i));
  await saveConfig(config);
  return true;
}

export async function swapPageOrder(
  idA: string,
  idB: string,
): Promise<boolean> {
  const config = await getConfig();
  const pageA = config.pages.find((p) => p.id === idA);
  const pageB = config.pages.find((p) => p.id === idB);
  if (!pageA || !pageB) return false;
  const tmp = pageA.displayOrder;
  pageA.displayOrder = pageB.displayOrder;
  pageB.displayOrder = tmp;
  await saveConfig(config);
  return true;
}

export async function updateSettings(
  settings: Partial<KioskConfig["settings"]>,
): Promise<KioskConfig["settings"]> {
  const config = await getConfig();
  config.settings = { ...config.settings, ...settings };
  await saveConfig(config);
  return config.settings;
}
