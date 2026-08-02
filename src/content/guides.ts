// Loads the per-game strategy guides. Each game has one standalone, separately
// readable markdown file under ./guides/<id>.md, keyed by the same id the game
// is catalogued and archived under. Vite globs them lazily so each guide is its
// own code-split chunk — the library index needs only the ids (from the glob
// keys), and a guide's markdown is fetched only when that guide is opened.

import {
  CATALOG,
  CATALOG_BY_ID,
  CATEGORY_ORDER,
  CATEGORY_LABEL,
  type CatalogCategory,
  type CatalogEntry,
} from "../catalog";

const LOADERS = import.meta.glob("./guides/*.md", {
  query: "?raw",
  import: "default",
}) as Record<string, () => Promise<string>>;

// "./guides/hex.md" → "hex"
const idToPath: Record<string, string> = {};
for (const path of Object.keys(LOADERS)) {
  const id = path.split("/").pop()!.replace(/\.md$/, "");
  idToPath[id] = path;
}

export interface GameGuide {
  id: string;
  title: string;
  markdown: string;
  entry?: CatalogEntry;
}

function titleOf(md: string, fallback: string): string {
  const m = /^#\s+(.+)$/m.exec(md);
  return m ? m[1].trim() : fallback;
}

export function hasGuide(id: string): boolean {
  return id in idToPath;
}

/** Fetch a single guide's markdown on demand (its own chunk). */
export async function loadGuide(id: string): Promise<GameGuide | undefined> {
  const path = idToPath[id];
  if (!path) return undefined;
  const md = await LOADERS[path]();
  const entry = CATALOG_BY_ID[id];
  return { id, title: titleOf(md, entry?.name ?? id), markdown: md, entry };
}

export interface GuideGroup {
  category: CatalogCategory;
  label: string;
  entries: CatalogEntry[];
}

/** Catalog entries that have a guide, grouped by category in catalog order. */
export function guideLibrary(): GuideGroup[] {
  return CATEGORY_ORDER.map((category) => ({
    category,
    label: CATEGORY_LABEL[category],
    entries: CATALOG.filter((e) => e.category === category && e.id in idToPath),
  })).filter((g) => g.entries.length > 0);
}

/** Flat list of guide-bearing catalog entries, in catalog order — for prev/next. */
export const GUIDE_ENTRIES: CatalogEntry[] = CATALOG.filter((e) => e.id in idToPath);
