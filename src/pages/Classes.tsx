/**
 * /classes — index page listing all seven D3 classes as cards. Each card
 * links to /classes/<slug>. Template for the future build pages.
 */
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ImageOff } from "lucide-react";
import Seo from "@/components/Seo";
import { breadcrumbSchema } from "@/lib/seo";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { CLASSES, ClassInfo, classPortrait } from "@/lib/classes";

const Classes = () => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Seo
        path="/classes"
        title="Diablo 3 Classes"
        description="All seven Diablo 3 classes on RuinWatch — Barbarian, Crusader, Demon Hunter, Monk, Necromancer, Witch Doctor and Wizard. Resources, signature skills and the best builds for the Rites of Sanctuary patch with the Altar of Rites and Ethereal Weapons."
        keywords={["Diablo 3 classes", "D3 class guide", "Rites of Sanctuary builds", "Altar of Rites", "Ethereal Weapons"]}
        jsonLd={breadcrumbSchema([
          { name: "Home", url: "/" },
          { name: "Classes", url: "/classes" },
        ])}
      />
      <SiteHeader />
      <main className="pt-24 md:pt-28 pb-24">
        <section className="container">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="font-display text-xs tracking-[0.5em] text-ember uppercase mb-4">
              {t("classes.tag")}
            </p>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl text-bone uppercase tracking-wider text-stone-carved mb-6">
              {t("classes.title")}
            </h1>
            <div className="divider-rune my-8" />
            <p className="font-serif-elegant text-lg md:text-xl text-muted-foreground italic">
              {t("classes.subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {CLASSES.map((c) => (
              <ClassCard key={c.slug} info={c} />
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
};

const ClassCard = ({ info }: { info: ClassInfo }) => {
  const { t } = useTranslation();
  const portrait = classPortrait(info);
  return (
    <Link
      to={`/classes/${info.slug}`}
      className="group panel-stone bg-card/60 hover:bg-card border border-stone transition-colors block overflow-hidden"
      style={{
        borderColor: undefined,
      }}
    >
      <div
        className="relative flex items-center justify-center bg-night overflow-hidden"
        style={{ aspectRatio: "1 / 1" }}
      >
        {/* class-accent glow */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-40 blur-2xl"
          style={{
            background: `radial-gradient(ellipse at center, hsl(${info.accent} / 0.5), transparent 70%)`,
          }}
        />
        {portrait ? (
          <img
            src={portrait}
            alt={info.name}
            className="relative max-h-[88%] w-auto select-none transition-transform duration-500 group-hover:scale-105"
            draggable={false}
            loading="lazy"
          />
        ) : (
          <div className="relative flex flex-col items-center gap-3 text-muted-foreground">
            <ImageOff className="w-10 h-10" strokeWidth={1.25} />
            <span className="font-mono text-[10px] uppercase tracking-[0.25em]">
              {t("classes.portraitPending")}
            </span>
          </div>
        )}
      </div>
      <div className="p-5 border-t border-stone/60">
        <p
          className="font-display text-xs tracking-[0.4em] uppercase mb-2"
          style={{ color: `hsl(${info.accent})` }}
        >
          {info.role}
        </p>
        <h3 className="font-display text-2xl text-bone uppercase tracking-wider mb-2 group-hover:text-ember transition-colors">
          {info.name}
        </h3>
        <p className="font-serif-elegant text-base text-muted-foreground italic mb-3">
          {t(`classes.${info.slug}.tagline`)}
        </p>
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          {t("classes.resourceLabel")}: <span className="text-bone/80">{info.resource}</span>
        </p>
      </div>
    </Link>
  );
};

export default Classes;
