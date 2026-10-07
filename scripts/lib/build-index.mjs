/**
 * build-index.mjs — shared ordering for public/planner/builds/index.json.
 * Keep CATEGORY_ORDER / TIER_ORDER in sync with BUILD_CATEGORIES in
 * src/lib/planner.ts (each category lists its own tiers there).
 */
export const CATEGORY_ORDER = ["solo-push", "support", "speed"];
export const TIER_ORDER = ["S", "A", "B", "C", "D", "F", "T16", "GR"];

const rank = (list, v) => {
  const i = list.indexOf(v);
  return i < 0 ? list.length : i;
};

/** Category → tier → class → name. Unknown categories/tiers sort last. */
export function sortIndex(builds) {
  return builds.sort((a, b) =>
    rank(CATEGORY_ORDER, a.category ?? "solo-push") - rank(CATEGORY_ORDER, b.category ?? "solo-push") ||
    rank(TIER_ORDER, a.tier ?? "A") - rank(TIER_ORDER, b.tier ?? "A") ||
    a.klass.localeCompare(b.klass) || a.name.localeCompare(b.name));
}
