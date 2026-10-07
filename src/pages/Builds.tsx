/**
 * /builds — season tier list, split into our categories (Solo Pushing, Support, Speed Farm) on one page.
 *
 * Each build is a row of class-portrait + name that deep-links into the planner
 * at /planner?build=<id>. Data comes from the same build index the planner uses
 * (/public/planner/builds/index.json) so the two views never drift.
 */
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ImageOff } from "lucide-react";
import Seo from "@/components/Seo";
import PageLoader from "@/components/PageLoader";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import {
  BUILD_CATEGORIES,
  BuildTier,
  PresetBuildMeta,
  useBuildIndex,
} from "@/lib/planner";
import { absUrl, breadcrumbSchema } from "@/lib/seo";
import { CLASSES_BY_SLUG, ClassSlug, classPortrait } from "@/lib/classes";

/** Accent color per tier (matches the "S/A/B…" headers in tier lists). */
const TIER_COLOR: Record<string, string> = {
  S: "0 75% 58%",     // red — best
  A: "28 90% 58%",    // orange
  B: "48 90% 58%",    // gold
  C: "90 55% 55%",    // green
  D: "190 70% 58%",   // cyan
  F: "0 0% 55%",      // grey
  T16: "270 60% 65%", // violet — speed farm
  GR: "210 80% 62%",  // blue — speed farm
};

const BuildCard = ({ b }: { b: PresetBuildMeta }) => {
  const info = CLASSES_BY_SLUG[b.klass as ClassSlug];
  const portrait = info ? classPortrait(info) : null;
  const accent = info?.accent ?? "30 90% 55%";
  return (
    <Link
      to={`/planner?build=${b.id}`}
      className="group flex items-center gap-3 px-3 py-2 border border-stone/40 bg-card/40 hover:bg-card/80 hover:border-ember/50 transition-colors"
    >
      <span
        className="relative flex-none w-9 h-9 rounded-full overflow-hidden border border-stone/60 bg-night flex items-center justify-center"
        style={{ boxShadow: `0 0 10px hsl(${accent} / 0.25)` }}
      >
        {portrait ? (
          <img
            src={portrait}
            alt={info?.name ?? b.klass}
            className="w-full h-full object-cover object-top select-none"
            draggable={false}
            loading="lazy"
          />
        ) : (
          <ImageOff className="w-4 h-4 text-bone/30" strokeWidth={1.25} />
        )}
      </span>
      <span className="min-w-0">
        <span className="block font-display text-sm text-bone tracking-wide truncate group-hover:text-ember transition-colors">
          {b.name}
        </span>
        <span className="block font-mono text-[9px] uppercase tracking-[0.2em] text-bone/40 truncate">
          {info?.name ?? b.klass}
        </span>
      </span>
    </Link>
  );
};

const TierRow = ({ tier, builds }: { tier: BuildTier; builds: PresetBuildMeta[] }) => {
  const color = TIER_COLOR[tier.key] ?? "30 90% 55%";
  return (
    <div className="flex flex-col md:flex-row gap-4 md:gap-6 py-6 border-b border-stone/40">
      <div className="md:w-48 flex-none">
        <div
          className="font-display text-3xl md:text-4xl uppercase tracking-wider"
          style={{ color: `hsl(${color})` }}
        >
          {tier.label}
        </div>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-bone/45 mt-1">
          {tier.note}
        </p>
      </div>
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {builds.map((b) => (
          <BuildCard key={b.id} b={b} />
        ))}
      </div>
    </div>
  );
};

const CategorySection = ({
  category,
  builds,
}: {
  category: typeof BUILD_CATEGORIES[number];
  builds: PresetBuildMeta[];
}) => {
  // tiers that actually have a build in this category, in the category's order
  const tiers = category.tiers.map((tr) => ({
    tier: tr,
    builds: builds.filter((b) => (b.tier ?? "A") === tr.key),
  })).filter((g) => g.builds.length > 0);
  if (tiers.length === 0) return null;

  return (
    <section className="mb-16">
      <div className="flex items-center gap-4 mb-2">
        <h2 className="font-display text-2xl md:text-3xl text-ember uppercase tracking-wider">
          {category.label}
        </h2>
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-bone/40">
          {builds.length} builds
        </span>
      </div>
      <div className="divider-rune mb-2" />
      {tiers.map((g) => (
        <TierRow key={g.tier.key} tier={g.tier} builds={g.builds} />
      ))}
    </section>
  );
};

const Builds = () => {
  const { t } = useTranslation();
  const { data: index, isLoading, isError } = useBuildIndex();

  // ItemList schema so the tier list is eligible for rich results, listing each
  // build as an entry that links into the planner.
  const itemListLd = index && index.length > 0
    ? {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "RuinWatch Diablo 3 Build Tier List",
        numberOfItems: index.length,
        itemListElement: index.map((b, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: `${b.name} (${b.tier ?? "A"} Tier)`,
          url: absUrl(`/planner?build=${b.id}`),
        })),
      }
    : undefined;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Seo
        path="/builds"
        title="Diablo 3 Build Tier List — Rites of Sanctuary"
        description="The complete RuinWatch Diablo 3 build tier list for the Rites of Sanctuary patch, ranked S through F across Solo Pushing and Support, plus Speed Farm templates for T16 and GR speeds. Every build uses the Altar of Rites and Ethereal Weapons and opens directly in our build planner. Free private server, permanent Non-Season."
        keywords={[
          "Diablo 3 build tier list",
          "Diablo 3 builds",
          "Diablo 3 build planner",
          "D3 best builds Rites of Sanctuary",
          "Diablo 3 solo push builds",
          "Diablo 3 support builds",
          "Altar of Rites builds",
          "Ethereal Weapons builds",
          "Diablo 3 GR pushing",
        ]}
        jsonLd={[
          breadcrumbSchema([
            { name: "Home", url: "/" },
            { name: "Builds", url: "/builds" },
          ]),
          ...(itemListLd ? [itemListLd] : []),
        ]}
      />
      <SiteHeader />
      <main className="pt-24 md:pt-28 pb-24">
        <section className="container">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="font-display text-xs tracking-[0.5em] text-ember uppercase mb-4">
              {t("builds.tag", "Codex")}
            </p>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl text-bone uppercase tracking-wider text-stone-carved mb-6">
              {t("builds.title", "Build Tier List")}
            </h1>
            <div className="divider-rune my-8" />
            <p className="font-serif-elegant text-lg md:text-xl text-muted-foreground italic">
              {t("builds.subtitle", "Every season build, ranked. Click any build to open it in the planner.")}
            </p>
          </div>

          {isLoading && <PageLoader fullscreen={false} label={t("builds.loading", "Loading builds…")} />}
          {isError && (
            <p className="text-center font-mono text-sm text-bone/60 py-20">
              {t("builds.error", "Could not load builds.")}
            </p>
          )}

          {index &&
            BUILD_CATEGORIES.filter((c) => c.ready).map((cat) => (
              <CategorySection
                key={cat.key}
                category={cat}
                builds={index.filter((b) => (b.category ?? "solo-push") === cat.key)}
              />
            ))}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
};

export default Builds;
