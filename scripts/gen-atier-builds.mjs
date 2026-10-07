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

// LoD Poison Scythe (Necro)
build({ id: "necromancer-lod-poison-scythe", name: "LoD Poison Scythe",
  source: "https://maxroll.gg/d3/guides/lod-poison-scythe-necromancer-guide", tagline: "Grim Scythe · Poison · LoD" },
  "necromancer", {
    head: gear("Andariel's Visage", A.helmCrit, [N("amethyst")]),
    shoulders: gear("Razeth's Volition", A.shoulderCdr),
    neck: gear("Haunted Visions", A.amuletCc, [L("legacyofdreams")]),
    torso: gear("Aquila Cuirass", A.chestVit, R3),
    hands: gear("Stone Gauntlets", A.glovesCrit),
    wrists: gear("Nemesis Bracers", A.bracerEl),
    waist: gear("Dayntee's Binding", A.beltVit),
    leftfinger: gear("Krysbin's Sentence", A.ringCrit, [L("simplicity")]),
    rightfinger: gear("Convention of Elements", A.ringCrit, [L("stricken")]),
    legs: gear("Depth Diggers", A.legsVit, T2),
    feet: gear("Ice Climbers", A.bootsVit),
    mainhand: gearE("Blackbog's Sharp", A.wpn, [N("emerald")]),
    offhand: gear("Leger's Disdain", A.off, [N("diamond")]),
  },
  ["Nayr's Black Death", "Trag'Oul's Corroded Fang", "The Flavor of Time"],
  ["Grim Scythe|Cursed Scythe", "Simulacrum|Blood and Bone", "Bone Armor|Dislocation", "Bone Spear|Blighted Marrow", "Death Nova|Blight", "Blood Rush|Potency"],
  ["Spreading Malediction", "Eternal Torment", "Swift Harvesting", "Stand Alone"]);

// Vyr Reverse Archon Frozen Orb (Wizard)
build({ id: "wizard-vyr-reverse-archon-fo", name: "Vyr Reverse Archon FO",
  source: "https://maxroll.gg/d3/guides/vyr-reverse-archon-frozen-orb-wizard-guide", tagline: "Frozen Orb · Vyr · Archon" },
  "wizard", {
    head: gear("Vyr's Sightless Skull", A.helmCrit, [N("topaz")]),
    shoulders: gear("Vyr's Proud Pauldrons", A.shoulderCdr),
    neck: gear("Squirt's Necklace", ["chd", "elemental", "chc"], [L("trapped")]),
    torso: gear("Vyr's Astonishing Aura", A.chestVit, T3),
    hands: gear("Vyr's Grasping Gauntlets", A.glovesCrit),
    wrists: gear("Ashnagarr's Blood Bracer", A.bracerEl),
    waist: gear("Fazula's Improbable Chain", A.beltVit),
    leftfinger: gear("Convention of Elements", A.ringCrit, [L("stricken")]),
    rightfinger: gear("Unity", A.ringCrit, [L("zei")]),
    legs: gear("Vyr's Fantastic Finery", A.legsVit, T2),
    feet: gear("Vyr's Swaggering Stance", A.bootsVit),
    mainhand: gearE("Wizardspike", A.wpn, [N("emerald")]),
    offhand: gear("Triumvirate", A.off, [N("diamond")]),
  },
  ["Wizardspike", "The Swami", "Halo of Karini"],
  ["Archon|Combustion", "Arcane Orb|Frozen Orb", "Shock Pulse|Piercing Orb", "Black Hole|Absolute Zero", "Magic Weapon|Deflection", "Storm Armor|Shocking Aspect"],
  ["Evocation", "Galvanizing Ward", "Power Hungry", "Elemental Exposure"]);

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

// Typhon Hydra (Wizard)
build({ id: "wizard-typhon-hydra", name: "Typhon Hydra",
  source: "https://maxroll.gg/d3/guides/typhon-hydra-wizard-guide", tagline: "Hydra · Typhon" },
  "wizard", {
    head: gear("The Magistrate", A.helmCrit, [N("topaz")]),
    shoulders: gear("Typhon's Tibia", A.shoulderCdr),
    neck: gear("Squirt's Necklace", ["chd", "elemental", "chc"], [L("trapped")]),
    torso: gear("Typhon's Thorax", A.chestVit, T3),
    hands: gear("Typhon's Claws", A.glovesCrit),
    wrists: gear("Ashnagarr's Blood Bracer", A.bracerEl),
    waist: gear("The Shame of Delsere", A.beltVit),
    leftfinger: gear("Halo of Karini", A.ringCrit, [L("enforcer")]),
    rightfinger: gear("Convention of Elements", A.ringCrit, [L("stricken")]),
    legs: gear("Typhon's Abdomen", A.legsVit, T2),
    feet: gear("Typhon's Tarsus", A.bootsVit),
    mainhand: gearE("Wizardspike", A.wpn, [N("emerald")]),
    offhand: gear("Winter Flurry", A.off, [N("diamond")]),
  },
  ["Serpent's Sparker", "Ring of Royal Grandeur", "Tasker and Theo"],
  ["Hydra|Frost Hydra", "Blizzard|Apocalypse", "Spectral Blade|Barrier Blades", "Storm Armor|Shocking Aspect", "Black Hole|Absolute Zero", "Teleport|Wormhole"],
  ["Galvanizing Ward", "Elemental Exposure", "Audacity", "Arcane Dynamo"]);

// Patterns of Justice Tempest Rush (Monk)
build({ id: "monk-poj-tempest-rush", name: "PoJ Tempest Rush",
  source: "https://maxroll.gg/d3/guides/patterns-of-justice-tempest-rush-monk-guide", tagline: "Tempest Rush · PoJ" },
  "monk", {
    head: gear("Decree of Justice", A.helmCrit, [N("diamond")]),
    shoulders: gear("Mirrors of Justice", A.shoulderCdr),
    neck: gear("Squirt's Necklace", ["chd", "elemental", "chc"], [L("trapped")]),
    torso: gear("Lamellars of Justice", A.chestVit, D3),
    hands: gear("Bazubands of Justice", A.glovesCrit),
    wrists: gear("Cesar's Memento", A.bracerEl),
    waist: gear("Captain Crimson's Silk Girdle", A.beltVit),
    leftfinger: gear("Convention of Elements", A.ringCrit, [L("taeguk")]),
    rightfinger: gear("Obsidian Ring of the Zodiac", A.ringCrit, [L("gogok")]),
    legs: gear("Mountains of Justice", A.legsVit, D2),
    feet: gear("Captain Crimson's Waders", A.bootsVit),
    mainhand: gearE("Jade Talon", A.wpn, [N("emerald")]),
    offhand: gear("Won Khim Lau", A.off, [N("diamond")]),
  },
  ["Balance", "Mantle of Channeling", "Ring of Royal Grandeur"],
  ["Tempest Rush|Flurry", "Sweeping Wind|Inner Storm", "Epiphany|Desert Shroud", "Blinding Flash|Faith in the Light", "Mantra of Salvation|Agility", "Serenity|Ascension"],
  ["Beacon of Ytar", "Seize the Initiative", "Harmony", "The Guardian's Path"]);

// Helltooth Zombie Bears (WD)
build({ id: "witchdoctor-helltooth-zombie-bears", name: "Helltooth Zombie Bears",
  source: "https://maxroll.gg/d3/guides/helltooth-zombie-bears-witch-doctor-guide", tagline: "Zombie Bears · Helltooth" },
  "witchdoctor", {
    head: gear("Helltooth Mask", A.helmCrit, [N("topaz")]),
    shoulders: gear("Helltooth Mantle", A.shoulderCdr),
    neck: gear("Squirt's Necklace", ["chd", "elemental", "chc"], [L("trapped")]),
    torso: gear("Helltooth Tunic", A.chestVit, T3),
    hands: gear("Helltooth Gauntlets", A.glovesCrit),
    wrists: gear("Lakumba's Ornament", A.bracerEl),
    waist: gear("Captain Crimson's Silk Girdle", A.beltVit),
    leftfinger: gear("The Compass Rose", A.ringCrit, [L("stricken")]),
    rightfinger: gear("Ring of Emptiness", A.ringCrit, [L("gogok")]),
    legs: gear("Captain Crimson's Thrust", A.legsVit, T2),
    feet: gear("Captain Crimson's Waders", A.bootsVit),
    mainhand: gearE("Arioc's Needle", A.wpn, [N("emerald")]),
    offhand: gear("Ursua's Trodden Effigy", A.off, [N("diamond")]),
  },
  ["In-geom", "Shukrani's Triumph", "Ring of Royal Grandeur"],
  ["Zombie Charger|Zombie Bears", "Wall of Death|Wall of Zombies", "Soul Harvest|Languish", "Piranhas|Piranhado", "Spirit Walk|Severance", "Locust Swarm|Pestilence"],
  ["Confidence Ritual", "Swampland Attunement", "Grave Injustice", "Blood Ritual"]);

// Mundunugu Spirit Barrage (WD)
build({ id: "witchdoctor-mundunugu-spirit-barrage", name: "Mundunugu Spirit Barrage",
  source: "https://maxroll.gg/d3/guides/mundunugu-spirit-barrage-witch-doctor-guide", tagline: "Spirit Barrage · Mundunugu" },
  "witchdoctor", {
    head: gear("Mundunugu's Headdress", A.helmCrit, [N("topaz")]),
    shoulders: gear("Mundunugu's Descendant", A.shoulderCdr),
    neck: gear("The Traveler's Pledge", ["chd", "elemental", "chc"], [L("trapped")]),
    torso: gear("Mundunugu's Robe", A.chestVit, T3),
    hands: gear("Mundunugu's Rhythm", A.glovesCrit),
    wrists: gear("Lakumba's Ornament", A.bracerEl),
    waist: gear("Captain Crimson's Silk Girdle", A.beltVit),
    leftfinger: gear("Ring of Emptiness", A.ringCrit, [L("gogok")]),
    rightfinger: gear("The Compass Rose", A.ringCrit, [L("stricken")]),
    legs: gear("Mundunugu's Decoration", A.legsVit, T2),
    feet: gear("Mundunugu's Dance", A.bootsVit),
    mainhand: gearE("Arioc's Needle", A.wpn, [N("emerald")]),
    offhand: gear("Gazing Demise", A.off, [N("diamond")]),
  },
  ["Sacred Harvester", "Aquila Cuirass", "Ring of Royal Grandeur"],
  ["Spirit Barrage|Manitou", "Locust Swarm|Pestilence", "Spirit Walk|Jaunt", "Big Bad Voodoo|Ghost Trance", "Soul Harvest|Languish", "Piranhas|Piranhado"],
  ["Rush of Essence", "Grave Injustice", "Confidence Ritual", "Gruesome Feast"]);

// Zunimassa Poison Dart (WD)
build({ id: "witchdoctor-zunimassa-poison-dart", name: "Zunimassa Poison Dart",
  source: "https://maxroll.gg/d3/guides/zunimassa-poison-dart-witch-doctor-guide", tagline: "Poison Dart · Zunimassa" },
  "witchdoctor", {
    head: gear("Carnevil", A.helmCrit, [N("topaz")]),
    shoulders: gear("Aughild's Power", A.shoulderCdr),
    neck: gear("The Traveler's Pledge", ["chd", "elemental", "chc"], [L("stricken")]),
    torso: gear("Zunimassa's Marrow", A.chestVit, T3),
    hands: gear("Zunimassa's Finger Wraps", A.glovesCrit),
    wrists: gear("Aughild's Search", A.bracerEl),
    waist: gear("The Witching Hour", A.beltVit),
    leftfinger: gear("The Compass Rose", A.ringCrit, [L("simplicity")]),
    rightfinger: gear("Zunimassa's Pox", A.ringCrit, [L("enforcer")]),
    legs: gear("Depth Diggers", A.legsVit, T2),
    feet: gear("Zunimassa's Trail", A.bootsVit),
    mainhand: gearE("Arioc's Needle", A.wpn, [N("emerald")]),
    offhand: gear("Zunimassa's String of Skulls", A.off, [N("diamond")]),
  },
  ["Echoing Fury", "Mask of Jeram", "Ring of Royal Grandeur"],
  ["Poison Dart|Spined Dart", "Fetish Army|Legion of Daggers", "Piranhas|Piranhado", "Spirit Walk|Jaunt", "Soul Harvest|Languish", "Horrify|Frightening Aspect"],
  ["Fetish Sycophants", "Grave Injustice", "Spirit Vessel", "Pierce the Veil"]);

// Marauder Sentry (DH)
build({ id: "demonhunter-marauder-sentry", name: "Marauder Sentry",
  source: "https://maxroll.gg/d3/guides/marauder-sentry-demon-hunter-guide", tagline: "Sentry · Marauder" },
  "demonhunter", {
    head: gear("Marauder's Visage", A.helmCrit, [N("diamond")]),
    shoulders: gear("Marauder's Spines", A.shoulderCdr),
    neck: gear("Squirt's Necklace", A.amuletCc, [L("trapped")]),
    torso: gear("Marauder's Carapace", A.chestVit, D3),
    hands: gear("Marauder's Gloves", A.glovesCrit),
    wrists: gear("Wraps of Clarity", A.bracerEl),
    waist: gear("Captain Crimson's Silk Girdle", A.beltVit),
    leftfinger: gear("Focus", A.ringCrit, [L("enforcer")]),
    rightfinger: gear("Restraint", A.ringCrit, [L("zei")]),
    legs: gear("Captain Crimson's Thrust", A.legsVit, D2),
    feet: gear("Captain Crimson's Waders", A.bootsVit),
    mainhand: gearE("Windforce", A.wpn, [N("emerald")]),
    offhand: gear("Bombardier's Rucksack", A.off, [N("diamond")]),
  },
  ["Manticore", "Zoey's Secret", "Ring of Royal Grandeur"],
  ["Cluster Arrow|Loaded for Bear", "Sentry|Polar Station", "Vengeance|Dark Heart", "Evasive Fire|Hardened", "Companion|Boar Companion", "Smoke Screen|Special Recipe"],
  ["Custom Engineering", "Grenadier", "Cull the Weak", "Ambush"]);

// UE Multishot (DH)
build({ id: "demonhunter-ue-multishot", name: "UE Multishot",
  source: "https://maxroll.gg/d3/guides/ue-multishot-demon-hunter-guide", tagline: "Multishot · Unhallowed Essence" },
  "demonhunter", {
    head: gear("Accursed Visage", A.helmCrit, [N("diamond")]),
    shoulders: gear("Unsanctified Shoulders", A.shoulderCdr),
    neck: gear("Squirt's Necklace", A.amuletCc, [L("trapped")]),
    torso: gear("Cage of the Hellborn", A.chestVit, D3),
    hands: gear("Fiendish Grips", A.glovesCrit),
    wrists: gear("Wraps of Clarity", A.bracerEl),
    waist: gear("Captain Crimson's Silk Girdle", A.beltVit),
    leftfinger: gear("Focus", A.ringCrit, [L("zei")]),
    rightfinger: gear("Restraint", A.ringCrit, [L("stricken")]),
    legs: gear("Unholy Plates", A.legsVit, D2),
    feet: gear("Hell Walkers", A.bootsVit),
    mainhand: gearE("Windforce", A.wpn, [N("emerald")]),
    offhand: gear("Dead Man's Legacy", A.off, [N("diamond")]),
  },
  ["Dawn", "Depth Diggers", "Ring of Royal Grandeur"],
  ["Multishot|Arsenal", "Preparation|Invigoration", "Vengeance|Dark Heart", "Vault|Tumble", "Companion|Wolf Companion", "Smoke Screen|Lingering Fog"],
  ["Ambush", "Tactical Advantage", "Ballistics", "Cull the Weak"]);

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

// LoD Blessed Shield (Crusader)
build({ id: "crusader-lod-blessed-shield", name: "LoD Blessed Shield",
  source: "https://maxroll.gg/d3/guides/lod-blessed-shield-crusader-guide", tagline: "Blessed Shield · LoD" },
  "crusader", {
    head: gear("Leoric's Crown", A.helmCrit, [N("diamond")]),
    shoulders: gear("Pauldrons of the Skeleton King", A.shoulderCdr),
    neck: gear("The Flavor of Time", A.amuletCc, [L("legacyofdreams")]),
    torso: gear("Aquila Cuirass", A.chestVit, D3),
    hands: gear("Stone Gauntlets", A.glovesCrit),
    wrists: gear("Akkhan's Manacles", A.bracerEl),
    waist: gear("The Witching Hour", A.beltVit),
    leftfinger: gear("Justice Lantern", A.ringCrit, [L("trapped")]),
    rightfinger: gear("Stone of Jordan", A.ringCrit, [L("stricken")]),
    legs: gear("Blackthorne's Jousting Mail", A.legsVit, D2),
    feet: gear("Ice Climbers", A.bootsVit),
    mainhand: gearE("Astreon's Iron Ward", A.wpn, [N("emerald")]),
    offhand: gear("Jekangbord", A.off, [N("diamond")]),
  },
  ["Akkhan's Leniency", "Aquila Cuirass", "Convention of Elements"],
  ["Blessed Shield|Combust", "Iron Skin|Flash", "Akarat's Champion|Prophet", "Laws of Valor|Critical", "Condemn|Vacuum", "Steed Charge|Endurance"],
  ["Fervor", "Finery", "Towering Shield", "Hold Your Ground"]);

// LoN Bombardment (Crusader)
build({ id: "crusader-lon-bombardment", name: "LoN Bombardment",
  source: "https://maxroll.gg/d3/guides/lon-bombardment-crusader-guide", tagline: "Bombardment · LoN" },
  "crusader", {
    head: gear("Leoric's Crown", A.helmCrit, [N("diamond")]),
    shoulders: gear("Pauldrons of the Skeleton King", A.shoulderCdr),
    neck: gear("Squirt's Necklace", A.amuletCc, [L("trapped")]),
    torso: gear("Aquila Cuirass", A.chestVit, D3),
    hands: gear("Stone Gauntlets", A.glovesCrit),
    wrists: gear("Strongarm Bracers", A.bracerEl),
    waist: gear("Belt of the Trove", A.beltVit),
    leftfinger: gear("Justice Lantern", A.ringCrit, [L("boyarsky")]),
    rightfinger: gear("Convention of Elements", A.ringCrit, [L("stricken")]),
    legs: gear("Blackthorne's Jousting Mail", A.legsVit, D2),
    feet: gear("Ice Climbers", A.bootsVit),
    mainhand: gearE("The Redeemer", A.wpn, [N("emerald")]),
    offhand: gear("Akarat's Awakening", A.off, [N("diamond")]),
  },
  ["The Mortal Drama", "Aquila Cuirass", "Convention of Elements"],
  ["Bombardment|Barrels of Spikes", "Punish|Celerity", "Akarat's Champion|Prophet", "Iron Skin|Reflective Skin", "Condemn|Vacuum", "Laws of Justice|Decaying Strength"],
  ["Fervor", "Iron Maiden", "Finery", "Hold Your Ground"]);

// AoV Heaven's Fury (Crusader)
build({ id: "crusader-aov-heavens-fury", name: "AoV Heaven's Fury",
  source: "https://maxroll.gg/d3/guides/aov-heavens-fury-crusader-guide", tagline: "Heaven's Fury · Aegis of Valor" },
  "crusader", {
    head: gear("Crown of Valor", A.helmCrit, [N("diamond")]),
    shoulders: gear("Spaulders of Valor", A.shoulderCdr),
    neck: gear("The Flavor of Time", A.amuletCc, [L("trapped")]),
    torso: gear("Brigandine of Valor", A.chestVit, D3),
    hands: gear("Gauntlets of Valor", A.glovesCrit),
    wrists: gear("Bracer of Fury", A.bracerEl),
    waist: gear("Captain Crimson's Silk Girdle", A.beltVit),
    leftfinger: gear("Convention of Elements", A.ringCrit, [L("stricken")]),
    rightfinger: gear("Obsidian Ring of the Zodiac", A.ringCrit, [L("pain")]),
    legs: gear("Chausses of Valor", A.legsVit, D2),
    feet: gear("Greaves of Valor", A.bootsVit),
    mainhand: gearE("The Redeemer", A.wpn, [N("emerald")]),
    offhand: gear("Shield of Fury", A.off, [N("diamond")]),
  },
  ["Fate of the Fell", "Ivory Tower", "Ring of Royal Grandeur"],
  ["Heaven's Fury|Fires of Heaven", "Fist of the Heavens|Fissure", "Judgment|Deliberation", "Laws of Valor|Unstoppable Force", "Akarat's Champion|Prophet", "Iron Skin|Flash"],
  ["Fervor", "Holy Cause", "Long Arm of the Law", "Finery"]);

// LoD HotA (Barbarian)
build({ id: "barbarian-lod-hota", name: "LoD HotA",
  source: "https://maxroll.gg/d3/guides/lod-hota-barbarian-guide", tagline: "Hammer of the Ancients · LoD" },
  "barbarian", {
    head: gear("Leoric's Crown", A.helmCrit, [N("diamond")]),
    shoulders: gear("Fury of the Ancients", A.shoulderCdr),
    neck: gear("Squirt's Necklace", A.amuletCc, [L("legacyofdreams")]),
    torso: gear("Cindercoat", A.chestVit, D3),
    hands: gear("Stone Gauntlets", A.glovesCrit),
    wrists: gear("Bracers of the First Men", A.bracerEl),
    waist: gear("The Witching Hour", A.beltVit),
    leftfinger: gear("Convention of Elements", A.ringCrit, [L("trapped")]),
    rightfinger: gear("Band of Might", A.ringCrit, [L("stricken")]),
    legs: gear("Blackthorne's Jousting Mail", A.legsVit, D2),
    feet: gear("Ice Climbers", A.bootsVit),
    mainhand: gearE("Gimmershred", A.wpn, [N("emerald")]),
    offhand: gear("Echoing Fury", A.off, [N("emerald")]),
  },
  ["The Gavel of Judgment", "Obsidian Ring of the Zodiac", "Mortick's Brace"],
  ["Hammer of the Ancients|Smash", "Call of the Ancients|Together as One", "Ground Stomp|Wrenching Smash", "Wrath of the Berserker|Insanity", "Battle Rage|Bloodshed", "War Cry|Veteran's Warning"],
  ["Rampage", "Boon of Bul-Kathos", "Berserker Rage", "Brawler"]);

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

// Savage Frenzy (Barbarian)
build({ id: "barbarian-savage-frenzy", name: "Savage Frenzy",
  source: "https://maxroll.gg/d3/guides/savage-frenzy-barbarian-guide", tagline: "Frenzy · Horde of the Ninety Savages" },
  "barbarian", {
    head: gear("Skull of Savages", A.helmCrit, [N("diamond")]),
    shoulders: gear("Spines of Savages", A.shoulderCdr),
    neck: gear("Squirt's Necklace", A.amuletCc, [L("trapped")]),
    torso: gear("Markings of Savages", A.chestVit, D3),
    hands: gear("Claws of Savages", A.glovesCrit),
    wrists: gear("Nemesis Bracers", A.bracerEl),
    waist: gear("The Undisputed Champion", A.beltVit),
    leftfinger: gear("Restraint", A.ringCrit, [L("simplicity")]),
    rightfinger: gear("Focus", A.ringCrit, [L("stricken")]),
    legs: gear("Depth Diggers", A.legsVit, D2),
    feet: gear("Heel of Savages", A.bootsVit),
    mainhand: gearE("Gimmershred", A.wpn, [N("emerald")]),
    offhand: gear("Oathkeeper", A.off, [N("emerald")]),
  },
  ["Bastion's Revered", "Depth Diggers", "Ring of Royal Grandeur"],
  ["Frenzy|Maniac", "Battle Rage|Bloodshed", "Threatening Shout|Falter", "War Cry|Veteran's Warning", "Wrath of the Berserker|Insanity", "Furious Charge|Cold Rush"],
  ["Rampage", "Berserker Rage", "Boon of Bul-Kathos", "Nerves of Steel"]);

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
