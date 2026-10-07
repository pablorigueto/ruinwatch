/**
 * Types and runtime loader for the Diablo III item catalog.
 *
 * Data lives at /public/items/items.json and icons under
 * /public/items/icons/<basename>.png. Item text is kept in sync with the game
 * files by casc-tools/build-codex-casc.mjs. The JSON is fetched once at runtime via TanStack
 * Query and cached for the session.
 */
import { useQuery } from "@tanstack/react-query";

export type Rarity =
  | "ethereal"
  | "legendary"
  | "set"
  | "magic"
  | "rare"
  | "common"
  | "crafted"
  | "unknown";

export interface ArmorWeaponBlock {
  /** "armor" or "weapon" */
  kind: string;
  /** "armor" | "dps" | "damage" | "shield" | ... */
  subtype: string;
  /** Big numeric value when present (e.g. "72 - 89", "85.8"). */
  value: string;
  /** Label next to / under the big value (e.g. "Armor", "Damage Per Second"). */
  label: string;
  /** Rich inner HTML for sub-blocks like the damage range + APS pair. */
  html: string;
}

export interface BreadcrumbCrumb {
  name: string;
  href: string;
}

export interface RelatedItem {
  name: string;
  href: string;
  level: string;
}

export interface SetPiece {
  name: string;
  href: string;
  is_current: boolean;
}

export interface ItemSet {
  name: string;
  pieces: SetPiece[];
  /** Each is an HTML snippet for a "(N) Set: …" bonus tier. */
  bonuses: string[];
}

export interface Item {
  slug: string;
  url: string;
  name: string;
  rarity: Rarity;
  /** e.g. "Legendary Helm" */
  item_type: string;
  /** e.g. "Head" */
  slot: string;
  icon_url: string;
  /** basename inside /items/icons/ */
  icon_file: string;
  armor_or_weapon: ArmorWeaponBlock[];
  /** HTML snippets — keep d3-color-* spans intact. */
  primary: string[];
  secondary: string[];
  /** Each entry is [headHtml, opt1Html, opt2Html, ...] */
  choice: string[][];
  /** "Account Bound", etc. */
  extras: string[];
  /** HTML — wraps a single d3-color-ffc7b377 span typically. */
  flavor: string;
  breadcrumb: BreadcrumbCrumb[];
  related: RelatedItem[];
  keywords: string;
  title: string;
  description: string;
  /** "helm", "ring", "sword-2h", etc. */
  category_slug: string;
  required_level: number | null;
  class_restriction: string[];
  unique_equipped: boolean;
  item_set: ItemSet | null;
}

const ITEMS_URL = "/items/items.json";
const ICON_BASE = "/items/icons/";

export function iconSrc(item: Pick<Item, "icon_file">): string {
  return item.icon_file ? `${ICON_BASE}${item.icon_file}` : "";
}

async function fetchItems(): Promise<Item[]> {
  const res = await fetch(ITEMS_URL);
  if (!res.ok) throw new Error(`items.json fetch failed: ${res.status}`);
  return (await res.json()) as Item[];
}

export function useItems() {
  return useQuery({
    queryKey: ["d3-items"],
    queryFn: fetchItems,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

/** Map of slug -> Item for O(1) detail lookup. */
export function indexBySlug(items: Item[]): Map<string, Item> {
  const m = new Map<string, Item>();
  for (const it of items) m.set(it.slug, it);
  return m;
}

const RARITY_ORDER: Rarity[] = ["ethereal", "set", "legendary", "rare", "magic", "crafted", "common", "unknown"];

/** Lower wins — Ethereal goes first per Season 24 spotlight. */
const RARITY_PRIORITY: Record<Rarity, number> = {
  ethereal: 0,
  set: 1,
  legendary: 2,
  rare: 3,
  magic: 4,
  crafted: 5,
  common: 6,
  unknown: 7,
};

/** Tailwind color class for a rarity, matching the site palette. */
export function rarityColorClass(rarity: Rarity): string {
  switch (rarity) {
    case "ethereal":
      return "text-[hsl(190,85%,75%)]";
    case "legendary":
      return "text-ember-glow";
    case "set":
      return "text-[hsl(120,55%,55%)]";
    case "magic":
      return "text-[hsl(220,90%,72%)]";
    case "rare":
      return "text-gold";
    case "crafted":
      return "text-gold";
    case "common":
      return "text-bone";
    default:
      return "text-muted-foreground";
  }
}

export function rarityBorderClass(rarity: Rarity): string {
  switch (rarity) {
    case "ethereal":
      return "border-[hsl(190,85%,75%)]/50 hover:border-[hsl(190,85%,75%)] shadow-[0_0_12px_-4px_hsl(190_85%_75%/0.4)]";
    case "legendary":
      return "border-ember/40 hover:border-ember";
    case "set":
      return "border-[hsl(120,55%,55%)]/40 hover:border-[hsl(120,55%,55%)]";
    case "magic":
      return "border-[hsl(220,90%,72%)]/40 hover:border-[hsl(220,90%,72%)]";
    case "rare":
      return "border-gold/40 hover:border-gold";
    case "crafted":
      return "border-gold/30 hover:border-gold/80";
    default:
      return "border-stone hover:border-bone/60";
  }
}

export const RARITIES: Rarity[] = RARITY_ORDER;

// ---------------------------------------------------------------------------
// Codex grouping: super-category -> category -> rarity -> items
// ---------------------------------------------------------------------------

/**
 * Order in which super-categories appear in the codex. Each entry's `cats`
 * is the ordered list of `category_slug` values from items.json that belong
 * to it. Adding a new Blizzard category? Append its slug here.
 */
/**
 * Equipment-slot aliases: items in these `from` categories are bucketed under
 * `to` for display, because they all go in the same gear slot. The class
 * sub-division surfaces the class-specific origin (a WD's voodoo mask still
 * shows up under Witch Doctor inside Helms).
 *
 * Items keep their original `category_slug` in the JSON, so the category
 * filter dropdown can still target e.g. "voodoo-mask" specifically.
 */
export const CATEGORY_ALIASES: Record<string, string> = {
  "voodoo-mask": "helm",
  "spirit-stone": "helm",
  "wizard-hat": "helm",
  "mighty-belt": "belt",
};

export const SUPER_CATS = [
  {
    key: "ethereal",
    label: "Ethereal",
    cats: ["ethereal"],
  },
  {
    key: "armor",
    label: "Armor",
    cats: [
      "helm",
      "pauldrons",
      "chest-armor",
      "cloak",
      "bracers",
      "gloves",
      "belt",
      "pants",
      "boots",
    ],
  },
  {
    key: "weapon-1h",
    label: "One-Handed Weapons",
    cats: [
      "sword-1h",
      "axe-1h",
      "mace-1h",
      "dagger",
      "fist-weapon",
      "mighty-weapon-1h",
      "scythe-1h",
      "flail-1h",
      "ceremonial-knife",
      "hand-crossbow",
      "wand",
    ],
  },
  {
    key: "weapon-2h",
    label: "Two-Handed Weapons",
    cats: [
      "sword-2h",
      "axe-2h",
      "mace-2h",
      "mighty-weapon-2h",
      "staff",
      "polearm",
      "bow",
      "crossbow",
      "daibo",
      "flail-2h",
      "scythe-2h",
      "spear",
    ],
  },
  {
    key: "offhand",
    label: "Off-Hand",
    cats: ["shield", "crusader-shield", "mojo", "orb", "quiver", "phylactery"],
  },
  {
    key: "jewelry",
    label: "Jewelry",
    cats: ["amulet", "ring"],
  },
  {
    key: "follower",
    label: "Follower Items",
    cats: ["enchantress-focus", "scoundrel-token", "templar-relic"],
  },
  {
    key: "consumable",
    label: "Consumables",
    cats: ["potion", "crafting-material", "dye"],
  },
  {
    key: "pattern",
    label: "Plans & Designs",
    cats: ["blacksmith-plan", "jeweler-design", "page-of-training"],
  },
  { key: "gem", label: "Gems", cats: ["gem"] },
  { key: "misc", label: "Miscellaneous", cats: ["misc"] },
] as const;

/** Display labels for category_slug values. */
export const CATEGORY_LABELS: Record<string, string> = {
  ethereal: "Ethereal Weapons",
  helm: "Helms",
  "chest-armor": "Chest Armor",
  pauldrons: "Shoulders",
  gloves: "Gloves",
  bracers: "Bracers",
  belt: "Belts",
  "mighty-belt": "Mighty Belts",
  pants: "Pants",
  boots: "Boots",
  cloak: "Cloaks",
  "spirit-stone": "Spirit Stones",
  "voodoo-mask": "Voodoo Masks",
  "wizard-hat": "Wizard Hats",
  "sword-1h": "One-Handed Swords",
  "axe-1h": "One-Handed Axes",
  "mace-1h": "One-Handed Maces",
  dagger: "Daggers",
  "fist-weapon": "Fist Weapons",
  "mighty-weapon-1h": "One-Handed Mighty Weapons",
  "scythe-1h": "One-Handed Scythes",
  "flail-1h": "One-Handed Flails",
  "ceremonial-knife": "Ceremonial Knives",
  "hand-crossbow": "Hand Crossbows",
  wand: "Wands",
  "sword-2h": "Two-Handed Swords",
  "axe-2h": "Two-Handed Axes",
  "mace-2h": "Two-Handed Maces",
  staff: "Staves",
  polearm: "Polearms",
  bow: "Bows",
  crossbow: "Crossbows",
  daibo: "Daibos",
  "flail-2h": "Two-Handed Flails",
  "scythe-2h": "Two-Handed Scythes",
  spear: "Spears",
  "mighty-weapon-2h": "Two-Handed Mighty Weapons",
  shield: "Shields",
  "crusader-shield": "Crusader Shields",
  mojo: "Mojos",
  orb: "Orbs",
  quiver: "Quivers",
  phylactery: "Phylacteries",
  ring: "Rings",
  amulet: "Amulets",
  "enchantress-focus": "Enchantress Foci",
  "scoundrel-token": "Scoundrel Tokens",
  "templar-relic": "Templar Relics",
  potion: "Potions",
  "crafting-material": "Crafting Materials",
  dye: "Dyes",
  "blacksmith-plan": "Blacksmith Plans",
  "jeweler-design": "Jeweler Designs",
  "page-of-training": "Pages of Training",
  gem: "Gems",
  misc: "Miscellaneous",
};

export function categoryLabel(slug: string): string {
  return CATEGORY_LABELS[slug] ?? slug;
}

/**
 * Sort comparator applied to items within a single (category, rarity) bucket.
 *
 * Default: alphabetical by name. Special case for regular gems (magic-rarity
 * entries under category "gem"), where we want the visual order to reflect the
 * upgrade ladder: group by color, then by tier ascending. That makes Amethyst
 * (lv 30) -> Flawless (lv 36) -> Square (lv 54) -> ... -> Flawless Royal
 * (lv 70) appear in sequence, then the next color, instead of a scrambled
 * alphabetical list ("Flawless Amethyst" sorting next to "Flawless Diamond").
 */
const GEM_SLUG_RE = /-x1_([A-Za-z]+)_(\d{2})$/;

function gemSortKey(it: Item): [string, number] {
  const m = it.slug.match(GEM_SLUG_RE);
  if (!m) return ["~", 99]; // unknown shape — push to end of group
  return [m[1].toLowerCase(), parseInt(m[2], 10)];
}

function compareWithinRarity(a: Item, b: Item): number {
  if (a.category_slug === "gem" && b.category_slug === "gem") {
    const [ca, ta] = gemSortKey(a);
    const [cb, tb] = gemSortKey(b);
    if (ca !== cb) return ca.localeCompare(cb);
    if (ta !== tb) return ta - tb;
  }
  // Secondary key (and default): required level, then name.
  const la = a.required_level ?? 9999;
  const lb = b.required_level ?? 9999;
  if (la !== lb) return la - lb;
  return a.name.localeCompare(b.name);
}

export interface CategoryGroup {
  slug: string;
  label: string;
  total: number;
  byRarity: Array<{ rarity: Rarity; items: Item[] }>;
}

export interface SuperGroup {
  key: string;
  label: string;
  total: number;
  categories: CategoryGroup[];
}

/**
 * Bucket items into the SUPER_CATS hierarchy. Empty buckets are dropped.
 * Any category not declared in SUPER_CATS is collected under an "Other"
 * super-group so nothing ever silently disappears.
 */
export function groupForCodex(items: Item[]): SuperGroup[] {
  const byCat = new Map<string, Item[]>();
  for (const it of items) {
    const raw = it.category_slug || "misc";
    const k = CATEGORY_ALIASES[raw] ?? raw;
    const bucket = byCat.get(k);
    if (bucket) bucket.push(it);
    else byCat.set(k, [it]);
  }

  const buildCategoryGroup = (slug: string, list: Item[]): CategoryGroup => {
    const byRar = new Map<Rarity, Item[]>();
    for (const it of list) {
      const r = it.rarity;
      const arr = byRar.get(r);
      if (arr) arr.push(it);
      else byRar.set(r, [it]);
    }
    for (const arr of byRar.values()) {
      arr.sort(compareWithinRarity);
    }
    const byRarity = Array.from(byRar.entries())
      .sort(([a], [b]) => RARITY_PRIORITY[a] - RARITY_PRIORITY[b])
      .map(([rarity, list2]) => ({ rarity, items: list2 }));
    return { slug, label: categoryLabel(slug), total: list.length, byRarity };
  };

  const result: SuperGroup[] = [];
  const seen = new Set<string>();
  for (const sc of SUPER_CATS) {
    const cats: CategoryGroup[] = [];
    for (const catSlug of sc.cats) {
      const list = byCat.get(catSlug);
      if (!list || list.length === 0) continue;
      seen.add(catSlug);
      cats.push(buildCategoryGroup(catSlug, list));
    }
    if (cats.length === 0) continue;
    result.push({
      key: sc.key,
      label: sc.label,
      total: cats.reduce((n, c) => n + c.total, 0),
      categories: cats,
    });
  }

  const leftover: CategoryGroup[] = [];
  for (const [slug, list] of byCat) {
    if (seen.has(slug)) continue;
    leftover.push(buildCategoryGroup(slug, list));
  }
  if (leftover.length > 0) {
    leftover.sort((a, b) => a.label.localeCompare(b.label));
    result.push({
      key: "other",
      label: "Other",
      total: leftover.reduce((n, c) => n + c.total, 0),
      categories: leftover,
    });
  }

  return result;
}
