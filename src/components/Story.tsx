import storyImg from "@/assets/story-sentinel.webp";
import { useTranslation, Trans } from "react-i18next";

const Story = () => {
  const { t } = useTranslation();

  return (
    <section id="story" className="relative py-28 md:py-40 overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 20% 50%, hsl(var(--crimson) / 0.06), transparent 60%)",
        }}
      />

      <div className="container relative">
        <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Image */}
          <div className="relative order-2 md:order-1">
            <div className="relative panel-stone overflow-hidden aspect-[4/5] max-w-md mx-auto">
              <img
                src={storyImg}
                alt="A hooded sentinel holds a torch among the ruins of a fallen cathedral"
                className="w-full h-full object-cover"
                loading="lazy"
                width={1024}
                height={1280}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
              <div className="absolute inset-0 ring-1 ring-inset ring-ember/10" />
            </div>
            <div className="absolute -top-3 -left-3 w-8 h-8 border-t border-l border-ember/60 max-w-md mx-auto md:mx-0" />
            <div className="absolute -bottom-3 -right-3 w-8 h-8 border-b border-r border-ember/60" />
          </div>

          {/* Text */}
          <div className="order-1 md:order-2">
            <p className="font-display text-xs tracking-[0.5em] text-ember uppercase mb-4">
              {t('story.tag')}
            </p>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-bone uppercase tracking-wider mb-8 text-stone-carved leading-tight">
              {t('story.title1')} <br />
              <span className="text-ember">{t('story.title2')}</span>
            </h2>

            <div className="divider-ember max-w-[120px] mb-8" />

            <blockquote className="font-serif-elegant text-xl md:text-2xl text-bone/90 italic leading-relaxed mb-8 border-l-2 border-ember/60 pl-6">
              {t('story.quote')}
            </blockquote>

            <div className="space-y-5 text-muted-foreground leading-relaxed">
              <p>
                <Trans i18nKey="story.p1">
                  When the world falls... <span className="text-bone font-medium">Some watch.</span>
                </Trans>
              </p>
              <p>
                <Trans i18nKey="story.p2">
                  Ruinwatch was born... <span className="text-bone font-medium">protect what can still be saved.</span>
                </Trans>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Story;
