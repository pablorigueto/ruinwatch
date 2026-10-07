/**
 * /classes/:slug — one D3 class. Template for future build content:
 *
 *   1. Hero with the class portrait + role / resource line
 *   2. About panel — playstyle paragraph + signature skills + preferred weapons
 *   3. Builds section — placeholder until community submissions land
 *
 * Hero accent color (border, glow, divider) comes from CLASSES[slug].accent.
 */
import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronRight, Hammer, ImageOff, ScrollText, Sparkles } from "lucide-react";
import Seo from "@/components/Seo";
import { breadcrumbSchema } from "@/lib/seo";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ClassSkills from "@/components/classes/ClassSkills";
import {
  CLASSES_BY_SLUG,
  ClassSlug,
  classPortrait,
} from "@/lib/classes";
import { categoryLabel } from "@/lib/items";

const ClassDetail = () => {
  const { slug = "" } = useParams<{ slug: string }>();
  const { t } = useTranslation();
  const info = useMemo(() => CLASSES_BY_SLUG[slug as ClassSlug], [slug]);

  if (!info) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <SiteHeader />
        <main className="pt-24 md:pt-28 pb-24 container text-center">
          <p className="font-display text-2xl text-bone uppercase tracking-wider mb-4">
            {t("classes.notFound")}
          </p>
          <Link
            to="/classes"
            className="font-mono text-sm uppercase tracking-widest text-ember hover:text-ember-glow"
          >
            {t("classes.back")}
          </Link>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const portrait = classPortrait(info);
  const accent = info.accent;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Seo
        path={`/classes/${info.slug}`}
        title={`${info.name} — Class Guide & Builds`}
        description={`${info.name} on RuinWatch (Diablo 3, Rites of Sanctuary patch). Resource: ${info.resource}. Signature skills: ${info.signature.join(", ")}. Explore the best ${info.name} builds with the Altar of Rites and Ethereal Weapons and open them in our planner.`}
        image={portrait ?? undefined}
        keywords={[`Diablo 3 ${info.name}`, `${info.name} build`, `${info.name} skills`, "Rites of Sanctuary", "Altar of Rites", "Ethereal Weapons"]}
        jsonLd={breadcrumbSchema([
          { name: "Home", url: "/" },
          { name: "Classes", url: "/classes" },
          { name: info.name, url: `/classes/${info.slug}` },
        ])}
      />
      <SiteHeader />
      <main className="pt-24 md:pt-28 pb-24">
        <section className="container">
          {/* breadcrumb */}
          <nav className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground mb-8 flex items-center flex-wrap gap-1">
            <Link to="/classes" className="hover:text-ember">
              {t("nav.classes")}
            </Link>
            <ChevronRight className="w-3 h-3 inline" strokeWidth={1.5} />
            <span style={{ color: `hsl(${accent})` }}>{info.name}</span>
          </nav>

          {/* HERO */}
          <div className="relative mb-16 lg:min-h-[460px] grid grid-cols-1 lg:grid-cols-[1fr_auto] items-center gap-8 lg:gap-12">
            <div className="text-center lg:text-left max-w-2xl mx-auto lg:mx-0">
              <p
                className="font-display text-xs tracking-[0.5em] uppercase mb-4"
                style={{ color: `hsl(${accent})` }}
              >
                {info.role}
              </p>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl text-bone uppercase tracking-wider text-stone-carved mb-6">
                {info.name}
              </h1>
              <div
                className="h-px w-32 my-8 mx-auto lg:mx-0"
                style={{
                  background: `linear-gradient(90deg, transparent, hsl(${accent}), transparent)`,
                }}
              />
              <p className="font-serif-elegant text-lg md:text-xl text-muted-foreground italic">
                {t(`classes.${info.slug}.tagline`)}
              </p>
              <div className="mt-6 inline-flex items-center gap-2 px-3 py-1.5 border font-mono text-[11px] uppercase tracking-[0.25em]"
                   style={{ borderColor: `hsl(${accent} / 0.4)`, color: `hsl(${accent})` }}>
                <Sparkles className="w-3.5 h-3.5" strokeWidth={1.5} />
                {t("classes.resourceLabel")}: <span className="text-bone/90">{info.resource}</span>
              </div>
            </div>

            <div className="hidden lg:block relative flex-none">
              <div
                aria-hidden
                className="absolute inset-0 -z-10 blur-3xl opacity-60"
                style={{
                  background: `radial-gradient(ellipse at center, hsl(${accent} / 0.55), transparent 65%)`,
                }}
              />
              {portrait ? (
                <img
                  src={portrait}
                  alt={info.name}
                  className="h-[460px] w-auto select-none"
                  style={{
                    filter: `drop-shadow(0 12px 28px hsl(${accent} / 0.3))`,
                  }}
                  draggable={false}
                />
              ) : (
                <div className="h-[460px] w-[300px] flex flex-col items-center justify-center gap-3 text-muted-foreground border border-dashed border-stone">
                  <ImageOff className="w-10 h-10" strokeWidth={1.25} />
                  <span className="font-mono text-[10px] uppercase tracking-[0.25em]">
                    {t("classes.portraitPending")}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ABOUT */}
          <article className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-16">
            <section className="lg:col-span-2 panel-stone bg-card/50 p-6 md:p-8">
              <div className="flex items-center gap-3 mb-4">
                <ScrollText className="w-5 h-5" style={{ color: `hsl(${accent})` }} strokeWidth={1.5} />
                <p
                  className="font-display text-xs tracking-[0.4em] uppercase"
                  style={{ color: `hsl(${accent})` }}
                >
                  {t("classes.aboutTag")}
                </p>
              </div>
              <h2 className="font-display text-2xl md:text-3xl text-bone uppercase tracking-wider mb-4">
                {t("classes.aboutTitle")}
              </h2>
              <p className="font-serif-elegant text-base md:text-lg text-muted-foreground leading-relaxed">
                {t(`classes.${info.slug}.lore`)}
              </p>
            </section>

            <aside className="panel-stone bg-card/50 p-6 space-y-6">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-2">
                  {t("classes.signatureLabel")}
                </p>
                <ul className="space-y-1">
                  {info.signature.map((s) => (
                    <li
                      key={s}
                      className="font-display text-sm text-bone tracking-wide"
                    >
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="pt-4 border-t border-stone/60">
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-2">
                  {t("classes.weaponsLabel")}
                </p>
                <ul className="space-y-1">
                  {info.weapons.map((w) => (
                    <li key={w}>
                      <Link
                        to={`/items#cat-${w}`}
                        className="font-display text-sm text-muted-foreground hover:text-ember tracking-wide transition-colors"
                      >
                        {categoryLabel(w)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          </article>

          {/* SKILLS — active / passive tabs */}
          <ClassSkills slug={info.slug} accent={accent} />

          {/* BUILDS PLACEHOLDER */}
          <section className="panel-stone bg-card/40 p-8 md:p-12 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Hammer
                className="w-5 h-5"
                style={{ color: `hsl(${accent})` }}
                strokeWidth={1.5}
              />
              <p
                className="font-display text-xs tracking-[0.4em] uppercase"
                style={{ color: `hsl(${accent})` }}
              >
                {t("classes.buildsTag")}
              </p>
            </div>
            <h2 className="font-display text-2xl md:text-3xl text-bone uppercase tracking-wider mb-4">
              {t("classes.buildsTitle")}
            </h2>
            <div
              className="h-px w-32 mx-auto my-6"
              style={{
                background: `linear-gradient(90deg, transparent, hsl(${accent} / 0.5), transparent)`,
              }}
            />
            <p className="font-serif-elegant text-base md:text-lg text-muted-foreground italic max-w-xl mx-auto">
              {t("classes.buildsBody")}
            </p>
          </section>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
};

export default ClassDetail;
