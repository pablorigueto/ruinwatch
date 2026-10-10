/**
 * validate-build.mjs — strict completeness/correctness check for a preset build.
 * FAILS (exit 1) on any of: invalid slot id, missing/duplicate item, unresolved
 * affix key, empty socket, missing rune on a runable skill, bad kanai power,
 * bad passive, wrong paragon total, OR a non-Ethereal weapon when an Ethereal
 * BiS exists for that class. Catches exactly the mistakes that slipped through
 * the manual process.
 *
 *   node scripts/validate-build.mjs <build-id>        # one build
 *   node scripts/validate-build.mjs --all             # every build in index.json
 */
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const P = (...x) => join(ROOT, ...x);

const SLOTS = ["head", "shoulders", "neck", "torso", "wrists", "hands", "waist",
  "legs", "feet", "leftfinger", "rightfinger", "mainhand", "offhand"];
const SLOT_SET = new Set(SLOTS);

// the weapon/ring affix pools the planner injects (mirror src/lib/planner.ts)
const WEAPON_POOL = { mainstat: "attrLarge", vit: "attrLarge", ias: "iasNormal",
  chd: "chdLarge", cdr: "cdrLarge", area: "areaLarge", lph: "lphVeryLarge",
  laek: "laekVeryLarge", rcr: "rcrLarge" };
const RING_POOL = { mainstat: "attrLarge", vit: "attrLarge", chc: "chcLarge",
  chd: "chdLarge", cdr: "cdrLarge", area: "areaLarge", rcr: "rcrLarge",
  wpnphy: "damageJewelry", resall: "resistAll", life: "lifeLarge",
  lph: "lphLarge", laek: "laekLarge" };

async function loadJSON(p) { return JSON.parse(await readFile(p, "utf8")); }

function affixTemplates(d, slot, item) {
  const has = (t) => d.statLimits.ancient?.[t] || d.statLimits.legendary?.[t];
  const isW = slot === "mainhand" || slot === "offhand";
  const isR = slot === "leftfinger" || slot === "rightfinger";
  const pool = isW ? WEAPON_POOL : isR ? RING_POOL : {};
  const extra = Object.fromEntries(Object.entries(pool).filter(([, t]) => has(t)));
  return { ...extra, ...(d.itemSlots[slot]?.affixes || {}), ...(item ? d.itemTypes[item.type]?.affixes || {} : {}) };
}
function resolveAffix(d, slot, item, key) {
  const T = affixTemplates(d, slot, item);
  if (T[key]) return true;
  const owner = Object.entries(d.statGroups).find(([g, m]) => m.includes(key) && T[g]);
  return !!owner;
}
function socketCount(d, slot, item) {
  const base = d.itemSlots[slot]?.sockets ?? 0;
  const hasPreset = (item.preset || []).includes("sockets");
  return Math.max(base, hasPreset ? 1 : 0);
}

async function validate(id, d, skills, errs) {
  const e = (m) => errs.push(`[${id}] ${m}`);
  let build;
  try { build = await loadJSON(P("public/planner/builds", `${id}.json`)); }
  catch { e(`build file ${id}.json not readable`); return; }

  const byId = new Map(d.items.map((i) => [i.id, i]));
  const cs = skills.classes[build.klass];
  if (!cs) e(`class ${build.klass} not in skills.json`);

  // --- equipment ---
  const seen = new Set();
  let etherealEquipped = false;
  for (const [slot, ps] of Object.entries(build.equipped || {})) {
    if (!SLOT_SET.has(slot)) { e(`invalid slot "${slot}"`); continue; }
    if (seen.has(slot)) e(`duplicate slot "${slot}"`);
    seen.add(slot);
    const item = byId.get(ps.itemId);
    if (!item) { e(`${slot}: item ${ps.itemId} not found`); continue; }
    if (item.quality === "ethereal") etherealEquipped = true;
    // item restrito a outra classe? (ex.: Mighty Belt é só de Bárbaro)
    const t = d.itemTypes[item.type];
    if ((t?.class && t.class !== build.klass) || (t?.classes && !t.classes.includes(build.klass)))
      e(`${slot}: ${item.name} (${item.type}) não pode ser usado por ${build.klass}`);
    // Ethereal: the chosen extra weapon power must be one of its options, the extra
    // passive a real class passive that is not already on the passive bar
    if (item.quality === "ethereal") {
      const options = item.required?.custom?.options ?? [];
      if (ps.etherealPower && !options.includes(ps.etherealPower)) e(`${slot}: ${item.name} cannot carry power "${ps.etherealPower}"`);
      // the same legendary power twice does not stack: not also in the cube or on another item
      const powerId = byId.get(ps.etherealPower)?.required?.custom?.id;
      if (powerId) {
        if (Object.values(build.kanai || {}).includes(powerId)) e(`${slot}: ethereal power "${powerId}" is also in Kanai's Cube`);
        const worn = Object.entries(build.equipped || {}).some(([s, o]) => s !== slot && byId.get(o.itemId)?.required?.custom?.id === powerId);
        if (worn) e(`${slot}: ethereal power "${powerId}" is also on an equipped item`);
      }
      if (ps.etherealPassive) {
        const known = Object.values(d.passives?.[build.klass] ?? {}).some((p) => p.id === ps.etherealPassive);
        if (!known) e(`${slot}: ethereal passive "${ps.etherealPassive}" is not a ${build.klass} passive`);
        if ((build.skills?.passives || []).includes(ps.etherealPassive)) e(`${slot}: ethereal passive "${ps.etherealPassive}" is already on the passive bar`);
      }
    }
    // affixes resolve?
    for (const k of ps.affixes || []) {
      if (!resolveAffix(d, slot, item, k)) e(`${slot}: affix "${k}" invalid for ${item.name}`);
    }
    // every available socket filled?
    const sc = socketCount(d, slot, item);
    const gems = ps.gems || [];
    if (gems.length < sc) e(`${slot}: ${item.name} has ${sc} socket(s) but only ${gems.length} gem(s) — fill weapon/armor sockets`);
    for (const g of gems) {
      const ok = g.legendary ? !!d.gems.legendary[g.gem] : !!d.gems.normal[g.gem];
      if (!ok) e(`${slot}: gem "${g.gem}"${g.legendary ? " (legendary)" : ""} not found`);
    }
  }

  // --- Ethereal BiS check: if the class has an Ethereal and none equipped, warn ---
  const classEthereals = d.items.filter((i) => i.quality === "ethereal" &&
    (i.required?.custom?.options || []).length >= 0 &&
    (d.itemTypes[i.type]?.class === build.klass || (d.itemTypes[i.type]?.classes || []).includes(build.klass)));
  // support builds equip utility weapons (Stormshield/Oculus etc.), not
  // Ethereals; some niche builds use a mandatory legendary (Karlei's Point) and
  // opt out with `noEthereal: true`.
  if (build.category !== "support" && !build.noEthereal && classEthereals.length > 0 && !etherealEquipped) {
    e(`no Ethereal weapon equipped, but ${build.klass} has Ethereals (e.g. ${classEthereals[0].name}) — most S/A builds use one`);
  }

  // --- kanai: power exists AND lives in the right cube slot (a weapon power
  // can't go in the armor slot, etc. — Funerary Pick is a scythe = weapon). ---
  // Kanai cube: the WEAPON slot takes weapons AND caster off-hands (source,
  // mojo, quiver, phylactery); only the defensive off-hands (shield,
  // crusadershield) count as ARMOR. JEWELRY takes rings/amulets.
  const CASTER_OFFHAND = new Set(["source", "mojo", "quiver", "phylactery"]);
  const powerCat = (type) => {
    const t = d.itemTypes[type];
    if (!t) return "?";
    if (t.slot === "onehand" || t.slot === "twohand" || t.weapon || CASTER_OFFHAND.has(type)) return "weapon";
    if (t.slot === "finger" || t.slot === "neck") return "jewelry";
    return "armor"; // chest/helm/etc. AND defensive off-hands (shield/crusadershield)
  };
  for (const [cat, pid] of Object.entries(build.kanai || {})) {
    if (!pid) continue;
    const it = d.items.find((i) => i.required?.custom?.id === pid);
    if (!it) { e(`kanai ${cat}: power "${pid}" not found`); continue; }
    const pc = powerCat(it.type);
    if (pc !== cat) e(`kanai ${cat}: "${it.name}" is a ${pc} power, not a ${cat} power (wrong cube slot)`);
  }

  // --- skills + runes ---
  if (cs) {
    const aset = new Set(cs.active.map((a) => a.slug));
    const pset = new Set(cs.passive.map((p) => p.slug));
    for (const a of build.skills?.active || []) {
      const sk = cs.active.find((x) => x.slug === a.skill);
      if (!sk) { e(`active skill "${a.skill}" not found`); continue; }
      if (sk.runes.length > 0 && !a.rune) e(`skill "${a.skill}" has runes but none selected`);
      if (a.rune && !sk.runes.some((r) => r.letter === a.rune)) e(`skill "${a.skill}" rune "${a.rune}" invalid`);
    }
    for (const ps of build.skills?.passives || []) if (!pset.has(ps)) e(`passive "${ps}" not found`);
  }

  // --- paragon total = level ---
  if (build.paragon) {
    let total = 0;
    for (const cat of Object.values(build.paragon)) total += Object.values(cat).reduce((a, b) => a + b, 0);
    const lvl = build.paragonLevel ?? 800;
    if (total !== lvl) e(`paragon total ${total} != level ${lvl}`);
  }
}

async function run() {
  const args = process.argv.slice(2);
  const d = await loadJSON(P("public/planner/planner.json"));
  const skills = await loadJSON(P("public/skills/skills.json"));
  const ids = args.includes("--all")
    ? (await loadJSON(P("public/planner/builds/index.json"))).builds.map((b) => b.id)
    : args.filter((a) => !a.startsWith("--"));
  if (ids.length === 0) { console.error("usage: validate-build.mjs <id> | --all"); process.exit(2); }

  const errs = [];
  for (const id of ids) await validate(id, d, skills, errs);
  if (errs.length) {
    console.error(`\n✗ ${errs.length} problem(s):\n` + errs.map((x) => "  " + x).join("\n"));
    process.exit(1);
  }
  console.log(`✓ ${ids.length} build(s) valid`);
}
run().catch((e) => { console.error(e); process.exit(1); });
