import { Link } from "react-router-dom";
import EmberField from "./EmberField";
import LogoMark from "./LogoMark";
import heroImg from "@/assets/hero-watchtower.webp";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { DISCORD_URL, PRE_LAUNCH } from "@/lib/site";
import DiscordIcon from "./DiscordIcon";

const Hero = () => {
  const { t } = useTranslation();

  return (
    <section
      id="top"
      className="relative min-h-screen flex items-center justify-center overflow-hidden vignette"
    >
      {/* Background image */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImg}
          alt="Ruined watchtower with a burning ember at its peak"
          className="w-full h-full object-cover opacity-50"
          width={1920}
          height={1080}
          loading="eager"
          // @ts-expect-error fetchpriority is a valid HTML attr not yet in React's types
          fetchpriority="high"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 40% at 50% 30%, hsl(var(--ember) / 0.18), transparent 70%)",
          }}
        />
      </div>

      <EmberField count={40} className="z-10" />

      {/* Content */}
      <div className="container relative z-20 text-center pt-24 pb-16">
        {/*<div className="flex justify-center mb-8 animate-fade-in-slow">
          <LogoMark size={120} />
        </div>*/}

        {PRE_LAUNCH && (
          <div className="flex justify-center mb-5 animate-fade-up">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 border border-ember/50 bg-ember/10 text-ember font-mono text-[10px] md:text-xs uppercase tracking-[0.3em]">
              <span className="w-1.5 h-1.5 rounded-full bg-ember animate-pulse" />
              {t('hero.comingSoon')}
            </span>
          </div>
        )}

        <p className="font-display text-xs md:text-sm tracking-[0.6em] text-ember mb-6 animate-fade-up uppercase">
          {t('hero.anno')}
        </p>

        <h1
          className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-bone tracking-[0.15em] uppercase mb-6 text-stone-carved animate-fade-up"
          style={{ animationDelay: "0.15s" }}
        >
          {t('hero.title')}
        </h1>

        <div
          className="max-w-2xl mx-auto animate-fade-up"
          style={{ animationDelay: "0.3s" }}
        >
          <div className="divider-ember mb-6 max-w-xs mx-auto" />
          <p className="font-serif-elegant text-xl md:text-2xl lg:text-3xl text-bone/90 italic leading-relaxed">
            {t('hero.subtitle')}
          </p>
          <div className="divider-ember mt-6 max-w-xs mx-auto" />
        </div>

        <p
          className="mt-8 max-w-xl mx-auto text-muted-foreground text-sm md:text-base leading-relaxed animate-fade-up"
          style={{ animationDelay: "0.45s" }}
        >
          {t('hero.desc')}
        </p>

        <div
          className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-up"
          style={{ animationDelay: "0.6s" }}
        >
          <a
            href={DISCORD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ember group w-full sm:w-auto sm:min-w-[280px]"
          >
            <DiscordIcon className="w-4 h-4" />
            {PRE_LAUNCH ? t('hero.joinDiscord') : t('nav.joinBtn')}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" strokeWidth={1.75} />
          </a>
          <Link
            to="/builds"
            className="inline-flex items-center justify-center gap-3 w-full sm:w-auto sm:min-w-[280px] px-8 py-4 border border-bone/30 text-bone font-display text-sm tracking-[0.3em] uppercase hover:border-ember hover:text-ember transition-all duration-500"
          >
            {t('hero.browse')}
          </Link>
        </div>

        {/* Scroll cue */}
        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-fade-in-slow"
          style={{ animationDelay: "1.5s" }}
        >
          <div className="flex flex-col items-center gap-2 text-muted-foreground/60">
            <div className="w-px h-12 bg-gradient-to-b from-ember/60 to-transparent" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
