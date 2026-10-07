/**
 * /myriam — Myriam Jahzia, the Mystic. Three functions she offers on this
 * server: Enchant (reroll a single property), Transmogrify (swap a piece's
 * appearance), and Dye (recolor your worn gear). Screenshots come from
 * /public/cosmetics/myriam-*.png — they're captures from the live server.
 */
import { useTranslation } from "react-i18next";
import { LucideIcon, Sparkles, Shirt, Paintbrush } from "lucide-react";
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
  { key: "enchant",      icon: Sparkles,   img: "/cosmetics/myriam-npc-function-1.png" },
  { key: "transmogrify", icon: Shirt,      img: "/cosmetics/myriam-npc-function-2.png" },
  { key: "dye",          icon: Paintbrush, img: "/cosmetics/myriam-npc-function-3.png" },
];

const Myriam = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Seo
        path="/myriam"
        title="Myriam the Mystic — Enchant, Transmogrify & Dye"
        description="Myriam Jahzia, the Mystic, on RuinWatch (Diablo 3). Reroll a single property with Enchant, change any piece's look with Transmogrify, and recolor your gear with Dye. Full walkthrough with in-game screenshots."
        keywords={["Diablo 3 Mystic", "Myriam enchant", "D3 transmogrify", "Diablo 3 dye"]}
        jsonLd={breadcrumbSchema([
          { name: "Home", url: "/" },
          { name: "Myriam", url: "/myriam" },
        ])}
      />
      <SiteHeader />
      <main className="pt-24 md:pt-28 pb-24">
        {/* HERO — text left, Myriam portrait right with ember glow */}
        <section className="container">
          <div className="relative mb-16 lg:min-h-[420px] grid grid-cols-1 lg:grid-cols-[1fr_auto] items-center gap-8 lg:gap-12">
            <div className="text-center lg:text-left max-w-2xl mx-auto lg:mx-0">
              <p className="font-display text-xs tracking-[0.5em] text-ember uppercase mb-4">
                {t("myriam.tag")}
              </p>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl text-bone uppercase tracking-wider text-stone-carved mb-6">
                {t("myriam.title")}
              </h1>
              <div className="divider-rune my-8 lg:mx-0" />
              <p className="font-serif-elegant text-lg md:text-xl text-muted-foreground italic">
                {t("myriam.subtitle")}
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
                src="/cosmetics/npc-myriam.png"
                alt="Myriam Jahzia, the Mystic"
                className="h-[420px] w-auto select-none"
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
              {t("myriam.servicesTag")}
            </p>
            <h2 className="font-display text-3xl md:text-4xl text-bone uppercase tracking-wider text-stone-carved mb-4">
              {t("myriam.servicesTitle")}
            </h2>
            <div className="divider-rune my-6" />
            <p className="font-serif-elegant text-base md:text-lg text-muted-foreground italic">
              {t("myriam.servicesSubtitle")}
            </p>
          </div>
        </section>

        {/* FUNCTIONS — alternating layout, screenshot left/right of copy */}
        <section className="container space-y-16">
          {FUNCTIONS.map((f, i) => (
            <ArtisanFunctionRow
              key={f.key}
              ns="myriam"
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

export default Myriam;
