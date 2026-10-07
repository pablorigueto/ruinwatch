/**
 * altar.ts — what each Altar of Rites seal asks you to sacrifice.
 *
 * The cost depends on HOW MANY seals you have already opened, not on which
 * seal: your 1st minor seal always costs 10 Reusable Parts, the 2nd a Flawless
 * Diamond + Arcane Dust + Reusable Parts, … The 3 potion seals cost Primordial
 * Ashes in the order you open them; the Final Seal is free.
 *
 * Sources: the step table is the one the RuinWatch server charges
 * (AltarStepCosts.cs — official CSV, corrected in-game, e.g. step 3 = 20 Death's
 * Breath). The CASC has no step table; item names and the generic requirement
 * labels ("Any Class Set Helm", "P75_DarkAlchemyMinorNodeDisplay_NNN") are the
 * CASC Items.stl strings.
 */
import type { AltarNode } from "@/lib/planner";

const ICON = (file: string) => `/items/icons/${file}_demonhunter_male.png`;

export interface AltarItem { name: string; icon: string }

/** Altar materials/items, named as in the CASC (Items.stl). */
export const ALTAR_ITEMS = {
  parts: { name: "Reusable Parts", icon: ICON("crafting_assortedparts_01") },
  dust: { name: "Arcane Dust", icon: ICON("crafting_magic_01") },
  breath: { name: "Death's Breath", icon: ICON("crafting_looted_reagent_01") },
  soul: { name: "Forgotten Soul", icon: ICON("crafting_legendary_01") },
  ashes: { name: "Primordial Ashes", icon: ICON("crafting_legendary_primal_01") },
  keystone: { name: "Greater Rift Keystone", icon: ICON("greaterlootrunkey") },
  shard: { name: "Blood Shard", icon: ICON("horadricrelic") },
  regret: { name: "Leoric's Regret", icon: ICON("demonorgan_skeletonking_x1") },
  putrid: { name: "Vial of Putridness", icon: ICON("demonorgan_ghom_x1") },
  idol: { name: "Idol of Terror", icon: ICON("demonorgan_siegebreaker_x1") },
  fright: { name: "Heart of Fright", icon: ICON("demonorgan_diablo_x1") },
  khanduran: { name: "Khanduran Rune", icon: ICON("p2_actbountyreagent_01") },
  nightshade: { name: "Caldeum Nightshade", icon: ICON("p2_actbountyreagent_02") },
  tapestry: { name: "Arreat War Tapestry", icon: ICON("p2_actbountyreagent_03") },
  flesh: { name: "Corrupted Angel Flesh", icon: ICON("p2_actbountyreagent_04") },
  water: { name: "Westmarch Holy Water", icon: ICON("p2_actbountyreagent_05") },
  diamond: { name: "Flawless Diamond or greater", icon: ICON("p75_darkalchemyminornodedisplay_002") },
  ruby: { name: "Flawless Royal Ruby", icon: ICON("x1_ruby_10") },
  emerald: { name: "Flawless Royal Emerald", icon: ICON("x1_emerald_10") },
  setHelm: { name: "Any Class Set Helm", icon: ICON("p75_darkalchemyminornodedisplay_004") },
  reapers: { name: "Reaper's Wraps", icon: ICON("unique_bracer_103_x1") },
  rorg: { name: "Ring of Royal Grandeur", icon: ICON("unique_ring_107_x1") },
  ramaladni: { name: "Ramaladni's Gift", icon: ICON("consumable_add_sockets_1") },
  scream: { name: "Petrified Scream", icon: ICON("swarmriftkey") },
  crCache: { name: "Challenge Rift Cache", icon: ICON("challengeriftrewardbag") },
  hellfire: { name: "Ancient Hellfire Amulet", icon: ICON("p75_darkalchemyminornodedisplay_018") },
  questions: { name: "Never Ending Questions", icon: ICON("p4_setdung_loreitem_3") },
  puzzle: { name: "Ancient Puzzle Ring", icon: ICON("p75_darkalchemyminornodedisplay_020") },
  whisper: { name: "Whisper of Atonement (Rank 125)", icon: ICON("p75_darkalchemyminornodedisplay_023") },
  augmented: { name: "Any Augmented Weapon", icon: ICON("p75_darkalchemyminornodedisplay_024") },
  herding: { name: "Staff of Herding", icon: ICON("staffofcow") },
} satisfies Record<string, AltarItem>;

export type AltarItemKey = keyof typeof ALTAR_ITEMS;
/** The 5 act bounty materials (a "N of each" cost expands to these). */
export const BOUNTY_MATS: AltarItemKey[] = ["khanduran", "nightshade", "tapestry", "flesh", "water"];

export interface AltarCost {
  items: Array<{ item: AltarItemKey; qty: number }>;
  /** N of EACH act bounty material. */
  bountyEach?: number;
  /** Greater Rift tier you must have cleared first (Blood Shard steps). */
  requiresGR?: number;
}

const c = (items: Array<[AltarItemKey, number]>, extra: Omit<AltarCost, "items"> = {}): AltarCost =>
  ({ items: items.map(([item, qty]) => ({ item, qty })), ...extra });

/** Cost of the Nth minor seal opened (index 0 = 1st sacrifice). */
export const MINOR_SEAL_COSTS: AltarCost[] = [
  c([["parts", 10]]),
  c([["diamond", 1], ["dust", 15], ["parts", 20]]),
  c([["breath", 20], ["keystone", 1]]),
  c([["setHelm", 1]]),
  c([["soul", 20]], { bountyEach: 10 }),
  c([["regret", 1], ["putrid", 1], ["idol", 1], ["fright", 1]]),
  c([["reapers", 1]]),
  c([["soul", 30]]),
  c([["shard", 1100]], { requiresGR: 60 }),
  c([["ruby", 1], ["breath", 20], ["rorg", 1]]),
  c([["emerald", 1]], { bountyEach: 30 }),
  c([["keystone", 20], ["ramaladni", 1]]),
  c([["shard", 1300]], { requiresGR: 80 }),
  c([["scream", 1]]),
  c([["crCache", 1]]),
  c([["soul", 250]]),
  c([["shard", 1400]], { requiresGR: 90 }),
  c([["hellfire", 1]]),
  c([["questions", 4]]),
  c([["puzzle", 1]], { bountyEach: 50 }),
  c([["breath", 500], ["soul", 300]]),
  c([["shard", 1500]], { requiresGR: 100 }),
  c([["whisper", 1]]),
  c([["augmented", 1]]),
  c([["herding", 1]]),
  c([["shard", 1600]], { requiresGR: 110 }),
];

/** Cost of the Nth potion seal opened. */
export const POTION_SEAL_COSTS: AltarCost[] = [c([["ashes", 55]]), c([["ashes", 110]]), c([["ashes", 165]])];

export type SealKind = "minor" | "potion" | "final";
export const sealKind = (node: AltarNode): SealKind => (node.final ? "final" : node.major ? "potion" : "minor");

export interface SealCost { kind: SealKind; step: number; cost: AltarCost | null }

/** The sacrifice of every seal: active seals by the order they were opened
 *  (`active` keeps click order), inactive ones by what they would cost next. */
export function sealCosts(nodes: Array<[string, AltarNode]>, active: string[]): Map<string, SealCost> {
  const kindOf = new Map(nodes.map(([id, n]) => [id, sealKind(n)]));
  const table = { minor: MINOR_SEAL_COSTS, potion: POTION_SEAL_COSTS, final: [] as AltarCost[] };
  const opened = { minor: 0, potion: 0, final: 0 };
  const out = new Map<string, SealCost>();
  for (const id of active) {
    const kind = kindOf.get(id);
    if (!kind) continue;
    const step = ++opened[kind];
    out.set(id, { kind, step, cost: table[kind][step - 1] ?? null });
  }
  for (const [id] of nodes) {
    if (out.has(id)) continue;
    const kind = kindOf.get(id)!;
    const step = opened[kind] + 1;
    out.set(id, { kind, step, cost: table[kind][step - 1] ?? null });
  }
  return out;
}

/** Sum the sacrifices of the active seals into one shopping list. */
export function altarTotals(costs: Map<string, SealCost>, active: string[]): Array<{ item: AltarItemKey; qty: number }> {
  const sum = new Map<AltarItemKey, number>();
  const add = (k: AltarItemKey, n: number) => sum.set(k, (sum.get(k) ?? 0) + n);
  for (const id of active) {
    const cost = costs.get(id)?.cost;
    if (!cost) continue;
    for (const { item, qty } of cost.items) add(item, qty);
    if (cost.bountyEach) for (const k of BOUNTY_MATS) add(k, cost.bountyEach);
  }
  const order = Object.keys(ALTAR_ITEMS) as AltarItemKey[];
  return order.filter((k) => sum.has(k)).map((item) => ({ item, qty: sum.get(item)! }));
}
