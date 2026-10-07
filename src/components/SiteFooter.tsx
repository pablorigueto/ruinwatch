import LogoMark from "./LogoMark";
import SocialLinks from "./SocialLinks";
import { useTranslation, Trans } from "react-i18next";
import { DISCORD_URL } from "@/lib/site";

const SiteFooter = () => {
  const { t } = useTranslation();

  return (
    <footer className="relative border-t border-stone bg-background pt-20 pb-10 overflow-hidden">
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, hsl(var(--ember) / 0.6), transparent)",
        }}
      />

      <div className="container">
        <div className="grid md:grid-cols-4 gap-12 mb-16">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-5">
              <LogoMark size={44} />
              <span className="font-display text-xl text-bone tracking-[0.25em]">
                RUINWATCH
              </span>
            </div>
            <p className="font-serif-elegant text-lg text-muted-foreground italic max-w-sm leading-relaxed">
              {t('pillars.quote')}
            </p>
            <p className="mt-6 text-xs text-muted-foreground/70 max-w-sm">
              {t('footer.desc')}
            </p>
            <SocialLinks className="mt-6" />
          </div>

          <div>
            <h4 className="font-display text-xs tracking-[0.4em] text-ember uppercase mb-5">
              {t('footer.col1')}
            </h4>
            <ul className="space-y-3 text-sm">
              {[
                { href: "#story", label: t('nav.vigil') },
                { href: "#features", label: t('nav.features') },
                { href: "/builds", label: t('nav.builds') },
                { href: "#join", label: t('nav.join') }
              ].map((l, i) => (
                <li key={i}>
                  <a
                    href={l.href}
                    className="text-muted-foreground hover:text-ember transition-colors"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display text-xs tracking-[0.4em] text-ember uppercase mb-5">
              {t('footer.col2')}
            </h4>
            <ul className="space-y-3 text-sm">
              {[
                { label: "Discord", href: DISCORD_URL, external: true },
                { label: "Forums", href: "#" },
                { label: "Wiki", href: "#" },
                { label: "Status", href: "#" },
                { label: "Patch Notes", href: "#" },
              ].map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    {...(l.external ? { target: "_blank", rel: "noreferrer noopener" } : {})}
                    className="text-muted-foreground hover:text-ember transition-colors"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="divider-rune mb-8" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground/60">
            {t('footer.bottom1', { year: new Date().getFullYear() })}
          </p>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/50 max-w-sm text-right leading-relaxed">
            <Trans i18nKey="footer.bottom2">
              All registered trademarks, character names, and lore belong to their respective owners. <br className="hidden md:block"/>
              This is an educational and preservation project functioning entirely not-for-profit.
            </Trans>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;
