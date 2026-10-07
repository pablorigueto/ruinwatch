/**
 * gen-cdf-support-builds.mjs — emit C/D/F-tier solo-push builds + the Support
 * category builds. Same engine as the prior generators. Support builds use the
 * `support` category and skip augment/ethereal conventions (utility gear).
 *
 *   node scripts/gen-cdf-support-builds.mjs && node scripts/validate-build.mjs --all
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
  } else if (s.runes.length) rune = s.runes[0].letter;
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
    id: meta.id, name: meta.name, klass, category: meta.category || "solo-push", tier: meta.tier,
    ...(meta.noEthereal ? { noEthereal: true } : {}),
    gender: meta.gender || "male", source: meta.source, season: "Rites of Sanctuary", tagline: meta.tagline,
    paragonLevel: 800, paragon: PARAGON, equipped,
    kanai: { weapon: power(kanai[0]), armor: power(kanai[1]), jewelry: power(kanai[2]) },
    skills: { active: active.map((s) => sk(klass, s)), passives: passives.map((p) => pas(klass, p)) },
  });
}
const A = {
  helmCrit: ["chc", "vit"], shoulderCdr: ["cdr", "area", "armor"], amuletCc: ["chd", "wpnphy", "chc"],
  amuletEl: ["chd", "elemental", "chc"], chestVit: ["vit", "armor"], glovesCrit: ["chc", "chd", "cdr"],
  bracerEl: ["elemental", "chc", "vit"], beltVit: ["vit", "life", "armor"], ringCrit: ["chc", "chd", "cdr"],
  ringCdr: ["cdr", "rcr", "chc"], legsVit: ["vit", "armor"], bootsVit: ["vit", "armor"], wpn: ["cdr", "area"], off: ["chc", "cdr"],
  suppWpn: ["cdr", "rcr"], suppGen: ["cdr", "rcr", "armor"], suppHead: ["chc", "vit", "armor"],
};
const D3 = [N("diamond"), N("diamond"), N("diamond")], D2 = [N("diamond"), N("diamond")];
const T3 = [N("topaz"), N("topaz"), N("topaz")], T2 = [N("topaz"), N("topaz")];
const R3 = [N("ruby"), N("ruby"), N("ruby")], R2 = [N("ruby"), N("ruby")];

/* ══════════════ C TIER (solo-push) ══════════════ */

// Aegis of Valor Fist of the Heavens (Crusader) — Season 28 (2.7.5). A versão anterior (S29+) dependia do
// Vigilante Belt P76 + Steed Charge, inexistente nesta versão. Cinto: a fonte usa Thunder God's Vigor (Mighty
// Belt, só Bárbaro) -> Khassett's Cord of Righteousness.
build({ id: "crusader-aov-fist-of-the-heavens", tier: "C", name: "Aegis of Valor Fist of the Heavens", noEthereal: true, source: "https://www.diablofans.com/builds/109974-aegis-of-valor", tagline: "Fist of the Heavens · Heaven's Fury · Aegis of Valor" },
  "crusader", {
    head: gear("Crown of Valor", A.helmCrit, [N("diamond")]), shoulders: gear("Spaulders of Valor", A.shoulderCdr),
    neck: gear("The Traveler's Pledge", A.amuletCc, [L("wreath")]), torso: gear("Brigandine of Valor", A.chestVit, D3),
    hands: gear("Gauntlets of Valor", A.glovesCrit), wrists: gear("Nemesis Bracers", A.bracerEl),
    waist: gear("Khassett's Cord of Righteousness", A.beltVit), leftfinger: gear("Eternal Union", A.ringCrit, [L("stricken")]),
    rightfinger: gear("The Compass Rose", A.ringCrit, [L("powerful")]), legs: gear("Chausses of Valor", A.legsVit, D2),
    feet: gear("Greaves of Valor", A.bootsVit), mainhand: gear("Fate of the Fell", A.wpn, [N("emerald")]), offhand: gear("Shield of Fury", A.off, [N("diamond")]),
  }, ["Darklight", "Bracer of Fury", "Obsidian Ring of the Zodiac"],
  ["Slash|Guard", "Fist of the Heavens|Fissure", "Heaven's Fury|Ascendancy", "Phalanx|Bodyguard", "Akarat's Champion|Prophet", "Laws of Justice|Immovable Object"],
  ["Indestructible", "Wrathful", "Holy Cause", "Vigilant"]);

// Vyr Chantodo Archon (Wizard)
build({ id: "wizard-vyr-chantodo", tier: "C", name: "Vyr Chantodo", noEthereal: true, source: "https://maxroll.gg/d3/guides/vyr-chantodo-archon-wod-wizard-guide", tagline: "Archon · Vyr Chantodo" },
  "wizard", {
    head: gear("Vyr's Sightless Skull", A.helmCrit, [N("diamond")]), shoulders: gear("Vyr's Proud Pauldrons", A.shoulderCdr),
    neck: gear("The Flavor of Time", A.amuletEl, [L("trapped")]), torso: gear("Vyr's Astonishing Aura", A.chestVit, T3),
    hands: gear("Vyr's Grasping Gauntlets", A.glovesCrit), wrists: gear("Nemesis Bracers", A.bracerEl),
    waist: gear("Fazula's Improbable Chain", A.beltVit), leftfinger: gear("Convention of Elements", A.ringCrit, [L("stricken")]),
    rightfinger: gear("Halo of Karini", A.ringCrit, [L("zei")]), legs: gear("Vyr's Fantastic Finery", A.legsVit, T2),
    feet: gear("Vyr's Swaggering Stance", A.bootsVit), mainhand: gearE("Wizardspike", A.wpn, [N("emerald")]), offhand: gear("Chantodo's Force", A.off, [N("diamond")]),
  }, ["The Furnace", "The Swami", "Obsidian Ring of the Zodiac"],
  ["Archon|Slow Time", "Black Hole|Absolute Zero", "Magic Weapon|Deflection", "Storm Armor|Shocking Aspect", "Arcane Torrent|Static Discharge", "Teleport|Wormhole"],
  ["Evocation", "Audacity", "Galvanizing Ward", "Illusionist"]);

// Inna Mystic Ally (Monk)
build({ id: "monk-inna-mystic-ally", tier: "C", name: "Inna Mystic Ally", source: "https://maxroll.gg/d3/guides/inna-mystic-ally-monk-guide", tagline: "Mystic Ally · Inna" },
  "monk", {
    head: gear("Inna's Radiance", A.helmCrit, [N("diamond")]), shoulders: gear("Aughild's Power", A.shoulderCdr),
    neck: gear("Squirt's Necklace", A.amuletEl, [L("enforcer")]), torso: gear("Inna's Vast Expanse", A.chestVit, D3),
    hands: gear("Inna's Hold", A.glovesCrit), wrists: gear("Bindings of the Lesser Gods", A.bracerEl),
    waist: gear("Inna's Favor", A.beltVit), leftfinger: gear("Convention of Elements", A.ringCrit, [L("trapped")]),
    rightfinger: gear("Obsidian Ring of the Zodiac", A.ringCrit, [L("stricken")]), legs: gear("Inna's Temperance", A.legsVit, D2),
    feet: gear("The Crudest Boots", A.bootsVit), mainhand: gearE("Jade Talon", A.wpn, [N("emerald")]), offhand: gear("Shenlong's Fist of Legend", A.off, [N("emerald")]),
  }, ["Flying Dragon", "Ring of Royal Grandeur", "Messerschmidt's Reaver"],
  ["Mystic Ally|Air Ally", "Cyclone Strike|Implosion", "Way of the Hundred Fists|Assimilation", "Dashing Strike|Radiance", "Serenity|Ascension", "Epiphany|Desert Shroud"],
  ["Beacon of Ytar", "Seize the Initiative", "Relentless Assault", "Near Death Experience"]);

// LoD Rapid Fire (DH)
build({ id: "demonhunter-lod-rapid-fire", tier: "C", name: "LoD Rapid Fire", source: "https://maxroll.gg/d3/guides/lod-rapid-fire-demon-hunter-guide", tagline: "Rapid Fire · LoD" },
  "demonhunter", {
    head: gear("Visage of Gunes", A.helmCrit, [N("diamond")]), shoulders: gear("Mantle of Channeling", A.shoulderCdr),
    neck: gear("The Ess of Johan", A.amuletCc, [L("legacyofdreams")]), torso: gear("Cindercoat", A.chestVit, R3),
    hands: gear("Stone Gauntlets", A.glovesCrit), wrists: gear("Lacuni Prowlers", A.bracerEl),
    waist: gear("Hellcat Waistguard", A.beltVit), leftfinger: gear("Convention of Elements", A.ringCrit, [L("pain")]),
    rightfinger: gear("Unity", A.ringCrit, [L("stricken")]), legs: gear("Blackthorne's Jousting Mail", A.legsVit, R2),
    feet: gear("Boots of Disregard", A.bootsVit), mainhand: gearE("Buriza-Do Kyanon", A.wpn, [N("emerald")]), offhand: gear("Sin Seekers", A.off, [N("diamond")]),
  }, ["Wojahnni Assaulter", "Aquila Cuirass", "Squirt's Necklace"],
  ["Rapid Fire|Bombardment", "Vengeance|Side Cannons", "Smoke Screen|Displacement", "Companion|Bat Companion", "Preparation|Focused Mind", "Vault|Tumble"],
  ["Cull the Weak", "Grenadier", "Ambush", "Tactical Advantage"]);

// Uliana EP (Monk)
build({ id: "monk-uliana-ep", tier: "C", name: "Uliana EP", source: "https://maxroll.gg/d3/guides/uliana-exploding-palm-monk-guide", tagline: "Exploding Palm · Uliana" },
  "monk", {
    head: gear("Uliana's Spirit", A.helmCrit, [N("diamond")]), shoulders: gear("Uliana's Strength", A.shoulderCdr),
    neck: gear("The Traveler's Pledge", A.amuletEl, [L("gogok")]), torso: gear("Uliana's Heart", A.chestVit, D3),
    hands: gear("Uliana's Fury", A.glovesCrit), wrists: gear("Gungdo Gear", A.bracerEl),
    waist: gear("Captain Crimson's Silk Girdle", A.beltVit), leftfinger: gear("Obsidian Ring of the Zodiac", A.ringCrit, [L("trapped")]),
    rightfinger: gear("Convention of Elements", A.ringCrit, [L("stricken")]), legs: gear("Captain Crimson's Thrust", A.legsVit, D2),
    feet: gear("Captain Crimson's Waders", A.bootsVit), mainhand: gearE("Bartuc's Cut-Throat", A.wpn, [N("emerald")]), offhand: gear("Lion's Claw", A.off, [N("emerald")]),
  }, ["The Flow of Eternity", "Aquila Cuirass", "Ring of Royal Grandeur"],
  ["Exploding Palm|Impending Doom", "Seven-Sided Strike|Sustained Attack", "Way of the Hundred Fists|Assimilation", "Dashing Strike|Blinding Speed", "Cyclone Strike|Implosion", "Epiphany|Desert Shroud"],
  ["Beacon of Ytar", "Harmony", "The Guardian's Path", "Mythic Rhythm"]);

// Shadow Impale (DH) — Karlei's Point (dagger) + Holy Point Shot
build({ id: "demonhunter-shadow-impale", tier: "C", name: "Shadow Impale", noEthereal: true, source: "https://maxroll.gg/d3/guides/shadow-impale-demon-hunter-guide", tagline: "Impale · The Shadow's Mantle" },
  "demonhunter", {
    head: gear("The Shadow's Mask", A.helmCrit, [N("diamond")]), shoulders: gear("The Shadow's Burden", A.shoulderCdr),
    neck: gear("The Traveler's Pledge", A.amuletCc, [L("trapped")]), torso: gear("The Shadow's Bane", A.chestVit, D3),
    hands: gear("The Shadow's Grasp", A.glovesCrit), wrists: gear("Aughild's Search", A.bracerEl),
    waist: gear("Chain of Shadows", A.beltVit), leftfinger: gear("The Compass Rose", A.ringCrit, [L("gogok")]),
    rightfinger: gear("Elusive Ring", A.ringCrit, [L("esoteric")]), legs: gear("The Shadow's Coil", A.legsVit, D2),
    feet: gear("The Shadow's Heels", A.bootsVit), mainhand: gear("Karlei's Point", A.wpn, [N("emerald")]), offhand: gear("Holy Point Shot", A.off, [N("diamond")]),
  }, ["Dawn", "Aquila Cuirass", "Ring of Royal Grandeur"],
  ["Impale|Overpenetration", "Shadow Power|Blood Moon", "Vengeance|Dark Heart", "Vault|Tumble", "Companion|Boar Companion", "Marked for Death|Valley of Death"],
  ["Cull the Weak", "Awareness", "Ambush", "Steady Aim"]);

// Raiment Generator (Monk)
build({ id: "monk-raiment-generator", tier: "C", name: "Raiment Generator", source: "https://maxroll.gg/d3/guides/raiment-generator-monk-guide", tagline: "Generator · Raiment of a Thousand Storms" },
  "monk", {
    head: gear("Mask of the Searing Sky", A.helmCrit, [N("diamond")]), shoulders: gear("Lefebvre's Soliloquy", A.shoulderCdr),
    neck: gear("The Traveler's Pledge", A.amuletEl, [L("simplicity")]), torso: gear("Heart of the Crashing Wave", A.chestVit, D3),
    hands: gear("Fists of Thunder", A.glovesCrit), wrists: gear("Spirit Guards", A.bracerEl),
    waist: gear("The Witching Hour", A.beltVit), leftfinger: gear("The Compass Rose", A.ringCrit, [L("trapped")]),
    rightfinger: gear("Convention of Elements", A.ringCrit, [L("stricken")]), legs: gear("Scales of the Dancing Serpent", A.legsVit, D2),
    feet: gear("Eight-Demon Boots", A.bootsVit), mainhand: gearE("Jade Talon", A.wpn, [N("emerald")]), offhand: gear("Shenlong's Relentless Assault", A.off, [N("emerald")]),
  }, ["Flying Dragon", "Depth Diggers", "Ring of Royal Grandeur"],
  ["Crippling Wave|Mangle", "Way of the Hundred Fists|Assimilation", "Dashing Strike|Radiance", "Cyclone Strike|Implosion", "Mantra of Salvation|Agility", "Serenity|Ascension"],
  ["Combination Strike", "Exalted Soul", "Alacrity", "Seize the Initiative"]);

// Arachyr Corpse Spiders (WD)
build({ id: "witchdoctor-arachyr-spiders", tier: "C", name: "Arachyr Spiders", source: "https://maxroll.gg/d3/guides/arachyr-corpse-spiders-witch-doctor-guide", tagline: "Corpse Spiders · Arachyr" },
  "witchdoctor", {
    head: gear("Arachyr's Visage", A.helmCrit, [N("diamond")]), shoulders: gear("Arachyr's Mantle", A.shoulderCdr),
    neck: gear("The Traveler's Pledge", A.amuletEl, [L("simplicity")]), torso: gear("Arachyr's Carapace", A.chestVit, T3),
    hands: gear("Arachyr's Claws", A.glovesCrit), wrists: gear("Lakumba's Ornament", A.bracerEl),
    waist: gear("Brood of Araneae", A.beltVit), leftfinger: gear("The Compass Rose", A.ringCrit, [L("enforcer")]),
    rightfinger: gear("Ring of Emptiness", A.ringCrit, [L("trapped")]), legs: gear("Depth Diggers", A.legsVit, T2),
    feet: gear("Arachyr's Stride", A.bootsVit), mainhand: gearE("Ghostflame", A.wpn, [N("emerald")]), offhand: gear("Shukrani's Triumph", A.off, [N("diamond")]),
  }, ["Echoing Fury", "Mask of Jeram", "Ring of Royal Grandeur"],
  ["Corpse Spiders|Widowmakers", "Locust Swarm|Pestilence", "Piranhas|Piranhado", "Spirit Walk|Jaunt", "Soul Harvest|Languish", "Horrify|Frightening Aspect"],
  ["Grave Injustice", "Pierce the Veil", "Confidence Ritual", "Spirit Vessel"]);

// Arachyr Lazy Locust Chicken (WD) — Season 28 (2.7.5). A versão anterior (S29+) dependia do Cluckeye P76
// (pets viram galinhas explosivas), que não existe nesta versão.
build({ id: "witchdoctor-arachyr-chicken", tier: "C", name: "Arachyr Lazy Locust Chicken", noEthereal: true, source: "https://www.diablofans.com/builds/109374-t16-lazy-locust-chicken-s28-2-7-5", tagline: "Angry Chicken · Locust Swarm · Arachyr" },
  "witchdoctor", {
    head: gear("Quetzalcoatl", A.helmCrit, [N("diamond")]), shoulders: gear("Arachyr's Mantle", A.shoulderCdr),
    neck: gear("Squirt's Necklace", A.amuletEl, [L("hoarder")]), torso: gear("Arachyr's Carapace", A.chestVit, T3),
    hands: gear("Arachyr's Claws", A.glovesCrit), wrists: gear("Guardian's Aversion", A.bracerEl),
    waist: gear("Guardian's Case", A.beltVit), leftfinger: gear("Rechel's Ring of Larceny", A.ringCrit, [L("zei")]),
    rightfinger: gear("Ring of Royal Grandeur", A.ringCrit, [L("trapped")]), legs: gear("Arachyr's Legs", A.legsVit, T2),
    feet: gear("Arachyr's Stride", A.bootsVit), mainhand: gear("Manajuma's Carving Knife", A.wpn, [N("emerald")]), offhand: gear("Manajuma's Gory Fetch", A.off, [N("diamond")]),
  }, ["Wormwood", "Krelm's Buff Belt", "Ring of Emptiness"],
  ["Spirit Walk|Severance", "Horrify|Stalker", "Locust Swarm|Pestilence", "Hex|Angry Chicken", "Soul Harvest|Soul to Waste", "Summon Zombie Dogs|Life Link"],
  ["Gruesome Feast", "Pierce the Veil", "Fierce Loyalty", "Grave Injustice"]);

// LoD Spirit Barrage (WD)
build({ id: "witchdoctor-lod-spirit-barrage", tier: "C", name: "LoD Spirit Barrage", source: "https://maxroll.gg/d3/guides/lod-spirit-barrage-witch-doctor-guide", tagline: "Spirit Barrage · LoD" },
  "witchdoctor", {
    head: gear("Andariel's Visage", A.helmCrit, [N("topaz")]), shoulders: gear("Pauldrons of the Skeleton King", A.shoulderCdr),
    neck: gear("Squirt's Necklace", A.amuletEl, [L("legacyofdreams")]), torso: gear("Aquila Cuirass", A.chestVit, T3),
    hands: gear("Frostburn", A.glovesCrit), wrists: gear("Lakumba's Ornament", A.bracerEl),
    waist: gear("Belt of Transcendence", A.beltVit), leftfinger: gear("Convention of Elements", A.ringCrit, [L("stricken")]),
    rightfinger: gear("Ring of Emptiness", A.ringCrit, [L("trapped")]), legs: gear("Blackthorne's Jousting Mail", A.legsVit, T2),
    feet: gear("Ice Climbers", A.bootsVit), mainhand: gearE("Ghostflame", A.wpn, [N("emerald")]), offhand: gear("Gazing Demise", A.off, [N("diamond")]),
  }, ["In-geom", "Stone Gauntlets", "Warzechian Armguards"],
  ["Spirit Barrage|Manitou", "Locust Swarm|Pestilence", "Spirit Walk|Jaunt", "Piranhas|Piranhado", "Soul Harvest|Languish", "Big Bad Voodoo|Slam Dance"],
  ["Grave Injustice", "Confidence Ritual", "Creeping Death", "Swampland Attunement"]);

// Helltooth Gargantuan (WD)
build({ id: "witchdoctor-helltooth-gargs", tier: "C", name: "Helltooth Gargs", source: "https://maxroll.gg/d3/guides/helltooth-gargantuan-witch-doctor-guide", tagline: "Gargantuan · Helltooth" },
  "witchdoctor", {
    head: gear("Helltooth Mask", A.helmCrit, [N("topaz")]), shoulders: gear("Helltooth Mantle", A.shoulderCdr),
    neck: gear("Squirt's Necklace", A.amuletEl, [L("enforcer")]), torso: gear("Helltooth Tunic", A.chestVit, T3),
    hands: gear("Helltooth Gauntlets", A.glovesCrit), wrists: gear("Lakumba's Ornament", A.bracerEl),
    waist: gear("The Witching Hour", A.beltVit), leftfinger: gear("The Short Man's Finger", A.ringCrit, [L("trapped")]),
    rightfinger: gear("Ring of Emptiness", A.ringCrit, [L("stricken")]), legs: gear("Helltooth Leg Guards", A.legsVit, T2),
    feet: gear("Helltooth Greaves", A.bootsVit), mainhand: gearE("Ghostflame", A.wpn, [N("emerald")]), offhand: gear("Shukrani's Triumph", A.off, [N("diamond")]),
  }, ["Echoing Fury", "Mask of Jeram", "Ring of Royal Grandeur"],
  ["Gargantuan|Restless Giant", "Wall of Death|Communing with Spirits", "Soul Harvest|Languish", "Spirit Walk|Jaunt", "Piranhas|Piranhado", "Locust Swarm|Pestilence"],
  ["Midnight Feast", "Confidence Ritual", "Pierce the Veil", "Spirit Vessel"]);

/* ══════════════ D TIER ══════════════ */

// IK Charge (Barbarian)
build({ id: "barbarian-ik-charge", tier: "D", name: "IK Charge", noEthereal: true, source: "https://maxroll.gg/d3/guides/ik-charge-barbarian-guide", tagline: "Furious Charge · Immortal King" },
  "barbarian", {
    head: gear("Immortal King's Triumph", A.helmCrit, [N("diamond")]), shoulders: gear("Raekor's Burden", A.shoulderCdr),
    neck: gear("Squirt's Necklace", A.amuletCc, [L("trapped")]), torso: gear("Immortal King's Eternal Reign", A.chestVit, D3),
    hands: gear("Raekor's Wraps", A.glovesCrit), wrists: gear("Mortick's Brace", A.bracerEl),
    waist: gear("Immortal King's Tribal Binding", A.beltVit), leftfinger: gear("Convention of Elements", A.ringCrit, [L("wreath")]),
    rightfinger: gear("Band of Might", A.ringCrit, [L("stricken")]), legs: gear("Immortal King's Stature", A.legsVit, D2),
    feet: gear("Immortal King's Stride", A.bootsVit), mainhand: gearE("Gimmershred", A.wpn, [N("emerald")]), offhand: gear("Echoing Fury", A.off, [N("emerald")]),
  }, ["Standoff", "Vile Ward", "Ring of Royal Grandeur"],
  ["Furious Charge|Battering Ram", "Seismic Slam|Rumble", "Wrath of the Berserker|Insanity", "Call of the Ancients|Together as One", "Sprint|Marathon", "Battle Rage|Bloodshed"],
  ["Rampage", "Berserker Rage", "Brawler", "Pound of Flesh"]);

/* ══════════════ F TIER ══════════════ */

// LoD Rat Mage (Necro)
build({ id: "necromancer-lod-rat-mage", tier: "F", name: "LoD \"Rat\" Mage", source: "https://maxroll.gg/d3/guides/lod-skeletal-mage-rat-necromancer", tagline: "Skeletal Mage · LoD" },
  "necromancer", {
    head: gear("Andariel's Visage", A.helmCrit, [N("amethyst")]), shoulders: gear("Razeth's Volition", A.shoulderCdr),
    neck: gear("Squirt's Necklace", A.amuletEl, [L("legacyofdreams")]), torso: gear("Requiem Cereplate", A.chestVit, R3),
    hands: gear("Tasker and Theo", A.glovesCrit), wrists: gear("Reaper's Wraps", A.bracerEl),
    waist: gear("The Witching Hour", A.beltVit), leftfinger: gear("Krysbin's Sentence", A.ringCrit, [L("trapped")]),
    rightfinger: gear("Circle of Nailuj's Evol", A.ringCrit, [L("enforcer")]), legs: gear("Hexing Pants of Mr. Yan", A.legsVit, R2),
    feet: gear("Steuart's Greaves", A.bootsVit), mainhand: gearE("Soul Harvest", A.wpn, [N("emerald")]), offhand: gear("Lost Time", A.off, [N("diamond")]),
  }, ["Scythe of the Cycle", "Haunted Visions", "In-geom"],
  ["Skeletal Mage|Singularity", "Simulacrum|Reservoir", "Land of the Dead|Frozen Lands", "Bone Armor|Harvest of Anguish", "Blood Rush|Metabolism", "Devour|Satiated"],
  ["Overwhelming Essence", "Final Service", "Extended Servitude", "Fueled by Death"]);

/* ══════════════ SUPPORT ══════════════ */

// zBarb (S)
build({ id: "support-zbarb", tier: "S", category: "support", name: "Support zBarb", source: "https://maxroll.gg/d3/guides/support-zbarb-guide", tagline: "Group Support · Barbarian" },
  "barbarian", {
    head: gear("Skull of Savages", A.suppHead, [N("diamond")]), shoulders: gear("Raekor's Burden", A.suppGen),
    neck: gear("The Flavor of Time", A.ringCdr, [L("toxin")]), torso: gear("Raekor's Heart", A.chestVit, D3),
    hands: gear("Raekor's Wraps", A.suppGen), wrists: gear("Strongarm Bracers", A.bracerEl),
    waist: gear("Pride of Cassius", A.beltVit), leftfinger: gear("Obsidian Ring of the Zodiac", A.ringCdr, [L("gogok")]),
    rightfinger: gear("Ring of Royal Grandeur", A.ringCdr, [L("wreath")]), legs: gear("Raekor's Breeches", A.legsVit, D2),
    feet: gear("Illusory Boots", A.bootsVit), mainhand: gear("Little Rogue", A.suppWpn, [N("diamond")]), offhand: gear("The Slanderer", A.suppWpn, [N("diamond")]),
  }, ["The Executioner", "Chilanik's Chain", "Oculus Ring"],
  ["Furious Charge|Stamina", "Ignore Pain|Mob Rule", "War Cry|Veteran's Warning", "Threatening Shout|Falter", "Ancient Spear|Rage Flip", "Ground Stomp|Wrenching Smash"],
  ["Inspiring Presence", "Nerves of Steel", "Relentless", "Pound of Flesh"]);

// Support DH (S)
build({ id: "support-demon-hunter", tier: "S", category: "support", name: "Support Demon Hunter", source: "https://maxroll.gg/d3/guides/support-demon-hunter-guide", tagline: "Group Support · Demon Hunter" },
  "demonhunter", {
    head: gear("Leoric's Crown", A.suppHead, [N("diamond")]), shoulders: gear("Mechanical Pauldrons", A.suppGen),
    neck: gear("Rondal's Locket", A.ringCdr, [L("toxin")]), torso: gear("Aquila Cuirass", A.chestVit, D3),
    hands: gear("Gas Powered Automail Forearm", A.suppGen), wrists: gear("Nemesis Bracers", A.bracerEl),
    waist: gear("Hunter's Wrath", A.beltVit), leftfinger: gear("Oculus Ring", A.ringCdr, [L("gogok")]),
    rightfinger: gear("Elusive Ring", A.ringCdr, [L("iceblink")]), legs: gear("Marauder's Encasement", A.legsVit, D2),
    feet: gear("Marauder's Treads", A.bootsVit), mainhand: gear("Odyssey's End", A.suppWpn, [N("diamond")]), offhand: gear("Bombardier's Rucksack", A.off, [N("diamond")]),
  }, ["Buriza-Do Kyanon", "Aquila Cuirass", "The Flavor of Time"],
  ["Entangling Shot|Chain Gang", "Multishot|Wind Chill", "Companion|Wolf Companion", "Strafe|Drifting Shadow", "Smoke Screen|Displacement", "Marked for Death|Contagion"],
  ["Numbing Traps", "Tactical Advantage", "Awareness", "Hot Pursuit"]);

// zMonk (A)
build({ id: "support-zmonk", tier: "A", category: "support", name: "Support zMonk", source: "https://maxroll.gg/d3/guides/support-zmonk-guide", tagline: "Group Support · Monk" },
  "monk", {
    head: gear("Inna's Radiance", A.suppHead, [N("diamond")]), shoulders: gear("Lefebvre's Soliloquy", A.suppGen),
    neck: gear("The Flavor of Time", A.ringCdr, [L("toxin")]), torso: gear("Inna's Vast Expanse", A.chestVit, D3),
    hands: gear("Inna's Hold", A.suppGen), wrists: gear("Nemesis Bracers", A.bracerEl),
    waist: gear("Captain Crimson's Silk Girdle", A.beltVit), leftfinger: gear("Obsidian Ring of the Zodiac", A.ringCdr, [L("gogok")]),
    rightfinger: gear("Oculus Ring", A.ringCdr, [L("iceblink")]), legs: gear("Inna's Temperance", A.legsVit, D2),
    feet: gear("Inna's Sandals", A.bootsVit), mainhand: gearE("Shadow Killer", A.suppWpn, [N("diamond")]), offhand: gear("Stormshield", A.off, [N("diamond")]),
  }, ["Flying Dragon", "Aquila Cuirass", "Ring of Royal Grandeur"],
  ["Crippling Wave|Breaking Wave", "Epiphany|Soothing Mist", "Mantra of Healing|Time of Need", "Inner Sanctuary|Temple of Protection", "Serenity|Tranquility", "Breath of Heaven|Zephyr"],
  ["Beacon of Ytar", "Near Death Experience", "Resolve", "Seize the Initiative"]);

// zNecro (A)
build({ id: "support-znecromancer", tier: "A", category: "support", name: "Support zNecromancer", source: "https://maxroll.gg/d3/guides/support-znecromancer-guide", tagline: "Group Support · Necromancer" },
  "necromancer", {
    head: gear("Leoric's Crown", A.suppHead, [N("diamond")]), shoulders: gear("Pestilence Defense", A.suppGen),
    neck: gear("Rondal's Locket", A.ringCdr, [L("toxin")]), torso: gear("Aquila Cuirass", A.chestVit, D3),
    hands: gear("Pestilence Gloves", A.suppGen), wrists: gear("Nemesis Bracers", A.bracerEl),
    waist: gear("Captain Crimson's Silk Girdle", A.beltVit), leftfinger: gear("Obsidian Ring of the Zodiac", A.ringCdr, [L("gogok")]),
    rightfinger: gear("Oculus Ring", A.ringCdr, [L("iceblink")]), legs: gear("Captain Crimson's Thrust", A.legsVit, D2),
    feet: gear("Steuart's Greaves", A.bootsVit), mainhand: gearE("Blackbog's Sharp", A.suppWpn, [N("diamond")]), offhand: gear("Stormshield", A.off, [N("diamond")]),
  }, ["Messerschmidt's Reaver", "Haunted Visions", "Convention of Elements"],
  ["Land of the Dead|Frozen Lands", "Devour|Cannibalize", "Corpse Lance|Brittle Touch", "Command Skeletons|Enforcer", "Blood Rush|Metabolism", "Frailty|Aura of Frailty"],
  ["Blood is Power", "Eternal Torment", "Life from Death", "Final Service"]);

// zWiz (B)
build({ id: "support-zwizard", tier: "B", category: "support", name: "Support zWizard", source: "https://maxroll.gg/d3/guides/support-zwiz-guide", tagline: "Group Support · Wizard" },
  "wizard", {
    head: gear("Crown of the Primus", A.suppHead, [N("diamond")]), shoulders: gear("Dashing Pauldrons of Despair", A.suppGen),
    neck: gear("The Flavor of Time", A.ringCdr, [L("toxin")]), torso: gear("Harness of Truth", A.chestVit, D3),
    hands: gear("Fierce Gauntlets", A.suppGen), wrists: gear("Strongarm Bracers", A.bracerEl),
    waist: gear("Captain Crimson's Silk Girdle", A.beltVit), leftfinger: gear("Obsidian Ring of the Zodiac", A.ringCdr, [L("gogok")]),
    rightfinger: gear("Oculus Ring", A.ringCdr, [L("iceblink")]), legs: gear("Leg Guards of Mystery", A.legsVit, D2),
    feet: gear("Captain Crimson's Waders", A.bootsVit), mainhand: gear("Aether Walker", A.suppWpn, [N("diamond")]), offhand: gear("Cosmic Strand", A.off, [N("diamond")]),
  }, ["Echoing Fury", "Aquila Cuirass", "Ring of Royal Grandeur"],
  ["Ice Armor|Frozen Storm", "Teleport|Safe Passage", "Slow Time|Exhaustion", "Frost Nova|Bone Chill", "Energy Twister|Gale Force", "Explosive Blast|Chain Reaction"],
  ["Cold Blooded", "Conflagration", "Astral Presence", "Illusionist"]);

// ── emit ─────────────────────────────────────────────────────────────────────
const existing = JSON.parse(await readFile(P("public/planner/builds/index.json"), "utf8")).builds;
const newIds = new Set(BUILDS.map((b) => b.id));
const index = { builds: existing.filter((e) => !newIds.has(e.id)) };
for (const b of BUILDS) {
  await writeFile(P("public/planner/builds", `${b.id}.json`), JSON.stringify(b, null, 2) + "\n", "utf8");
  index.builds.push({ id: b.id, name: b.name, klass: b.klass, category: b.category, tier: b.tier, tagline: b.tagline, source: b.source });
}
sortIndex(index.builds);
await writeFile(P("public/planner/builds/index.json"), JSON.stringify(index, null, 2) + "\n", "utf8");
console.log(`wrote ${BUILDS.length} builds + index (${index.builds.length} total)`);
