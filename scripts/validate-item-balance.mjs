// Catalog contract: exact identities/rolls, scoped sets and repeatable generation.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { applyCodexBackports, applyPlannerBackports } from '../casc-tools/lib/balance-backports.mjs';
const load = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const codex = load('../public/items/items.json');
const planner = load('../public/planner/planner.json');
const item = id => planner.items.find(i => i.id === id);
assert.match(item('P65_flail2H_norm_unique_01').required.custom.format, /6 seconds.*100 times.*refresh together/);
assert.deepEqual([item('P65_flail2H_norm_unique_01').required.custom.min, item('P65_flail2H_norm_unique_01').required.custom.max], [35, 40]);
assert.deepEqual([item('P4_flail2H_norm_unique_01').required.custom.min, item('P4_flail2H_norm_unique_01').required.custom.max], [15, 20]);
assert.match(item('Unique_Belt_002_x1').required.custom.format, /Steed Charge.*movement speed.*random nearby enemy.*attack speed.*action bar/);
assert.equal(item('Unique_Belt_002_x1').required.custom.args, 0);
assert.deepEqual([item('Unique_Bow_015_x1').required.custom.min, item('Unique_Bow_015_x1').required.custom.max], [150, 200]);
assert.match(item('Unique_Bow_015_x1').required.custom.format, /50%% more damage per exploded chicken/);
assert.match(planner.sets.dreadlands.bonuses['2'][0].format, /delay of 5 seconds/);
assert.match(planner.sets.manajuma.bonuses['2'][1].format, /75%%.*5 seconds after/);
assert.match(planner.sets.manajuma.bonuses['2'][2].format, /half second.*100%%/);
for (const id of ['P65_flail2H_norm_unique_01', 'Unique_Belt_002_x1', 'Unique_Bow_015_x1']) {
  const entry = codex.find(i => i.slug.endsWith('-' + id));
  const power = item(id).required.custom;
  const plain = entry.secondary[0].replace(/<[^>]+>/g, '');
  assert(plain.includes(power.format.replace('%d', `[${power.min} - ${power.max}]`).replaceAll('%%', '%')));
  assert(entry.secondary[0].includes('d3-color-ffff8000'));
}
for (const id of ['dreadlands', 'manajuma']) {
  const set = planner.sets[id];
  const pieces = codex.filter(i => i.item_set?.name === set.name);
  assert.equal(pieces.length, id === 'dreadlands' ? 6 : 2);
  for (const piece of pieces) for (const bonus of set.bonuses['2']) {
    assert(piece.item_set.bonuses[0].includes(bonus.format.replaceAll('%%', '%')));
  }
}
assert.deepEqual(applyCodexBackports(structuredClone(codex)), codex, 'Codex generation is idempotent');
assert.deepEqual(applyPlannerBackports(structuredClone(planner)), planner, 'Planner generation is idempotent');
const foreign = { slug: 'other-Unique_Belt_002_x1_extra', secondary: ['original'], primary: ['stat'], item_set: null };
assert.deepEqual(applyCodexBackports([structuredClone(foreign)])[0], foreign, 'No substring-based item matches');
console.log('PASS: five backports, 11 Codex previews, planner rolls and legacy identity, orange powers, idempotent generators.');
