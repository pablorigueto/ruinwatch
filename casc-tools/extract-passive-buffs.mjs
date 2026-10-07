/**
 * extract-passive-buffs.mjs — canonical damage-% from passive skills, read from
 * the CASC <Class>_Passive_<Name>.pow files. Emits public/planner/passive-buffs.json:
 * { <passiveSlug>: { pct, slot, note } } for passives that grant a clear damage %.
 *
 * Passive slug = the planner's skills.json passive slug. We match by stripping
 * "<Class>_Passive_" from the .pow name and kebab-casing, then verify against
 * skills.json so only real passives are emitted.
 */
import { readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseSlotNames, resolveSF } from "./pow-parser.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const POW = join(__dirname, "pow");
const SKILLS = join(__dirname, "..", "public", "skills", "skills.json");
const OUT = join(__dirname, "..", "public", "planner", "passive-buffs.json");

const kebab = (s) => s.replace(/([a-z0-9])([A-Z])/g, "$1-$2").replace(/_/g, "-").toLowerCase();

// slot names that are a clear flat damage bonus (not reduction/taken/cost/heal).
const isDamage = (s) =>
  /(bonus damage|extra damage|damage increase|increased damage|damage bonus|weapon damage)/i.test(s) &&
  !/reduc|taken|cost|heal|regen|thorn|crit chance|attack speed|duration|radius/i.test(s);

async function run() {
  const skills = JSON.parse(await readFile(SKILLS, "utf8"));
  const passiveSlugs = new Set();
  for (const cls of Object.values(skills.classes)) for (const p of cls.passive) passiveSlugs.add(p.slug);

  const files = (await readdir(POW)).filter((f) => /_Passive_.*\.pow$/i.test(f));
  const out = {};
  const ctx = { slevel: 70, runes: { a: 0, b: 0, c: 0, d: 0, e: 0 }, table: () => null };

  for (const file of files) {
    const m = file.match(/_Passive_(.+)\.pow$/i);
    if (!m) continue;
    const slug = kebab(m[1]);
    if (!passiveSlugs.has(slug)) continue; // only real planner passives
    const buf = await readFile(join(POW, file));
    const slots = parseSlotNames(buf);
    let best = null;
    for (let n = 0; n < slots.length; n++) {
      const name = slots[n]?.name || "";
      if (!isDamage(name)) continue;
      const v = resolveSF(buf, n, ctx);
      if (v != null && v > 0 && v < 5) { best = { name, pct: +(v * 100).toFixed(0) }; break; }
    }
    if (best) out[slug] = { pct: best.pct, slot: best.name, note: `+${best.pct}% damage (passive)` };
  }

  await writeFile(OUT, JSON.stringify(out, null, 2), "utf8");
  console.log(`Wrote ${OUT} — ${Object.keys(out).length} passive damage buffs`);
  for (const [k, v] of Object.entries(out)) console.log(`  ${k}: +${v.pct}% (${v.slot})`);
}
run().catch((e) => { console.error(e); process.exit(1); });
