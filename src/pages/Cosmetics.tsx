/**
 * /cosmetics — explains how players obtain cosmetics on the Ruinwatch
 * server. Walkthrough of the New Tristram vendor area, each merchant's
 * inventory, the F1 preview, and how Platinum is earned in-game.
 *
 * All screenshots live in /public/cosmetics/ and were captured from the
 * server by the project owner.
 */
import { useTranslation } from "react-i18next";
import { Coins, Crown, Eye, Heart, MapPin, Sparkles } from "lucide-react";
import Seo from "@/components/Seo";
import { breadcrumbSchema } from "@/lib/seo";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ZoomableImage from "@/components/ZoomableImage";

interface Vendor {
  key: string;
  icon: typeof Crown;
  npcImg: string;
  shopImg?: string;
}

const VENDORS: Vendor[] = [
  {
    key: "wings",
    icon: Sparkles,
    npcImg: "/cosmetics/npc-wings.png",
    shopImg: "/cosmetics/shop-wings.png",
  },
  {
    key: "pets",
    icon: Heart,
    npcImg: "/cosmetics/npc-pets.png",
    shopImg: "/cosmetics/shop-pets.png",
  },
  {
    key: "portrait",
    icon: Crown,
    npcImg: "/cosmetics/npc-portrait.png",
    shopImg: "/cosmetics/shop-portrait.png",
  },
  {
    key: "pennants",
    icon: Eye,
    npcImg: "/cosmetics/npc-pennants.png",
    shopImg: "/cosmetics/shop-pennant.png",
  },
  {
    key: "expansions",
    icon: Coins,
    npcImg: "/cosmetics/npc-expansions.png",
  },
];

const Cosmetics = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Seo
        path="/cosmetics"
        title="All Cosmetics Free — Wings, Pets, Pennants & Portraits"
        description="On RuinWatch every Diablo 3 cosmetic is free to unlock — all wings, pets, pennants, portrait frames and transmogs from past seasons. Missed them on the official servers? Earn them all here, in-game, at no cost. A free, canonical Diablo 3 private server on the Rites of Sanctuary patch with the full Altar of Rites and Ethereal Weapons."
        keywords={[
          "Diablo 3 all cosmetics free",
          "D3 free wings",
          "Diablo 3 pets pennants portraits",
          "unlock Diablo 3 cosmetics",
          "Diablo 3 transmogs server",
          "missed seasonal cosmetics",
          "Rites of Sanctuary",
          "Ethereal Weapons",
        ]}
        jsonLd={breadcrumbSchema([
          { name: "Home", url: "/" },
          { name: "Cosmetics", url: "/cosmetics" },
        ])}
      />
      <SiteHeader />
      <main className="pt-24 md:pt-28 pb-24">
        {/* HERO — title block on the left, the head Platinum merchant on the
            right with a soft ember glow behind him. Same pattern as /kadala.
            Portrait hides under lg so the text can breathe on mobile. */}
        <section className="container">
          <div className="relative mb-12 lg:min-h-[420px] grid grid-cols-1 lg:grid-cols-[1fr_auto] items-center gap-8 lg:gap-12">
            <div className="text-center lg:text-left max-w-2xl mx-auto lg:mx-0">
              <p className="font-display text-xs tracking-[0.5em] text-ember uppercase mb-4">
                {t("cosmetics.tag")}
              </p>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl text-bone uppercase tracking-wider text-stone-carved mb-6">
                {t("cosmetics.title")}
              </h1>
              <div className="divider-rune my-8 lg:mx-0" />
              <p className="font-serif-elegant text-lg md:text-xl text-muted-foreground italic">
                {t("cosmetics.subtitle")}
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
                src="/cosmetics/arghus-npc-cosmetics.png"
                alt="Arghus, head Platinum merchant"
                className="h-[420px] w-auto select-none"
                style={{
                  filter: "drop-shadow(0 12px 28px hsl(var(--ember) / 0.25))",
                }}
                draggable={false}
              />
            </div>
          </div>
        </section>

        {/* WHERE — location screenshot + caption */}
        <section className="container mb-20">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 items-center">
            <div className="panel-stone overflow-hidden">
              <img
                src="/cosmetics/cosmetic-area-location.png"
                alt={t("cosmetics.where.alt")}
                className="w-full h-auto block"
                loading="lazy"
              />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-4">
                <MapPin
                  className="w-5 h-5 text-ember flex-none"
                  strokeWidth={1.5}
                />
                <p className="font-display text-xs tracking-[0.5em] text-ember uppercase">
                  {t("cosmetics.where.tag")}
                </p>
              </div>
              <h2 className="font-display text-2xl md:text-3xl text-bone uppercase tracking-wider mb-4">
                {t("cosmetics.where.title")}
              </h2>
              <p className="font-serif-elegant text-base md:text-lg text-muted-foreground leading-relaxed">
                {t("cosmetics.where.body")}
              </p>
            </div>
          </div>
        </section>

        {/* MERCHANTS — one card per NPC */}
        <section className="container mb-20">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="font-display text-xs tracking-[0.5em] text-ember uppercase mb-4">
              {t("cosmetics.merchants.tag")}
            </p>
            <h2 className="font-display text-3xl md:text-4xl text-bone uppercase tracking-wider text-stone-carved mb-4">
              {t("cosmetics.merchants.title")}
            </h2>
            <div className="divider-rune my-6" />
            <p className="font-serif-elegant text-base md:text-lg text-muted-foreground italic">
              {t("cosmetics.merchants.subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {VENDORS.map((v) => (
              <VendorCard key={v.key} vendor={v} t={t} />
            ))}
          </div>
        </section>

        {/* PLATINUM — how to earn it */}
        <section className="container mb-20">
          <div className="panel-stone bg-card/40 p-6 md:p-10">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <div className="inline-flex items-center gap-3 mb-4">
                <Coins
                  className="w-6 h-6 text-ember"
                  strokeWidth={1.5}
                />
                <p className="font-display text-xs tracking-[0.5em] text-ember uppercase">
                  {t("cosmetics.platinum.tag")}
                </p>
              </div>
              <h2 className="font-display text-3xl md:text-4xl text-bone uppercase tracking-wider text-stone-carved mb-4">
                {t("cosmetics.platinum.title")}
              </h2>
              <p className="font-serif-elegant text-base md:text-lg text-muted-foreground italic">
                {t("cosmetics.platinum.subtitle")}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <PlatinumSource k="rifts" t={t} />
              <PlatinumSource k="greaters" t={t} />
              <PlatinumSource k="events" t={t} />
              <PlatinumSource k="online" t={t} />
            </div>

            <div className="mt-8 pt-8 border-t border-stone/60 grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-background/40 border border-ember/40 p-5">
                <div className="flex items-center gap-3 mb-3">
                  <Heart
                    className="w-5 h-5 text-ember"
                    strokeWidth={1.5}
                  />
                  <h3 className="font-display text-base text-bone uppercase tracking-[0.2em]">
                    {t("cosmetics.platinum.patreonTitle")}
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t("cosmetics.platinum.patreonBody")}
                </p>
              </div>
              <div className="bg-background/40 border border-stone p-5">
                <div className="flex items-center gap-3 mb-3">
                  <Sparkles
                    className="w-5 h-5 text-bone"
                    strokeWidth={1.5}
                  />
                  <h3 className="font-display text-base text-bone uppercase tracking-[0.2em]">
                    {t("cosmetics.platinum.fairTitle")}
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t("cosmetics.platinum.fairBody")}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* PREVIEW — F1 hint */}
        <section className="container">
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-3 mb-3">
              <Eye className="w-5 h-5 text-ember" strokeWidth={1.5} />
              <p className="font-display text-xs tracking-[0.5em] text-ember uppercase">
                {t("cosmetics.preview.tag")}
              </p>
            </div>
            <h2 className="font-display text-2xl md:text-3xl text-bone uppercase tracking-wider mb-4">
              {t("cosmetics.preview.title")}
            </h2>
            <p className="font-serif-elegant text-base md:text-lg text-muted-foreground italic">
              {t("cosmetics.preview.body")}
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
};

const VendorCard = ({
  vendor,
  t,
}: {
  vendor: Vendor;
  t: ReturnType<typeof useTranslation>["t"];
}) => {
  const Icon = vendor.icon;
  return (
    <article className="panel-stone bg-card/60 p-5 flex flex-col gap-4">
      <header className="flex items-center gap-3 pb-3 border-b border-stone/60">
        <Icon
          className="w-5 h-5 text-ember flex-none"
          strokeWidth={1.5}
        />
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-lg text-bone uppercase tracking-[0.2em] truncate">
            {t(`cosmetics.merchants.${vendor.key}.name`)}
          </h3>
          <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-muted-foreground mt-1">
            {t(`cosmetics.merchants.${vendor.key}.sub`)}
          </p>
        </div>
      </header>

      <p className="text-sm text-muted-foreground leading-relaxed">
        {t(`cosmetics.merchants.${vendor.key}.body`)}
      </p>

      <div className={`grid gap-3 ${vendor.shopImg ? "grid-cols-2" : "grid-cols-1"}`}>
        <ZoomableImage
          src={vendor.npcImg}
          alt={t(`cosmetics.merchants.${vendor.key}.name`)}
          caption={t("cosmetics.merchants.npcCaption")}
        />
        {vendor.shopImg && (
          <ZoomableImage
            src={vendor.shopImg}
            alt={`${t(`cosmetics.merchants.${vendor.key}.name`)} preview`}
            caption={t("cosmetics.merchants.shopCaption")}
          />
        )}
      </div>
    </article>
  );
};


const PlatinumSource = ({
  k,
  t,
}: {
  k: string;
  t: ReturnType<typeof useTranslation>["t"];
}) => (
  <div className="bg-background/40 border border-stone p-4 text-center">
    <p className="font-display text-xs tracking-[0.3em] text-ember uppercase mb-2">
      {t(`cosmetics.platinum.sources.${k}.title`)}
    </p>
    <p className="text-xs text-muted-foreground leading-relaxed">
      {t(`cosmetics.platinum.sources.${k}.body`)}
    </p>
  </div>
);

export default Cosmetics;
