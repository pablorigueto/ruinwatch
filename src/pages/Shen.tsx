/**
 * /shen — Covetous Shen, the Jeweler. Three functions he offers: Combine
 * Gems (rank up), Forge Jewelry (craft Hellfire amulets/rings + Sovereign /
 * Exquisite tiers), and Remove Gem (un-socket without losing either piece).
 *
 * Screenshots live in /public/cosmetics/covetous-shen-*.png — captures from
 * the live server.
 */
import { useTranslation } from "react-i18next";
import { LucideIcon, Gem, Hammer, Wrench } from "lucide-react";
import Seo from "@/components/Seo";
import { breadcrumbSchema } from "@/lib/seo";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ArtisanFunctionRow from "@/components/ArtisanFunctionRow";

interface Func {
  key: string;
  icon: LucideIcon;
  img: string;
}

const FUNCTIONS: Func[] = [
  { key: "combine", icon: Gem,    img: "/cosmetics/covetous-shen-function-1.png" },
  { key: "forge",   icon: Hammer, img: "/cosmetics/covetous-shen-function-2.png" },
  { key: "remove",  icon: Wrench, img: "/cosmetics/covetous-shen-function-3.png" },
];

const Shen = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Seo
        path="/shen"
        title="Covetous Shen the Jeweler — Combine, Forge & Remove Gems"
        description="Covetous Shen, the Jeweler, on RuinWatch (Diablo 3). Rank up gems, forge Hellfire amulets and rings, and remove socketed gems without losing either piece. Full guide with in-game screenshots."
        keywords={["Diablo 3 Jeweler", "Covetous Shen", "D3 Hellfire amulet", "Diablo 3 combine gems"]}
        jsonLd={breadcrumbSchema([
          { name: "Home", url: "/" },
          { name: "Shen", url: "/shen" },
        ])}
      />
      <SiteHeader />
      <main className="pt-24 md:pt-28 pb-24">
        {/* HERO — text left, Shen portrait right with ember glow */}
        <section className="container">
          <div className="relative mb-16 lg:min-h-[440px] grid grid-cols-1 lg:grid-cols-[1fr_auto] items-center gap-8 lg:gap-12">
            <div className="text-center lg:text-left max-w-2xl mx-auto lg:mx-0">
              <p className="font-display text-xs tracking-[0.5em] text-ember uppercase mb-4">
                {t("shen.tag")}
              </p>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl text-bone uppercase tracking-wider text-stone-carved mb-6">
                {t("shen.title")}
              </h1>
              <div className="divider-rune my-8 lg:mx-0" />
              <p className="font-serif-elegant text-lg md:text-xl text-muted-foreground italic">
                {t("shen.subtitle")}
              </p>
            </div>
            <div className="hidden lg:block relative flex-none">
              <div
                aria-hidden
                className="absolute inset-0 -z-10 blur-3xl opacity-50"
                style={{
                  background:
                    "radial-gradient(ellipse at center, hsl(var(--ember) / 0.55), transparent 65%)",
                }}
              />
              <img
                src="/cosmetics/npc-covetous-shen.png"
                alt="Covetous Shen, the Jeweler"
                className="h-[440px] w-auto select-none"
                style={{
                  filter: "drop-shadow(0 12px 28px hsl(var(--ember) / 0.25))",
                }}
                draggable={false}
              />
            </div>
          </div>
        </section>

        {/* SECTION HEADER */}
        <section className="container mb-12">
          <div className="text-center max-w-2xl mx-auto">
            <p className="font-display text-xs tracking-[0.5em] text-ember uppercase mb-4">
              {t("shen.servicesTag")}
            </p>
            <h2 className="font-display text-3xl md:text-4xl text-bone uppercase tracking-wider text-stone-carved mb-4">
              {t("shen.servicesTitle")}
            </h2>
            <div className="divider-rune my-6" />
            <p className="font-serif-elegant text-base md:text-lg text-muted-foreground italic">
              {t("shen.servicesSubtitle")}
            </p>
          </div>
        </section>

        <section className="container space-y-16">
          {FUNCTIONS.map((f, i) => (
            <ArtisanFunctionRow
              key={f.key}
              ns="shen"
              funcKey={f.key}
              icon={f.icon}
              img={f.img}
              reverse={i % 2 === 1}
            />
          ))}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
};

export default Shen;
