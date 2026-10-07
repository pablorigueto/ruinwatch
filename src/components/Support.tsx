import { ArrowUpRight, Flame } from "lucide-react";
import { useTranslation } from "react-i18next";
import { DONATE_URL, PRE_LAUNCH } from "@/lib/site";

export default function Support() {
  const { t } = useTranslation();
  return (
    <section id="support" className="relative border-t border-stone bg-ember-soft py-20 scroll-mt-20" aria-labelledby="support-title">
      <div className="container max-w-4xl text-center">
        <Flame className="mx-auto mb-5 h-7 w-7 text-ember" aria-hidden="true" />
        <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-ember mb-4">{t("support.eyebrow")}</p>
        <h2 id="support-title" className="font-display text-3xl md:text-4xl text-bone mb-6">{t("support.title")}</h2>
        <p className="max-w-2xl mx-auto text-muted-foreground leading-relaxed mb-5">{t("support.body")}</p>
        <p className="max-w-xl mx-auto text-sm text-bone/80 leading-relaxed mb-8">{t("support.voluntary")}</p>
        <p className="max-w-2xl mx-auto text-sm text-muted-foreground leading-relaxed mb-8">{t("support.pricing")}</p>
        <a href={DONATE_URL} className="btn-ember">
          {t("support.cta")} <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </a>
        <p className="text-xs text-muted-foreground mt-5">{t("support.payment")}</p>
        {PRE_LAUNCH && <p className="text-xs text-muted-foreground/80 mt-2">{t("support.prelaunch")}</p>}
      </div>
    </section>
  );
}
