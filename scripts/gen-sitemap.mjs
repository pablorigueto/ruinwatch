/**
 * gen-sitemap.mjs — build public/sitemap.xml from the live data.
 *
 * Covers: static marketing/codex routes, every class, every build (the planner
 * deep-links), and every codex item. Re-run whenever builds or items change.
 *
 *   node scripts/gen-sitemap.mjs
 */
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const P = (...x) => join(ROOT, ...x);
const SITE = "https://ruinwatch.com";

const CLASSES = [
  "barbarian", "crusader", "demonhunter", "monk",
  "necromancer", "witchdoctor", "wizard",
];

/** Static, high-value routes with crawl priority. */
const STATIC = [
  { loc: "/", priority: "1.0", changefreq: "weekly" },
  { loc: "/builds", priority: "0.9", changefreq: "weekly" },
  { loc: "/cosmetics", priority: "0.9", changefreq: "monthly" },
  { loc: "/classes", priority: "0.7", changefreq: "monthly" },
  { loc: "/items", priority: "0.7", changefreq: "weekly" },
  { loc: "/kadala", priority: "0.6", changefreq: "monthly" },
  { loc: "/myriam", priority: "0.5", changefreq: "monthly" },
  { loc: "/shen", priority: "0.5", changefreq: "monthly" },
  { loc: "/planner", priority: "0.6", changefreq: "monthly" },
];

const xmlEscape = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function urlTag({ loc, priority, changefreq }) {
  return (
    `  <url>\n` +
    `    <loc>${xmlEscape(SITE + loc)}</loc>\n` +
    (changefreq ? `    <changefreq>${changefreq}</changefreq>\n` : "") +
    (priority ? `    <priority>${priority}</priority>\n` : "") +
    `  </url>`
  );
}

async function main() {
  const urls = [...STATIC];

  // classes
  for (const c of CLASSES) urls.push({ loc: `/classes/${c}`, priority: "0.6", changefreq: "monthly" });

  // builds (planner deep links) — high value, blog-like
  try {
    const idx = JSON.parse(await readFile(P("public/planner/builds/index.json"), "utf8"));
    for (const b of idx.builds ?? [])
      urls.push({ loc: `/planner?build=${b.id}`, priority: "0.8", changefreq: "weekly" });
  } catch (e) {
    console.warn("no build index:", e.message);
  }

  // codex items
  try {
    const data = JSON.parse(await readFile(P("public/items/items.json"), "utf8"));
    const items = Array.isArray(data) ? data : data.items ?? [];
    for (const it of items)
      if (it.slug) urls.push({ loc: `/items/${encodeURIComponent(it.slug)}`, priority: "0.4", changefreq: "monthly" });
  } catch (e) {
    console.warn("no items.json:", e.message);
  }

  const body =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map(urlTag).join("\n") +
    `\n</urlset>\n`;

  await writeFile(P("public/sitemap.xml"), body, "utf8");
  console.log(`sitemap.xml written — ${urls.length} URLs`);
}

main().catch((e) => { console.error(e); process.exit(1); });
