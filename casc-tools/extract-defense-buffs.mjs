/**
 * extract-defense-buffs.mjs — canonical defensive %s (damage reduction, armor%,
 * resist%) from passive .pow files, for the planner's toughness. Emits
 * public/planner/defense-buffs.json: { <passiveSlug>: { kind, pct, slot, note } }
 * where kind is "dr" (generic damage reduction), "armor" (% armor) or "resall".
 */
import { readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseSlotNames, resolveSF } from "./pow-parser.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const POW = join(__dirname, "pow");
const SKILLS = join(__dirname, "..", "public", "skills", "skills.json");
const OUT = join(__dirname, "..", "public", "planner", "defense-buffs.json");

const kebab = (s) => s.replace(/([a-z0-9])([A-Z])/g, "$1-$2").replace(/_/g, "-").toLowerCase();

/** Classify a slot name into a defensive kind, or null. Excludes conditional
 *  cheat-death (Nerves of Steel) and block/dodge-specific (handled separately). */
function classify(name) {
  if (/cheat|fatal|killed|once every|death/i.test(name)) return null;
  if (/armor increase|increased armor|armor bonus|armor%|% armor/i.test(name)) return "armor";
  if (/all resist|resist all|resistance increase|resist bonus/i.test(name)) return "resall";
  if (/damage reduction|reduce.*damage taken|damage taken reduc/i.test(name)) return "dr";
  return null;
}

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
    if (!passiveSlugs.has(slug)) continue;
    const buf = await readFile(join(POW, file));
    const slots = parseSlotNames(buf);
    for (let n = 0; n < slots.length; n++) {
      const name = slots[n]?.name || "";
      const kind = classify(name);
      if (!kind) continue;
      // skip "Duration"-type slots (not a % bonus) and absurd values.
      if (/duration|per stack|increment/i.test(name)) continue;
      const v = resolveSF(buf, n, ctx);
      if (v != null && v > 0 && v < 5) {
        const pct = +(v * 100).toFixed(0);
        if (pct >= 50) continue; // cheat-death / conditional outliers (Nerves 95%, Relentless 50%)
        out[slug] = { kind, pct, slot: name, note: `${name} +${pct}%` };
        break;
      }
    }
  }

  await writeFile(OUT, JSON.stringify(out, null, 2), "utf8");
  console.log(`Wrote ${OUT} — ${Object.keys(out).length} defensive passives`);
  for (const [k, v] of Object.entries(out)) console.log(`  ${k}: ${v.kind} +${v.pct}% (${v.slot})`);
}
run().catch((e) => { console.error(e); process.exit(1); });
