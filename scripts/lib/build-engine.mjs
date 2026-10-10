/**
 * build-engine.mjs — turns a compact build spec (item / power / skill names) into the
 * preset-build JSON the planner loads, and writes it + the build index.
 * Shared by the scripts/gen-*-builds.mjs generators that use the spec format.
 *
 * Names are resolved against the CASC-generated planner data, always picking the
 * current version of an item or power (not legacy, highest Pnn_ prefix).
 */
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { sortIndex } from "./build-index.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const P = (...x) => join(ROOT, ...x);

const PARAGON = {
  core: { movement: 50, resource: 50, mainstat: 50, vit: 50 },
  offense: { cdr: 50, chc: 50, chd: 50, ias: 50 },
  defense: { armor: 50, resall: 50, ldr: 50, life: 50 },
  utility: { rcr: 50, laek: 50, gf: 50, area: 50 },
};

/** Default rolled affixes per slot (the planner fills each at its max roll). */
const AFFIXES = {
  helm: ["chc", "vit"], shoulders: ["cdr", "area", "armor"], amulet: ["chd", "elemental", "chc"],
  chest: ["vit", "armor"], gloves: ["chc", "chd", "cdr"], bracers: ["elemental", "chc", "vit"],
  belt: ["vit", "life", "armor"], ring: ["chc", "chd", "cdr"], legs: ["vit", "armor"], boots: ["vit", "armor"],
  wpn: ["cdr", "area"], off: ["chc", "cdr"],
};

export async function createEngine() {
  const d = JSON.parse(await readFile(P("public/planner/planner.json"), "utf8"));
  const skills = JSON.parse(await readFile(P("public/skills/skills.json"), "utf8"));

  const pnum = (id) => Number(/^[Pp](\d+)_/.exec(id)?.[1] ?? 0);
  const current = (name, filter = () => true) => d.items
    .filter((i) => !i.legacy && filter(i) && (i.name || "").toLowerCase() === name.toLowerCase())
    .sort((a, b) => pnum(b.id) - pnum(a.id))[0];
  const item = (name) => {
    const it = current(name);
    if (!it) throw new Error(`item not found: ${name}`);
    return it.id;
  };
  const power = (name) => {
    const it = current(name, (i) => !!i.required?.custom?.id);
    if (!it) throw new Error(`power not found: ${name}`);
    return it.required.custom.id;
  };
  const skill = (klass, [sname, rname]) => {
    const s = skills.classes[klass].active.find((a) => a.name.toLowerCase() === sname.toLowerCase());
    if (!s) throw new Error(`skill not found: ${klass} ${sname}`);
    const r = s.runes.find((x) => x.name.toLowerCase() === rname.toLowerCase());
    if (!r) throw new Error(`rune not found: ${klass} ${sname} / ${rname}`);
    return { skill: s.slug, rune: r.letter };
  };
  const passive = (klass, name) => {
    const p = skills.classes[klass].passive.find((x) => x.name.toLowerCase() === name.toLowerCase());
    if (!p) throw new Error(`passive not found: ${klass} ${name}`);
    return p.slug;
  };
  const isWeapon = (name) => {
    const t = d.itemTypes[current(name).type];
    return !!(t?.weapon || t?.slot === "onehand" || t?.slot === "twohand");
  };

  const N = (gem) => ({ gem });
  const L = (gem) => ({ gem, legendary: true });
  const gear = (name, affixes, gems = [], augment = 750) => ({ itemId: item(name), affixes, augment, gems });

  /** Ethereal extras: `{ power: "<weapon power item name>", passive: "<passive name>" }`
   *  -> the ids the planner stores on the Ethereal's slot. */
  const etherealChoices = (klass, slotItem, ethereal) => {
    const it = d.items.find((i) => i.id === slotItem.itemId);
    if (!ethereal || it?.quality !== "ethereal") return slotItem;
    const options = it.required?.custom?.options ?? [];
    const power = options.find((id) => d.items.find((i) => i.id === id)?.name.toLowerCase() === ethereal.power.toLowerCase());
    if (!power) throw new Error(`${it.name} cannot carry power: ${ethereal.power}`);
    return { ...slotItem, etherealPower: power, etherealPassive: passive(klass, ethereal.passive) };
  };

  /** Expand a compact spec into the preset-build JSON shape. `legendaryGems` go to the
   *  amulet, left ring and right ring, in that order; `ethereal` (optional) sets the
   *  Ethereal weapon's extra power and passive. */
  function build(spec) {
    const g = spec.gear;
    const [neckGem, ring1Gem, ring2Gem] = spec.legendaryGems.map(L);
    const weapon = (name, affixes, gems) => etherealChoices(spec.klass, gear(name, affixes, gems), spec.ethereal);
    return {
      id: spec.id, name: spec.name, klass: spec.klass, category: spec.category, tier: spec.tier,
      ...(spec.noEthereal === false ? {} : { noEthereal: true }),
      gender: "male", source: spec.source, season: spec.season, tagline: spec.tagline,
      paragonLevel: 800, paragon: PARAGON,
      equipped: {
        head: gear(g.head, AFFIXES.helm, [N("diamond")]),
        shoulders: gear(g.shoulders, AFFIXES.shoulders),
        neck: gear(g.neck, AFFIXES.amulet, [neckGem]),
        torso: gear(g.torso, AFFIXES.chest, [N("diamond"), N("diamond"), N("diamond")]),
        hands: gear(g.hands, AFFIXES.gloves),
        wrists: gear(g.wrists, AFFIXES.bracers),
        waist: gear(g.waist, AFFIXES.belt),
        legs: gear(g.legs, AFFIXES.legs, [N("diamond"), N("diamond")]),
        feet: gear(g.feet, AFFIXES.boots),
        leftfinger: gear(g.leftfinger, AFFIXES.ring, [ring1Gem]),
        rightfinger: gear(g.rightfinger, AFFIXES.ring, [ring2Gem]),
        mainhand: weapon(g.mainhand, AFFIXES.wpn, [N("emerald")]),
        // a weapon off-hand (dual-wield, hand crossbow) takes an emerald like the main
        // hand; sources / mojos / phylacteries / shields take a diamond.
        // no off-hand with a two-handed weapon
        ...(g.offhand ? { offhand: weapon(g.offhand, AFFIXES.off, [N(isWeapon(g.offhand) ? "emerald" : "diamond")]) } : {}),
      },
      kanai: { weapon: power(spec.kanai[0]), armor: power(spec.kanai[1]), jewelry: power(spec.kanai[2]) },
      skills: {
        active: spec.skills.map((s) => skill(spec.klass, s)),
        passives: spec.passives.map((p) => passive(spec.klass, p)),
      },
    };
  }

  /** Read a base build: the original kept in scripts/data/build-bases/, or else the build on
   *  the site. `fromSite` reads the site version directly — e.g. the Ethereal solo build a speed
   *  variant starts from (run gen-theorycraft-builds.mjs first). */
  async function readBase(baseId, fromSite = false) {
    const dirs = fromSite ? ["public/planner/builds"] : ["scripts/data/build-bases", "public/planner/builds"];
    for (const dir of dirs) {
      try { return JSON.parse(await readFile(P(dir, `${baseId}.json`), "utf8")); } catch { /* next */ }
    }
    throw new Error(`base build not found: ${baseId}`);
  }

  /** Copy a base build and change only what `o` lists: `gear` (slot -> item name, or null to
   *  empty the slot), `ethereal` (extra power + passive of the Ethereal weapon), `kanai`
   *  ([weapon, armor, jewelry] power names), `skills` (the whole bar) or `swapSkills`
   *  (skill slug -> [name, rune] for single slots), `passives`, `legendaryGems` and `fromSite`
   *  (start from the site version instead of the original). */
  async function derive(baseId, o) {
    const b = structuredClone(await readBase(baseId, o.fromSite));
    Object.assign(b, { id: o.id, name: o.name, category: o.category, tier: o.tier, tagline: o.tagline });
    for (const [slot, name] of Object.entries(o.gear ?? {})) {
      if (name === null) { delete b.equipped[slot]; continue; }
      // a different item drops the previous Ethereal's extra power / passive choices
      const { etherealPower: _p, etherealPassive: _s, ...prev } = b.equipped[slot] ?? { affixes: [], augment: 750, gems: [] };
      b.equipped[slot] = { ...prev, itemId: item(name) };
    }
    for (const slot of ["mainhand", "offhand"]) {
      if (b.equipped[slot]) b.equipped[slot] = etherealChoices(b.klass, b.equipped[slot], o.ethereal);
    }
    if (o.kanai) b.kanai = { weapon: power(o.kanai[0]), armor: power(o.kanai[1]), jewelry: power(o.kanai[2]) };
    if (o.skills) b.skills.active = o.skills.map((s) => skill(b.klass, s));
    for (const [slug, spec] of Object.entries(o.swapSkills ?? {})) {
      const i = b.skills.active.findIndex((a) => a.skill === slug);
      if (i < 0) throw new Error(`${baseId}: no skill ${slug} to swap`);
      b.skills.active[i] = skill(b.klass, spec);
    }
    if (o.passives) b.skills.passives = o.passives.map((p) => passive(b.klass, p));
    if (o.legendaryGems) {
      const [neck, left, right] = o.legendaryGems;
      for (const [slot, gem] of [["neck", neck], ["leftfinger", left], ["rightfinger", right]]) {
        if (gem && b.equipped[slot]) b.equipped[slot].gems = [L(gem)];
      }
    }
    delete b.noEthereal;
    return b;
  }

  return { build, derive };
}

/** Write each build file and merge them into public/planner/builds/index.json. */
export async function emitBuilds(builds) {
  const existing = JSON.parse(await readFile(P("public/planner/builds/index.json"), "utf8")).builds;
  const newIds = new Set(builds.map((b) => b.id));
  const index = { builds: existing.filter((e) => !newIds.has(e.id)) };
  for (const b of builds) {
    await writeFile(P("public/planner/builds", `${b.id}.json`), JSON.stringify(b, null, 2) + "\n", "utf8");
    index.builds.push({ id: b.id, name: b.name, klass: b.klass, category: b.category, tier: b.tier, tagline: b.tagline, source: b.source });
  }
  sortIndex(index.builds);
  await writeFile(P("public/planner/builds/index.json"), JSON.stringify(index, null, 2) + "\n", "utf8");
  console.log(`wrote ${builds.length} builds + index (${index.builds.length} total)`);
}
