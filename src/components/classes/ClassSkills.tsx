/**
 * ClassSkills — the heart of the class page: Active / Passive skill tabs.
 *
 * Active tab: every active skill as a row with its icon, unlock level, category,
 * cost line and description. Each row expands to reveal its five skill runes
 * (color-dot + name + effect), mirroring the official skill page.
 *
 * Passive tab: a grid of passive traits with icon, level and description.
 *
 * Data comes from useSkills() (/public/skills/skills.json). The component takes
 * an `accent` HSL string so each class colors its own tabs and dividers.
 *
 * Typography rules (legibility first):
 *   - body copy uses font-body (Inter) at ~15px, NOT the thin display serif;
 *   - highlighted values use one fixed bright amber so contrast is consistent
 *     across all seven classes (some accents — green, slate — read poorly on
 *     small text), reserving the class accent for structural chrome only.
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, Loader2, Swords, Sparkles } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ActiveSkill,
  PassiveSkill,
  Paragraphs,
  Rune,
  TextRun,
  classSkills,
  runeIndex,
  useSkills,
} from "@/lib/skills";
import type { ClassSlug } from "@/lib/classes";

/** The five runestone glyphs live in one horizontal sprite sheet. We slice it
 *  with percentage background-position so the 50.4px-per-cell width maps exactly
 *  (0/25/50/75/100%) with no sub-pixel drift. */
const RUNE_SHEET = "/images/RunesSkill.png";

const RuneGlyph = ({ letter, title }: { letter: string; title: string }) => {
  const i = runeIndex(letter); // 0..4
  return (
    <span
      aria-hidden
      title={title}
      className="flex-none w-7 h-7 rounded-sm"
      style={{
        backgroundImage: `url('${RUNE_SHEET}')`,
        backgroundSize: "500% 100%",
        backgroundPosition: `${(i / 4) * 100}% 50%`,
        backgroundRepeat: "no-repeat",
      }}
    />
  );
};

/** Fixed highlight tint for in-text values — bright amber, high contrast on
 *  the charcoal background for every class. */
const HL = "39 95% 62%";

/** One paragraph: render runs inline; highlighted values in fixed amber. */
const RunLine = ({ runs }: { runs: TextRun[] }) => (
  <>
    {runs.map((r, i) =>
      r.hl ? (
        <span key={i} className="font-semibold" style={{ color: `hsl(${HL})` }}>
          {r.text}
        </span>
      ) : (
        <span key={i}>{r.text}</span>
      ),
    )}
  </>
);

/** A multi-paragraph description block. Each paragraph is its own line so we
 *  get real vertical spacing instead of one run-on wall of text. */
const RichText = ({ paras, className = "" }: { paras: Paragraphs; className?: string }) => (
  <div className={`space-y-1.5 ${className}`}>
    {paras.map((runs, i) => (
      <p key={i} className="leading-relaxed">
        <RunLine runs={runs} />
      </p>
    ))}
  </div>
);

const SkillIcon = ({
  src,
  alt,
  size = "lg",
  bare = false,
}: {
  src?: string;
  alt: string;
  size?: "lg" | "sm";
  /** When true, render the artwork as-is — no frame, background or crop.
   *  Used for passives, whose source icons are already round. */
  bare?: boolean;
}) => {
  const dim = size === "lg" ? "w-16 h-16" : "w-12 h-12";
  const frame = bare
    ? "overflow-visible"
    : "border border-stone/80 bg-night overflow-hidden rounded-sm shadow-[inset_0_0_0_1px_rgba(0,0,0,0.5)]";
  return (
    <span className={`relative flex-none ${dim} ${frame}`}>
      {src ? (
        <img
          src={src}
          alt={alt}
          className={`w-full h-full ${bare ? "object-contain" : "object-cover"}`}
          loading="lazy"
          draggable={false}
        />
      ) : (
        <span className="flex w-full h-full items-center justify-center">
          <Swords className="w-5 h-5 text-muted-foreground" strokeWidth={1.25} />
        </span>
      )}
    </span>
  );
};

const LevelChip = ({ level }: { level: number }) => {
  const { t } = useTranslation();
  return (
    <span className="font-mono text-[11px] font-medium tracking-[0.15em] text-bone/55 whitespace-nowrap">
      {t("classes.skills.levelShort")} {level}
    </span>
  );
};

const RuneRow = ({ rune }: { rune: Rune }) => (
  <li className="flex items-start gap-3.5 py-3.5">
    <RuneGlyph letter={rune.letter} title={rune.name} />
    <div className="min-w-0 space-y-1">
      <span className="block font-display text-[15px] text-bone tracking-wide">{rune.name}</span>
      <RichText paras={rune.descRuns} className="font-body text-[14px] text-bone/80" />
    </div>
  </li>
);

const ActiveRow = ({ skill, accent }: { skill: ActiveSkill; accent: string }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const hasRunes = skill.runes.length > 0;

  return (
    <div
      className={`bg-card/70 border transition-colors ${
        open ? "border-stone" : "border-stone/50 hover:border-stone/80"
      }`}
    >
      <button
        type="button"
        onClick={() => hasRunes && setOpen((o) => !o)}
        className="w-full flex items-start gap-4 p-4 md:p-5 text-left"
        aria-expanded={hasRunes ? open : undefined}
      >
        <SkillIcon src={skill.icon} alt={skill.name} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center flex-wrap gap-x-3 gap-y-1.5">
            <h4 className="font-display text-xl text-bone uppercase tracking-wider">{skill.name}</h4>
            {skill.category && (
              <span
                className="font-mono text-[10px] font-medium uppercase tracking-[0.2em] px-2 py-0.5 rounded-sm border"
                style={{
                  borderColor: `hsl(${accent} / 0.45)`,
                  color: `hsl(${accent})`,
                  background: `hsl(${accent} / 0.08)`,
                }}
              >
                {skill.category}
              </span>
            )}
            <span className="ml-auto flex items-center gap-3">
              <LevelChip level={skill.level} />
              {hasRunes && (
                <ChevronDown
                  className={`flex-none w-5 h-5 text-bone/40 transition-transform ${open ? "rotate-180" : ""}`}
                  strokeWidth={2}
                />
              )}
            </span>
          </div>

          {skill.cost.length > 0 && (
            <div className="flex flex-wrap gap-x-5 gap-y-0.5 mt-2.5 font-mono text-[12px] text-bone/65 tracking-wide">
              {skill.cost.map((line, i) => (
                <span key={i}>
                  <RunLine runs={line} />
                </span>
              ))}
            </div>
          )}

          <RichText
            paras={skill.descRuns}
            className="font-body text-[15px] text-bone/85 mt-3 max-w-3xl"
          />
        </div>
      </button>

      {hasRunes && open && (
        <div className="px-4 md:px-5 pb-5 pl-4 md:pl-[5.5rem]">
          <div
            className="h-px w-full mb-2"
            style={{ background: `linear-gradient(90deg, hsl(${accent} / 0.6), transparent)` }}
          />
          <p className="font-display text-[11px] uppercase tracking-[0.35em] text-bone/45 py-2">
            {t("classes.skills.runesLabel")}
          </p>
          <ul className="divide-y divide-stone/35">
            {skill.runes.map((r) => (
              <RuneRow key={r.letter} rune={r} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const PassiveCard = ({ skill }: { skill: PassiveSkill }) => (
  <div className="bg-card/70 border border-stone/50 hover:border-stone/80 transition-colors p-4 md:p-5 flex items-start gap-4">
    <SkillIcon src={skill.icon} alt={skill.name} size="sm" bare />
    <div className="min-w-0 flex-1">
      <div className="flex items-baseline flex-wrap gap-x-3 gap-y-1">
        <h4 className="font-display text-[17px] text-bone uppercase tracking-wider">{skill.name}</h4>
        <span className="ml-auto">
          <LevelChip level={skill.level} />
        </span>
      </div>
      <RichText paras={skill.descRuns} className="font-body text-[14px] text-bone/85 mt-2" />
    </div>
  </div>
);

const ClassSkills = ({ slug, accent }: { slug: ClassSlug; accent: string }) => {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useSkills();
  const skills = classSkills(data, slug);

  const tabTrigger =
    "rounded-none font-display text-xs tracking-[0.25em] uppercase text-bone/55 px-5 py-2 " +
    "data-[state=active]:bg-ember/15 data-[state=active]:text-ember-glow data-[state=active]:shadow-[inset_0_-2px_0_0_hsl(var(--ember))]";

  return (
    <section className="mb-16">
      <div className="flex items-center gap-3 mb-6">
        <Sparkles className="w-5 h-5" style={{ color: `hsl(${accent})` }} strokeWidth={1.5} />
        <p className="font-display text-xs tracking-[0.4em] uppercase" style={{ color: `hsl(${accent})` }}>
          {t("classes.skills.tag")}
        </p>
      </div>
      <h2 className="font-display text-2xl md:text-3xl text-bone uppercase tracking-wider mb-6">
        {t("classes.skills.title")}
      </h2>

      {isLoading && (
        <div className="flex items-center gap-3 text-bone/60 font-mono text-sm py-12 justify-center">
          <Loader2 className="w-5 h-5 animate-spin" /> {t("classes.skills.loading")}
        </div>
      )}
      {isError && (
        <p className="font-mono text-sm text-bone/60 py-12 text-center">{t("classes.skills.error")}</p>
      )}

      {skills && (
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="bg-card/50 border border-stone/60 rounded-none mb-6 p-0 h-auto">
            <TabsTrigger value="active" className={tabTrigger}>
              {t("classes.skills.activeTab")} ({skills.active.length})
            </TabsTrigger>
            <TabsTrigger value="passive" className={tabTrigger}>
              {t("classes.skills.passiveTab")} ({skills.passive.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-2.5 mt-0">
            <p className="font-mono text-[11px] text-bone/45 tracking-wide mb-3">
              {t("classes.skills.activeHint")}
            </p>
            {skills.active.map((s) => (
              <ActiveRow key={s.slug} skill={s} accent={accent} />
            ))}
          </TabsContent>

          <TabsContent value="passive" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {skills.passive.map((s) => (
                <PassiveCard key={s.slug} skill={s} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </section>
  );
};

export default ClassSkills;
