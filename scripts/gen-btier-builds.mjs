/**
 * gen-btier-builds.mjs — emit the B-Tier solo-push builds (same engine as the
 * S/A generators). Mainhand uses gearE() for the season ethereal; 2H builds
 * (MotE) equip the 2H ethereal and omit the offhand.
 *
 *   node scripts/gen-btier-builds.mjs && node scripts/validate-build.mjs --all
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
    id: meta.id, name: meta.name, klass, category: "solo-push", tier: "B",
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
  legsVit: ["vit", "armor"], bootsVit: ["vit", "armor"], wpn: ["cdr", "area"], off: ["chc", "cdr"],
};
const D3 = [N("diamond"), N("diamond"), N("diamond")], D2 = [N("diamond"), N("diamond")];
const T3 = [N("topaz"), N("topaz"), N("topaz")], T2 = [N("topaz"), N("topaz")];
const R3 = [N("ruby"), N("ruby"), N("ruby")], R2 = [N("ruby"), N("ruby")];
const Am1 = [N("amethyst")];

// ── B-tier builds ─────────────────────────────────────────────────────────────

// LoD Energy Twister (Wizard)
build({ id: "wizard-lod-twister", name: "LoD Twister", source: "https://maxroll.gg/d3/guides/lod-twister-wizard-guide", tagline: "Energy Twister · LoD" },
  "wizard", {
    head: gear("Pride's Fall", A.helmCrit, [N("topaz")]), shoulders: gear("Mantle of Channeling", A.shoulderCdr),
    neck: gear("Squirt's Necklace", A.amuletEl, [L("legacyofdreams")]), torso: gear("Aquila Cuirass", A.chestVit, T3),
    hands: gear("Stone Gauntlets", A.glovesCrit), wrists: gear("Ashnagarr's Blood Bracer", A.bracerEl),
    waist: gear("The Shame of Delsere", A.beltVit), leftfinger: gear("Halo of Karini", A.ringCrit, [L("stricken")]),
    rightfinger: gear("Convention of Elements", A.ringCrit, [L("trapped")]), legs: gear("Blackthorne's Jousting Mail", A.legsVit, T2),
    feet: gear("Ice Climbers", A.bootsVit), mainhand: gearE("Wizardspike", A.wpn, [N("emerald")]), offhand: gear("Etched Sigil", A.off, [N("diamond")]),
  }, ["Valthek's Rebuke", "The Swami", "Unity"],
  ["Energy Twister|Wicked Wind", "Arcane Torrent|Flame Ward", "Teleport|Safe Passage", "Storm Armor|Shocking Aspect", "Wave of Force|Arcane Attunement", "Magic Weapon|Deflection"],
  ["Elemental Exposure", "Audacity", "Galvanizing Ward", "Illusionist"]);

// DMO Energy Twister (Wizard)
build({ id: "wizard-dmo-twister", name: "DMO Twister", source: "https://maxroll.gg/d3/guides/dmo-twister-wizard-guide", tagline: "Energy Twister · DMO" },
  "wizard", {
    head: gear("Pride's Fall", A.helmCrit, [N("topaz")]), shoulders: gear("Mantle of Channeling", A.shoulderCdr),
    neck: gear("Squirt's Necklace", A.amuletEl, [L("trapped")]), torso: gear("Harness of Truth", A.chestVit, T3),
    hands: gear("Fierce Gauntlets", A.glovesCrit), wrists: gear("Ranslor's Folly", A.bracerEl),
    waist: gear("Captain Crimson's Silk Girdle", A.beltVit), leftfinger: gear("Halo of Karini", A.ringCrit, [L("stricken")]),
    rightfinger: gear("Convention of Elements", A.ringCrit, [L("esoteric")]), legs: gear("Leg Guards of Mystery", A.legsVit, T2),
    feet: gear("Striders of Destiny", A.bootsVit), mainhand: gearE("Wizardspike", A.wpn, [N("emerald")]), offhand: gear("Etched Sigil", A.off, [N("diamond")]),
  }, ["Valthek's Rebuke", "Ring of Royal Grandeur", "Halo of Karini"],
  ["Magic Weapon|Deflection", "Arcane Torrent|Flame Ward", "Slow Time|Exhaustion", "Storm Armor|Shocking Aspect", "Energy Twister|Wicked Wind", "Wave of Force|Arcane Attunement"],
  ["Elemental Exposure", "Audacity", "Unwavering Will", "Illusionist"]);

// LoD Hydra (Wizard)
build({ id: "wizard-lod-hydra", name: "LoD Hydra", source: "https://maxroll.gg/d3/guides/lod-hydra-wizard-guide", tagline: "Hydra · LoD" },
  "wizard", {
    head: gear("The Magistrate", A.helmCrit, [N("topaz")]), shoulders: gear("Pauldrons of the Skeleton King", A.shoulderCdr),
    neck: gear("Squirt's Necklace", A.amuletEl, [L("legacyofdreams")]), torso: gear("Aquila Cuirass", A.chestVit, T3),
    hands: gear("Tasker and Theo", A.glovesCrit), wrists: gear("Ashnagarr's Blood Bracer", A.bracerEl),
    waist: gear("The Shame of Delsere", A.beltVit), leftfinger: gear("Convention of Elements", A.ringCrit, [L("stricken")]),
    rightfinger: gear("Unity", A.ringCrit, [L("enforcer")]), legs: gear("Blackthorne's Jousting Mail", A.legsVit, T2),
    feet: gear("Ice Climbers", A.bootsVit), mainhand: gearE("Wizardspike", A.wpn, [N("emerald")]), offhand: gear("Winter Flurry", A.off, [N("diamond")]),
  }, ["Serpent's Sparker", "Stone Gauntlets", "Halo of Karini"],
  ["Hydra|Mammoth Hydra", "Spectral Blade|Barrier Blades", "Blizzard|Unrelenting Storm", "Black Hole|Spellsteal", "Teleport|Safe Passage", "Storm Armor|Shocking Aspect"],
  ["Elemental Exposure", "Audacity", "Galvanizing Ward", "Arcane Dynamo"]);

// LoD Frozen Orb (Wizard)
build({ id: "wizard-lod-frozen-orb", name: "LoD Frozen Orb", source: "https://maxroll.gg/d3/guides/lod-frozen-orb-wizard-guide", tagline: "Frozen Orb · LoD" },
  "wizard", {
    head: gear("Pride's Fall", A.helmCrit, [N("topaz")]), shoulders: gear("Pauldrons of the Skeleton King", A.shoulderCdr),
    neck: gear("Squirt's Necklace", A.amuletEl, [L("legacyofdreams")]), torso: gear("Aquila Cuirass", A.chestVit, T3),
    hands: gear("Stone Gauntlets", A.glovesCrit), wrists: gear("Ashnagarr's Blood Bracer", A.bracerEl),
    waist: gear("The Shame of Delsere", A.beltVit), leftfinger: gear("Halo of Karini", A.ringCrit, [L("stricken")]),
    rightfinger: gear("Convention of Elements", A.ringCrit, [L("trapped")]), legs: gear("Blackthorne's Jousting Mail", A.legsVit, T2),
    feet: gear("Ice Climbers", A.bootsVit), mainhand: gearE("Wizardspike", A.wpn, [N("emerald")]), offhand: gear("Triumvirate", A.off, [N("diamond")]),
  }, ["Wizardspike", "Stone Gauntlets", "Unity"],
  ["Arcane Orb|Frozen Orb", "Spectral Blade|Barrier Blades", "Storm Armor|Shocking Aspect", "Black Hole|Absolute Zero", "Magic Weapon|Deflection", "Teleport|Wormhole"],
  ["Galvanizing Ward", "Power Hungry", "Elemental Exposure", "Blur"]);

// DMO Frozen Orb (Wizard)
build({ id: "wizard-dmo-frozen-orb", name: "DMO Frozen Orb", source: "https://maxroll.gg/d3/guides/dmo-frozen-orb-wizard-guide", tagline: "Frozen Orb · DMO" },
  "wizard", {
    head: gear("Shrouded Mask", A.helmCrit, [N("topaz")]), shoulders: gear("Dashing Pauldrons of Despair", A.shoulderCdr),
    neck: gear("Squirt's Necklace", A.amuletEl, [L("trapped")]), torso: gear("Harness of Truth", A.chestVit, T3),
    hands: gear("Fierce Gauntlets", A.glovesCrit), wrists: gear("Ashnagarr's Blood Bracer", A.bracerEl),
    waist: gear("The Shame of Delsere", A.beltVit), leftfinger: gear("Focus", A.ringCrit, [L("zei")]),
    rightfinger: gear("Restraint", A.ringCrit, [L("stricken")]), legs: gear("Leg Guards of Mystery", A.legsVit, T2),
    feet: gear("Striders of Destiny", A.bootsVit), mainhand: gearE("Wizardspike", A.wpn, [N("emerald")]), offhand: gear("Triumvirate", A.off, [N("diamond")]),
  }, ["Wizardspike", "Crown of the Primus", "Halo of Karini"],
  ["Arcane Orb|Frozen Orb", "Slow Time|Time Warp", "Spectral Blade|Barrier Blades", "Storm Armor|Shocking Aspect", "Black Hole|Absolute Zero", "Teleport|Wormhole"],
  ["Galvanizing Ward", "Power Hungry", "Blur", "Elemental Exposure"]);

// LoD Wave of Light (Monk)
build({ id: "monk-lod-wave-of-light", name: "LoD WoL", source: "https://maxroll.gg/d3/guides/lod-wave-of-light-monk-guide", tagline: "Wave of Light · LoD" },
  "monk", {
    head: gear("Tzo Krin's Gaze", A.helmCrit, [N("diamond")]), shoulders: gear("Lefebvre's Soliloquy", A.shoulderCdr),
    neck: gear("Squirt's Necklace", A.amuletEl, [L("legacyofdreams")]), torso: gear("Cindercoat", A.chestVit, R3),
    hands: gear("Magefist", A.glovesCrit), wrists: gear("Pinto's Pride", A.bracerEl),
    waist: gear("The Witching Hour", A.beltVit), leftfinger: gear("Avarice Band", A.ringCrit, [L("trapped")]),
    rightfinger: gear("Unity", A.ringCrit, [L("enforcer")]), legs: gear("Blackthorne's Jousting Mail", A.legsVit, R2),
    feet: gear("The Crudest Boots", A.bootsVit), mainhand: gearE("Bartuc's Cut-Throat", A.wpn, [N("emerald")]), offhand: gear("Rabid Strike", A.off, [N("emerald")]),
  }, ["Incense Torch of the Grand Temple", "Kyoshiro's Blade", "Obsidian Ring of the Zodiac"],
  ["Wave of Light|Explosive Light", "Mystic Ally|Air Ally", "Epiphany|Desert Shroud", "Cyclone Strike|Implosion", "Mantra of Salvation|Agility", "Blinding Flash|Faith in the Light"],
  ["Beacon of Ytar", "Seize the Initiative", "The Guardian's Path", "Near Death Experience"]);



// Jade Harvester (WD)
build({ id: "witchdoctor-jade-harvester", name: "Jade Harvester", source: "https://maxroll.gg/d3/guides/jade-harvester-witch-doctor-guide", tagline: "Haunt · Locust · Jade" },
  "witchdoctor", {
    head: gear("Jade Harvester's Wisdom", A.helmCrit, [N("topaz")]), shoulders: gear("Jade Harvester's Joy", A.shoulderCdr),
    neck: gear("The Flavor of Time", A.amuletEl, [L("trapped")]), torso: gear("Jade Harvester's Peace", A.chestVit, T3),
    hands: gear("Jade Harvester's Mercy", A.glovesCrit), wrists: gear("Lakumba's Ornament", A.bracerEl),
    waist: gear("Haunting Girdle", A.beltVit), leftfinger: gear("Convention of Elements", A.ringCrit, [L("stricken")]),
    rightfinger: gear("Ring of Emptiness", A.ringCrit, [L("gogok")]), legs: gear("Jade Harvester's Courage", A.legsVit, T2),
    feet: gear("Jade Harvester's Swiftness", A.bootsVit), mainhand: gearE("Ghostflame", A.wpn, [N("emerald")]), offhand: gear("Vile Hive", A.off, [N("diamond")]),
  }, ["The Furnace", "Quetzalcoatl", "Ring of Royal Grandeur"],
  ["Haunt|Resentful Spirits", "Soul Harvest|Languish", "Piranhas|Piranhado", "Spirit Walk|Jaunt", "Horrify|Frightening Aspect", "Locust Swarm|Pestilence"],
  ["Creeping Death", "Grave Injustice", "Spirit Vessel", "Confidence Ritual"]);


// LoD Poison Dart Carnevil (WD)
build({ id: "witchdoctor-lon-poison-dart", name: "LoN Poison Dart", source: "https://maxroll.gg/d3/guides/lod-dart-carnevil-witch-doctor-guide", tagline: "Poison Dart · Carnevil · LoD" },
  "witchdoctor", {
    head: gear("Carnevil", A.helmCrit, [N("topaz")]), shoulders: gear("Pauldrons of the Skeleton King", A.shoulderCdr),
    neck: gear("Squirt's Necklace", A.amuletEl, [L("legacyofdreams")]), torso: gear("Aquila Cuirass", A.chestVit, T3),
    hands: gear("Stone Gauntlets", A.glovesCrit), wrists: gear("Lakumba's Ornament", A.bracerEl),
    waist: gear("The Witching Hour", A.beltVit), leftfinger: gear("Convention of Elements", A.ringCrit, [L("simplicity")]),
    rightfinger: gear("Unity", A.ringCrit, [L("enforcer")]), legs: gear("Depth Diggers", A.legsVit, T2),
    feet: gear("Ice Climbers", A.bootsVit), mainhand: gearE("Ghostflame", A.wpn, [N("emerald")]), offhand: gear("Shukrani's Triumph", A.off, [N("diamond")]),
  }, ["Echoing Fury", "Mask of Jeram", "Convention of Elements"],
  ["Poison Dart|Spined Dart", "Piranhas|Piranhado", "Spirit Walk|Jaunt", "Soul Harvest|Languish", "Horrify|Frightening Aspect", "Big Bad Voodoo|Slam Dance"],
  ["Fetish Sycophants", "Grave Injustice", "Pierce the Veil", "Spirit Vessel"]);

// Pestilence Corpse Lance (Necro)
build({ id: "necromancer-pestilence-corpse-lance", name: "Pestilence Corpse Lance", source: "https://maxroll.gg/d3/guides/pestilence-corpse-lance-necromancer-guide", tagline: "Corpse Lance · Pestilence" },
  "necromancer", {
    head: gear("Pestilence Mask", A.helmCrit, [N("diamond")]), shoulders: gear("Pestilence Defense", A.shoulderCdr),
    neck: gear("Squirt's Necklace", A.amuletEl, [L("trapped")]), torso: gear("Pestilence Robe", A.chestVit, R3),
    hands: gear("Pestilence Gloves", A.glovesCrit), wrists: gear("Strongarm Bracers", A.bracerEl),
    waist: gear("Captain Crimson's Silk Girdle", A.beltVit), leftfinger: gear("Krysbin's Sentence", A.ringCrit, [L("zei")]),
    rightfinger: gear("Convention of Elements", A.ringCrit, [L("gogok")]), legs: gear("Captain Crimson's Thrust", A.legsVit, R2),
    feet: gear("Pestilence Battle Boots", A.bootsVit), mainhand: gearE("Blackbog's Sharp", A.wpn, [N("emerald")]), offhand: gear("Jesseth Skullshield", A.off, [N("diamond")]),
  }, ["Reilena's Shadowhook", "Corpsewhisper Pauldrons", "Ring of Royal Grandeur"],
  ["Corpse Lance|Brittle Touch", "Devour|Voracious", "Simulacrum|Reservoir", "Decrepify|Borrowed Time", "Land of the Dead|Frozen Lands", "Blood Rush|Potency"],
  ["Blood is Power", "Final Service", "Overwhelming Essence", "Stand Alone"]);

// Roland Sweep Attack (Crusader)
build({ id: "crusader-roland-sweep", name: "Roland Sweep", source: "https://maxroll.gg/d3/guides/roland-sweep-attack-crusader-guide", tagline: "Sweep Attack · Roland" },
  "crusader", {
    head: gear("Roland's Visage", A.helmCrit, [N("diamond")]), shoulders: gear("Roland's Mantle", A.shoulderCdr),
    neck: gear("The Traveler's Pledge", A.amuletCc, [L("trapped")]), torso: gear("Roland's Bearing", A.chestVit, D3),
    hands: gear("Roland's Grasp", A.glovesCrit), wrists: gear("Strongarm Bracers", A.bracerEl),
    waist: gear("Captain Crimson's Silk Girdle", A.beltVit), leftfinger: gear("Obsidian Ring of the Zodiac", A.ringCrit, [L("stricken")]),
    rightfinger: gear("Convention of Elements", A.ringCrit, [L("gogok")]), legs: gear("Roland's Determination", A.legsVit, D2),
    feet: gear("Roland's Stride", A.bootsVit), mainhand: gearE("Astreon's Iron Ward", A.wpn, [N("emerald")]), offhand: gear("Denial", A.off, [N("diamond")]),
  }, ["Golden Flense", "Aquila Cuirass", "Ring of Royal Grandeur"],
  ["Sweep Attack|Blazing Sweep", "Iron Skin|Flash", "Akarat's Champion|Prophet", "Laws of Valor|Unstoppable Force", "Condemn|Vacuum", "Steed Charge|Draw and Quarter"],
  ["Fervor", "Finery", "Indestructible", "Holy Cause"]);

// Invoker Thorns (Crusader)
build({ id: "crusader-invoker-thorns", name: "Invoker Thorns", source: "https://maxroll.gg/d3/guides/invoker-thorns-crusader-guide", tagline: "Thorns · Invoker" },
  "crusader", {
    head: gear("Crown of the Invoker", A.helmCrit, [N("diamond")]), shoulders: gear("Burden of the Invoker", A.shoulderCdr),
    neck: gear("The Traveler's Pledge", A.amuletCc, [L("trapped")]), torso: gear("Aquila Cuirass", A.chestVit, D3),
    hands: gear("Pride of the Invoker", A.glovesCrit), wrists: gear("Shackles of the Invoker", A.bracerEl),
    waist: gear("Captain Crimson's Silk Girdle", A.beltVit), leftfinger: gear("The Compass Rose", A.ringCrit, [L("boyarsky")]),
    rightfinger: gear("Convention of Elements", A.ringCrit, [L("stricken")]), legs: gear("Renewal of the Invoker", A.legsVit, D2),
    feet: gear("Zeal of the Invoker", A.bootsVit), mainhand: gearE("Khalim's Will", A.wpn, [N("emerald")]), offhand: gear("Shield of the Steed", A.off, [N("diamond")]),
  }, ["The Furnace", "Leoric's Crown", "Convention of Elements"],
  ["Slash|Zeal", "Iron Skin|Reflective Skin", "Akarat's Champion|Prophet", "Laws of Valor|Unstoppable Force", "Bombardment|Annihilate", "Steed Charge|Draw and Quarter"],
  ["Fervor", "Finery", "Iron Maiden", "Hold Your Ground"]);



// MotE Seismic Slam (Barbarian)
build({ id: "barbarian-mote-seismic-slam", name: "MotE Seismic Slam", source: "https://maxroll.gg/d3/guides/mote-slam-barbarian-guide", tagline: "Seismic Slam · Might of the Earth" },
  "barbarian", {
    head: gear("Eyes of the Earth", A.helmCrit, [N("diamond")]), shoulders: gear("Spires of the Earth", A.shoulderCdr),
    neck: gear("Squirt's Necklace", A.amuletCc, [L("trapped")]), torso: gear("Spirit of the Earth", A.chestVit, D3),
    hands: gear("Pull of the Earth", A.glovesCrit), wrists: gear("Bracers of Destruction", A.bracerEl),
    waist: gear("Captain Crimson's Silk Girdle", A.beltVit), leftfinger: gear("Convention of Elements", A.ringCrit, [L("zei")]),
    rightfinger: gear("Band of Might", A.ringCrit, [L("stricken")]), legs: gear("Weight of the Earth", A.legsVit, D2),
    feet: gear("Foundation of the Earth", A.bootsVit), mainhand: gearE("Gimmershred", A.wpn, [N("emerald")]), offhand: gear("Echoing Fury", A.off, [N("emerald")]),
  }, ["Fury of the Vanished Peak", "Ring of Royal Grandeur", "Obsidian Ring of the Zodiac"],
  ["Seismic Slam|Permafrost", "Leap|Call of Arreat", "Wrath of the Berserker|Thrive on Chaos", "Call of the Ancients|Ancients' Fury", "Battle Rage|Bloodshed", "War Cry|Veteran's Warning"],
  ["No Escape", "Rampage", "Boon of Bul-Kathos", "Nerves of Steel"]);

// IK HotA (Barbarian)
build({ id: "barbarian-ik-hota", name: "IK HotA", source: "https://maxroll.gg/d3/guides/ik-hota-barbarian-guide", tagline: "Hammer of the Ancients · Immortal King" },
  "barbarian", {
    head: gear("Immortal King's Triumph", A.helmCrit, Am1), shoulders: gear("Fury of the Ancients", A.shoulderCdr),
    neck: gear("The Traveler's Pledge", A.amuletCc, [L("trapped")]), torso: gear("Immortal King's Eternal Reign", A.chestVit, D3),
    hands: gear("Immortal King's Irons", A.glovesCrit), wrists: gear("Bracers of the First Men", A.bracerEl),
    waist: gear("Immortal King's Tribal Binding", A.beltVit), leftfinger: gear("Convention of Elements", A.ringCrit, [L("pain")]),
    rightfinger: gear("Band of Might", A.ringCrit, [L("stricken")]), legs: gear("Immortal King's Stature", A.legsVit, D2),
    feet: gear("Immortal King's Stride", A.bootsVit), mainhand: gearE("Gimmershred", A.wpn, [N("emerald")]), offhand: gear("Echoing Fury", A.off, [N("emerald")]),
  }, ["The Gavel of Judgment", "Mortick's Brace", "Obsidian Ring of the Zodiac"],
  ["Hammer of the Ancients|Smash", "Wrath of the Berserker|Insanity", "Call of the Ancients|Together as One", "Furious Charge|Merciless Assault", "Battle Rage|Bloodshed", "Ancient Spear|Rage Flip"],
  ["Rampage", "Berserker Rage", "Brawler", "Nerves of Steel"]);

// ── emit ─────────────────────────────────────────────────────────────────────
const existing = JSON.parse(await readFile(P("public/planner/builds/index.json"), "utf8")).builds;
const newIds = new Set(BUILDS.map((b) => b.id));
const index = { builds: existing.filter((e) => !newIds.has(e.id)) };
for (const b of BUILDS) {
  await writeFile(P("public/planner/builds", `${b.id}.json`), JSON.stringify(b, null, 2) + "\n", "utf8");
  index.builds.push({ id: b.id, name: b.name, klass: b.klass, category: "solo-push", tier: "B", tagline: b.tagline, source: b.source });
}
sortIndex(index.builds);
await writeFile(P("public/planner/builds/index.json"), JSON.stringify(index, null, 2) + "\n", "utf8");
console.log(`wrote ${BUILDS.length} B-tier builds + index (${index.builds.length} total)`);
