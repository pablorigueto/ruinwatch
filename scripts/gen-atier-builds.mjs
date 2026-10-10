/**
 * gen-atier-builds.mjs — emit the A-Tier solo-push builds. Same approach as the
 * S-tier generator: resolve items (prefer current / ethereal), skills, gems.
 * Mainhand uses gearE() to force the class ethereal weapon (the season BiS);
 * the named legendary weapon's power goes in the cube when applicable.
 *
 *   node scripts/gen-atier-builds.mjs && node scripts/validate-build.mjs --all
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
// the season ethereal weapon per class (the one validate-build wants equipped)
const CLASS_ETHEREAL = {
  necromancer: "Blackbog's Sharp", wizard: "Wizardspike", witchdoctor: "Arioc's Needle",
  demonhunter: "Buriza-Do Kyanon", crusader: "The Redeemer", barbarian: "Gimmershred",
  monk: "Jade Talon",
};

function item(name) {
  const re = new RegExp("^" + name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$", "i");
  let hits = d.items.filter((i) => re.test(i.name || ""));
  if (!hits.length) hits = d.items.filter((i) => new RegExp(name, "i").test(i.name || ""));
  const c = hits.find((x) => x.current) || hits[0];
  if (!c) throw new Error(`item not found: ${name}`);
  return c.id;
}
function ethereal(name) {
  const it = d.items.find((i) => i.quality === "ethereal" && new RegExp(name, "i").test(i.name || ""));
  if (!it) throw new Error(`ethereal not found: ${name}`);
  return it.id;
}
function power(name) {
  // versão ATUAL do poder: nome exato, sem "legacy" (as legacy são de patches anteriores), maior prefixo Pnn_
  const pnum = (id) => Number(/^[Pp](\d+)_/.exec(id)?.[1] ?? 0);
  const exact = d.items.filter((i) => i.required?.custom?.id && !i.legacy && (i.name || "").toLowerCase() === name.toLowerCase());
  const it = exact.sort((a, b) => pnum(b.id) - pnum(a.id))[0]
    ?? d.items.find((i) => new RegExp(name, "i").test(i.name || "") && i.required?.custom?.id);
  if (!it) throw new Error(`power not found: ${name}`);
  return it.required.custom.id;
}
function sk(klass, spec) {
  const [sname, rname] = spec.split("|");
  const b = skills.classes[klass];
  const s = b.active.find((a) => a.name.toLowerCase() === sname.trim().toLowerCase());
  if (!s) throw new Error(`skill not found: ${klass} ${sname}`);
  let rune = null;
  if (rname) {
    const r = s.runes.find((x) => x.name.toLowerCase() === rname.trim().toLowerCase());
    if (!r) throw new Error(`rune not found: ${klass} ${sname} / ${rname}`);
    rune = r.letter;
  } else if (s.runes.length) {
    rune = s.runes[0].letter; // builds always slot a rune; default to first if unspecified
  }
  return { skill: s.slug, rune };
}
function pas(klass, name) {
  const p = skills.classes[klass].passive.find((x) => x.name.toLowerCase() === name.toLowerCase());
  if (!p) throw new Error(`passive not found: ${klass} ${name}`);
  return p.slug;
}
const N = (gem) => ({ gem });
const L = (gem) => ({ gem, legendary: true });
function gear(name, affixes = [], gems = [], augment = 750) { return { itemId: item(name), affixes, augment, gems }; }
function gearE(name, affixes = [], gems = [], augment = 750) { return { itemId: ethereal(name), affixes, augment, gems }; }

const BUILDS = [];
function build(meta, klass, equipped, kanai, active, passives) {
  BUILDS.push({
    id: meta.id, name: meta.name, klass, category: "solo-push", tier: "A",
    gender: meta.gender || "male", source: meta.source, season: "Rites of Sanctuary", tagline: meta.tagline,
    paragonLevel: 800, paragon: PARAGON, equipped,
    kanai: { weapon: power(kanai[0]), armor: power(kanai[1]), jewelry: power(kanai[2]) },
    skills: { active: active.map((s) => sk(klass, s)), passives: passives.map((p) => pas(klass, p)) },
  });
}
// common affix presets per slot-role to keep specs short
const A = {
  helmCrit: ["chc", "vit"], shoulderCdr: ["cdr", "area", "armor"], amuletCc: ["chd", "wpnphy", "chc"],
  chestVit: ["vit", "armor"], glovesCrit: ["chc", "chd", "cdr"], bracerEl: ["elemental", "chc", "vit"],
  beltVit: ["vit", "life", "armor"], ringCrit: ["chc", "chd", "cdr"], legsVit: ["vit", "armor"],
  bootsVit: ["vit", "armor"], wpn: ["cdr", "area"], off: ["chc", "cdr"],
};
// gem packs
const D3 = [N("diamond"), N("diamond"), N("diamond")], D2 = [N("diamond"), N("diamond")];
const T3 = [N("topaz"), N("topaz"), N("topaz")], T2 = [N("topaz"), N("topaz")];
const R3 = [N("ruby"), N("ruby"), N("ruby")], R2 = [N("ruby"), N("ruby")];

// ── A-tier builds ─────────────────────────────────────────────────────────────

// LoD Corpse Explosion (Necro)
build({ id: "necromancer-lod-corpse-explosion", name: "LoD Corpse Explosion",
  source: "https://maxroll.gg/d3/guides/lod-corpse-explosion-necromancer-guide", tagline: "Corpse Explosion · LoD" },
  "necromancer", {
    head: gear("Leoric's Crown", A.helmCrit, [N("amethyst")]),
    shoulders: gear("Razeth's Volition", A.shoulderCdr),
    neck: gear("The Flavor of Time", A.amuletCc, [L("legacyofdreams")]),
    torso: gear("Aquila Cuirass", A.chestVit, T3),
    hands: gear("Grasps of Essence", A.glovesCrit),
    wrists: gear("Nemesis Bracers", A.bracerEl),
    waist: gear("Dayntee's Binding", A.beltVit),
    leftfinger: gear("Krysbin's Sentence", A.ringCrit, [L("trapped")]),
    rightfinger: gear("Convention of Elements", A.ringCrit, [L("stricken")]),
    legs: gear("Blackthorne's Jousting Mail", A.legsVit, T2),
    feet: gear("Ice Climbers", A.bootsVit),
    mainhand: gearE("Blackbog's Sharp", A.wpn, [N("emerald")]),
    offhand: gear("Lost Time", A.off, [N("diamond")]),
  },
  ["Nayr's Black Death", "Stone Gauntlets", "Obsidian Ring of the Zodiac"],
  ["Grim Scythe|Cursed Scythe", "Corpse Explosion|Close Quarters", "Bone Armor|Dislocation", "Blood Rush|Potency", "Land of the Dead|Frozen Lands", "Bone Spear|Blighted Marrow"],
  ["Spreading Malediction", "Blood is Power", "Stand Alone", "Eternal Torment"]);



// Firebird Explosive Blast (Wizard)
build({ id: "wizard-firebird-explosive-blast", name: "Firebird Explosive Blast",
  source: "https://maxroll.gg/d3/guides/firebird-explosive-blast-wizard-guide", tagline: "Explosive Blast · Firebird" },
  "wizard", {
    head: gear("Firebird's Plume", A.helmCrit, [N("topaz")]),
    shoulders: gear("Firebird's Pinions", A.shoulderCdr),
    neck: gear("Squirt's Necklace", ["chd", "elemental", "chc"], [L("trapped")]),
    torso: gear("Firebird's Breast", A.chestVit, T3),
    hands: gear("Firebird's Talons", A.glovesCrit),
    wrists: gear("Aughild's Search", A.bracerEl),
    waist: gear("Captain Crimson's Silk Girdle", A.beltVit),
    leftfinger: gear("Obsidian Ring of the Zodiac", A.ringCrit, [L("taeguk")]),
    rightfinger: gear("Convention of Elements", A.ringCrit, [L("stricken")]),
    legs: gear("Firebird's Down", A.legsVit, T2),
    feet: gear("Firebird's Tarsi", A.bootsVit),
    mainhand: gearE("Wizardspike", A.wpn, [N("emerald")]),
    offhand: gear("Orb of Infinite Depth", A.off, [N("diamond")]),
  },
  ["In-geom", "Mantle of Channeling", "Ring of Royal Grandeur"],
  ["Disintegrate|Convergence", "Explosive Blast|Chain Reaction", "Teleport|Wormhole", "Magic Weapon|Deflection", "Black Hole|Absolute Zero", "Arcane Torrent|Static Discharge"],
  ["Galvanizing Ward", "Elemental Exposure", "Audacity", "Evocation"]);

// Firebird Flame Blades (Wizard)
build({ id: "wizard-firebird-flame-blades", name: "Firebird Flame Blades",
  source: "https://maxroll.gg/d3/guides/firebird-flame-blades-wizard-guide", tagline: "Spectral Blade · Firebird" },
  "wizard", {
    head: gear("Firebird's Plume", A.helmCrit, [N("topaz")]),
    shoulders: gear("Firebird's Pinions", A.shoulderCdr),
    neck: gear("The Traveler's Pledge", ["chd", "elemental", "chc"], [L("trapped")]),
    torso: gear("Firebird's Breast", A.chestVit, T3),
    hands: gear("Firebird's Talons", A.glovesCrit),
    wrists: gear("Ashnagarr's Blood Bracer", A.bracerEl),
    waist: gear("The Shame of Delsere", A.beltVit),
    leftfinger: gear("Obsidian Ring of the Zodiac", A.ringCrit, [L("stricken")]),
    rightfinger: gear("Convention of Elements", A.ringCrit, [L("gogok")]),
    legs: gear("Firebird's Down", A.legsVit, T2),
    feet: gear("Firebird's Tarsi", A.bootsVit),
    mainhand: gearE("Wizardspike", A.wpn, [N("emerald")]),
    offhand: gear("Orb of Infinite Depth", A.off, [N("diamond")]),
  },
  ["Fragment of Destiny", "Aquila Cuirass", "Ring of Royal Grandeur"],
  ["Disintegrate|Convergence", "Spectral Blade|Flame Blades", "Explosive Blast|Chain Reaction", "Teleport|Safe Passage", "Magic Weapon|Deflection", "Black Hole|Spellsteal"],
  ["Elemental Exposure", "Audacity", "Evocation", "Galvanizing Ward"]);








// GoD Hungering Arrow (DH)
build({ id: "demonhunter-god-hungering-arrow", name: "GoD Hungering Arrow",
  source: "https://maxroll.gg/d3/guides/god-ha-demon-hunter-guide", tagline: "Hungering Arrow · Gears of Dreadlands" },
  "demonhunter", {
    head: gear("Dystopian Goggles", A.helmCrit, [N("diamond")]),
    shoulders: gear("Mechanical Pauldrons", A.shoulderCdr),
    neck: gear("Squirt's Necklace", A.amuletCc, [L("trapped")]),
    torso: gear("Galvanized Vest", A.chestVit, D3),
    hands: gear("Gas Powered Automail Forearm", A.glovesCrit),
    wrists: gear("Wraps of Clarity", A.bracerEl),
    waist: gear("Hunter's Wrath", A.beltVit),
    leftfinger: gear("Focus", A.ringCrit, [L("simplicity")]),
    rightfinger: gear("Restraint", A.ringCrit, [L("taeguk")]),
    legs: gear("Cold Cathode Trousers", A.legsVit, D2),
    feet: gear("Antique Vintage Boots", A.bootsVit),
    mainhand: gearE("Buriza-Do Kyanon", A.wpn, [N("emerald")]),
    offhand: gear("The Ninth Cirri Satchel", A.off, [N("diamond")]),
  },
  ["Dawn", "Depth Diggers", "Convention of Elements"],
  ["Hungering Arrow|Devouring Arrow", "Strafe|Rocket Storm", "Vengeance|Dark Heart", "Smoke Screen|Displacement", "Preparation|Focused Mind", "Companion|Bat Companion"],
  ["Numbing Traps", "Awareness", "Tactical Advantage", "Ambush"]);

// UE Hungering Arrow (DH)
build({ id: "demonhunter-ue-hungering-arrow", name: "UE Hungering Arrow",
  source: "https://maxroll.gg/d3/guides/ue-hungering-arrow-demon-hunter-guide", tagline: "Hungering Arrow · Unhallowed Essence" },
  "demonhunter", {
    head: gear("Accursed Visage", A.helmCrit, [N("diamond")]),
    shoulders: gear("Unsanctified Shoulders", A.shoulderCdr),
    neck: gear("Squirt's Necklace", A.amuletCc, [L("trapped")]),
    torso: gear("Cage of the Hellborn", A.chestVit, D3),
    hands: gear("Fiendish Grips", A.glovesCrit),
    wrists: gear("Wraps of Clarity", A.bracerEl),
    waist: gear("Hunter's Wrath", A.beltVit),
    leftfinger: gear("Focus", A.ringCrit, [L("simplicity")]),
    rightfinger: gear("Restraint", A.ringCrit, [L("stricken")]),
    legs: gear("Unholy Plates", A.legsVit, D2),
    feet: gear("Hell Walkers", A.bootsVit),
    mainhand: gearE("Buriza-Do Kyanon", A.wpn, [N("emerald")]),
    offhand: gear("The Ninth Cirri Satchel", A.off, [N("diamond")]),
  },
  ["Dawn", "Depth Diggers", "Convention of Elements"],
  ["Hungering Arrow|Devouring Arrow", "Multishot|Wind Chill", "Preparation|Invigoration", "Vengeance|Dark Heart", "Smoke Screen|Special Recipe", "Shadow Power|Gloom"],
  ["Cull the Weak", "Numbing Traps", "Awareness", "Ambush"]);





// Raekor Boulder Toss (Barbarian)
build({ id: "barbarian-raekor-boulder-toss", name: "Raekor Boulder Toss",
  source: "https://maxroll.gg/d3/guides/raekor-boulder-toss-barbarian-guide", tagline: "Boulder Toss · Raekor" },
  "barbarian", {
    head: gear("Raekor's Will", A.helmCrit, [N("diamond")]),
    shoulders: gear("Raekor's Burden", A.shoulderCdr),
    neck: gear("The Traveler's Pledge", A.amuletCc, [L("trapped")]),
    torso: gear("Raekor's Heart", A.chestVit, D3),
    hands: gear("Raekor's Wraps", A.glovesCrit),
    wrists: gear("Skular's Salvation", A.bracerEl),
    waist: gear("Captain Crimson's Silk Girdle", A.beltVit),
    leftfinger: gear("Band of Might", A.ringCrit, [L("stricken")]),
    rightfinger: gear("The Compass Rose", A.ringCrit, [L("zei")]),
    legs: gear("Raekor's Breeches", A.legsVit, D2),
    feet: gear("Raekor's Striders", A.bootsVit),
    mainhand: gearE("Gimmershred", A.wpn, [N("emerald")]),
    offhand: gear("Arreat's Law", A.off, [N("emerald")]),
  },
  ["The Furnace", "Stone Gauntlets", "Convention of Elements"],
  ["Ancient Spear|Boulder Toss", "Weapon Throw|Mighty Throw", "Furious Charge|Merciless Assault", "Wrath of the Berserker|Insanity", "Battle Rage|Bloodshed", "War Cry|Veteran's Warning"],
  ["No Escape", "Boon of Bul-Kathos", "Rampage", "Nerves of Steel"]);


// ── emit ─────────────────────────────────────────────────────────────────────
const existing = JSON.parse(await readFile(P("public/planner/builds/index.json"), "utf8")).builds;
const newIds = new Set(BUILDS.map((b) => b.id));
const index = { builds: existing.filter((e) => !newIds.has(e.id)) };
for (const b of BUILDS) {
  await writeFile(P("public/planner/builds", `${b.id}.json`), JSON.stringify(b, null, 2) + "\n", "utf8");
  index.builds.push({ id: b.id, name: b.name, klass: b.klass, category: "solo-push", tier: "A", tagline: b.tagline, source: b.source });
}
sortIndex(index.builds);
await writeFile(P("public/planner/builds/index.json"), JSON.stringify(index, null, 2) + "\n", "utf8");
console.log(`wrote ${BUILDS.length} A-tier builds + index (${index.builds.length} total)`);
