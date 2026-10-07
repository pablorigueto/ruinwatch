/**
 * prerender.mjs — post-build step that bakes per-route SEO into static HTML.
 *
 * The app is a client-side SPA: browsers run JS and react-helmet-async sets the
 * correct <head> per route, and Googlebot executes JS so it indexes that fine.
 * But social crawlers (Discord, Facebook, WhatsApp, X) and other non-JS bots
 * only read the static HTML — so without this they'd show the homepage card for
 * every internal link.
 *
 * For each important route we clone dist/index.html and rewrite the title +
 * description + canonical + OG/Twitter tags to that route's values, writing
 * dist/<route>/index.html. The bundled JS still loads and hydrates normally.
 *
 *   node scripts/prerender.mjs   (runs automatically after `npm run build`)
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const P = (...x) => join(ROOT, ...x);
const SITE_URL = "https://ruinwatch.com";
const SITE_NAME = "RuinWatch";
const OG_IMAGE = `${SITE_URL}/favicon.png`; // keep in sync with lib/seo DEFAULT_OG_IMAGE

/** Load ROUTE_META out of the TS module without a TS toolchain: strip the
 *  import + the `SITE_NAME` reference, then eval the array literal. */
function loadRouteMeta() {
  const src = readFileSync(P("src/lib/routeMeta.ts"), "utf8");
  const m = src.match(/export const ROUTE_META[^=]*=\s*(\[[\s\S]*?\]);/);
  if (!m) throw new Error("ROUTE_META array not found in routeMeta.ts");
  return new Function(`return ${m[1]}`)();
}

const htmlEscape = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Replace the first attribute value for a tag matched by `marker`. */
function setTag(html, marker, newValue) {
  // marker is a regex that captures everything up to the value, value, then rest
  return html.replace(marker, (_m, pre, _old, post) => `${pre}${htmlEscape(newValue)}${post}`);
}

function rewrite(baseHtml, meta) {
  const title = `${meta.title} | ${SITE_NAME}`;
  const url = `${SITE_URL}${meta.path}`;
  const type = meta.type || "website";
  let h = baseHtml;

  // <title>…</title>
  h = h.replace(/<title>[\s\S]*?<\/title>/, `<title>${htmlEscape(title)}</title>`);
  // meta name="description"
  h = setTag(h, /(<meta\s+name="description"\s+content=")([\s\S]*?)("\s*\/?>)/, meta.description);
  // canonical
  h = setTag(h, /(<link\s+rel="canonical"\s+href=")([\s\S]*?)("\s*\/?>)/, url);
  // OG
  h = setTag(h, /(<meta\s+property="og:title"\s+content=")([\s\S]*?)("\s*\/?>)/, title);
  h = setTag(h, /(<meta\s+property="og:description"\s+content=")([\s\S]*?)("\s*\/?>)/, meta.description);
  h = setTag(h, /(<meta\s+property="og:url"\s+content=")([\s\S]*?)("\s*\/?>)/, url);
  h = setTag(h, /(<meta\s+property="og:type"\s+content=")([\s\S]*?)("\s*\/?>)/, type);
  h = setTag(h, /(<meta\s+property="og:image"\s+content=")([\s\S]*?)("\s*\/?>)/, OG_IMAGE);
  // Twitter
  h = setTag(h, /(<meta\s+name="twitter:title"\s+content=")([\s\S]*?)("\s*\/?>)/, title);
  h = setTag(h, /(<meta\s+name="twitter:description"\s+content=")([\s\S]*?)("\s*\/?>)/, meta.description);
  h = setTag(h, /(<meta\s+name="twitter:image"\s+content=")([\s\S]*?)("\s*\/?>)/, OG_IMAGE);
  return h;
}

function main() {
  const base = readFileSync(P("dist/index.html"), "utf8");
  const routes = loadRouteMeta();
  let n = 0;
  for (const meta of routes) {
    const html = rewrite(base, meta);
    const outDir = P("dist", meta.path.replace(/^\//, ""));
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, "index.html"), html, "utf8");
    n++;
  }
  console.log(`prerendered ${n} routes to static HTML`);
}

main();
