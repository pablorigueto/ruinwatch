/**
 * gen-stier-builds.mjs — emit the S-Tier solo-push build JSONs from compact
 * specs. Resolves item ids (prefers `current`), skill slugs + rune letters and
 * gem keys against the canonical data, so a spec stays human-readable while the
 * output is fully resolved. Re-runnable; also rewrites builds/index.json.
 *
 *   node scripts/gen-stier-builds.mjs
 *   node scripts/validate-build.mjs --all   # then verify
 */
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { sortIndex } from "./lib/build-index.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const P = (...x) => join(ROOT, ...x);
const d = JSON.parse(await readFile(P("public/planner/planner.json"), "utf8"));
const skills = JSON.parse(await readFile(P("public/skills/skills.json"), "utf8"));

const PARAGON = {
  core: { movement: 50, resource: 50, mainstat: 50, vit: 50 },
  offense: { cdr: 50, chc: 50, chd: 50, ias: 50 },
  defense: { armor: 50, resall: 50, ldr: 50, life: 50 },
  utility: { rcr: 50, laek: 50, gf: 50, area: 50 },
};

/** resolve an item by exact name (prefer current), else substring. */
function item(name) {
  const re = new RegExp("^" + name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$", "i");
  let hits = d.items.filter((i) => re.test(i.name || ""));
  if (!hits.length) hits = d.items.filter((i) => new RegExp(name, "i").test(i.name || ""));
  const c = hits.find((x) => x.current) || hits[0];
  if (!c) throw new Error(`item not found: ${name}`);
  return c.id;
}
/** resolve an ETHEREAL item by name (necessary when a legendary of the same
 *  name also exists and is flagged current). */
function ethereal(name) {
  const it = d.items.find((i) => i.quality === "ethereal" && new RegExp(name, "i").test(i.name || ""));
  if (!it) throw new Error(`ethereal not found: ${name}`);
  return it.id;
}
/** resolve a kanai power id by item name. */
function power(name) {
  // versão ATUAL do poder: nome exato, sem "legacy" (as legacy são de patches anteriores), maior prefixo Pnn_
  const pnum = (id) => Number(/^[Pp](\d+)_/.exec(id)?.[1] ?? 0);
  const exact = d.items.filter((i) => i.required?.custom?.id && !i.legacy && (i.name || "").toLowerCase() === name.toLowerCase());
  const it = exact.sort((a, b) => pnum(b.id) - pnum(a.id))[0]
    ?? d.items.find((i) => new RegExp(name, "i").test(i.name || "") && i.required?.custom?.id);
  if (!it) throw new Error(`power not found: ${name}`);
  return it.required.custom.id;
}
/** resolve "Skill Name|Rune Name" → {skill, rune}. */
function sk(klass, spec) {
  const [sname, rname] = spec.split("|");
  const b = skills.classes[klass];
  const s = b.active.find((a) => a.name.toLowerCase() === sname.trim().toLowerCase());
  if (!s) throw new Error(`skill not found: ${klass} ${sname}`);
  let rune = null;
  if (rname) {
    const r = s.runes.find((x) => x.name.toLowerCase() === rname.trim().toLowerCase());
    if (!r) throw new Error(`rune not found: ${sname} / ${rname}`);
    rune = r.letter;
  }
  return { skill: s.slug, rune };
}
function pas(klass, name) {
  const p = skills.classes[klass].passive.find((x) => x.name.toLowerCase() === name.toLowerCase());
  if (!p) throw new Error(`passive not found: ${klass} ${name}`);
  return p.slug;
}
/** a slot: gear(name, [affixes], gems[], augment). g = gem shorthand. */
const N = (gem) => ({ gem }); // normal gem
const L = (gem) => ({ gem, legendary: true }); // legendary gem
function gear(name, affixes = [], gems = [], augment = 750) {
  return { itemId: item(name), affixes, augment, gems };
}
/** gear() but forces the ethereal variant (for weapons w/ a legendary twin). */
function gearE(name, affixes = [], gems = [], augment = 750) {
  return { itemId: ethereal(name), affixes, augment, gems };
}

// ── build specs ──────────────────────────────────────────────────────────────
const BUILDS = [];

// helper to register
function build(meta, klass, equipped, kanai, active, passives) {
  BUILDS.push({
    id: meta.id, name: meta.name, klass, category: "solo-push", tier: "S",
    gender: meta.gender || "male", source: meta.source, season: "Rites of Sanctuary",
    tagline: meta.tagline,
    paragonLevel: 800, paragon: PARAGON,
    equipped,
    kanai: { weapon: power(kanai[0]), armor: power(kanai[1]), jewelry: power(kanai[2]) },
    skills: { active: active.map((s) => sk(klass, s)), passives: passives.map((p) => pas(klass, p)) },
  });
}

// 1. Inarius Death Nova
build(
  { id: "necromancer-inarius-death-nova", name: "Inarius Death Nova",
    source: "https://maxroll.gg/d3/guides/inarius-death-nova-necromancer-guide", tagline: "Death Nova · Solo Push" },
  "necromancer",
  {
    head: gear("Inarius's Understanding", ["chc", "vit"], [N("amethyst")]),
    shoulders: gear("Mantle of Channeling", ["cdr", "area", "armor"]),
    neck: gear("Haunted Visions", ["chd", "wpnphy", "chc"], [L("trapped")]),
    torso: gear("Inarius's Conviction", ["vit", "armor"], [N("topaz"), N("topaz"), N("topaz")]),
    hands: gear("Inarius's Will", ["chc", "chd", "cdr"]),
    wrists: gear("Aughild's Search", ["elemental", "chc", "vit"]),
    waist: gear("Dayntee's Binding", ["vit", "life", "armor"]),
    leftfinger: gear("Krysbin's Sentence", ["chc", "chd", "cdr"], [L("stricken")]),
    rightfinger: gear("Convention of Elements", ["chc", "chd", "cdr"], [L("esoteric")]),
    legs: gear("Inarius's Reticence", ["vit", "armor"], [N("topaz"), N("topaz")]),
    feet: gear("Inarius's Perseverance", ["vit", "armor"]),
    mainhand: gear("Blackbog's Sharp", ["cdr", "area"], [N("emerald")]),
    offhand: gear("Iron Rose", ["chc", "cdr"], [N("diamond")]),
  },
  ["Bloodtide Blade", "Wisdom of Kalan", "Funerary Pick"],
  ["Death Nova|Blood Nova", "Siphon Blood|Power Shift", "Simulacrum|Blood and Bone", "Bone Armor|Dislocation", "Leech|Osmosis", "Frailty|Aura of Frailty"],
  ["Swift Harvesting", "Stand Alone", "Spreading Malediction", "Final Service"],
);

// 2. LoD Death Nova
build(
  { id: "necromancer-lod-death-nova", name: "LoD Death Nova",
    source: "https://maxroll.gg/d3/guides/lod-death-nova-necromancer-guide", tagline: "Death Nova · LoD · Solo Push" },
  "necromancer",
  {
    head: gear("Leoric's Crown", ["chc", "vit"], [N("amethyst")]),
    shoulders: gear("Mantle of Channeling", ["cdr", "area", "armor"]),
    neck: gear("Haunted Visions", ["chd", "wpnphy", "chc"], [L("trapped")]),
    torso: gear("Aquila Cuirass", ["vit", "armor"], [N("topaz"), N("topaz"), N("topaz")]),
    hands: gear("Stone Gauntlets", ["chc", "chd", "cdr"]),
    wrists: gear("Strongarm Bracers", ["elemental", "chc", "vit"]),
    waist: gear("The Witching Hour", ["vit", "life", "armor"]),
    leftfinger: gear("Krysbin's Sentence", ["chc", "chd", "cdr"], [L("stricken")]),
    rightfinger: gear("Unity", ["chc", "chd", "cdr"], [L("trapped")]),
    legs: gear("Blackthorne's Jousting Mail", ["vit", "armor"], [N("topaz"), N("topaz")]),
    feet: gear("Steuart's Greaves", ["vit", "armor"]),
    mainhand: gearE("Blackbog's Sharp", ["cdr", "area"], [N("emerald")]),
    offhand: gear("Iron Rose", ["chc", "cdr"], [N("diamond")]),
  },
  ["Bloodtide Blade", "Funerary Pick", "Convention of Elements"],
  ["Death Nova|Blood Nova", "Siphon Blood|Power Shift", "Simulacrum|Blood and Bone", "Frailty|Aura of Frailty", "Bone Armor|Dislocation", "Blood Rush|Metabolism"],
  ["Swift Harvesting", "Stand Alone", "Spreading Malediction", "Final Service"],
);

// override LoD gem slots to use Legacy of Dreams in a ring
BUILDS[1].equipped.leftfinger.gems = [L("legacyofdreams")];
BUILDS[1].equipped.rightfinger.gems = [L("trapped")];

// 3. Trag'Oul Death Nova
build(
  { id: "necromancer-tragoul-death-nova", name: "Trag'Oul Death Nova",
    source: "https://maxroll.gg/d3/guides/tragoul-death-nova-necromancer-guide", tagline: "Death Nova · Trag'Oul · Solo Push" },
  "necromancer",
  {
    head: gear("Trag'Oul's Guise", ["chc", "vit"], [N("topaz")]),
    shoulders: gear("Mantle of Channeling", ["cdr", "area", "armor"]),
    neck: gear("Haunted Visions", ["chd", "wpnphy", "chc"], [L("trapped")]),
    torso: gear("Trag'Oul's Scales", ["vit", "armor"], [N("topaz"), N("topaz"), N("topaz")]),
    hands: gear("Trag'Oul's Claws", ["chc", "chd", "cdr"]),
    wrists: gear("Guardian's Aversion", ["elemental", "chc", "vit"]),
    waist: gear("Dayntee's Binding", ["vit", "life", "armor"]),
    leftfinger: gear("Krysbin's Sentence", ["chc", "chd", "cdr"], [L("stricken")]),
    rightfinger: gear("Convention of Elements", ["chc", "chd", "cdr"], [L("zei")]),
    legs: gear("Trag'Oul's Hide", ["vit", "armor"], [N("topaz"), N("topaz")]),
    feet: gear("Trag'Oul's Stalwart Greaves", ["vit", "armor"]),
    mainhand: gear("Blackbog's Sharp", ["cdr", "area"], [N("emerald")]),
    offhand: gear("Iron Rose", ["chc", "cdr"], [N("diamond")]),
  },
  ["Bloodtide Blade", "Mantle of Channeling", "Ring of Royal Grandeur"],
  ["Death Nova|Blood Nova", "Siphon Blood|Power Shift", "Simulacrum|Blood and Bone", "Bone Armor|Dislocation", "Frailty|Early Grave", "Blood Rush|Metabolism"],
  ["Swift Harvesting", "Stand Alone", "Spreading Malediction", "Final Service"],
);

// 4. Masquerade Bone Spear
build(
  { id: "necromancer-masquerade-bone-spear", name: "Masquerade Bone Spear",
    source: "https://maxroll.gg/d3/guides/masquerade-bone-spear-necromancer-guide", tagline: "Bone Spear · Solo Push" },
  "necromancer",
  {
    head: gear("Luxurious Bauta", ["chc", "vit"], [N("diamond")]),
    shoulders: gear("Glamorous Gigot", ["area", "vit", "armor"]),
    neck: gear("Haunted Visions", ["chd", "wpnphy", "chc"], [L("zei")]),
    torso: gear("Sophisticated Vest", ["vit", "armor"], [N("topaz"), N("topaz"), N("topaz")]),
    hands: gear("Lavishing Gloves", ["chc", "chd", "area"]),
    wrists: gear("Gelmindor's Marrow Guards", ["elemental", "chc", "vit"]),
    waist: gear("Dayntee's Binding", ["vit", "life", "armor"]),
    leftfinger: gear("Krysbin's Sentence", ["chc", "chd", "cdr"], [L("trapped")]),
    rightfinger: gear("Convention of Elements", ["chc", "chd", "cdr"], [L("stricken")]),
    legs: gear("Elegant Pants", ["vit", "armor"], [N("topaz"), N("topaz")]),
    feet: gear("Extravagant Shoes", ["vit", "armor"]),
    mainhand: gear("Blackbog's Sharp", ["cdr", "area"], [N("emerald")]),
    offhand: gear("Lost Time", ["chc", "cdr"], [N("diamond")]),
  },
  ["Maltorius' Petrified Spike", "Aquila Cuirass", "Ring of Royal Grandeur"],
  ["Bone Spear|Blighted Marrow", "Simulacrum|Blood and Bone", "Grim Scythe|Frost Scythe", "Bone Armor|Dislocation", "Blood Rush|Metabolism", "Decrepify|Wither"],
  ["Bone Prison", "Serration", "Stand Alone", "Spreading Malediction"],
);

// 5. Firebird Meteor (Wizard)
build(
  { id: "wizard-firebird-meteor", name: "Firebird Meteor",
    source: "https://maxroll.gg/d3/guides/firebird-meteor-wizard-guide", tagline: "Meteor · Firebird · Solo Push" },
  "wizard",
  {
    head: gear("Firebird's Plume", ["chc", "vit"], [N("topaz")]),
    shoulders: gear("Firebird's Pinions", ["cdr", "area", "armor"]),
    neck: gear("Squirt's Necklace", ["chd", "elemental", "chc"], [L("stricken")]),
    torso: gear("Firebird's Breast", ["vit", "armor"], [N("topaz"), N("topaz"), N("topaz")]),
    hands: gear("Firebird's Talons", ["chc", "chd", "area"]),
    wrists: gear("Guardian's Aversion", ["elemental", "chc", "vit"]),
    waist: gear("Guardian's Case", ["vit", "life", "armor"]),
    leftfinger: gear("Halo of Karini", ["chc", "chd", "cdr"], [L("trapped")]),
    rightfinger: gear("Convention of Elements", ["chc", "chd", "cdr"], [L("zei")]),
    legs: gear("Firebird's Down", ["vit", "armor"], [N("topaz"), N("topaz")]),
    feet: gear("Nilfur's Boast", ["vit", "armor"]),
    mainhand: gearE("Wizardspike", ["cdr", "area"], [N("emerald")]),
    offhand: gear("Firebird's Eye", ["chc", "cdr"], [N("diamond")]),
  },
  ["The Grand Vizier", "Mempo of Twilight", "Ring of Royal Grandeur"],
  ["Meteor|Comet", "Disintegrate|Convergence", "Teleport|Wormhole", "Storm Armor|Power of the Storm", "Diamond Skin|Prism", "Black Hole|Absolute Zero"],
  ["Elemental Exposure", "Power Hungry", "Galvanizing Ward", "Conflagration"],
);

// 6. LoD "Bazooka" Meteor (Wizard)
build(
  { id: "wizard-lod-meteor", name: "LoD \"Bazooka\" Meteor",
    source: "https://maxroll.gg/d3/guides/lod-meteor-wizard-guide", tagline: "Meteor · LoD · Solo Push" },
  "wizard",
  {
    head: gear("The Swami", ["chc", "vit"], [N("ruby")]),
    shoulders: gear("Pauldrons of the Skeleton King", ["cdr", "area", "armor"]),
    neck: gear("Squirt's Necklace", ["chd", "elemental", "chc"], [L("stricken")]),
    torso: gear("Aquila Cuirass", ["vit", "armor"], [N("ruby"), N("ruby"), N("ruby")]),
    hands: gear("Stone Gauntlets", ["chc", "chd", "cdr"]),
    wrists: gear("Ashnagarr's Blood Bracer", ["elemental", "chc", "vit"]),
    waist: gear("Fazula's Improbable Chain", ["vit", "life", "armor"]),
    leftfinger: gear("Halo of Karini", ["chc", "chd", "cdr"], [L("legacyofdreams")]),
    rightfinger: gear("Convention of Elements", ["chc", "chd", "cdr"], [L("gogok")]),
    legs: gear("Blackthorne's Jousting Mail", ["vit", "armor"], [N("ruby"), N("ruby")]),
    feet: gear("Nilfur's Boast", ["vit", "armor"]),
    mainhand: gearE("Wizardspike", ["cdr", "area"], [N("emerald")]),
    offhand: gear("Tal Rasha's Unwavering Glare", ["chc", "cdr"], [N("diamond")]),
  },
  ["The Grand Vizier", "The Smoldering Core", "Convention of Elements"],
  ["Meteor|Star Pact", "Archon|Teleport", "Storm Armor|Shocking Aspect", "Magic Weapon|Deflection", "Spectral Blade|Barrier Blades", "Black Hole|Spellsteal"],
  ["Evocation", "Galvanizing Ward", "Audacity", "Arcane Dynamo"],
);

// 7. Tal Rasha Meteor (Wizard)
build(
  { id: "wizard-tal-rasha-meteor", name: "Tal Rasha Meteor",
    source: "https://maxroll.gg/d3/guides/tal-rasha-meteor-wizard-guide", tagline: "Meteor · Tal Rasha · Solo Push" },
  "wizard",
  {
    head: gear("Mempo of Twilight", ["chc", "vit"], [N("topaz")]),
    shoulders: gear("Pauldrons of the Skeleton King", ["cdr", "area", "armor"]),
    neck: gear("Tal Rasha's Allegiance", ["chd", "elemental", "chc"], [L("trapped")]),
    torso: gear("Tal Rasha's Relentless Pursuit", ["vit", "armor"], [N("topaz"), N("topaz"), N("topaz")]),
    hands: gear("Tal Rasha's Grasp", ["chc", "chd", "area"]),
    wrists: gear("Guardian's Aversion", ["elemental", "chc", "vit"]),
    waist: gear("Tal Rasha's Brace", ["vit", "life", "armor"]),
    leftfinger: gear("Halo of Karini", ["chc", "chd", "cdr"], [L("zei")]),
    rightfinger: gear("Convention of Elements", ["chc", "chd", "cdr"], [L("stricken")]),
    legs: gear("Tal Rasha's Stride", ["vit", "armor"], [N("topaz"), N("topaz")]),
    feet: gear("Nilfur's Boast", ["vit", "armor"]),
    mainhand: gearE("Wizardspike", ["cdr", "area"], [N("emerald")]),
    offhand: gear("Tal Rasha's Unwavering Glare", ["chc", "cdr"], [N("diamond")]),
  },
  ["The Grand Vizier", "The Smoldering Core", "Ring of Royal Grandeur"],
  ["Meteor|Comet", "Storm Armor|Power of the Storm", "Teleport|Safe Passage", "Familiar|Sparkflint", "Black Hole|Spellsteal", "Diamond Skin|Prism"],
  ["Power Hungry", "Elemental Exposure", "Galvanizing Ward", "Arcane Dynamo"],
);

// 8. Akkhan Condemn (Crusader)
build(
  { id: "crusader-akkhan-condemn", name: "Akkhan Condemn",
    source: "https://maxroll.gg/d3/guides/akkhan-condemn-crusader-guide", tagline: "Condemn · Akkhan · Solo Push" },
  "crusader",
  {
    head: gear("Helm of Akkhan", ["chc", "vit"], [N("diamond")]),
    shoulders: gear("Pauldrons of Akkhan", ["cdr", "area", "armor"]),
    neck: gear("Squirt's Necklace", ["chd", "wpnphy", "chc"], [L("trapped")]),
    torso: gear("Breastplate of Akkhan", ["vit", "armor"], [N("diamond"), N("diamond"), N("diamond")]),
    hands: gear("Gauntlets of Akkhan", ["chc", "chd", "cdr"]),
    wrists: gear("Strongarm Bracers", ["elemental", "chc", "vit"]),
    waist: gear("Captain Crimson's Silk Girdle", ["vit", "life", "armor"]),
    leftfinger: gear("The Compass Rose", ["chc", "chd", "cdr"], [L("enforcer")]),
    rightfinger: gear("Rechel's Ring of Larceny", ["chc", "chd", "cdr"], [L("trapped")]),
    legs: gear("Cuisses of Akkhan", ["vit", "armor"], [N("diamond"), N("diamond")]),
    feet: gear("Sabatons of Akkhan", ["vit", "armor"]),
    mainhand: gearE("The Redeemer", ["cdr", "area"], [N("emerald")]),
    offhand: gear("Unrelenting Phalanx", ["chc", "cdr"], [N("diamond")]),
  },
  ["Frydehr's Wrath", "Ring of Royal Grandeur", "Tasker and Theo"],
  ["Phalanx|Bowmen", "Judgment|Debilitate", "Condemn|Shattering Explosion", "Akarat's Champion|Prophet", "Laws of Valor|Unstoppable Force", "Justice|Sword of Justice"],
  ["Fervor", "Finery", "Long Arm of the Law", "Lord Commander"],
);

// 9. Natalya Spike Trap (Demon Hunter)
build(
  { id: "demonhunter-natalya-spike-trap", name: "Natalya Spike Trap",
    source: "https://maxroll.gg/d3/guides/natalya-spike-trap-demon-hunter-guide", tagline: "Spike Trap · Natalya · Solo Push" },
  "demonhunter",
  {
    head: gear("Natalya's Sight", ["chc", "vit"], [N("diamond")]),
    shoulders: gear("Aughild's Power", ["cdr", "area", "armor"]),
    neck: gear("Squirt's Necklace", ["chd", "wpnphy", "chc"], [L("trapped")]),
    torso: gear("Natalya's Embrace", ["vit", "armor"], [N("diamond"), N("diamond"), N("diamond")]),
    hands: gear("Natalya's Touch", ["chc", "chd", "cdr"]),
    wrists: gear("Aughild's Search", ["elemental", "chc", "vit"]),
    waist: gear("Captain Crimson's Silk Girdle", ["vit", "life", "armor"]),
    leftfinger: gear("Natalya's Reflection", ["chc", "chd", "cdr"], [L("esoteric")]),
    rightfinger: gear("The Compass Rose", ["chc", "chd", "cdr"], [L("stricken")]),
    legs: gear("Natalya's Leggings", ["vit", "armor"], [N("diamond"), N("diamond")]),
    feet: gear("Natalya's Bloody Footprints", ["vit", "armor"]),
    mainhand: gearE("Doomslinger", ["cdr", "area"], [N("emerald")]),
    offhand: gear("The Demon's Demise", ["chc", "cdr"], [N("diamond")]),
  },
  ["Chanon Bolter", "Trag'Oul Coils", "Ring of Royal Grandeur"],
  ["Spike Trap|Custom Trigger", "Evasive Fire|Hardened", "Caltrops|Bait the Trap", "Vengeance|Dark Heart", "Smoke Screen|Healing Vapors", "Shadow Power|Gloom"],
  ["Custom Engineering", "Cull the Weak", "Numbing Traps", "Ambush"],
);

// ── emit ─────────────────────────────────────────────────────────────────────
const existing = JSON.parse(await readFile(P("public/planner/builds/index.json"), "utf8")).builds;
const newIds = new Set(BUILDS.map((b) => b.id));
const index = { builds: [] };
// keep non-S-tier existing builds (e.g. barbarian A), drop ones we regenerate
for (const e of existing) if (!newIds.has(e.id)) index.builds.push(e);
for (const b of BUILDS) {
  await writeFile(P("public/planner/builds", `${b.id}.json`), JSON.stringify(b, null, 2) + "\n", "utf8");
  index.builds.push({ id: b.id, name: b.name, klass: b.klass, category: "solo-push", tier: "S", tagline: b.tagline, source: b.source });
}
// sort index: S first, then by class
sortIndex(index.builds);
await writeFile(P("public/planner/builds/index.json"), JSON.stringify(index, null, 2) + "\n", "utf8");
console.log(`wrote ${BUILDS.length} S-tier builds + index (${index.builds.length} total)`);
