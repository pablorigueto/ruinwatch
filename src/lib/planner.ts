/**
 * Types + runtime loader for the RuinWatch build planner.
 *
 * Data lives at /public/planner/planner.json, kept in sync with the game files
 * by casc-tools/build-planner-casc.mjs. Item IDs are the canonical D3 ids, so
 * each item's `icon` matches the codex icons.
 *
 * Fetched once at runtime via TanStack Query, cached for the session.
 */
import { useQuery } from "@tanstack/react-query";

export type Quality = "legendary" | "set" | "rare" | "ethereal";

/** A registered item of the planner dataset. */
export interface PlannerItem {
  id: string;
  ids?: string[];
  name: string;
  /** Weapon/armor category, e.g. "helm", "sword", "ring". */
  type: string;
  quality: Quality;
  /** Set id (lowercase) for set items. */
  set?: string;
  /** "Legacy" etc. on old variants. */
  suffix?: string;
  /** Stat-roll preset (stat ids / group names). */
  preset?: string[];
  /** Always-present rolls and legendary powers. */
  required?: Record<string, unknown> & { custom?: LegendaryPower };
  /** Rollable affixes -> stat-limit template name or inline range. */
  affixes?: Record<string, string | { min?: number; max?: number; step?: number }>;
  /** Local icon path (/items/icons/...), absent when no match was found. */
  icon?: string;
  /** True for the live/season copy when the game ships several patch-pack
   *  variants of the same legendary (highest "Pxx_" prefix wins). */
  current?: boolean;
}

export interface LegendaryPower {
  id: string;
  name: string;
  format: string;
  args?: number;
  min?: number;
  max?: number;
  value?: number | number[];
  /** Ethereal only: item ids of the class weapon powers it can carry. */
  options?: string[];
}

export interface SetDef {
  name: string;
  class: string | null;
  order: string[];
  /** piece-count -> list of bonus entries ({stat,value} or {format}). */
  bonuses: Record<string, Array<{ stat?: string; value?: number[]; format?: string }>>;
}

export interface LegendaryGem {
  id: string;
  name: string;
  types: string[];
  maxlevel: number;
  effects: Array<{ format: string | null; value: unknown; delta: unknown; stat: string | null }>;
  /** local icon path (/planner/icons/...), attached by fetch-gem-icons. */
  icon?: string;
}

export interface NormalGemColor {
  id: string;
  name: string;
  weapon?: { stat: string; amount: number[] };
  head?: { stat: string; amount: number[] };
  other?: { stat: string; amount: number[] };
  icon?: string;
}

export interface StatDef {
  name: string;
  format?: string;
  percent?: boolean;
  secondary?: boolean;
  classes?: string[];
}

export interface StatRange {
  min: number;
  max: number;
  step?: number;
}

export interface SlotDef {
  name: string;
  classes?: string[];
  /** affix stat-id -> stat-limit template name. */
  affixes?: Record<string, string>;
  sockets?: number;
  socketType?: string;
}

export interface ClassDef {
  name: string;
  primary?: string;
  resources?: string[];
}

export interface PlannerData {
  generatedFrom: string;
  season: string;
  classes: Record<string, ClassDef>;
  stats: Record<string, StatDef>;
  statGroups: Record<string, string[]>;
  statLimits: Record<string, Record<string, StatRange>>;
  itemSlots: Record<string, SlotDef>;
  /** Per weapon/armor type base data: the affix templates a type can roll, plus
   *  weapon {speed,min,max} for DPS. Weapons source their affixes from here (the
   *  generic itemSlots map is empty for weapon slots). */
  itemTypes: Record<string, {
    affixes?: Record<string, string>;
    weapon?: { speed: number; min: number; max: number };
    slot?: string;
  }>;
  powerClasses: Record<string, string>;
  sets: Record<string, SetDef>;
  gems: { normal: Record<string, NormalGemColor>; legendary: Record<string, LegendaryGem> };
  items: PlannerItem[];
  /** Class passives by class (id = skills.json slug), e.g. for an Ethereal's extra passive. */
  passives?: Record<string, Record<string, { id: string; name: string; index: number }>>;
  /** Season extras (Altar of Rites, potions). Optional. */
  altar?: Record<string, AltarNode>;
  potions?: unknown[];
  /** Canonical class-buff damage %s extracted from the CASC .pow files. */
  classBuffs?: Record<string, { pct: number; slot: string; note: string }>;
  /** Canonical passive damage %s extracted from the CASC passive .pow files. */
  passiveBuffs?: Record<string, { pct: number; slot: string; note: string }>;
  /** Canonical defensive %s (dr/armor/resall) from CASC passive .pow files. */
  defenseBuffs?: Record<string, { kind: "dr" | "armor" | "resall"; pct: number; slot: string; note: string }>;
}

export interface AltarNode {
  name: string;
  desc: string;
  flavor?: string;
  /** sprite-sheet column index into altar1.webp (minors) / altar2.webp (majors). */
  icon?: number;
  /** tree position on the 9-col × 11-row seal lattice. */
  row?: number;
  col?: number;
  /** ids of nodes that must be active before this one (the tree edges). */
  requires?: string[];
  /** a "major" seal (bottom tier) uses the altar2 sprite; `final` is the apex. */
  major?: boolean;
  final?: boolean;
}

const PLANNER_URL = "/planner/planner.json";
const SKILL_DAMAGE_URL = "/planner/skill-damage.json";
const BUILDS_INDEX_URL = "/planner/builds/index.json";

async function fetchPlanner(): Promise<PlannerData> {
  const res = await fetch(PLANNER_URL, { cache: "no-cache" });
  if (!res.ok) throw new Error(`planner.json fetch failed: ${res.status}`);
  return (await res.json()) as PlannerData;
}

export function usePlanner() {
  return useQuery({
    queryKey: ["d3-planner"],
    queryFn: fetchPlanner,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

/** Canonical per-skill weapon-damage coefficients, extracted from the CASC .pow
 *  files (casc-tools/extract-skill-damage.mjs). slug -> { coeff, sno, slot }. */
export interface SkillCoeff {
  coeff: number;
  sno: number;
  slot: number;
}

async function fetchSkillDamage(): Promise<Record<string, SkillCoeff>> {
  const res = await fetch(SKILL_DAMAGE_URL, { cache: "no-cache" });
  if (!res.ok) throw new Error(`skill-damage.json fetch failed: ${res.status}`);
  return (await res.json()) as Record<string, SkillCoeff>;
}

export function useSkillDamage() {
  return useQuery({
    queryKey: ["d3-skill-damage"],
    queryFn: fetchSkillDamage,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

/** The list of reference builds (from /public/planner/builds/index.json). */
async function fetchBuildIndex(): Promise<PresetBuildMeta[]> {
  const res = await fetch(BUILDS_INDEX_URL, { cache: "no-cache" });
  if (!res.ok) throw new Error(`builds index fetch failed: ${res.status}`);
  const j = (await res.json()) as { builds: PresetBuildMeta[] };
  return j.builds ?? [];
}

export function useBuildIndex() {
  return useQuery({
    queryKey: ["d3-build-index"],
    queryFn: fetchBuildIndex,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

/** Fetch one reference build's full JSON by id. */
export async function fetchPresetBuild(id: string): Promise<PresetBuild> {
  const res = await fetch(`/planner/builds/${id}.json`, { cache: "no-cache" });
  if (!res.ok) throw new Error(`build ${id} fetch failed: ${res.status}`);
  return (await res.json()) as PresetBuild;
}

/* ------------------------------------------------------------------ */
/* Slot / type model                                                  */
/* ------------------------------------------------------------------ */

/** The 13 equip slots in paperdoll order. */
export const PAPERDOLL_SLOTS = [
  "head",
  "shoulders",
  "neck",
  "torso",
  "wrists",
  "hands",
  "waist",
  "legs",
  "feet",
  "leftfinger",
  "rightfinger",
  "mainhand",
  "offhand",
] as const;
export type SlotId = (typeof PAPERDOLL_SLOTS)[number];

/** Which item `type`s are equippable in each paperdoll slot. Weapon/offhand
 *  slots accept many categories; the rest map one-to-one. */
export const SLOT_TYPES: Record<SlotId, string[]> = {
  head: ["helm", "spiritstone", "voodoomask", "wizardhat"],
  shoulders: ["shoulders"],
  neck: ["amulet"],
  torso: ["chestarmor", "cloak"],
  wrists: ["bracers"],
  hands: ["gloves"],
  waist: ["belt", "mightybelt"],
  legs: ["pants"],
  feet: ["boots"],
  leftfinger: ["ring"],
  rightfinger: ["ring"],
  mainhand: [
    "sword", "axe", "mace", "dagger", "spear", "fistweapon", "scythe", "flail", "wand",
    "mightyweapon", "ceremonialknife", "sword2h", "axe2h", "mace2h", "polearm", "staff",
    "daibo", "bow", "crossbow", "handcrossbow", "mightyweapon2h", "flail2h", "scythe2h",
    "phylactery",
  ],
  offhand: ["shield", "crusadershield", "mojo", "source", "quiver", "phylactery"],
};

export const SLOT_LABELS: Record<SlotId, string> = {
  head: "Head",
  shoulders: "Shoulders",
  neck: "Amulet",
  torso: "Chest",
  wrists: "Bracers",
  hands: "Gloves",
  waist: "Belt",
  legs: "Pants",
  feet: "Boots",
  leftfinger: "Ring 1",
  rightfinger: "Ring 2",
  mainhand: "Main Hand",
  offhand: "Off-Hand",
};

/** Items equippable in a slot, optionally filtered by class. Sorted by
 *  rarity (set, legendary, rare) then name. */
export function itemsForSlot(
  data: PlannerData,
  slot: SlotId,
  klass?: string,
): PlannerItem[] {
  const types = new Set(SLOT_TYPES[slot]);
  const rank: Record<Quality, number> = { set: 0, ethereal: 1, legendary: 2, rare: 3 };
  return data.items
    .filter((it) => types.has(it.type))
    .filter((it) => it.quality !== "rare") // endgame builds don't use rare items
    .filter((it) => okForClass(data, it, klass))
    .sort((a, b) => (rank[a.quality] - rank[b.quality]) || a.name.localeCompare(b.name));
}

/** Display name of the set an item belongs to (or null). */
export function setName(data: PlannerData, item: PlannerItem): string | null {
  return item.set ? data.sets[item.set]?.name ?? null : null;
}

/** Distinct sets that have at least one item equippable in a slot, for the
 *  picker's "filter by set" dropdown. Returns [{id, name}], sorted by name. */
export function setsForSlot(
  data: PlannerData,
  slot: SlotId,
  klass?: string,
): Array<{ id: string; name: string }> {
  const types = new Set(SLOT_TYPES[slot]);
  const ids = new Set<string>();
  for (const it of data.items) {
    if (it.set && types.has(it.type) && okForClass(data, it, klass)) ids.add(it.set);
  }
  return [...ids]
    .map((id) => ({ id, name: data.sets[id]?.name ?? id }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Render a set bonus entry ({stat,value} or {format}) to display text. */
export function setBonusText(
  data: PlannerData,
  bonus: { stat?: string; value?: number[]; format?: string },
): string {
  if (bonus.format) return renderPrintf(bonus.format, bonus.value ?? []);
  if (bonus.stat && bonus.value) return formatStat(data, bonus.stat, bonus.value[0]);
  return "";
}

/** Item types that only one class can equip (class-specific gear). */
const CLASS_ONLY_TYPES: Record<string, string> = {
  // Demon Hunter
  quiver: "demonhunter", handcrossbow: "demonhunter",
  // Witch Doctor
  mojo: "witchdoctor", ceremonialknife: "witchdoctor", voodoomask: "witchdoctor",
  // Wizard
  wizardhat: "wizard", source: "wizard",
  // Monk
  spiritstone: "monk", daibo: "monk", fistweapon: "monk",
  // Crusader
  crusadershield: "crusader", flail: "crusader", flail2h: "crusader",
  // Barbarian
  mightyweapon: "barbarian", mightyweapon2h: "barbarian", mightybelt: "barbarian",
  // Necromancer
  phylactery: "necromancer", scythe: "necromancer", scythe2h: "necromancer",
};

/** True if an item can be used by `klass`. Enforces three rules:
 *  1. set items belong to the set's class (Inna's = monk, Marauder = DH…);
 *  2. class-specific item types (quiver, mojo, phylactery…) lock to one class;
 *  3. legendary powers restricted to a class. Unrestricted items pass. */
export function okForClass(data: PlannerData, it: PlannerItem, klass?: string): boolean {
  if (!klass) return true;
  // 1. set class restriction
  if (it.set) {
    const setClass = data.sets[it.set]?.class;
    if (setClass && setClass !== klass) return false;
  }
  // 2. class-specific item type
  const typeClass = CLASS_ONLY_TYPES[it.type];
  if (typeClass && typeClass !== klass) return false;
  // 3. legendary power restriction
  const powerId = it.required?.custom?.id;
  if (powerId) {
    const restrict = data.powerClasses[powerId];
    if (restrict && restrict !== klass) return false;
  }
  return true;
}

/** Resolve a stat-limit template name to its numeric range for a quality. */
export function statRange(
  data: PlannerData,
  quality: Quality,
  template: string,
): StatRange | null {
  return data.statLimits[quality]?.[template] ?? data.statLimits.legendary?.[template] ?? null;
}

/** Human label for a stat id (falls back to the id). */
export function statName(data: PlannerData, statId: string): string {
  return data.stats[statId]?.name ?? statId;
}

/** Playable (non-follower) classes in canonical order. */
export const PLAYABLE_CLASSES = [
  "barbarian", "crusader", "demonhunter", "monk", "necromancer", "witchdoctor", "wizard",
] as const;

/** The primary attribute a class scales with — the stat its "mainstat" affix
 *  resolves to (Barbarian/Crusader → Str, DH/Monk → Dex, the casters → Int). */
const CLASS_MAIN_STAT: Record<string, "str" | "dex" | "int"> = {
  barbarian: "str",
  crusader: "str",
  demonhunter: "dex",
  monk: "dex",
  necromancer: "int",
  witchdoctor: "int",
  wizard: "int",
};
export function classMainStat(klass: string): "str" | "dex" | "int" {
  return CLASS_MAIN_STAT[klass] ?? "str";
}

/* ------------------------------------------------------------------ */
/* Affix / quality model (Phase 2)                                    */
/* ------------------------------------------------------------------ */

export const QUALITIES: Quality[] = ["legendary", "set", "rare"];
/** Tiers a player can roll an item to, best-first. `set` items keep their tier.
 *  Rare is intentionally excluded — endgame builds only use legendary/ancient/
 *  primal (plus set). */
export const TIERS = ["primal", "ancient", "legendary"] as const;
export type Tier = (typeof TIERS)[number];

/** Human label for any affix key, resolving groups (mainstat) and class skill
 *  bonuses (skill_head -> "Head Skills"). Falls back to the raw key. */
export function affixLabel(data: PlannerData, key: string): string {
  if (data.stats[key]?.name) return data.stats[key].name;
  if (key === "mainstat") return "Primary Stat";
  if (key.startsWith("skill_")) {
    const slot = key.slice("skill_".length);
    return `${(SLOT_LABELS as Record<string, string>)[slot] ?? slot} Skill Damage`;
  }
  if (key === "sockets") return "Sockets";
  if (key === "augment") return "Augment (Caldesann's Despair)";
  return key;
}

/** Standard primary affixes a WEAPON can roll, beyond its type-specific lines.
 *  The itemTypes only list the unique templates (weapon damage, fury/etc.),
 *  so we add the universal weapon pool with their canonical stat-limit tables. */
const WEAPON_AFFIX_TEMPLATES: Record<string, string> = {
  mainstat: "attrLarge",
  vit: "attrLarge",
  damage: "damageWeaponPercent", // +%Damage (special); range resolved if present
  ias: "iasNormal",
  chd: "chdLarge",
  cdr: "cdrLarge",
  area: "areaLarge",
  lph: "lphVeryLarge",
  laek: "laekVeryLarge",
  rcr: "rcrLarge",
};

/** Standard primary affixes a RING can roll — the planner dataset leaves the ring
 *  slot's affix map empty, so we supply the universal jewelry pool. */
const RING_AFFIX_TEMPLATES: Record<string, string> = {
  mainstat: "attrLarge",
  vit: "attrLarge",
  chc: "chcLarge",
  chd: "chdLarge",
  cdr: "cdrLarge",
  area: "areaLarge",
  rcr: "rcrLarge",
  wpnphy: "damageJewelry",
  resall: "resistAll",
  life: "lifeLarge",
  lph: "lphLarge",
  laek: "laekLarge",
};

/** The affix→template map an item can roll: the generic slot affixes merged
 *  with the item-type affixes (weapons keep their damage/elemental lines here,
 *  since the weapon slot's own affix map is empty) plus the universal weapon /
 *  ring pools for those slots. */
export function itemAffixTemplates(
  data: PlannerData,
  slot: SlotId,
  item?: PlannerItem,
): Record<string, string> {
  const slotMap = data.itemSlots[slot]?.affixes ?? {};
  const typeMap = item ? data.itemTypes[item.type]?.affixes ?? {} : {};
  const isWeapon = slot === "mainhand" || slot === "offhand";
  const isRing = slot === "leftfinger" || slot === "rightfinger";
  const pool = isWeapon ? WEAPON_AFFIX_TEMPLATES : isRing ? RING_AFFIX_TEMPLATES : {};
  // only add pool templates that actually have a stat-limit table
  const extra = Object.fromEntries(
    Object.entries(pool).filter(
      ([, tmpl]) => data.statLimits.ancient?.[tmpl] || data.statLimits.legendary?.[tmpl],
    ),
  );
  return { ...extra, ...slotMap, ...typeMap };
}

/** Resolve the numeric range for an affix at a given tier, using the item's
 *  full template map. Primal uses the ancient max for both bounds (primals roll
 *  perfect). Weapon damage templates carry a second pair (min2/max2) — the real
 *  rolled range — which we surface as the range. */
export function affixRange(
  data: PlannerData,
  slot: SlotId,
  affixKey: string,
  tier: Tier,
  item?: PlannerItem,
): StatRange | null {
  const template = itemAffixTemplates(data, slot, item)[affixKey];
  if (!template) return null;
  const tableName = tier === "primal" || tier === "ancient" ? "ancient" : tier;
  const lim = data.statLimits[tableName]?.[template] ?? data.statLimits.legendary?.[template];
  if (!lim) return null;
  // weapon-damage limits store the rolled range in min2/max2 (a delta pair);
  // fall back to min/max for ordinary affixes.
  const r2 = lim as StatRange & { min2?: number; max2?: number };
  const lo = r2.min2 ?? r2.min;
  const hi = r2.max2 ?? r2.max;
  if (tier === "primal") return { min: hi, max: hi, step: r2.step };
  return { min: lo, max: hi, step: r2.step };
}

/** All affix keys an item can roll (slot + type templates). */
export function slotAffixKeys(data: PlannerData, slot: SlotId, item?: PlannerItem): string[] {
  return Object.keys(itemAffixTemplates(data, slot, item));
}

/** How many PRIMARY affix slots an item of this slot type carries — matching
 *  live D3 / the official planner: weapons & 2-handers expose 6 (incl. the
 *  weapon-damage line), everything else 4. The item's fixed `preset` affixes
 *  occupy the first of these; the rest are free for the player to choose. */
export function primaryAffixSlots(slot: SlotId): number {
  return slot === "mainhand" || slot === "offhand" ? 6 : 4;
}

/** Affix keys the player may pick for a FREE slot on this gear slot, grouped for
 *  a dropdown (e.g. "Resistance" → single-element resists). Skips the "sockets"
 *  pseudo-affix (sockets are their own UI) and anything already chosen. */
export interface AffixOption { key: string; label: string; group: string; }
export function choosableAffixes(
  data: PlannerData,
  slot: SlotId,
  taken: string[],
  item?: PlannerItem,
): AffixOption[] {
  const taken_ = new Set(taken);
  const out: AffixOption[] = [];
  for (const key of slotAffixKeys(data, slot, item)) {
    if (key === "sockets" || key === "dura" || key === "lvlreq") continue;
    if (taken_.has(key)) continue;
    out.push({ key, label: affixLabel(data, key), group: affixGroup(data, key) });
  }
  return out.sort((a, b) => a.group.localeCompare(b.group) || a.label.localeCompare(b.label));
}

/** Coarse category label used to group affixes in the picker dropdown. */
function affixGroup(_data: PlannerData, key: string): string {
  if (key === "mainstat" || key === "vit" || ["str", "dex", "int"].includes(key)) return "Primary";
  if (key === "resall" || key.startsWith("resist")) return "Resistance";
  if (key.startsWith("wpn") || key === "weapon" || key.startsWith("elem")) return "Damage";
  if (["life", "regen", "armor", "edef", "meleedef", "rangedef", "thorns", "block"].includes(key))
    return "Defensive";
  if (key.startsWith("skill_")) return "Skill Damage";
  return "Utility";
}

/** Render a printf-style format: fill each %d/%.1f/%s slot from values in
 *  order, and turn literal %% into %. Single-pass (no sentinel hack). */
export function renderPrintf(format: string, values: Array<number | string>): string {
  let i = 0;
  return format.replace(/%%|%\.?\d*[dfsu]/g, (tok) => {
    if (tok === "%%") return "%";
    const v = values[i++];
    return v == null ? "" : String(v);
  });
}

/** Format a stat value into its display string using the stat's printf format.
 *  Damage-range stats (args:2, "+%d-%d Damage") are shown as their top value
 *  since we track a single rolled number; a missing format falls back cleanly. */
export function formatStat(data: PlannerData, statId: string, value: number): string {
  const def = data.stats[statId] as (StatDef & { args?: number; damage?: boolean }) | undefined;
  if (!def?.format) {
    // elemental weapon damage (wpnhol/wpnfir/…) carries no format — label it.
    const label = def?.damage ? "Damage" : affixLabel(data, statId);
    return `+${value} ${label}`;
  }
  // a two-arg damage range: fill both %d with the rolled value (top of range).
  if (def.args === 2) return renderPrintf(def.format, [value, value]);
  return renderPrintf(def.format, [value]);
}

/** A fixed/intrinsic affix line on an item (the `required` block — legendary &
 *  ethereal built-in properties like "+1000 Intelligence", "Reduces cooldown by
 *  10%", "Gain the Rigor Mortis passive"). These are always-present and locked. */
export interface IntrinsicLine { key: string; text: string }

/** Render an item's intrinsic (`required`) affixes for display, at their max
 *  roll. Skips `custom` (the legendary power, shown separately) and durability.
 *  A damage range (min2/max2) shows as "+min2-max2 <Name>". */
export function intrinsicLines(data: PlannerData, item: PlannerItem, passiveName?: string): IntrinsicLine[] {
  const req = item.required as Record<string, unknown> | undefined;
  if (!req) return [];
  const out: IntrinsicLine[] = [];
  for (const [key, raw] of Object.entries(req)) {
    if (key === "custom" || key === "dura") continue;
    const def = data.stats[key] as (StatDef & { args?: number; damage?: boolean }) | undefined;
    const v = raw as { min?: number; max?: number; min2?: number; max2?: number };
    // value-less flags (ethereal_damage, extra_passive, ignore-durability) just
    // print their format/name verbatim.
    if (v == null || (v.min == null && v.max == null && v.min2 == null)) {
      // %p = the passive an Ethereal grants ("Gain the %p passive."), once one is chosen
      const txt = def?.format ? def.format.replace(/%%/g, "%").replace(/%p/g, passiveName ?? "…") : def?.name;
      if (txt) out.push({ key, text: txt });
      continue;
    }
    // a weapon-damage pair → "+lo-hi Name"
    if (v.min2 != null || (def?.damage && v.min !== v.max)) {
      const lo = v.min2 ?? v.min ?? 0;
      const hi = v.max2 ?? v.max ?? 0;
      out.push({ key, text: `+${lo}-${hi} ${def?.name ?? affixLabel(data, key)}` });
      continue;
    }
    out.push({ key, text: formatStat(data, key, v.max ?? v.min ?? 0) });
  }
  return out;
}

/** Gem quality tier names (index into a normal gem's amount[] array). */
// The 10 modern D3 gem qualities (index aligns with a normal gem's amount[]).
export const GEM_TIERS = [
  "Normal", "Flawless", "Square", "Flawless Square", "Star",
  "Marquise", "Imperial", "Flawless Imperial", "Royal", "Flawless Royal",
] as const;

/** A normal gem's contributed stat for a slot context (weapon/head/other). */
export function normalGemEffect(
  gem: NormalGemColor,
  context: "weapon" | "head" | "other",
  tierIndex: number,
): { stat: string; value: number } | null {
  const block = gem[context];
  if (!block) return null;
  const idx = Math.min(tierIndex, block.amount.length - 1);
  return { stat: block.stat, value: block.amount[idx] };
}

/** Render a legendary gem effect at a level (value + delta*level when present). */
export function legendaryGemText(
  effect: LegendaryGem["effects"][number],
  level: number,
): string {
  if (!effect.format) return "";
  const vals = Array.isArray(effect.value) ? effect.value : effect.value != null ? [effect.value] : [];
  const deltas = Array.isArray(effect.delta) ? effect.delta : effect.delta != null ? [effect.delta] : [];
  let i = 0;
  return effect.format.replace(/%%|%\.?\d*[dfsu]/g, (tok) => {
    if (tok === "%%") return "%";
    const base = (vals[i] as number) ?? 0;
    const d = (deltas[i] as number) ?? 0;
    i++;
    const v = base + d * level;
    return Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/.?0+$/, "");
  });
}

/* ------------------------------------------------------------------ */
/* Build state (shared across phases 2-6)                             */
/* ------------------------------------------------------------------ */

export interface SocketGem {
  /** normal gem color id (e.g. "emerald") or legendary gem key. */
  gem: string;
  legendary: boolean;
  /** normal: tier index into amount[]; legendary: gem level. */
  rank: number;
}

/** A configured item occupying a slot. */
export interface SlotState {
  itemId: string;
  tier: Tier;
  /** chosen affix key -> rolled value. */
  affixes: Record<string, number>;
  /** legendary power rolled value (when the item has a custom power w/ range). */
  powerValue?: number;
  gems: SocketGem[];
  /** Ethereal only: the "+1 Class Weapon Legendary Power" (item id from the item's options). */
  etherealPower?: string;
  /** Ethereal only: the "+1 Class Passive Power" (passive slug). */
  etherealPassive?: string;
}

export interface KanaiState {
  weapon?: string; // power id
  armor?: string;
  jewelry?: string;
}

/** A read-only assembly of an item's display data for a hover tooltip — the
 *  rolled affixes + the item's intrinsic (legendary/ethereal) properties +
 *  augment + power + set bonuses, grouped like the in-game card. */
export interface ItemTooltip {
  name: string;
  quality: Quality;
  typeLabel: string;
  /** primary stat lines (rolled affixes + intrinsic non-secondary props). */
  primary: string[];
  /** secondary line (the legendary power text), if any. */
  power?: string;
  /** Ethereal only: the chosen extra class weapon legendary power and extra class passive. */
  ethereal?: { power?: { name: string; text: string }; passive?: string };
  /** Caldesann's augment line, if present. */
  augment?: string;
  /** set name + its bonus lines. */
  setName?: string;
  setBonuses?: string[];
  flavor?: string;
}

export function itemTooltip(
  data: PlannerData,
  item: PlannerItem,
  state: SlotState | undefined,
  slot: SlotId,
  klass: string,
): ItemTooltip {
  const primary: string[] = [];
  // rolled affixes from the equipped state (skip the augment, shown apart)
  if (state) {
    for (const [stat, v] of Object.entries(state.affixes)) {
      if (stat === "augment") continue;
      primary.push(formatStat(data, stat, v));
    }
  }
  // intrinsic legendary/ethereal properties always present on the item (an Ethereal's
  // "Gain the … passive" line moves to its own block below once a passive is chosen)
  const passiveName = state ? etherealPassiveName(data, klass, state) : undefined;
  for (const line of intrinsicLines(data, item, passiveName)) {
    if (line.key === "extra_passive" && passiveName) continue;
    primary.push(line.text);
  }

  const power = powerDisplay(item, state?.powerValue) ?? undefined;
  let ethereal: ItemTooltip["ethereal"];
  if (item.quality === "ethereal" && state) {
    const ep = etherealPowerItem(data, item, state);
    ethereal = { power: ep ? { name: ep.name, text: powerDisplay(ep) ?? "" } : undefined, passive: passiveName };
  }
  const aug = state?.affixes.augment;
  const augment = aug != null ? `+${aug} ${affixLabel(data, classMainStat(klass))} (Caldesann's Despair)` : undefined;

  const sName = setName(data, item) ?? undefined;
  let setBonuses: string[] | undefined;
  if (item.set && data.sets[item.set]) {
    setBonuses = [];
    for (const [pieces, bonuses] of Object.entries(data.sets[item.set].bonuses).sort((a, b) => Number(a[0]) - Number(b[0]))) {
      for (const bo of bonuses) setBonuses.push(`(${pieces}) ${setBonusText(data, bo)}`);
    }
  }

  return {
    name: item.name,
    quality: item.quality,
    typeLabel: (SLOT_LABELS as Record<string, string>)[slot] ?? slot,
    primary,
    power,
    ethereal,
    augment,
    setName: sName,
    setBonuses,
  };
}

/** Skill bar: 6 active (skill slug -> rune letter | null) + up to 4 passives. */
export interface SkillState {
  active: Array<{ skill: string; rune: string | null }>;
  passives: string[];
}

export interface ParagonState {
  level: number;
  core: Record<string, number>;
  offense: Record<string, number>;
  defense: Record<string, number>;
  utility: Record<string, number>;
}

export interface BuildState {
  klass: string;
  /** character gender — drives the paperdoll background art. */
  gender?: "male" | "female";
  equipped: Partial<Record<SlotId, SlotState>>;
  kanai: KanaiState;
  skills: SkillState;
  paragon: ParagonState;
  /** ids of toggled-on damage buffs (see DAMAGE_BUFFS). */
  buffs: string[];
  /** ids of activated Altar of Rites nodes. */
  altar: string[];
}

export function emptyBuild(klass: string): BuildState {
  return {
    klass,
    gender: "male",
    equipped: {},
    kanai: {},
    skills: { active: [], passives: [] },
    paragon: defaultParagon(),
    buffs: [],
    altar: [],
  };
}

/* ------------------------------------------------------------------ */
/* Toggleable damage buffs                                            */
/* ------------------------------------------------------------------ */

export interface DamageBuff {
  id: string;
  /** display label. */
  label: string;
  /** total damage multiplier when active (1.30 = +30%). */
  mult: number;
  /** "gem", "set" (requires pieces), "class", or "global". */
  source: "gem" | "set" | "class" | "global";
  /** class slug for class buffs / gem key for gem buffs / set id for set buffs. */
  key?: string;
  /** short note on the condition. */
  note?: string;
}

/** Curated, canonical toggleable damage multipliers. Values are the standard
 *  fully-ramped figures a build planner assumes (max stacks / active). Gem
 *  buffs only apply when that legendary gem is socketed in the build. */
export const DAMAGE_BUFFS: DamageBuff[] = [
  // global / common combat buffs (rank-independent)
  { id: "buff_coe", label: "Convention of Elements", mult: 2.0, source: "global", note: "+200% on the active element cycle" },
];

/** Per-stack multipliers for legendary gems whose damage buff stacks. The CASC
 *  effect value is per-stack; the planner assumes fully ramped (max stacks). */
const GEM_STACKS: Record<string, number> = { taeguk: 10, stricken: 1, zei: 1 };

/** Legendary gem damage buffs computed canonically from each socketed gem's
 *  effect at its EQUIPPED RANK (value + delta·rank). Only gems whose first
 *  effect is a clear "increased damage" are offered as toggles. */
export function gemDamageBuffs(data: PlannerData, build: BuildState): DamageBuff[] {
  // collect socketed legendary gems with their highest equipped rank
  const ranks: Record<string, number> = {};
  for (const ss of Object.values(build.equipped)) {
    for (const g of ss?.gems ?? []) {
      if (g.legendary) ranks[g.gem] = Math.max(ranks[g.gem] ?? 0, g.rank);
    }
  }
  const out: DamageBuff[] = [];
  for (const [key, rank] of Object.entries(ranks)) {
    const gem = data.gems.legendary[key];
    if (!gem) continue;
    const e = gem.effects.find((x) => x.format && /increased damage|increase the damage|damage you deal/i.test(x.format));
    if (!e?.value) continue;
    const base = Array.isArray(e.value) ? (e.value[0] as number) : (e.value as number);
    const delta = Array.isArray(e.delta) ? (e.delta[0] as number) : ((e.delta as number) ?? 0);
    let pct = base + delta * rank;
    if (pct > 200) continue; // skip proc-style "X% chance to smite for N%"
    const stacks = GEM_STACKS[key] ?? 1;
    pct *= stacks;
    out.push({
      id: `gem_${key}`,
      label: `${gem.name}${stacks > 1 ? ` (${stacks} stacks)` : ""}`,
      mult: 1 + pct / 100,
      source: "gem",
      key,
      note: `+${pct.toFixed(0)}% at rank ${rank}`,
    });
  }
  return out;
}

/** Class-skill damage buffs built from the CASC-extracted canonical %s
 *  (data.classBuffs). Only those whose skill is on the bar are returned. The
 *  skill display name comes from skills.json via the caller. */
function classSkillBuffs(data: PlannerData, equippedSkills: Set<string>, labelFor: (slug: string) => string): DamageBuff[] {
  const cb = data.classBuffs ?? {};
  const out: DamageBuff[] = [];
  for (const [slug, info] of Object.entries(cb)) {
    if (!equippedSkills.has(slug)) continue;
    out.push({
      id: `skill_${slug}`,
      label: labelFor(slug),
      mult: 1 + info.pct / 100,
      source: "class",
      key: slug,
      note: info.note,
    });
  }
  return out;
}

/** Combined damage multiplier from the toggled buffs, gated so gem buffs only
 *  count when that gem is socketed somewhere in the build. */
/** Sets currently equipped, with piece count and which bonus tiers are active.
 *  For the paperdoll's "Active Sets" indicator. */
export interface ActiveSet {
  id: string;
  name: string;
  count: number;
  /** sorted bonus tiers, each flagged active when count >= pieces. */
  tiers: Array<{ pieces: number; active: boolean }>;
}
export function activeSets(data: PlannerData, build: BuildState): ActiveSet[] {
  const counts: Record<string, number> = {};
  for (const ss of Object.values(build.equipped)) {
    const item = ss && data.items.find((i) => i.id === ss.itemId);
    if (item?.set) counts[item.set] = (counts[item.set] ?? 0) + 1;
  }
  return Object.entries(counts)
    .map(([id, count]) => {
      const set = data.sets[id];
      const tiers = Object.keys(set?.bonuses ?? {})
        .map(Number)
        .sort((a, b) => a - b)
        .map((pieces) => ({ pieces, active: count >= pieces }));
      return { id, name: set?.name ?? id, count, tiers };
    })
    .sort((a, b) => b.count - a.count);
}

/** Active set bonuses (sets with enough equipped pieces) that grant a clear
 *  damage % — surfaced as toggleable buffs (most are conditional/skill-specific,
 *  so the player opts in). Returns DamageBuff[] with source "set". */
export function setDamageBuffs(data: PlannerData, build: BuildState): DamageBuff[] {
  const counts: Record<string, number> = {};
  for (const ss of Object.values(build.equipped)) {
    const item = ss && data.items.find((i) => i.id === ss.itemId);
    if (item?.set) counts[item.set] = (counts[item.set] ?? 0) + 1;
  }
  const out: DamageBuff[] = [];
  for (const [setId, count] of Object.entries(counts)) {
    const set = data.sets[setId];
    if (!set) continue;
    for (const [pcStr, bonuses] of Object.entries(set.bonuses)) {
      const pc = Number(pcStr);
      if (count < pc) continue; // not enough pieces for this tier
      for (const b of bonuses) {
        if (!b.format) continue;
        const m = b.format.match(/(\d[\d,]*)\s*%%\s*(?:increased\s*)?(?:more\s*)?damage|damage[^.]*?by\s*(\d[\d,]*)\s*%%/i);
        if (!m) continue;
        const pct = Number((m[1] || m[2] || "").replace(/,/g, ""));
        if (!pct || pct > 100000) continue;
        out.push({
          id: `set_${setId}_${pc}`,
          label: `${set.name} (${pc})`,
          mult: 1 + pct / 100,
          source: "set",
          key: setId,
          note: b.format.replace(/%%/g, "%").replace(/<[^>]+>/g, "").slice(0, 60),
        });
        break; // one buff per piece-tier
      }
    }
  }
  return out;
}

/** Combined damage multiplier from toggled buffs. Gem buffs require the gem
 *  socketed; set buffs require enough pieces (both gated by availableBuffs). */
export function buffMultiplier(data: PlannerData, build: BuildState): number {
  const all = availableBuffs(data, build);
  let mult = 1;
  for (const id of build.buffs) {
    const b = all.find((x) => x.id === id);
    if (b) mult *= b.mult;
  }
  // activated Altar of Rites nodes that grant a clean damage %
  for (const nodeId of build.altar) {
    const node = data.altar?.[nodeId];
    if (!node?.desc) continue;
    const m = node.desc.match(/(\d[\d,]*)\s*%\s*(?:increased\s*)?(?:more\s*)?damage|damage[^.]*?by\s*(\d[\d,]*)\s*%/i);
    if (!m) continue;
    const pct = Number((m[1] || m[2] || "").replace(/,/g, ""));
    if (pct && pct <= 100000) mult *= 1 + pct / 100;
  }
  return mult;
}

/** Damage-% buffs from the powers slotted in Kanai's Cube (weapon/armor/jewelry)
 *  and from equipped legendary items' powers. Skill/element-specific, so they're
 *  opt-in toggles. */
export function kanaiDamageBuffs(data: PlannerData, build: BuildState): DamageBuff[] {
  const out: DamageBuff[] = [];
  const seen = new Set<string>();
  const addFromPower = (powerId: string | undefined, where: string) => {
    if (!powerId) return;
    const item = itemForPower(data, powerId);
    const p = item?.required?.custom;
    if (!p?.format || seen.has(powerId)) return;
    const m = p.format.match(/(\d[\d,]*)\s*%%\s*(?:increased|more|additional)?\s*damage|damage[^.]*?by\s*(\d[\d,]*)\s*%%/i);
    if (!m) return;
    const pct = Number((m[1] || m[2] || "").replace(/,/g, ""));
    if (!pct || pct < 5 || pct > 100000) return;
    seen.add(powerId);
    out.push({
      id: `kanai_${powerId}`,
      label: `${p.name} (${where})`,
      mult: 1 + pct / 100,
      source: "global",
      note: p.format.replace(/%%/g, "%").replace(/<[^>]+>/g, "").slice(0, 60),
    });
  };
  addFromPower(build.kanai.weapon, "Cube");
  addFromPower(build.kanai.armor, "Cube");
  addFromPower(build.kanai.jewelry, "Cube");
  return out;
}

/** Buffs available for a build: active set damage bonuses + gem buffs whose gem
 *  is socketed + equipped class-skill buffs + Kanai power buffs + global. */
export function availableBuffs(
  data: PlannerData,
  build: BuildState,
  skillNames?: Record<string, string>,
): DamageBuff[] {
  const equippedSkills = new Set(
    build.skills.active.map((a) => a?.skill).filter((x): x is string => !!x),
  );
  const base = DAMAGE_BUFFS; // now only global buffs
  const labelFor = (slug: string) => skillNames?.[slug] ?? slug;

  // passive damage buffs (canonical from CASC), gated by equipped passives
  const equippedPassives = new Set(build.skills.passives.filter(Boolean));
  const passiveBuffs: DamageBuff[] = [];
  for (const [slug, info] of Object.entries(data.passiveBuffs ?? {})) {
    if (!equippedPassives.has(slug)) continue;
    passiveBuffs.push({
      id: `passive_${slug}`,
      label: skillNames?.[slug] ?? slug,
      mult: 1 + info.pct / 100,
      source: "class",
      key: slug,
      note: info.note,
    });
  }

  return [
    ...setDamageBuffs(data, build),
    ...gemDamageBuffs(data, build),
    ...kanaiDamageBuffs(data, build),
    ...classSkillBuffs(data, equippedSkills, labelFor),
    ...passiveBuffs,
    ...base,
  ];
}

/* ------------------------------------------------------------------ */
/* Paragon (Phase 5)                                                  */
/* ------------------------------------------------------------------ */

export type ParagonCat = "core" | "offense" | "defense" | "utility";

export interface ParagonBonus {
  key: string;
  label: string;
  /** per-point value. */
  per: number;
  /** per-node point cap; 0 = uncapped (Core Primary Stat & Vitality). */
  cap: number;
  percent?: boolean;
  /** sprite-sheet icon index (paragon.webp, 24 icons of 24px). */
  icon: number;
  /** the Core "Maximum <Resource>" node — label resolved per class. */
  resourceNode?: boolean;
}

/** The canonical D3 Paragon board (4 nodes per category). In Core, Primary Stat
 *  and Vitality are UNCAPPED (cap 0) — you dump unlimited points there; Movement
 *  Speed and Max Resource cap at 50. Offense/Defense/Utility nodes all cap at 50.
 *  The "Maximum Resource" label is class-specific (see RESOURCE_NAME). */
export const PARAGON: Record<ParagonCat, ParagonBonus[]> = {
  core: [
    { key: "mainstat", label: "Primary Stat", per: 5, cap: 0, icon: 0 },
    { key: "vit", label: "Vitality", per: 5, cap: 0, icon: 1 },
    { key: "movement", label: "Movement Speed", per: 0.5, cap: 50, percent: true, icon: 2 },
    { key: "resource", label: "Maximum Resource", per: 0.5, cap: 50, resourceNode: true, icon: 3 },
  ],
  offense: [
    { key: "ias", label: "Attack Speed", per: 0.2, cap: 0, percent: true, icon: 4 },
    { key: "cdr", label: "Cooldown Reduction", per: 0.2, cap: 50, percent: true, icon: 5 },
    { key: "chc", label: "Critical Hit Chance", per: 0.1, cap: 50, percent: true, icon: 6 },
    { key: "chd", label: "Critical Hit Damage", per: 1, cap: 50, percent: true, icon: 7 },
  ],
  defense: [
    { key: "life", label: "Life", per: 0.5, cap: 0, percent: true, icon: 8 },
    { key: "armor", label: "Armor", per: 0.5, cap: 50, percent: true, icon: 9 },
    { key: "resall", label: "Resistance to All Elements", per: 1, cap: 50, icon: 10 },
    { key: "ldr", label: "Life per Second", per: 4.3, cap: 50, icon: 11 },
  ],
  utility: [
    { key: "area", label: "Area Damage", per: 1, cap: 0, percent: true, icon: 12 },
    { key: "rcr", label: "Resource Cost Reduction", per: 0.2, cap: 50, percent: true, icon: 13 },
    { key: "laek", label: "Life per Hit", per: 160.9, cap: 50, icon: 14 },
    { key: "gf", label: "Bonus to Gold/Globe Radius", per: 0.1, cap: 50, icon: 15 },
  ],
};

export const PARAGON_CATS: ParagonCat[] = ["core", "offense", "defense", "utility"];

/** Fresh paragon allocation: every CAPPED node starts maxed (in live D3 you
 *  always fill the 50-caps first), and the UNCAPPED nodes start at 0 since they
 *  have no natural maximum. */
export function defaultParagon(): ParagonState {
  const fill = (cat: ParagonCat): Record<string, number> =>
    Object.fromEntries(PARAGON[cat].filter((b) => b.cap > 0).map((b) => [b.key, b.cap]));
  return {
    level: 0,
    core: fill("core"),
    offense: fill("offense"),
    defense: fill("defense"),
    utility: fill("utility"),
  };
}

/** Per-class "Maximum <Resource>" name + per-point value for the Core resource
 *  node (e.g. Wizard = Maximum Arcane Power, +0.5/pt). */
export const RESOURCE_PARAGON: Record<string, { name: string; per: number }> = {
  wizard: { name: "Maximum Arcane Power", per: 0.5 },
  barbarian: { name: "Maximum Fury", per: 0.5 },
  crusader: { name: "Maximum Wrath", per: 0.5 },
  monk: { name: "Maximum Spirit", per: 1 },
  demonhunter: { name: "Maximum Hatred", per: 1 },
  witchdoctor: { name: "Maximum Mana", per: 5 },
  necromancer: { name: "Maximum Essence", per: 1 },
};

/* ------------------------------------------------------------------ */
/* Kanai's Cube (Phase 3)                                             */
/* ------------------------------------------------------------------ */

export type KanaiCat = "weapon" | "armor" | "jewelry";

const KANAI_WEAPON = new Set([
  "sword", "axe", "mace", "dagger", "spear", "fistweapon", "scythe", "flail", "wand",
  "mightyweapon", "ceremonialknife", "sword2h", "axe2h", "mace2h", "polearm", "staff",
  "daibo", "bow", "crossbow", "handcrossbow", "mightyweapon2h", "flail2h", "scythe2h",
  "shield", "crusadershield", "mojo", "source", "quiver", "phylactery",
]);
const KANAI_JEWELRY = new Set(["ring", "amulet"]);

/** Categorize an item's natural type into a Kanai cube category. */
export function kanaiCategory(type: string): KanaiCat {
  if (KANAI_WEAPON.has(type)) return "weapon";
  if (KANAI_JEWELRY.has(type)) return "jewelry";
  return "armor";
}

export interface KanaiPower {
  /** power id (item.required.custom.id). */
  powerId: string;
  /** the item the power comes from. */
  item: PlannerItem;
  name: string;
}

/** All extractable legendary powers in a cube category, filtered by class,
 *  sorted by name. One entry per unique power id (first item wins). */
export function kanaiPowers(data: PlannerData, cat: KanaiCat, klass?: string): KanaiPower[] {
  const seen = new Set<string>();
  const out: KanaiPower[] = [];
  for (const it of data.items) {
    const power = it.required?.custom;
    if (!power?.id) continue;
    if (kanaiCategory(it.type) !== cat) continue;
    if (seen.has(power.id)) continue;
    if (!okForClass(data, it, klass)) continue;
    seen.add(power.id);
    out.push({ powerId: power.id, item: it, name: power.name });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

/** Look up the item that defines a given Kanai power id. */
export function itemForPower(data: PlannerData, powerId: string): PlannerItem | null {
  return data.items.find((it) => it.required?.custom?.id === powerId) ?? null;
}

/** Render a legendary power's format string with a chosen value (or its max).
 *  Used for picker previews and the editor. */
export function powerDisplay(item: PlannerItem, value?: number): string | null {
  const p = item.required?.custom;
  if (!p?.format) return null;
  const fallback = value ?? p.max ?? (Array.isArray(p.value) ? p.value[0] : p.value);
  let first = true;
  return p.format.replace(/%%|%\.?\d*[dfsu]/g, (tok) => {
    if (tok === "%%") return "%";
    const v = first ? fallback : (p.max ?? p.min);
    first = false;
    return v == null ? "X" : String(v);
  });
}

/* ------------------------------------------------------------------ */
/* Ethereal weapons: +1 class weapon legendary power and +1 class passive */
/* ------------------------------------------------------------------ */

/** The class weapon powers an Ethereal can carry (its `required.custom.options`). */
export function etherealPowerOptions(data: PlannerData, item: PlannerItem): PlannerItem[] {
  if (item.quality !== "ethereal") return [];
  const ids = item.required?.custom?.options ?? [];
  const byId = new Map(data.items.map((i) => [i.id, i] as const));
  return ids.map((id) => byId.get(id)).filter((i): i is PlannerItem => !!i);
}

/** The weapon power chosen for this Ethereal, if any (and still a valid option). */
export function etherealPowerItem(data: PlannerData, item: PlannerItem, state: SlotState): PlannerItem | undefined {
  return state.etherealPower ? etherealPowerOptions(data, item).find((i) => i.id === state.etherealPower) : undefined;
}

/** Display name of the extra passive chosen for this Ethereal. */
export function etherealPassiveName(data: PlannerData, klass: string, state: SlotState): string | undefined {
  if (!state.etherealPassive) return undefined;
  return Object.values(data.passives?.[klass] ?? {}).find((p) => p.id === state.etherealPassive)?.name;
}

/* ------------------------------------------------------------------ */
/* Save / load + stat summary (Phase 6)                               */
/* ------------------------------------------------------------------ */

/** Serialize a build to a URL-safe base64 string (JSON -> base64url). */
export function encodeBuild(build: BuildState): string {
  const json = JSON.stringify(build);
  const b64 = typeof btoa === "function" ? btoa(unescape(encodeURIComponent(json))) : "";
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Parse a build string back into a BuildState (null on failure). */
export function decodeBuild(code: string): BuildState | null {
  try {
    const b64 = code.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(escape(atob(b64)));
    return normalizeBuild(JSON.parse(json));
  } catch {
    return null;
  }
}

/** Merge a parsed object onto a fresh build so missing fields (new phases)
 *  stay valid. Null when it isn't a build at all. */
export function normalizeBuild(raw: unknown): BuildState | null {
  const obj = raw as Partial<BuildState> | null;
  if (!obj || typeof obj !== "object" || typeof obj.klass !== "string") return null;
  const base = emptyBuild(obj.klass);
  return {
    ...base,
    ...obj,
    equipped: obj.equipped ?? {},
    kanai: { ...base.kanai, ...obj.kanai },
    skills: { ...base.skills, ...obj.skills },
    paragon: { ...base.paragon, ...obj.paragon },
    buffs: obj.buffs ?? [],
    altar: obj.altar ?? [],
  };
}

/* ------------------------------------------------------------------ */
/* Build files — download / upload a build as JSON (no backend)        */
/* ------------------------------------------------------------------ */

export const BUILD_FILE_FORMAT = "ruinwatch-build";
export const BUILD_FILE_VERSION = 1;
/** Uploads above this are rejected before parsing (a build is a few KB). */
export const BUILD_FILE_MAX_BYTES = 512 * 1024;

export interface BuildFile {
  format: typeof BUILD_FILE_FORMAT;
  version: number;
  name: string;
  exportedAt: string;
  build: BuildState;
}

export function toBuildFile(build: BuildState, name: string): BuildFile {
  return {
    format: BUILD_FILE_FORMAT,
    version: BUILD_FILE_VERSION,
    name,
    exportedAt: new Date().toISOString(),
    build,
  };
}

/** File name for a download: "ruinwatch-<class>-<name>.json". */
export function buildFileName(build: BuildState, name: string): string {
  const slug = `${build.klass}-${name}`.toLowerCase().normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
  return `ruinwatch-${slug || build.klass}.json`;
}

export type BuildFileError = "invalid-json" | "not-a-build" | "unknown-class";

/** Read an uploaded build JSON. Accepts our export file, a bare BuildState, or
 *  a reference build (the /public/planner/builds/*.json format). Gear whose item
 *  id no longer exists is dropped and counted in `skipped`. */
export function parseBuildFile(
  data: PlannerData,
  text: string,
  knownClasses: readonly string[],
): { build: BuildState; name: string | null; skipped: number } | { error: BuildFileError } {
  let raw: unknown;
  try { raw = JSON.parse(text); } catch { return { error: "invalid-json" }; }
  if (!raw || typeof raw !== "object") return { error: "not-a-build" };
  const obj = raw as Record<string, unknown>;

  let build: BuildState | null;
  let name: string | null = typeof obj.name === "string" ? obj.name : null;
  if (obj.format === BUILD_FILE_FORMAT) {
    build = normalizeBuild(obj.build);
  } else if (isPresetBuild(obj)) {
    build = buildFromPreset(data, obj as unknown as PresetBuild);
  } else {
    build = normalizeBuild(obj);
    name = null;
  }
  if (!build) return { error: "not-a-build" };
  if (!knownClasses.includes(build.klass)) return { error: "unknown-class" };

  const byId = new Set(data.items.map((it) => it.id));
  const slots = new Set<string>(PAPERDOLL_SLOTS);
  let skipped = 0;
  const equipped: BuildState["equipped"] = {};
  for (const [slot, ss] of Object.entries(build.equipped ?? {}) as [SlotId, SlotState][]) {
    if (!slots.has(slot) || !ss || !byId.has(ss.itemId)) { skipped++; continue; }
    equipped[slot] = { ...ss, affixes: ss.affixes ?? {}, gems: Array.isArray(ss.gems) ? ss.gems : [] };
  }
  build.equipped = equipped;
  if (build.gender !== "female") build.gender = "male";
  return { build, name: name?.slice(0, 120) ?? null, skipped };
}

/** A reference build lists slots as { itemId, affixes: string[] } (no tier). */
function isPresetBuild(obj: Record<string, unknown>): boolean {
  if (typeof obj.klass !== "string" || !obj.equipped || typeof obj.equipped !== "object") return false;
  return Object.values(obj.equipped as Record<string, unknown>).some(
    (s) => !!s && typeof s === "object" && !("tier" in s) && "itemId" in s,
  );
}

/** Sum a stat value into an accumulator (handles percent vs flat the same). */
type StatTotals = Record<string, number>;

/** Aggregate all stat contributions from gear affixes, gems and paragon into a
 *  flat totals map (statId -> summed value). Pure summation — NOT a combat sim
 *  (no set/skill multipliers). Good enough for a character-sheet style summary. */
export function aggregateStats(data: PlannerData, build: BuildState): StatTotals {
  const totals: StatTotals = {};
  const add = (stat: string, v: number) => {
    if (!stat || !Number.isFinite(v)) return;
    totals[stat] = (totals[stat] ?? 0) + v;
  };

  // gear affixes + gems
  for (const slot of PAPERDOLL_SLOTS) {
    const ss = build.equipped[slot];
    if (!ss) continue;
    // "augment" (Caldesann's) contributes the class primary attribute.
    for (const [stat, v] of Object.entries(ss.affixes))
      add(stat === "augment" ? classMainStat(build.klass) : stat, v);
    const ctx: "weapon" | "head" | "other" =
      slot === "mainhand" || slot === "offhand" ? "weapon" : slot === "head" ? "head" : "other";
    for (const g of ss.gems) {
      if (g.legendary) continue; // legendary gem buffs are conditional — left to the sim phase
      const color = data.gems.normal[g.gem];
      const eff = color ? normalGemEffect(color, ctx, g.rank) : null;
      if (eff) add(eff.stat, eff.value);
    }
  }

  // paragon
  for (const cat of PARAGON_CATS) {
    for (const b of PARAGON[cat]) {
      const pts = build.paragon[cat][b.key] ?? 0;
      if (pts && b.per) add(b.key === "mainstat" ? "mainstat" : b.key, pts * b.per);
    }
  }

  return totals;
}

/** Pick out the headline stats for the summary panel, in display order. */
export const SUMMARY_STATS: Array<{ key: string; label: string; percent?: boolean }> = [
  { key: "str", label: "Strength" },
  { key: "dex", label: "Dexterity" },
  { key: "int", label: "Intelligence" },
  { key: "mainstat", label: "Primary (Paragon)" },
  { key: "vit", label: "Vitality" },
  { key: "chc", label: "Crit Chance", percent: true },
  { key: "chd", label: "Crit Damage", percent: true },
  { key: "ias", label: "Attack Speed", percent: true },
  { key: "cdr", label: "Cooldown Reduction", percent: true },
  { key: "area", label: "Area Damage", percent: true },
  { key: "rcr", label: "Resource Cost Reduction", percent: true },
  { key: "armor", label: "Armor" },
  { key: "resall", label: "All Resistance" },
  { key: "life", label: "Life %", percent: true },
];

/** Default a freshly-equipped item: max rolls on every slot affix + power. */
export function defaultSlotState(
  data: PlannerData,
  slot: SlotId,
  item: PlannerItem,
  klass: string,
): SlotState {
  // Default every freshly-equipped item to Primal (the best tier = max rolls).
  const tier: Tier = "primal";
  const affixes: Record<string, number> = {};
  const templates = itemAffixTemplates(data, slot, item);
  for (const key of item.preset ?? []) {
    if (key === "sockets") continue;
    const groupKeys = data.statGroups[key];
    // a group preset KEY (mainstat) defaults to the class's primary attribute
    const targetKey = groupKeys
      ? (groupKeys.includes(classMainStat(klass)) ? classMainStat(klass) : groupKeys[0])
      : key;
    // resolve the template: direct, or via the group this key belongs to
    // (e.g. "wpnhol" → the "weapon" template on the item's type).
    let tmpl = templates[key] ? key : null;
    if (!tmpl) {
      const owner = Object.entries(data.statGroups).find(([gk, m]) => m.includes(key) && templates[gk]);
      tmpl = owner ? owner[0] : null;
    }
    const range = tmpl ? affixRange(data, slot, tmpl, tier, item) : null;
    if (range) affixes[targetKey] = range.max;
  }
  const power = item.required?.custom;
  const powerValue = power?.max ?? (Array.isArray(power?.value) ? power!.value[0] : power?.value);
  return { itemId: item.id, tier, affixes, powerValue, gems: [] };
}

/* ------------------------------------------------------------------ */
/* Preset (reference) builds — readable JSON imported from guides      */
/* ------------------------------------------------------------------ */

/** A gem entry in a preset build. `rank` is optional — normal gems default to
 *  the top tier, legendary gems to their max level. */
interface PresetGem { gem: string; legendary?: boolean; rank?: number }
/** `affixes` are extra rolled stat keys (beyond the item's fixed preset) to add
 *  at their max roll — e.g. ["resall","skill_barbarian"] for +All Res + skill
 *  damage. `augment` is a flat mainstat add (Caldesann's Despair). */
interface PresetSlot {
  itemId: string; gems?: PresetGem[]; affixes?: string[]; augment?: number;
  /** Ethereal only: chosen class weapon power (item id) and extra class passive (slug). */
  etherealPower?: string; etherealPassive?: string;
}

/** The hand-authored, human-readable shape of a reference build (one JSON file
 *  per guide under /public/planner/builds/). Items are referenced by id, gems
 *  by their planner key, skills by slug + rune letter. */
export interface PresetBuild {
  id: string;
  name: string;
  klass: string;
  category?: string;
  tier?: string;
  gender?: "male" | "female";
  source?: string;
  season?: string;
  tagline?: string;
  equipped: Partial<Record<SlotId, PresetSlot>>;
  kanai?: KanaiState;
  skills?: SkillState;
  paragon?: Partial<ParagonState>;
  /** Paragon level for the build (default 800). */
  paragonLevel?: number;
  /** Active Altar-of-Rites node ids. Omit → every node is active (the seasonal
   *  default for a finished build); pass [] to start with the altar empty. */
  altar?: string[];
}

export interface PresetBuildMeta {
  id: string;
  name: string;
  klass: string;
  /** build category (which tier list it belongs to). Default "solo-push". */
  category?: string;
  /** rank within the category's tier list: "S" | "A" | "B" | "C" | "D" | "F". */
  tier?: string;
  tagline?: string;
  source?: string;
}

export interface BuildTier { key: string; label: string; note: string }

/** Solo-tierlist tiers in display order, with their subtitle. */
export const BUILD_TIERS: BuildTier[] = [
  { key: "S", label: "S Tier", note: "Best Solo GR builds" },
  { key: "A", label: "A Tier", note: "Up to 5 GRs behind S" },
  { key: "B", label: "B Tier", note: "Up to 10 GRs behind S" },
  { key: "C", label: "C Tier", note: "Up to 15 GRs behind S" },
  { key: "D", label: "D Tier", note: "Up to 20 GRs behind S" },
  { key: "F", label: "F Tier", note: "25+ GRs behind S" },
];

/** Speed-farm builds are grouped by what they farm, not ranked. */
export const SPEED_TIERS: BuildTier[] = [
  { key: "T16", label: "T16 Farm", note: "Torment 16 rifts & bounties" },
  { key: "GR", label: "GR Speeds", note: "Fast Greater Rifts for XP & gems" },
];

/** Build categories. `ready` flags the ones we've actually populated; `tiers`
 *  are the groups shown inside the category (default: the S→F tier list).
 *  Keep in sync with CATEGORY_ORDER / TIER_ORDER in scripts/lib/build-index.mjs. */
export const BUILD_CATEGORIES: Array<{ key: string; label: string; ready: boolean; tiers: BuildTier[] }> = [
  { key: "solo-push", label: "Solo Pushing", ready: true, tiers: BUILD_TIERS },
  { key: "support", label: "Support", ready: true, tiers: BUILD_TIERS },
  { key: "speed", label: "Speed Farm", ready: true, tiers: SPEED_TIERS },
];

/** The tier groups of a category (S→F for unknown ones). */
export function tiersForCategory(category: string): BuildTier[] {
  return BUILD_CATEGORIES.find((c) => c.key === category)?.tiers ?? BUILD_TIERS;
}

/** Expand a readable PresetBuild into a full BuildState the planner can render.
 *  Unknown item ids are skipped (logged) so a stale reference never crashes. */
export function buildFromPreset(data: PlannerData, preset: PresetBuild): BuildState {
  const byId = new Map(data.items.map((it) => [it.id, it] as const));
  const build = emptyBuild(preset.klass);
  build.gender = preset.gender ?? "male";

  const validSlots = new Set<string>(PAPERDOLL_SLOTS);
  for (const [slot, ps] of Object.entries(preset.equipped) as [SlotId, PresetSlot][]) {
    if (!validSlots.has(slot)) { console.warn(`preset ${preset.id}: unknown slot "${slot}" (use head/torso/leftfinger/…)`); continue; }
    const item = byId.get(ps.itemId);
    if (!item) { console.warn(`preset ${preset.id}: item ${ps.itemId} not found for ${slot}`); continue; }
    const ss = defaultSlotState(data, slot, item, preset.klass);
    ss.gems = (ps.gems ?? []).map((g) => {
      const legendary = g.legendary ?? false;
      const rank = g.rank ?? (legendary
        ? (data.gems.legendary[g.gem]?.maxlevel ?? 25)
        : GEM_TIERS.length - 1);
      return { gem: g.gem, legendary, rank };
    });
    // apply the build's explicitly-rolled affixes (max roll for the tier)
    for (const key of ps.affixes ?? []) {
      const tmpl = itemAffixTemplates(data, slot, item)[key]
        ? key
        : Object.entries(data.statGroups).find(([gk, m]) => m.includes(key) && itemAffixTemplates(data, slot, item)[gk])?.[0];
      const range = tmpl ? affixRange(data, slot, tmpl, ss.tier, item) : null;
      if (range) ss.affixes[key] = range.max;
    }
    if (ps.augment) ss.affixes.augment = ps.augment;
    if (ps.etherealPower) ss.etherealPower = ps.etherealPower;
    if (ps.etherealPassive) ss.etherealPassive = ps.etherealPassive;
    build.equipped[slot] = ss;
  }

  if (preset.kanai) build.kanai = { ...preset.kanai };
  if (preset.skills) build.skills = { active: [...preset.skills.active], passives: [...preset.skills.passives] };
  if (preset.paragon) build.paragon = { ...build.paragon, ...preset.paragon };
  // a finished build is at endgame paragon (default 800) with the cap nodes full.
  build.paragon.level = preset.paragonLevel ?? 800;
  // Altar: a guide build runs the full altar by default; the player can toggle
  // nodes off. Pass an explicit list (incl. []) to override.
  build.altar = preset.altar ?? Object.keys(data.altar ?? {});
  return build;
}
