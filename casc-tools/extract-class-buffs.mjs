/**
 * extract-class-buffs.mjs — canonical damage-% values for toggleable class buff
 * skills, read from the CASC .pow files (no hardcoded numbers). Emits
 * public/planner/class-buffs.json: { <skillSlug>: { label, pct, note } }.
 *
 * Each buff names the .pow + the slot-name pattern that holds its damage bonus.
 * We resolve that slot via the ScriptFormula VM (rank 70, no rune).
 */
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseSlotNames, resolveSF } from "./pow-parser.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const POW = join(__dirname, "pow");
const OUT = join(__dirname, "..", "public", "planner", "class-buffs.json");

// skillSlug -> { pow, match (regex on slot name for the damage % slot), note }
const BUFFS = {
  "battle-rage": { pow: "Barbarian_BattleRage", match: /total:\s*damage bonus/i, note: "+{p}% damage" },
  "war-cry": { pow: "X1_Barbarian_WarCry_v2", match: /damage|invigorate/i, note: "buff" },
  "marked-for-death": { pow: "DemonHunter_MarkedForDeath", match: /^damage increase$/i, note: "+{p}% damage taken" },
  "mantra-of-conviction": { pow: "X1_Monk_MantraOfConviction_v2", match: /damage|conviction/i, note: "+{p}% damage taken" },
  "laws-of-valor": { pow: "X1_Crusader_LawsOfValor", match: /damage/i, note: "+{p}% (rune)" },
  "big-bad-voodoo": { pow: "Witchdoctor_BigBadVoodoo", match: /damage/i, note: "+{p}% (Slam Dance)" },
};

async function run() {
  const out = {};
  for (const [slug, def] of Object.entries(BUFFS)) {
    let buf;
    try {
      buf = await readFile(join(POW, `${def.pow}.pow`));
    } catch {
      console.warn("  !! missing", def.pow);
      continue;
    }
    const slots = parseSlotNames(buf);
    const ctx = { slevel: 70, runes: { a: 0, b: 0, c: 0, d: 0, e: 0 }, table: () => null };
    let best = null;
    for (let n = 0; n < slots.length; n++) {
      const name = slots[n]?.name || "";
      if (!def.match.test(name)) continue;
      const v = resolveSF(buf, n, ctx);
      if (v != null && v > 0 && v < 5) { best = { name, pct: +(v * 100).toFixed(0) }; break; }
    }
    if (best) {
      out[slug] = { pct: best.pct, slot: best.name, note: def.note.replace("{p}", String(best.pct)) };
      console.log(`  ${slug}: +${best.pct}% (${best.name})`);
    } else {
      console.log(`  ${slug}: no damage slot found`);
    }
  }
  await writeFile(OUT, JSON.stringify(out, null, 2), "utf8");
  console.log(`\nWrote ${OUT} — ${Object.keys(out).length} class buffs`);
}
run().catch((e) => { console.error(e); process.exit(1); });
