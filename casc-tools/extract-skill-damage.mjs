/**
 * extract-skill-damage.mjs — build skill-damage.json: the canonical weapon-damage
 * coefficient for every hero skill (and its damage rune slots), straight from
 * the CASC .pow files + the server's authoritative slot mapping.
 *
 * Pipeline (all canonical, all CASC/RE; reads server files READ-ONLY, writes
 * nothing into serverruinwatch):
 *   1. Skills.cs           -> skill name -> Power SNO id
 *   2. <Class>/<Skill>.cs  -> AddWeaponDamage(ScriptFormula(N)) -> damage slot N
 *   3. Power.csv           -> SNO id -> .pow file name
 *   4. casc-tools/pow/*.pow -> resolveSF(N) -> coefficient (× weapon damage)
 *
 * Output: casc-tools/skill-damage.json  -> { <skillSlug>: { sno, pow, slots:[N],
 *   coeff } }  where coeff is the base weapon-damage multiplier (e.g. 3.2 = 320%).
 */
import { readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { resolveSF, parseSlotNames } from "./pow-parser.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SERVER = "D:/projects/serverruinwatch/src/RuinWatch";
const SKILLS_CS = join(SERVER, "D3-GameServer/GSSystem/SkillsSystem/Skills.cs");
const IMPL_ROOT = join(SERVER, "D3-GameServer/GSSystem/PowerSystem/Implementations/HeroSkills");
const POWER_CSV = "D:/projects/serverruinwatch/notes/CASCs-csv/Power.csv";
const POW_DIR = join(__dirname, "pow");
const OUT = join(__dirname, "skill-damage.json");

const parseHex = (s) => (s.startsWith("0x") ? parseInt(s, 16) : parseInt(s, 10));

/** Skills whose weapon damage lives in a SUB-power, not their own .pow. The
 *  skill .cs is a transform/controller that delegates the hit to another power.
 *  Maps skillConst -> { pow, slot } of the actual damage. Canonical (read from
 *  the sub-power's own AddWeaponDamage(ScriptFormula(slot))). */
const POWER_OVERRIDE = {
  // Archon.cs is the transform; the attack is ArchonArcaneStrike (SF(0)).
  Archon: { pow: "Wizard_Archon_ArcaneStrike", slot: 0 },
};

/** skill const name -> SNO id, from Skills.cs `public const int Name = id;`. */
async function loadSkillSnos() {
  const src = await readFile(SKILLS_CS, "utf8");
  const map = {};
  for (const m of src.matchAll(/public const int (\w+)\s*=\s*(0x[0-9A-Fa-f]+|\d+)\s*;/g)) {
    map[m[1]] = parseHex(m[2]);
  }
  return map;
}

/** SNO id -> .pow base name (without extension), from Power.csv. */
async function loadPowerNames() {
  const csv = await readFile(POWER_CSV, "utf8");
  const map = {};
  for (const line of csv.split(/\r?\n/).slice(1)) {
    const [name, id] = line.split(",");
    if (name && id) map[Number(id)] = name;
  }
  return map;
}

/** Walk the HeroSkills impls; for each, pull the ImplementsPowerSNO ref + every
 *  AddWeaponDamage(ScriptFormula(N)) / WeaponDamage(..., ScriptFormula(N)) slot. */
async function loadImpls() {
  const out = [];
  const classes = await readdir(IMPL_ROOT, { withFileTypes: true });
  for (const c of classes) {
    if (!c.isDirectory()) continue;
    const dir = join(IMPL_ROOT, c.name);
    const files = await readdir(dir);
    for (const f of files) {
      if (!f.endsWith(".cs")) continue;
      const src = await readFile(join(dir, f), "utf8");
      // which skill SNO this file implements
      const sno = src.match(/\[ImplementsPowerSNO\(\s*(?:SkillsSystem\.)?Skills\.[\w.]*\.(\w+)\s*\)/);
      if (!sno) continue;
      // damage slots: AddWeaponDamage(ScriptFormula(N)) or WeaponDamage(..., ScriptFormula(N), ...)
      const slots = new Set();
      for (const m of src.matchAll(/AddWeaponDamage\(\s*ScriptFormula\((\d+)\)/g)) slots.add(Number(m[1]));
      for (const m of src.matchAll(/WeaponDamage\([^;]*?ScriptFormula\((\d+)\)/g)) slots.add(Number(m[1]));
      out.push({ class: c.name, file: f, skillConst: sno[1], slots: [...slots] });
    }
  }
  return out;
}

async function run() {
  const snos = await loadSkillSnos();
  const powerNames = await loadPowerNames();
  const impls = await loadImpls();
  const powFiles = new Set(await readdir(POW_DIR));

  const result = {};
  let resolved = 0;
  const misses = [];

  for (const impl of impls) {
    const sno = snos[impl.skillConst];
    if (!sno) { misses.push(`${impl.file}: no SNO for ${impl.skillConst}`); continue; }
    // sub-power override (Archon -> ArchonArcaneStrike, etc.)
    const override = POWER_OVERRIDE[impl.skillConst];
    const powName = override ? override.pow : powerNames[sno];
    const damageSlots = override ? [override.slot, ...impl.slots] : impl.slots;
    if (!powName) { misses.push(`${impl.file}: no power name for SNO ${sno}`); continue; }
    const powFile = `${powName}.pow`;
    if (!powFiles.has(powFile)) { misses.push(`${impl.file}: missing ${powFile}`); continue; }
    if (!damageSlots.length) continue; // skill has no direct weapon-damage slot (pet/buff/etc.)

    const buf = await readFile(join(POW_DIR, powFile));
    const slotNames = parseSlotNames(buf); // ScriptFormulaDetails names per slot
    // resolve damage slots at level 70, no runes (base coefficient)
    const ctx = { slevel: 70, runes: { a: 0, b: 0, c: 0, d: 0, e: 0 }, table: () => null };
    const coeffs = {};
    for (const n of damageSlots) {
      const v = resolveSF(buf, n, ctx);
      if (v != null) coeffs[n] = +v.toFixed(4);
    }
    // Also resolve every slot named like a base-damage scalar. The declared
    // AddWeaponDamage(SF(0)) slot is sometimes a runed product (e.g. Spike Trap:
    // SF_17 * SF_14 * … where SF_14 = "Rune_A ? 19.3 : 0" zeroes it with no rune).
    // The true base coefficient lives in the "Base: Damage Scalar" slot.
    // "Base: Damage Scalar", "Damage Scalar Base", "Base Weapon Scalar", etc.
    const isBaseScalar = (s) =>
      /\bbase\b/i.test(s) && /(damage|weapon)\s*scalar/i.test(s);
    const baseSlots = [];
    for (let n = 0; n < slotNames.length; n++) {
      if (isBaseScalar(slotNames[n]?.name || "")) {
        const v = resolveSF(buf, n, ctx);
        if (v != null) { coeffs[n] = +v.toFixed(4); baseSlots.push(n); }
      }
    }
    // Pick the primary damage slot. The slot name (from ScriptFormulaDetails)
    // tells us which slot is the weapon-damage coefficient; we then require it to
    // resolve to a sane non-zero value. Names like "...AOE Radius"/"Crit Chance"/
    // "Knockback ..." are not the main hit, so they're rejected.
    const nameOf = (n) => (slotNames[n]?.name || "");
    // strong signal: explicit weapon-damage names
    const isWeaponDmg = (s) =>
      /(weapon\s*damage|weapon\s*%|damage\s*scalar|damage\s*per\s*second|dot\s*weapon|weapon\s*scalar)/i.test(s) &&
      !/cost|duration|\bradius\b|chance|reduction|\bspeed\b|knockback|aoe|angle|stacks?|icd/i.test(s);
    // names that are clearly NOT the damage value (geometry, control, timing).
    const isNonDmg = (s) =>
      /radius|duration|chance|reduction|\bspeed\b|knockback|aoe|angle|stacks?|icd|cost|cooldown|range|distance|count|number/i.test(s);
    const sane = (v) => v != null && v >= 0.2 && v <= 60; // base weapon-% range
    const cand = (n) => ({ n, name: nameOf(n), v: coeffs[n] });
    // candidate set = declared AddWeaponDamage slots + any "Base: Damage Scalar"
    const candidateSlots = [...new Set([...damageSlots, ...baseSlots])];
    // 1) prefer the declared slot if it resolves sane + is weapon-damage-named
    let pick = damageSlots.map(cand).filter((c) => sane(c.v) && isWeaponDmg(c.name))[0];
    // 2) else the canonical "Base: Damage Scalar" slot (handles runed-product SF_0
    //    that zeroes with no rune — e.g. Spike Trap)
    if (!pick) pick = baseSlots.map(cand).filter((c) => sane(c.v))[0];
    // 3) else any declared slot that's plausibly damage (not geometry/control)
    if (!pick) pick = candidateSlots.map(cand).filter((c) => sane(c.v) && !isNonDmg(c.name))[0];
    // 4) else: no real weapon-damage slot — buff/utility skill.
    const primarySlot = pick ? pick.n : damageSlots[0];
    const primary = pick ? pick.v : null;
    const slug = impl.skillConst.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
    result[slug] = {
      skill: impl.skillConst,
      sno,
      pow: powName,
      slots: impl.slots,
      slotNames: Object.fromEntries(impl.slots.map((n) => [n, nameOf(n)])),
      coeffs,
      primarySlot,
      coeff: primary ?? null,
    };
    if (primary != null) resolved++;
  }

  await writeFile(OUT, JSON.stringify(result, null, 2), "utf8");
  console.log(`Wrote ${OUT}`);
  console.log(`  skills with a resolved coefficient: ${resolved} / ${Object.keys(result).length}`);
  if (misses.length) console.log(`  misses (${misses.length}):\n   ` + misses.slice(0, 12).join("\n   "));
}

run().catch((e) => { console.error(e); process.exit(1); });
