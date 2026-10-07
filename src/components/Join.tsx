import { Download, UserPlus, Settings, Flame, MessagesSquare, BellRing, Swords } from "lucide-react";
import { useTranslation } from "react-i18next";
import { DISCORD_URL, PRE_LAUNCH } from "@/lib/site";
import DiscordIcon from "./DiscordIcon";

const Join = () => {
  const { t } = useTranslation();

  // Before launch the server isn't open, so the steps funnel to Discord (the
  // waitlist) instead of "download the client / create an account".
  const STEPS = PRE_LAUNCH
    ? [
        { icon: MessagesSquare, title: t('join.p1Title'), text: t('join.p1Text') },
        { icon: BellRing, title: t('join.p2Title'), text: t('join.p2Text') },
        { icon: Swords, title: t('join.p3Title'), text: t('join.p3Text') },
      ]
    : [
        { icon: Download, title: t('join.j1Title'), text: t('join.j1Text') },
        { icon: UserPlus, title: t('join.j2Title'), text: t('join.j2Text') },
        { icon: Settings, title: t('join.j3Title'), text: t('join.j3Text') },
        { icon: Flame, title: t('join.j4Title'), text: t('join.j4Text') },
      ];

  return (
    <section id="join" className="relative py-28 md:py-36 bg-night">
      <div className="container relative">
        <div className="text-center max-w-2xl mx-auto mb-20">
          <p className="font-display text-xs tracking-[0.5em] text-ember uppercase mb-4">
            {t('join.tag')}
          </p>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-bone uppercase tracking-wider text-stone-carved mb-6">
            {t('join.title')}
          </h2>
          <div className="divider-rune my-8" />
          <p className="font-serif-elegant text-lg md:text-xl text-muted-foreground italic">
            {PRE_LAUNCH ? t('join.subtitlePre') : t('join.subtitle')}
          </p>
        </div>

        <div className="relative max-w-3xl mx-auto">
          <div className="absolute left-7 md:left-8 top-4 bottom-4 w-px bg-gradient-to-b from-transparent via-ember/40 to-transparent hidden sm:block" />

          <ol className="space-y-8">
            {STEPS.map((step, i) => (
              <li key={i} className="relative flex gap-6 sm:gap-8 group">
                <div className="relative flex-shrink-0">
                  <div className="relative w-14 h-14 md:w-16 md:h-16 flex items-center justify-center bg-card border border-stone group-hover:border-ember transition-colors">
                    <step.icon
                      className="w-5 h-5 md:w-6 md:h-6 text-ember"
                      strokeWidth={1.25}
                    />
                    <span className="absolute -top-2 -right-2 w-6 h-6 bg-background border border-ember/60 flex items-center justify-center font-display text-[10px] text-ember tracking-wider">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                </div>

                <div className="flex-1 panel-stone p-6 md:p-7 group-hover:border-ember/40 transition-colors">
                  <h3 className="font-display text-lg md:text-xl text-bone uppercase tracking-[0.2em] mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-20 text-center max-w-xl mx-auto">
          <div className="divider-ember mb-10" />
          <p className="font-serif-elegant text-xl md:text-2xl text-bone/70 italic mb-4 leading-relaxed">
            {t('join.q1')}
          </p>
          <p className="font-serif-elegant text-xl md:text-2xl text-bone italic mb-4 leading-relaxed">
            {t('join.q2')}
          </p>
          <p className="font-display text-2xl md:text-3xl text-ember uppercase tracking-[0.15em] mb-8">
            {t('join.q3')}
          </p>
          {PRE_LAUNCH ? (
            <a
              href={DISCORD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ember"
            >
              <DiscordIcon className="w-4 h-4" />
              {t('join.btnPre')}
            </a>
          ) : (
            <a href="#" className="btn-ember">
              <Flame className="w-4 h-4" strokeWidth={1.75} />
              {t('join.btn')}
            </a>
          )}
        </div>
      </div>
    </section>
  );
};

export default Join;
