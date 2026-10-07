import {
  Flame,
  Swords,
  Sparkles,
  ShieldCheck,
  Infinity as InfinityIcon,
  Users,
} from "lucide-react";
import { useTranslation } from "react-i18next";

const Features = () => {
  const { t } = useTranslation();

  const FEATURES = [
    {
      icon: Flame,
      title: t('features.f1Title'),
      text: t('features.f1Text'),
    },
    {
      icon: Swords,
      title: t('features.f2Title'),
      text: t('features.f2Text'),
    },
    {
      icon: Sparkles,
      title: t('features.f3Title'),
      text: t('features.f3Text'),
    },
    {
      icon: ShieldCheck,
      title: t('features.f4Title'),
      text: t('features.f4Text'),
    },
    {
      icon: InfinityIcon,
      title: t('features.f5Title'),
      text: t('features.f5Text'),
    },
    {
      icon: Users,
      title: t('features.f6Title'),
      text: t('features.f6Text'),
    },
  ];

  return (
    <section id="features" className="relative py-28 md:py-36">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto mb-20">
          <p className="font-display text-xs tracking-[0.5em] text-ember uppercase mb-4">
            {t('features.tag')}
          </p>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-bone uppercase tracking-wider text-stone-carved mb-6">
            {t('features.title')}
          </h2>
          <div className="divider-rune my-8" />
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-stone/40 panel-stone overflow-hidden">
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className="group bg-card p-8 lg:p-10 transition-all duration-500 hover:bg-background relative"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-ember/0 to-transparent group-hover:via-ember/60 transition-all duration-500" />

              <f.icon
                className="w-7 h-7 text-ember mb-6"
                strokeWidth={1.25}
              />
              <h3 className="font-display text-lg text-bone uppercase tracking-[0.2em] mb-3">
                {f.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
