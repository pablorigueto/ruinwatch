/**
 * Static per-route SEO metadata, shared by the prerender step (scripts/
 * prerender.mjs) so social crawlers and non-JS bots get the correct
 * title/description/OG for each shareable page — not the homepage fallback.
 *
 * Keep these in sync with each page's <Seo> component (the runtime source of
 * truth for browsers; this table is the build-time copy for crawlers).
 */
import { SITE_NAME } from "./seo";

export interface RouteMeta {
  /** Route path, e.g. "/builds". "/" is the home (handled by index.html). */
  path: string;
  /** Title WITHOUT brand suffix (the suffix "| RuinWatch" is appended). */
  title: string;
  description: string;
  /** og:type — "website" (default) or "article". */
  type?: "website" | "article";
}

/** Compose the full <title> exactly like lib/seo.pageTitle. */
export function fullTitle(title: string): string {
  return `${title} | ${SITE_NAME}`;
}

/** The shareable, navigationally-important routes worth prerendering. */
export const ROUTE_META: RouteMeta[] = [
  {
    path: "/builds",
    title: "Diablo 3 Build Tier List — Rites of Sanctuary",
    description:
      "The complete RuinWatch Diablo 3 build tier list for the Rites of Sanctuary patch, ranked S through F across Solo Pushing and Support, plus Speed Farm templates for T16 and GR speeds. Every build uses the Altar of Rites and Ethereal Weapons and opens directly in our build planner. Free private server, permanent Non-Season.",
  },
  {
    path: "/planner",
    title: "Build Planner",
    description:
      "Free Diablo 3 build planner for RuinWatch (Rites of Sanctuary patch, Altar of Rites + Ethereal Weapons). Assemble a character slot by slot: gear, Kanai's Cube, skills, runes, paragon and the Altar of Rites, then share your build.",
  },
  {
    path: "/cosmetics",
    title: "All Cosmetics Free — Wings, Pets, Pennants & Portraits",
    description:
      "On RuinWatch every Diablo 3 cosmetic is free to unlock — all wings, pets, pennants, portrait frames and transmogs from past seasons. Missed them on the official servers? Earn them all here, in-game, at no cost. A free, canonical Diablo 3 private server on the Rites of Sanctuary patch with the full Altar of Rites and Ethereal Weapons.",
  },
  {
    path: "/classes",
    title: "Diablo 3 Classes",
    description:
      "All seven Diablo 3 classes on RuinWatch — Barbarian, Crusader, Demon Hunter, Monk, Necromancer, Witch Doctor and Wizard. Resources, signature skills and the best builds for the Rites of Sanctuary patch with the Altar of Rites and Ethereal Weapons.",
  },
  {
    path: "/items",
    title: "Diablo 3 Item Codex",
    description:
      "Browse the full Diablo 3 item codex on RuinWatch — every legendary, set piece and Ethereal Weapon available on our Rites of Sanctuary private server, with affixes and legendary powers. Search by name, slot or rarity.",
  },
  {
    path: "/kadala",
    title: "Kadala Blood Shard Gamble Odds",
    description:
      "Kadala Blood Shard gambling odds for every slot and class on RuinWatch (Diablo 3, Rites of Sanctuary patch). See exact drop chances, costs and expected shards per legendary — including the Altar of Rites Pattern seal that doubles your gamble odds. Plan your gambles efficiently.",
  },
  {
    path: "/myriam",
    title: "Myriam the Mystic — Enchant, Transmogrify & Dye",
    description:
      "Myriam Jahzia, the Mystic, on RuinWatch (Diablo 3). Reroll a single property with Enchant, change any piece's look with Transmogrify, and recolor your gear with Dye. Full walkthrough with in-game screenshots.",
  },
  {
    path: "/shen",
    title: "Covetous Shen the Jeweler — Combine, Forge & Remove Gems",
    description:
      "Covetous Shen, the Jeweler, on RuinWatch (Diablo 3). Rank up gems, forge Hellfire amulets and rings, and remove socketed gems without losing either piece. Full guide with in-game screenshots.",
  },
  // class detail pages
  { path: "/classes/barbarian", title: "Barbarian — Class Guide & Builds", description: "Barbarian on RuinWatch (Diablo 3, Rites of Sanctuary patch). Explore the best Barbarian builds with the Altar of Rites and Ethereal Weapons and open them in our planner." },
  { path: "/classes/crusader", title: "Crusader — Class Guide & Builds", description: "Crusader on RuinWatch (Diablo 3, Rites of Sanctuary patch). Explore the best Crusader builds with the Altar of Rites and Ethereal Weapons and open them in our planner." },
  { path: "/classes/demonhunter", title: "Demon Hunter — Class Guide & Builds", description: "Demon Hunter on RuinWatch (Diablo 3, Rites of Sanctuary patch). Explore the best Demon Hunter builds with the Altar of Rites and Ethereal Weapons and open them in our planner." },
  { path: "/classes/monk", title: "Monk — Class Guide & Builds", description: "Monk on RuinWatch (Diablo 3, Rites of Sanctuary patch). Explore the best Monk builds with the Altar of Rites and Ethereal Weapons and open them in our planner." },
  { path: "/classes/necromancer", title: "Necromancer — Class Guide & Builds", description: "Necromancer on RuinWatch (Diablo 3, Rites of Sanctuary patch). Explore the best Necromancer builds with the Altar of Rites and Ethereal Weapons and open them in our planner." },
  { path: "/classes/witchdoctor", title: "Witch Doctor — Class Guide & Builds", description: "Witch Doctor on RuinWatch (Diablo 3, Rites of Sanctuary patch). Explore the best Witch Doctor builds with the Altar of Rites and Ethereal Weapons and open them in our planner." },
  { path: "/classes/wizard", title: "Wizard — Class Guide & Builds", description: "Wizard on RuinWatch (Diablo 3, Rites of Sanctuary patch). Explore the best Wizard builds with the Altar of Rites and Ethereal Weapons and open them in our planner." },
];
