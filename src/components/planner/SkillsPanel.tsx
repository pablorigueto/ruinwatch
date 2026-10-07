/**
 * SkillsPanel — Phase 4. Build the skill bar: 6 active skill slots (each a
 * skill + an optional rune) and 4 passive slots. Data is reused from the
 * generated skills.json via useSkills(); the picker is filtered to the
 * planner's selected class.
 */
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { X, Plus, Swords, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SkillState } from "@/lib/planner";
import { ActiveSkill, Paragraphs, PassiveSkill, Rune, classSkills, runeIndex, runsText, useSkills } from "@/lib/skills";

const RUNE_SHEET = "/images/RunesSkill.png";
const ACTIVE_SLOTS = 6;
const PASSIVE_SLOTS = 4;

const RuneGlyph = ({ letter, className = "w-5 h-5" }: { letter: string; className?: string }) => {
  const i = runeIndex(letter);
  return (
    <span
      aria-hidden
      className={`${className} rounded-sm flex-none`}
      style={{
        backgroundImage: `url('${RUNE_SHEET}')`,
        backgroundSize: "500% 100%",
        backgroundPosition: `${(i / 4) * 100}% 50%`,
        backgroundRepeat: "no-repeat",
      }}
    />
  );
};

/** Render description paragraphs with the green-highlighted values D3 paints. */
const RuneDesc = ({ paras }: { paras: Paragraphs }) => (
  <>
    {paras.map((runs, pi) => (
      <span key={pi} className="block leading-snug">
        {runs.map((r, ri) => (
          <span key={ri} className={r.hl ? "text-[#6fe06f] font-medium" : "text-bone/80"}>
            {r.text}
          </span>
        ))}
      </span>
    ))}
  </>
);

/** Rich hover tooltip for a passive: name, level and effect. */
const PassiveCard = ({ passive }: { passive: PassiveSkill }) => (
  <span className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity absolute left-1/2 -translate-x-1/2 bottom-[112%] z-30 w-64 text-left pointer-events-none"
    style={{ filter: "drop-shadow(0 6px 16px rgba(0,0,0,0.85))" }}>
    <span className="block border-2 border-[#8a6d2f] rounded-md overflow-hidden" style={{ backgroundColor: "#0c0a08" }}>
      <span className="block text-center px-3 py-2 border-b border-[#8a6d2f]/60" style={{ background: "linear-gradient(#1a140c,#0c0a08)" }}>
        <span className="font-display text-base text-[#e8c97a] tracking-wide">{passive.name}</span>
      </span>
      <span className="block px-3 py-2.5 font-body text-[12px]">
        <span className="block text-[#c9a86a]/70 text-[10px] uppercase tracking-wider mb-1">Passive · Lv {passive.level}</span>
        <RuneDesc paras={passive.descRuns} />
      </span>
    </span>
  </span>
);

/** Rich hover tooltip for a skill slot: the skill (name, cost,
 *  description) followed by the chosen rune's own name + description. */
const SkillCard = ({ skill, rune }: { skill: ActiveSkill; rune?: Rune }) => (
  <span className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity absolute left-1/2 -translate-x-1/2 bottom-[108%] z-30 w-72 text-left pointer-events-none"
    style={{ filter: "drop-shadow(0 6px 16px rgba(0,0,0,0.85))" }}>
    <span className="block border-2 border-[#8a6d2f] rounded-md overflow-hidden" style={{ backgroundColor: "#0c0a08" }}>
      <span className="block text-center px-3 py-2 border-b border-[#8a6d2f]/60" style={{ background: "linear-gradient(#1a140c,#0c0a08)" }}>
        <span className="font-display text-base text-[#e8c97a] tracking-wide">{skill.name}</span>
      </span>
      <span className="block px-3 py-2.5 font-body text-[12px]">
        <span className="block text-[#c9a86a]/70 text-[10px] uppercase tracking-wider mb-1">
          {skill.category} · Lv {skill.level}
        </span>
        {skill.cost?.length > 0 && (
          <span className="block text-bone/55 text-[11px] mb-1.5">{runsText(skill.cost)}</span>
        )}
        <RuneDesc paras={skill.descRuns} />
      </span>
      {rune && (
        <span className="block px-3 py-2.5 border-t border-[#8a6d2f]/40 font-body text-[12px]">
          <span className="flex items-center gap-2 mb-1.5">
            <RuneGlyph letter={rune.letter} className="w-4 h-4" />
            <span className="font-display text-sm text-[#e8c97a] tracking-wide">{rune.name}</span>
          </span>
          <RuneDesc paras={rune.descRuns} />
        </span>
      )}
    </span>
  </span>
);

/* ---- active skill picker (skill, then rune) ---------------------------- */

const ActivePicker = ({
  skills,
  taken,
  onPick,
  onClose,
}: {
  skills: ActiveSkill[];
  taken: Set<string>;
  onPick: (skill: string, rune: string | null) => void;
  onClose: () => void;
}) => {
  const { t } = useTranslation();
  const [q, setQ] = useState("");
  const [chosen, setChosen] = useState<ActiveSkill | null>(null);

  const list = useMemo(() => {
    const n = q.trim().toLowerCase();
    return skills.filter((s) => !taken.has(s.slug) && (!n || s.name.toLowerCase().includes(n)));
  }, [skills, taken, q]);

  return (
    <DialogContent className="max-w-lg bg-background border-stone/70 rounded-none p-0 gap-0 max-h-[85vh] flex flex-col">
      <DialogHeader className="p-5 border-b border-stone/60">
        <DialogTitle className="font-display text-lg text-bone uppercase tracking-wider">
          {chosen ? `${chosen.name} — ${t("planner.skills.chooseRune")}` : t("planner.skills.chooseSkill")}
        </DialogTitle>
      </DialogHeader>

      {!chosen ? (
        <>
          <div className="p-4 border-b border-stone/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bone/40" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t("planner.search")}
                className="w-full bg-card/70 border border-stone/60 rounded-none pl-9 pr-3 py-2 font-body text-sm text-bone placeholder:text-bone/35 focus:outline-none focus:border-ember/60"
              />
            </div>
          </div>
          <div className="overflow-y-auto p-2">
            {list.map((s) => (
              <button
                key={s.slug}
                type="button"
                onClick={() => (s.runes.length ? setChosen(s) : onPick(s.slug, null))}
                className="w-full flex items-center gap-3 p-2 text-left hover:bg-card/70 transition-colors"
              >
                <span className="flex-none w-10 h-10 border border-stone/60 bg-night rounded-sm overflow-hidden flex items-center justify-center">
                  {s.icon ? <img src={s.icon} alt="" className="w-full h-full object-cover" loading="lazy" /> : <Swords className="w-4 h-4 text-bone/30" />}
                </span>
                <span className="font-display text-sm text-bone tracking-wide">{s.name}</span>
                <span className="ml-auto font-mono text-[10px] text-bone/35 uppercase">{s.category}</span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="overflow-y-auto p-2">
          <button
            type="button"
            onClick={() => onPick(chosen.slug, null)}
            className="w-full flex items-center gap-3 p-2.5 text-left hover:bg-card/70 border-b border-stone/30"
          >
            <span className="w-5 h-5 flex-none" />
            <span className="font-body text-sm text-bone/70 italic">{t("planner.skills.noRune")}</span>
          </button>
          {chosen.runes.map((r) => (
            <button
              key={r.letter}
              type="button"
              onClick={() => onPick(chosen.slug, r.letter)}
              className="w-full flex items-center gap-3 p-2.5 text-left hover:bg-card/70 transition-colors"
            >
              <RuneGlyph letter={r.letter} />
              <span className="font-display text-sm text-bone tracking-wide">{r.name}</span>
            </button>
          ))}
        </div>
      )}
    </DialogContent>
  );
};

/* ---- passive picker ---------------------------------------------------- */

const PassivePicker = ({
  passives,
  taken,
  onPick,
  onClose,
}: {
  passives: { name: string; slug: string; icon?: string }[];
  taken: Set<string>;
  onPick: (slug: string) => void;
  onClose: () => void;
}) => {
  const { t } = useTranslation();
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const n = q.trim().toLowerCase();
    return passives.filter((p) => !taken.has(p.slug) && (!n || p.name.toLowerCase().includes(n)));
  }, [passives, taken, q]);
  return (
    <DialogContent className="max-w-lg bg-background border-stone/70 rounded-none p-0 gap-0 max-h-[85vh] flex flex-col">
      <DialogHeader className="p-5 border-b border-stone/60">
        <DialogTitle className="font-display text-lg text-bone uppercase tracking-wider">
          {t("planner.skills.choosePassive")}
        </DialogTitle>
      </DialogHeader>
      <div className="p-4 border-b border-stone/50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bone/40" />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("planner.search")} className="w-full bg-card/70 border border-stone/60 rounded-none pl-9 pr-3 py-2 font-body text-sm text-bone placeholder:text-bone/35 focus:outline-none focus:border-ember/60" />
        </div>
      </div>
      <div className="overflow-y-auto p-2">
        {list.map((p) => (
          <button key={p.slug} type="button" onClick={() => onPick(p.slug)} className="w-full flex items-center gap-3 p-2 text-left hover:bg-card/70 transition-colors">
            <span className="flex-none w-10 h-10 rounded-full overflow-hidden bg-night flex items-center justify-center">
              {p.icon ? <img src={p.icon} alt="" className="w-full h-full object-contain" loading="lazy" /> : <Swords className="w-4 h-4 text-bone/30" />}
            </span>
            <span className="font-display text-sm text-bone tracking-wide">{p.name}</span>
          </button>
        ))}
      </div>
    </DialogContent>
  );
};

/* ---- panel ------------------------------------------------------------- */

const SkillsPanel = ({
  klass,
  skills,
  onChange,
}: {
  klass: string;
  skills: SkillState;
  onChange: (next: SkillState) => void;
}) => {
  const { t } = useTranslation();
  const { data } = useSkills();
  const cs = classSkills(data, klass as never);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [passiveIdx, setPassiveIdx] = useState<number | null>(null);

  const activeBySlug = useMemo(() => {
    const m: Record<string, ActiveSkill> = {};
    cs?.active.forEach((s) => (m[s.slug] = s));
    return m;
  }, [cs]);
  const passiveBySlug = useMemo(() => {
    const m: Record<string, PassiveSkill> = {};
    cs?.passive.forEach((s) => (m[s.slug] = s));
    return m;
  }, [cs]);

  const takenActive = new Set(skills.active.map((a) => a.skill));
  const takenPassive = new Set(skills.passives);

  const setActive = (i: number, skill: string, rune: string | null) => {
    const next = [...skills.active];
    next[i] = { skill, rune };
    onChange({ ...skills, active: next });
    setActiveIdx(null);
  };
  const clearActive = (i: number) => {
    const next = [...skills.active];
    next.splice(i, 1);
    onChange({ ...skills, active: next });
  };
  const setPassive = (i: number, slug: string) => {
    const next = [...skills.passives];
    next[i] = slug;
    onChange({ ...skills, passives: next });
    setPassiveIdx(null);
  };
  const clearPassive = (i: number) => {
    const next = [...skills.passives];
    next.splice(i, 1);
    onChange({ ...skills, passives: next });
  };

  return (
    <section className="mt-8">
      <div className="flex items-center gap-2 mb-3">
        <Swords className="w-4 h-4 text-ember" />
        <h2 className="font-display text-sm uppercase tracking-[0.3em] text-bone/70">{t("planner.skills.title")}</h2>
      </div>

      {/* active bar */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 mb-4">
        {Array.from({ length: ACTIVE_SLOTS }).map((_, i) => {
          const entry = skills.active[i];
          const skill = entry ? activeBySlug[entry.skill] : null;
          const rune = skill && entry?.rune ? skill.runes.find((r) => r.letter === entry.rune) : undefined;
          return (
            <div
              key={i}
              className="relative min-h-[150px] bg-card/60 border border-stone/60 group"
            >
              <button type="button" onClick={() => setActiveIdx(i)} className="w-full h-full flex flex-col items-center justify-center p-2 gap-0.5">
                {skill ? (
                  <>
                    {skill.icon ? (
                      <img src={skill.icon} alt={skill.name} className="w-12 h-12 object-cover rounded-sm" />
                    ) : (
                      <Swords className="w-6 h-6 text-bone/40" />
                    )}
                    <span className="mt-1 font-mono text-[9px] text-bone/60 text-center leading-tight line-clamp-1">{skill.name}</span>
                    {rune && (
                      <span className="mt-1 flex flex-col items-center gap-0.5 max-w-full">
                        <RuneGlyph letter={rune.letter} className="h-[45px] w-[45px]" />
                        <span className="font-mono text-[9px] text-ember/85 text-center leading-tight line-clamp-1">{rune.name}</span>
                      </span>
                    )}
                  </>
                ) : (
                  <Plus className="w-5 h-5 text-bone/30" />
                )}
              </button>
              {skill && <SkillCard skill={skill} rune={rune} />}
              {skill && (
                <button type="button" onClick={() => clearActive(i)} className="absolute top-1 right-1 text-bone/40 hover:text-ember opacity-0 group-hover:opacity-100">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* passives */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {Array.from({ length: PASSIVE_SLOTS }).map((_, i) => {
          const slug = skills.passives[i];
          const p = slug ? passiveBySlug[slug] : null;
          return (
            <div
              key={i}
              className="relative flex items-center gap-2 bg-card/60 border border-stone/60 p-2 group"
            >
              <button type="button" onClick={() => setPassiveIdx(i)} className="flex items-center gap-2 min-w-0 flex-1">
                <span className="flex-none w-9 h-9 rounded-full overflow-hidden bg-night flex items-center justify-center">
                  {p?.icon ? <img src={p.icon} alt="" className="w-full h-full object-contain" /> : <Plus className="w-4 h-4 text-bone/30" />}
                </span>
                <span className="min-w-0 font-display text-xs text-bone tracking-wide truncate">
                  {p ? p.name : <span className="text-bone/35 italic">{t("planner.skills.passive")}</span>}
                </span>
              </button>
              {p && <PassiveCard passive={p} />}
              {p && (
                <button type="button" onClick={() => clearPassive(i)} className="text-bone/40 hover:text-ember opacity-0 group-hover:opacity-100">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      <Dialog open={activeIdx !== null} onOpenChange={(o) => !o && setActiveIdx(null)}>
        {activeIdx !== null && cs && (
          <ActivePicker
            skills={cs.active}
            taken={takenActive}
            onPick={(skill, rune) => setActive(activeIdx, skill, rune)}
            onClose={() => setActiveIdx(null)}
          />
        )}
      </Dialog>
      <Dialog open={passiveIdx !== null} onOpenChange={(o) => !o && setPassiveIdx(null)}>
        {passiveIdx !== null && cs && (
          <PassivePicker
            passives={cs.passive}
            taken={takenPassive}
            onPick={(slug) => setPassive(passiveIdx, slug)}
            onClose={() => setPassiveIdx(null)}
          />
        )}
      </Dialog>
    </section>
  );
};

export default SkillsPanel;
