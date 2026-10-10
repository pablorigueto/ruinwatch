/**
 * reclassify-builds.mjs — re-rank every Solo Pushing build on one ladder.
 *
 * Level of a build, in Greater Rift levels relative to the old S tier:
 *   - builds reworked around the Ethereal: base build's tier + log(damage x) / log(1.17)
 *     (each GR level has ~17% more monster life). The estimates come from the multiplier
 *     ratios documented in gen-theorycraft-builds.mjs (2.7.5 game data, not a combat sim);
 *   - every other build: the middle of its listed tier.
 * Tier = distance to the strongest build: S within 5 GRs, A within 10, B 15, C 20, D 25, F beyond.
 *
 * The tier a generator wrote is kept as `listedTier`, so running this again gives the same
 * result. Run after the generators:
 *
 *   node scripts/gen-theorycraft-builds.mjs && node scripts/gen-speed-support-builds.mjs \
 *     && node scripts/reclassify-builds.mjs && node scripts/validate-build.mjs --all
 */
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const P = (...x) => join(ROOT, ...x);

/** Middle of each tier's band, in GRs vs the old S tier. */
const TIER_MID = { S: 0, A: -2.5, B: -7.5, C: -12.5, D: -17.5, F: -25 };
const gr = (x) => Math.log(x) / Math.log(1.17);

/** Reworked builds: [tier of the base build, estimated damage multiplier vs that base]. */
const ESTIMATES = {
  "barbarian-lod-hota": ["A", 10], "barbarian-savage-frenzy": ["A", 5.3],
  "barbarian-waste-ww-rend": ["A", 1.5], "barbarian-mote-leapquake": ["B", 1.4],
  "crusader-akkhan-condemn": ["S", 10], "crusader-lod-blessed-shield": ["A", 5.6],
  "crusader-aov-heavens-fury": ["A", 2.5], "crusader-sotl-blessed-hammer": ["B", 4.8],
  "crusader-lon-bombardment": ["A", 1.8],
  "demonhunter-ue-multishot": ["A", 5.4], "demonhunter-god-strafe": ["A", 2.4],
  "demonhunter-natalya-spike-trap": ["S", 1.4], "demonhunter-marauder-sentry": ["A", 1.2],
  "monk-swk-tempest-rush": ["B", 5.1], "monk-swk-wave-of-light": ["B", 3],
  "monk-poj-tempest-rush": ["A", 1.2], "monk-uliana-ep": ["C", 1.9],
  "necromancer-inarius-death-nova": ["S", 5], "necromancer-tragoul-death-nova": ["S", 5],
  "necromancer-lod-death-nova": ["S", 5], "necromancer-masquerade-bone-spear": ["S", 5],
  "necromancer-rathma-aotd": ["S", 3], "necromancer-lod-poison-scythe": ["A", 3],
  "witchdoctor-helltooth-zombie-bears": ["A", 8.4], "witchdoctor-mundunugu-spirit-barrage": ["A", 1.2],
  "witchdoctor-zunimassa-poison-dart": ["A", 1.25], "witchdoctor-arachyr-firebats": ["B", 1.2],
  "wizard-lod-meteor": ["S", 11.5], "wizard-firebird-meteor": ["S", 5.75], "wizard-tal-rasha-meteor": ["S", 5.75],
  "wizard-typhon-hydra": ["A", 2.3], "wizard-vyr-reverse-archon-fo": ["A", 2.3],
};

const tierFor = (behind) =>
  behind <= 5 ? "S" : behind <= 10 ? "A" : behind <= 15 ? "B" : behind <= 20 ? "C" : behind <= 25 ? "D" : "F";

const indexPath = P("public/planner/builds/index.json");
const index = JSON.parse(await readFile(indexPath, "utf8"));
const solo = index.builds.filter((b) => (b.category ?? "solo-push") === "solo-push");

const files = new Map();
for (const entry of solo) {
  const path = P("public/planner/builds", `${entry.id}.json`);
  const build = JSON.parse(await readFile(path, "utf8"));
  build.listedTier ??= build.tier; // the generator's tier, kept across runs
  const est = ESTIMATES[entry.id];
  entry.level = est ? TIER_MID[est[0]] + gr(est[1]) : TIER_MID[build.listedTier];
  files.set(entry.id, { path, build });
}

const top = Math.max(...solo.map((e) => e.level));
const moved = [];
for (const entry of solo) {
  const { path, build } = files.get(entry.id);
  const tier = tierFor(top - entry.level);
  if (tier !== entry.tier) moved.push(`${entry.tier} -> ${tier}  ${entry.name}`);
  entry.tier = build.tier = tier;
  delete entry.level;
  await writeFile(path, JSON.stringify(build, null, 2) + "\n", "utf8");
}
await writeFile(indexPath, JSON.stringify(index, null, 2) + "\n", "utf8");
console.log(`reclassified ${solo.length} solo builds; top = +${top.toFixed(1)} GR vs the old S tier; ${moved.length} moved`);
for (const m of moved) console.log("  " + m);
