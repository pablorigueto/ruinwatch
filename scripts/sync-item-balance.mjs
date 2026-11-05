// Refresh only the explicitly selected RuinWatch backports, without game assets.
import { readFileSync, writeFileSync } from 'node:fs';
import { applyCodexBackports, applyPlannerBackports } from '../casc-tools/lib/balance-backports.mjs';
for (const [path, apply] of [
  ['../public/items/items.json', applyCodexBackports],
  ['../public/planner/planner.json', applyPlannerBackports],
]) {
  const url = new URL(path, import.meta.url);
  const original = readFileSync(url, 'utf8');
  const updated = JSON.stringify(apply(JSON.parse(original)));
  if (original !== updated) writeFileSync(url, updated);
  console.log(`Balance catalog synchronized: ${path}`);
}
