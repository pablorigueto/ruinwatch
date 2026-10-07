/**
 * Central SEO configuration for RuinWatch.
 *
 * One place for the canonical domain, brand strings, and the default social
 * card so every page can derive absolute URLs and on-brand metadata. The site
 * is a community-run Diablo III private server based on Season "Rites of
 * Sanctuary" with the Ethereal Weapons re-enabled — everything else is canonical
 * D3, and ALL cosmetics (wings, pets, pennants, portraits) are free to earn.
 *
 * Audience: English-speaking (US-focused) players.
 */

/** Canonical production origin — used for absolute canonical/OG URLs + sitemap. */
export const SITE_URL = "https://ruinwatch.com";

export const SITE_NAME = "RuinWatch";

/** Default social share image (absolute). TODO: replace with a real 1200×630
 *  branded card at /og-default.png; until that art exists we fall back to the
 *  favicon so social previews never 404. */
export const DEFAULT_OG_IMAGE = `${SITE_URL}/favicon.png`;

/** Brand tagline reused across home + org schema. */
export const SITE_TAGLINE =
  "Free Diablo III Private Server — Rites of Sanctuary, Altar of Rites & Ethereal Weapons, all cosmetics free";

/** The recurring value props, in priority order, for descriptions/keywords. */
export const SELLING_POINTS = [
  "free Diablo 3 private server",
  "Rites of Sanctuary patch",
  "full Altar of Rites",
  "Ethereal Weapons",
  "Diablo 3 build planner and build tier list",
  "all cosmetics unlocked free",
  "wings, pets, pennants and portraits",
  "permanent Non-Season Greater Rift pushing",
];

/** Make a relative path absolute against the canonical origin. */
export function absUrl(path = "/"): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Compose a page title as "Page Title | RuinWatch" (home stays unbranded-suffix). */
export function pageTitle(title?: string): string {
  if (!title) return `${SITE_NAME} — ${SITE_TAGLINE}`;
  return `${title} | ${SITE_NAME}`;
}

/** The Organization / WebSite JSON-LD injected once on the home page. */
export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_TAGLINE,
    logo: absUrl("/favicon.png"),
    sameAs: [
      "https://www.facebook.com/ruinwatch",
      "https://www.instagram.com/ruinwatch",
    ],
  };
}

/** WebSite schema (enables sitelinks search box eligibility later). */
export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
  };
}

/** A BreadcrumbList schema from [{name, url}] crumbs (urls relative or absolute). */
export function breadcrumbSchema(crumbs: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: absUrl(c.url),
    })),
  };
}
