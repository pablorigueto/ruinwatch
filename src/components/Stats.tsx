import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

interface CountUpProps { target: number; duration?: number; }

const CountUp = ({ target, duration = 2000 }: CountUpProps) => {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const tick = (now: number) => {
            const t = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - t, 3);
            setValue(Math.floor(target * eased));
            if (t < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.4 }
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [target, duration]);

  return <span ref={ref}>{value.toLocaleString()}</span>;
};

const Stats = () => {
  const { t } = useTranslation();

  const STATS = [
    { value: 2847, label: t('stats.s1'), suffix: "" },
    { value: 100, label: t('stats.s2'), suffix: "%" },
    { value: 67, label: t('stats.s3'), suffix: "+" },
    { value: 187, label: t('stats.s4'), suffix: "" },
  ];

  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, transparent, hsl(var(--ember) / 0.03), transparent)",
        }}
      />
      <div className="container relative">
        <div className="text-center mb-16">
          <p className="font-display text-xs tracking-[0.5em] text-ember uppercase mb-4">
            {t('stats.tag')}
          </p>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-bone uppercase tracking-wider text-stone-carved">
            {t('stats.title')}
          </h2>
          <div className="divider-ember mt-8 max-w-xs mx-auto" />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-stone/40 panel-stone overflow-hidden">
          {STATS.map((s, i) => (
            <div
              key={i}
              className="bg-card p-8 md:p-10 text-center group hover:bg-background/60 transition-colors"
            >
              <div className="font-display text-4xl md:text-5xl lg:text-6xl text-ember mb-4 text-ember-glow">
                <CountUp target={s.value} />
                {s.suffix}
              </div>
              <div className="font-display text-[10px] md:text-xs tracking-[0.35em] text-muted-foreground uppercase">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Stats;
