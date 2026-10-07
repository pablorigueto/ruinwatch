/**
 * gen-s28-builds.mjs — builds taken from diablofans Season 28 (2.7.5, published
 * before Jul/2023 — the client version RuinWatch runs). Solo-push additions plus
 * the "speed" category (fast T16 / GR / bounty farming templates).
 * Gear, Kanai, skills, passives and legendary gems follow the source; per-slot
 * affixes / normal gems use the house defaults (diablofans doesn't list them).
 * The source weapons are kept (`noEthereal`), not swapped for the class Ethereal.
 *
 *   node scripts/gen-s28-builds.mjs && node scripts/validate-build.mjs --all
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

/** Current version of an item by exact name: not legacy, highest Pnn_ prefix. */
const pnum = (id) => Number(/^[Pp](\d+)_/.exec(id)?.[1] ?? 0);
function current(name, filter = () => true) {
  const hits = d.items.filter((i) => !i.legacy && filter(i) && (i.name || "").toLowerCase() === name.toLowerCase());
  return hits.sort((a, b) => pnum(b.id) - pnum(a.id))[0];
}
function item(name) {
  const it = current(name);
  if (!it) throw new Error(`item not found: ${name}`);
  return it.id;
}
function power(name) {
  const it = current(name, (i) => !!i.required?.custom?.id);
  if (!it) throw new Error(`power not found: ${name}`);
  return it.required.custom.id;
}
function sk(klass, [sname, rname]) {
  const s = skills.classes[klass].active.find((a) => a.name.toLowerCase() === sname.toLowerCase());
  if (!s) throw new Error(`skill not found: ${klass} ${sname}`);
  const r = s.runes.find((x) => x.name.toLowerCase() === rname.toLowerCase());
  if (!r) throw new Error(`rune not found: ${klass} ${sname} / ${rname}`);
  return { skill: s.slug, rune: r.letter };
}
function pas(klass, name) {
  const p = skills.classes[klass].passive.find((x) => x.name.toLowerCase() === name.toLowerCase());
  if (!p) throw new Error(`passive not found: ${klass} ${name}`);
  return p.slug;
}

const N = (gem) => ({ gem });
const L = (gem) => ({ gem, legendary: true });
const A = {
  helm: ["chc", "vit"], shoulders: ["cdr", "area", "armor"], amulet: ["chd", "elemental", "chc"],
  chest: ["vit", "armor"], gloves: ["chc", "chd", "cdr"], bracers: ["elemental", "chc", "vit"],
  belt: ["vit", "life", "armor"], ring: ["chc", "chd", "cdr"], legs: ["vit", "armor"], boots: ["vit", "armor"],
  wpn: ["cdr", "area"], off: ["chc", "cdr"],
};
const gear = (name, affixes, gems = [], augment = 750) => ({ itemId: item(name), affixes, augment, gems });
const isWeapon = (name) => {
  const t = d.itemTypes[current(name).type];
  return !!(t?.weapon || t?.slot === "onehand" || t?.slot === "twohand");
};

/** Expand a compact spec (names only) into the preset-build JSON shape. */
function build(spec) {
  const g = spec.gear;
  const [neckGem, ring1Gem, ring2Gem] = spec.legendaryGems.map(L);
  const equipped = {
    head: gear(g.head, A.helm, [N("diamond")]),
    shoulders: gear(g.shoulders, A.shoulders),
    neck: gear(g.neck, A.amulet, [neckGem]),
    torso: gear(g.torso, A.chest, [N("diamond"), N("diamond"), N("diamond")]),
    hands: gear(g.hands, A.gloves),
    wrists: gear(g.wrists, A.bracers),
    waist: gear(g.waist, A.belt),
    legs: gear(g.legs, A.legs, [N("diamond"), N("diamond")]),
    feet: gear(g.feet, A.boots),
    leftfinger: gear(g.leftfinger, A.ring, [ring1Gem]),
    rightfinger: gear(g.rightfinger, A.ring, [ring2Gem]),
    mainhand: gear(g.mainhand, A.wpn, [N("emerald")]),
    // a weapon off-hand (hand crossbow, dual-wield) takes an emerald like the
    // main hand; sources / mojos / phylacteries / shields take a diamond.
    offhand: gear(g.offhand, A.off, [N(isWeapon(g.offhand) ? "emerald" : "diamond")]),
  };
  return {
    id: spec.id, name: spec.name, klass: spec.klass, category: spec.category, tier: spec.tier, noEthereal: true,
    gender: "male", source: spec.source, season: "Season 28 (2.7.5)", tagline: spec.tagline,
    paragonLevel: 800, paragon: PARAGON, equipped,
    kanai: { weapon: power(spec.kanai[0]), armor: power(spec.kanai[1]), jewelry: power(spec.kanai[2]) },
    skills: { active: spec.skills.map((s) => sk(spec.klass, s)), passives: spec.passives.map((p) => pas(spec.klass, p)) },
  };
}

const SPECS = [
  /* ── solo-push ── */
  {
    id: "demonhunter-god-strafe", name: "GoD Strafe (Valla's)", klass: "demonhunter", category: "solo-push", tier: "A",
    tagline: "Strafe · Gears of Dreadlands · GR 120–130",
    source: "https://www.diablofans.com/builds/109969-season-28-dreadlands-120-130-solo-build-altar",
    gear: {
      head: "Dystopian Goggles", shoulders: "Mechanical Pauldrons", neck: "Squirt's Necklace", torso: "Galvanized Vest",
      hands: "Gas Powered Automail Forearm", wrists: "Guardian's Aversion", waist: "Guardian's Case", legs: "Depth Diggers",
      feet: "Antique Vintage Boots", leftfinger: "Focus", rightfinger: "Restraint", mainhand: "Valla's Bequest", offhand: "Dawn",
    },
    kanai: ["The Ninth Cirri Satchel", "Hunter's Wrath", "Ring of Royal Grandeur"],
    skills: [["Hungering Arrow", "Devouring Arrow"], ["Strafe", "Icy Trail"], ["Vengeance", "Dark Heart"],
      ["Vault", "Tumble"], ["Fan of Knives", "Bladed Armor"], ["Preparation", "Punishment"]],
    passives: ["Archery", "Cull the Weak", "Numbing Traps", "Ambush"],
    legendaryGems: ["trapped", "simplicity", "zei"],
  },

  /* ── speed: GR speeds / bounties ── */
  {
    id: "speed-demonhunter-god-bounties", name: "GoD Speed Farm", klass: "demonhunter", category: "speed", tier: "GR",
    tagline: "Strafe · Dreadlands · Bounties + GR 100+",
    source: "https://www.diablofans.com/builds/109962-god-speed-farm-bounties-gr-100-r",
    gear: {
      head: "Dystopian Goggles", shoulders: "Mechanical Pauldrons", neck: "Squirt's Necklace", torso: "Galvanized Vest",
      hands: "Gas Powered Automail Forearm", wrists: "Guardian's Aversion", waist: "Guardian's Case", legs: "Depth Diggers",
      feet: "Antique Vintage Boots", leftfinger: "Focus", rightfinger: "Restraint", mainhand: "Dawn", offhand: "Fortress Ballista",
    },
    kanai: ["The Ninth Cirri Satchel", "Hunter's Wrath", "Ring of Royal Grandeur"],
    skills: [["Hungering Arrow", "Devouring Arrow"], ["Strafe", "Drifting Shadow"], ["Shadow Power", "Shadow Glide"],
      ["Preparation", "Focused Mind"], ["Vengeance", "Dark Heart"], ["Fan of Knives", "Bladed Armor"]],
    passives: ["Blood Vengeance", "Cull the Weak", "Thrill of the Hunt", "Hot Pursuit"],
    legendaryGems: ["trapped", "simplicity", "taeguk"],
  },
  {
    id: "speed-witchdoctor-mundunugu-gr", name: "Mundunugu GR Speed", klass: "witchdoctor", category: "speed", tier: "GR",
    tagline: "Spirit Barrage · Mundunugu · GR 110 / T16",
    source: "https://www.diablofans.com/builds/109993-season-28-wich-doctor-mundugurunu-speed-110-t16",
    gear: {
      head: "Broken Crown", shoulders: "Mundunugu's Descendant", neck: "Blackthorne's Duncraig Cross", torso: "Mundunugu's Robe",
      hands: "Mundunugu's Rhythm", wrists: "Lakumba's Ornament", waist: "The Witching Hour", legs: "Mundunugu's Decoration",
      feet: "Mundunugu's Dance", leftfinger: "Ring of Emptiness", rightfinger: "Convention of Elements",
      mainhand: "The Barber", offhand: "Gazing Demise",
    },
    kanai: ["Voo's Juicer", "Frostburn", "Ring of Royal Grandeur"],
    skills: [["Locust Swarm", "Pestilence"], ["Spirit Barrage", "Manitou"], ["Spirit Walk", "Severance"],
      ["Soul Harvest", "Languish"], ["Piranhas", "Piranhado"], ["Big Bad Voodoo", "Ghost Trance"]],
    passives: ["Blood Ritual", "Spirit Vessel", "Grave Injustice", "Confidence Ritual"],
    legendaryGems: ["gogok", "powerful", "stricken"],
  },
  {
    id: "speed-necromancer-blood-nova-gr", name: "Trag'Oul Blood Nova GR Speed", klass: "necromancer", category: "speed", tier: "GR",
    tagline: "Death Nova · Trag'Oul · GR speeds",
    source: "https://www.diablofans.com/builds/109820-blood-nova-gr-speeds-s28-2-7-5",
    gear: {
      head: "Trag'Oul's Guise", shoulders: "Mantle of Channeling", neck: "Haunted Visions", torso: "Trag'Oul's Scales",
      hands: "Trag'Oul's Claws", wrists: "Guardian's Aversion", waist: "Guardian's Case", legs: "Trag'Oul's Hide",
      feet: "Trag'Oul's Stalwart Greaves", leftfinger: "Convention of Elements", rightfinger: "Krysbin's Sentence",
      mainhand: "Funerary Pick", offhand: "Iron Rose",
    },
    kanai: ["Bloodtide Blade", "Steuart's Greaves", "Ring of Royal Grandeur"],
    skills: [["Siphon Blood", "Power Shift"], ["Death Nova", "Blood Nova"], ["Frailty", "Aura of Frailty"],
      ["Bone Armor", "Dislocation"], ["Blood Rush", "Metabolism"], ["Simulacrum", "Blood and Bone"]],
    passives: ["Spreading Malediction", "Final Service", "Swift Harvesting", "Stand Alone"],
    legendaryGems: ["trapped", "zei", "powerful"],
  },

  /* ── speed: T16 farming ── */
  {
    id: "speed-witchdoctor-mundunugu-t16", name: "Mundunugu Warp Speed T16", klass: "witchdoctor", category: "speed", tier: "T16",
    tagline: "Spirit Barrage · Mundunugu · 440% move speed",
    source: "https://www.diablofans.com/builds/109817-t16-warp-speed-440-ms-s28-2-7-5",
    gear: {
      head: "Guardian's Gaze", shoulders: "Mundunugu's Descendant", neck: "Squirt's Necklace", torso: "Mundunugu's Robe",
      hands: "Mundunugu's Rhythm", wrists: "Warzechian Armguards", waist: "Guardian's Case", legs: "Mundunugu's Decoration",
      feet: "Mundunugu's Dance", leftfinger: "Rechel's Ring of Larceny", rightfinger: "Stone of Jordan",
      mainhand: "The Barber", offhand: "Shukrani's Triumph",
    },
    kanai: ["Gazing Demise", "Krelm's Buff Belt", "Ring of Royal Grandeur"],
    skills: [["Spirit Barrage", "Manitou"], ["Big Bad Voodoo", "Slam Dance"], ["Summon Zombie Dogs", "Life Link"],
      ["Soul Harvest", "Soul to Waste"], ["Spirit Walk", "Severance"], ["Horrify", "Stalker"]],
    passives: ["Fierce Loyalty", "Pierce the Veil", "Gruesome Feast", "Grave Injustice"],
    legendaryGems: ["hoarder", "trapped", "zei"],
  },
  {
    id: "speed-necromancer-vortex-mages-t16", name: "Vortex Mages T16", klass: "necromancer", category: "speed", tier: "T16",
    tagline: "Skeletal Mage · Krysbin's · T16 speeds",
    source: "https://www.diablofans.com/builds/108836-t16-vortex-mages-ultra-speeds-s28-2-7-5",
    gear: {
      head: "Leoric's Crown", shoulders: "Razeth's Volition", neck: "Haunted Visions", torso: "Requiem Cereplate",
      hands: "Tasker and Theo", wrists: "Warzechian Armguards", waist: "Krelm's Buff Belt", legs: "Hexing Pants of Mr. Yan",
      feet: "Steuart's Greaves", leftfinger: "Circle of Nailuj's Evol", rightfinger: "Krysbin's Sentence",
      mainhand: "Scythe of the Cycle", offhand: "Lost Time",
    },
    kanai: ["Reilena's Shadowhook", "Goldwrap", "Briggs' Wrath"],
    skills: [["Bone Armor", "Harvest of Anguish"], ["Skeletal Mage", "Life Support"], ["Frailty", "Aura of Frailty"],
      ["Simulacrum", "Reservoir"], ["Blood Rush", "Metabolism"], ["Devour", "Devouring Aura"]],
    passives: ["Fueled by Death", "Overwhelming Essence", "Dark Reaping", "Extended Servitude"],
    legendaryGems: ["hoarder", "zei", "legacyofdreams"],
  },
];

// ── emit ─────────────────────────────────────────────────────────────────────
const BUILDS = SPECS.map(build);
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
