/**
 * Kadala drop-table loader.
 *
 * The data file at /public/kadala/kadala.json is produced by
 * scripts/build-kadala.py from the server's canonical CSVs. Refresh with:
 *
 *     python scripts/build-kadala.py
 *
 * The math behind each row:
 *
 *     per_gamble  = legChance * (weight / bucketTotalWeight)
 *     avgShards   = shardCost / per_gamble
 *     shardsForP  = shardCost * ln(1-p) / ln(1 - per_gamble)
 *
 * The Pattern seal from the Altar of Rites doubles every per-gamble chance
 * (and therefore halves avg shards / shards-for-N%). The toggle on the page
 * just divides the displayed numbers by two; the JSON itself is the no-Pattern
 * baseline.
 */
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Item, useItems } from "@/lib/items";

export type ClassKey =
  | "barbarian"
  | "crusader"
  | "demonhunter"
  | "monk"
  | "necromancer"
  | "witchdoctor"
  | "wizard";

export const KADALA_CLASSES: { key: ClassKey; label: string }[] = [
  { key: "barbarian", label: "Barbarian" },
  { key: "crusader", label: "Crusader" },
  { key: "demonhunter", label: "Demon Hunter" },
  { key: "monk", label: "Monk" },
  { key: "necromancer", label: "Necromancer" },
  { key: "witchdoctor", label: "Witch Doctor" },
  { key: "wizard", label: "Wizard" },
];

export type Quality = "legendary" | "set" | string;

export interface KadalaRow {
  slot: string;
  itemType: string;
  name: string;
  quality: Quality;
  id: string;
  itemLevel: number;
  unlocksAt: number;
  bucket: string;
  shardCost: number;
  legChance: number;
  weight: number;
  bucketTotalWeight: number;
  perGamble: number;
  avgShards: number;
  shardsFor80: number;
  deathsBreath: number;
  belowKadalaMin: boolean;
}

export type KadalaData = Record<ClassKey, KadalaRow[]>;

const URL = "/kadala/kadala.json";

async function fetchKadala(): Promise<KadalaData> {
  const r = await fetch(URL);
  if (!r.ok) throw new Error(`kadala.json fetch failed: ${r.status}`);
  return (await r.json()) as KadalaData;
}

export function useKadala() {
  return useQuery({
    queryKey: ["kadala"],
    queryFn: fetchKadala,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

/**
 * The thirteen Kadala "bucket" slots — each bucket pools its candidates and
 * shares one shard cost + legendary-upgrade roll. 1H and 2H weapons are
 * separate buckets even though they share the 75-shard cost.
 *
 * Order matches the cheapest-to-most-expensive progression a player walks
 * the vendor with.
 */
export const KADALA_BUCKETS: { key: string; label: string; cost: number }[] = [
  { key: "head", label: "Helms", cost: 25 },
  { key: "shoulders", label: "Shoulders", cost: 25 },
  { key: "chest", label: "Chest", cost: 25 },
  { key: "gloves", label: "Gloves", cost: 25 },
  { key: "bracers", label: "Bracers", cost: 25 },
  { key: "belt", label: "Belts", cost: 25 },
  { key: "pants", label: "Pants", cost: 25 },
  { key: "boots", label: "Boots", cost: 25 },
  { key: "offhand", label: "Off-Hand", cost: 25 },
  { key: "amulet", label: "Amulet", cost: 50 },
  { key: "ring", label: "Ring", cost: 50 },
  { key: "1h", label: "1H Weapon", cost: 75 },
  { key: "2h", label: "2H Weapon", cost: 75 },
];

/** Numeric formatter — thousand separator with a thin space, easier to scan
 * in dense tables than the default comma. */
export function fmt(n: number): string {
  return n.toLocaleString("en-US").replace(/,/g, " ");
}

/** A Kadala row joined with its codex counterpart so the page can reuse the
 * shared icon, rarity color, and full tooltip rather than carrying its own
 * copies. `codex` is undefined when the codex has no matching entry (rare;
 * mostly happens for items the dedup pass dropped). */
export interface KadalaJoined extends KadalaRow {
  codex: Item | undefined;
}

/** Build an `item id -> codex Item` index. Codex slugs are of the form
 * `<name-kebab>-<item id>` (e.g. `countess-julias-cameo-
 * Unique_Amulet_103_x1`), so the codex slug ends with `-<id>`. Build once,
 * O(items * ids) — fine for ~1500 items × ~200 ids per class.
 */
function buildCodexIndex(items: Item[], ids: Set<string>): Map<string, Item> {
  const out = new Map<string, Item>();
  for (const it of items) {
    for (const id of ids) {
      if (out.has(id)) continue;
      if (it.slug.endsWith(`-${id}`)) {
        out.set(id, it);
        break;
      }
    }
  }
  return out;
}

export function useKadalaJoined(cls: ClassKey | null) {
  const kad = useKadala();
  const codex = useItems();
  const joined = useMemo<KadalaJoined[] | undefined>(() => {
    if (!cls || !kad.data || !codex.data) return undefined;
    const rows = kad.data[cls] ?? [];
    const ids = new Set(rows.map((r) => r.id));
    const idx = buildCodexIndex(codex.data, ids);
    return rows.map((r) => ({ ...r, codex: idx.get(r.id) }));
  }, [cls, kad.data, codex.data]);
  return {
    rows: joined,
    isLoading: kad.isLoading || codex.isLoading,
    error: kad.error || codex.error,
  };
}
