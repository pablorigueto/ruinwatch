/**
 * <Seo> — per-route document head (title, description, canonical, Open Graph,
 * Twitter card, optional JSON-LD). Drop one at the top of every page.
 *
 * Uses react-helmet-async (provider lives in App.tsx). Google executes JS and
 * indexes the rendered head, so this gives each route real, distinct metadata
 * even though the app is a client-side SPA.
 */
import { Helmet } from "react-helmet-async";
import {
  DEFAULT_OG_IMAGE,
  SITE_NAME,
  absUrl,
  pageTitle,
} from "@/lib/seo";

export interface SeoProps {
  /** Page title WITHOUT the brand suffix (we append "| RuinWatch"). */
  title?: string;
  description: string;
  /** Canonical path for this page (relative, e.g. "/builds"). */
  path: string;
  /** Absolute or relative OG image; defaults to the brand card. */
  image?: string;
  /** og:type — "website" (default) or "article" for build/guide pages. */
  type?: "website" | "article";
  /** Comma-free list of keywords (optional; modern SEO weights this lightly). */
  keywords?: string[];
  /** One or more JSON-LD objects to embed. */
  jsonLd?: object | object[];
  /** Set true on pages that shouldn't be indexed (e.g. the empty planner). */
  noindex?: boolean;
}

const Seo = ({
  title,
  description,
  path,
  image,
  type = "website",
  keywords,
  jsonLd,
  noindex,
}: SeoProps) => {
  const fullTitle = pageTitle(title);
  const canonical = absUrl(path);
  const ogImage = image ? absUrl(image) : DEFAULT_OG_IMAGE;
  const blocks = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet prioritizeSeoTags>
      <html lang="en" />
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && keywords.length > 0 && (
        <meta name="keywords" content={keywords.join(", ")} />
      )}
      <link rel="canonical" href={canonical} />
      {noindex ? (
        <meta name="robots" content="noindex, follow" />
      ) : (
        <meta name="robots" content="index, follow, max-image-preview:large" />
      )}

      {/* Open Graph */}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:locale" content="en_US" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {blocks.map((b, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(b)}
        </script>
      ))}
    </Helmet>
  );
};

export default Seo;
