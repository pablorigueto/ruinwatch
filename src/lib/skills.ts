/**
 * Types and runtime loader for the Diablo III class skills.
 *
 * Data lives at /public/skills/skills.json with icons under
 * /public/skills/<class>/<skill>.png. The text is generated from the game files
 * by casc-tools/build-skills-casc.mjs. The JSON is fetched
 * once at runtime via TanStack Query and cached for the session.
 *
 * Skill text (names, descriptions, runes) is intentionally English: D3 skill
 * names are the universal reference players use, and the game files ship
 * them that way. Only the surrounding UI chrome is localized via i18n.
 */
import { useQuery } from "@tanstack/react-query";
import type { ClassSlug } from "./classes";

/** Runestone color slot a–e, mapped to the five D3 rune-stone tints. */
export type RuneColor = "indigo" | "crimson" | "obsidian" | "golden" | "alabaster";

/** A run of description text; `hl` marks the values D3 paints green/gold. */
export interface TextRun {
  text: string;
  hl: boolean;
}

/** A description is a list of paragraphs, each a list of text runs. */
export type Paragraphs = TextRun[][];

export interface Rune {
  letter: string;
  color: RuneColor;
  name: string;
  descRuns: Paragraphs;
}

export interface ActiveSkill {
  name: string;
  slug: string;
  /** Character level the skill unlocks at. */
  level: number;
  /** "Primary", "Secondary", "Defensive", … */
  category: string;
  /** Resource lines (Generate / Cost / Cooldown / Charges), one paragraph each. */
  cost: Paragraphs;
  descRuns: Paragraphs;
  /** Path under /public, e.g. "/skills/barbarian/bash.png". */
  icon?: string;
  runes: Rune[];
}

export interface PassiveSkill {
  name: string;
  slug: string;
  level: number;
  descRuns: Paragraphs;
  icon?: string;
}

export interface ClassSkills {
  active: ActiveSkill[];
  passive: PassiveSkill[];
}

export interface SkillData {
  scrapedFrom: string;
  classes: Record<string, ClassSkills>;
}

const SKILLS_URL = "/skills/skills.json";

/** Map a rune color slot to an HSL token for badge/tinting. */
export const RUNE_HSL: Record<RuneColor, string> = {
  indigo: "245 60% 62%",
  crimson: "0 70% 55%",
  obsidian: "220 8% 45%",
  golden: "45 85% 58%",
  alabaster: "40 25% 82%",
};

/** Column index (0–4) of a rune in the runestone sprite sheet, by slot letter.
 *  The sheet (public/images/RunesSkill.png) holds the five stones in a–e order. */
export function runeIndex(letter: string): number {
  return Math.max(0, "abcde".indexOf(letter.toLowerCase()));
}

async function fetchSkills(): Promise<SkillData> {
  const res = await fetch(SKILLS_URL, { cache: "no-cache" });
  if (!res.ok) throw new Error(`skills.json fetch failed: ${res.status}`);
  return (await res.json()) as SkillData;
}

export function useSkills() {
  return useQuery({
    queryKey: ["d3-skills"],
    queryFn: fetchSkills,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

/** Pull one class's skills out of the dataset (or null while loading/missing). */
export function classSkills(data: SkillData | undefined, slug: ClassSlug): ClassSkills | null {
  return data?.classes?.[slug] ?? null;
}

/** Flatten paragraphs into plain text (for alt/title attrs). */
export function runsText(paras: Paragraphs): string {
  return paras
    .map((p) => p.map((r) => r.text).join(""))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

/** True when the skill has a cooldown (a burst, not sustained damage). */
export function hasCooldown(skill: ActiveSkill): boolean {
  return /Cooldown:/.test(runsText(skill.cost));
}

/** True when the skill deals damage with the chosen rune: either the skill itself does, or
 *  only that rune adds damage (e.g. Wrath of the Berserker only hits with Arreat's Wail). */
export function dealsDamage(skill: ActiveSkill, rune: string | null): boolean {
  if (/weapon damage/i.test(runsText(skill.descRuns))) return true;
  const r = skill.runes.find((x) => x.letter === rune);
  return !!r && /weapon damage/i.test(runsText(r.descRuns));
}
