/**
 * Configuration for the seven Diablo III classes.
 *
 * The fields here are universal D3 mechanics (resource name, primary weapon
 * types, role) so they're hard-coded rather than translated. The flavor copy
 * (tagline, lore paragraph) is localized via i18n under `classes.<slug>.*`.
 *
 * Portraits live at /public/cosmetics/<slug>.png. Two are not yet uploaded
 * (demonhunter, witchdoctor) — `portraitReady: false` marks them so the UI
 * can show a tasteful placeholder until the file lands.
 */
export type ClassSlug =
  | "barbarian"
  | "crusader"
  | "demonhunter"
  | "monk"
  | "necromancer"
  | "witchdoctor"
  | "wizard";

export interface ClassInfo {
  slug: ClassSlug;
  /** Display name — kept here too so non-localized code (cards, breadcrumbs)
   *  has a sane fallback even before i18n loads. */
  name: string;
  /** Combat resource the class spends to cast skills. */
  resource: string;
  /** One-word role tag for the index card. */
  role: string;
  /** Weapon-category slugs the class typically wields, matching the codex
   *  category slugs from items.json (used for future build pages). */
  weapons: string[];
  /** Two or three iconic skills players associate with the class. */
  signature: string[];
  /** HSL color string used for the page accent (border, glow, divider). */
  accent: string;
  /** False when the portrait file isn't uploaded yet. */
  portraitReady: boolean;
}

/** The seven classes, in their canonical D3 lineup order. */
export const CLASSES: ClassInfo[] = [
  {
    slug: "barbarian",
    name: "Barbarian",
    resource: "Fury",
    role: "Melee Bruiser",
    weapons: ["mighty-weapon-1h", "mighty-weapon-2h", "axe-2h", "mace-2h", "sword-2h", "polearm"],
    signature: ["Whirlwind", "Hammer of the Ancients", "Earthquake"],
    accent: "12 75% 50%",
    portraitReady: true,
  },
  {
    slug: "crusader",
    name: "Crusader",
    resource: "Wrath",
    role: "Holy Vanguard",
    weapons: ["flail-1h", "flail-2h", "crusader-shield", "sword-2h", "mace-2h"],
    signature: ["Blessed Hammer", "Falling Sword", "Heaven's Fury"],
    accent: "48 90% 55%",
    portraitReady: true,
  },
  {
    slug: "demonhunter",
    name: "Demon Hunter",
    resource: "Hatred & Discipline",
    role: "Ranged Hunter",
    weapons: ["bow", "crossbow", "hand-crossbow", "quiver", "cloak"],
    signature: ["Multishot", "Strafe", "Impale"],
    accent: "0 70% 50%",
    portraitReady: true,
  },
  {
    slug: "monk",
    name: "Monk",
    resource: "Spirit",
    role: "Martial Combatant",
    weapons: ["fist-weapon", "daibo", "spirit-stone"],
    signature: ["Tempest Rush", "Wave of Light", "Seven-Sided Strike"],
    accent: "200 85% 60%",
    portraitReady: true,
  },
  {
    slug: "necromancer",
    name: "Necromancer",
    resource: "Essence",
    role: "Bone & Death Caster",
    weapons: ["scythe-1h", "scythe-2h", "phylactery", "sword-1h"],
    signature: ["Corpse Lance", "Bone Spear", "Skeletal Mage"],
    accent: "150 50% 50%",
    portraitReady: true,
  },
  {
    slug: "witchdoctor",
    name: "Witch Doctor",
    resource: "Mana",
    role: "Pet & Poison Caster",
    weapons: ["ceremonial-knife", "mojo", "voodoo-mask", "dagger"],
    signature: ["Firebats", "Spirit Barrage", "Gargantuan"],
    accent: "280 50% 55%",
    portraitReady: true,
  },
  {
    slug: "wizard",
    name: "Wizard",
    resource: "Arcane Power",
    role: "Arcane Sorcerer",
    weapons: ["wand", "orb", "wizard-hat"],
    signature: ["Meteor", "Arcane Orb", "Archon"],
    accent: "220 90% 65%",
    portraitReady: true,
  },
];

export const CLASSES_BY_SLUG: Record<ClassSlug, ClassInfo> = Object.fromEntries(
  CLASSES.map((c) => [c.slug, c]),
) as Record<ClassSlug, ClassInfo>;

/** Path to a class portrait (or null if not uploaded yet). */
export function classPortrait(info: ClassInfo): string | null {
  return info.portraitReady ? `/cosmetics/${info.slug}.png` : null;
}
