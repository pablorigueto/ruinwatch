/**
 * StatSummary — Phase 6 character-sheet panel. Sums all gear affixes, normal
 * gems and paragon points into a flat totals list. This is summation only, not
 * a combat simulation (set/skill multipliers and DPS land in Phase 7).
 */
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ListChecks, Swords, Shield, HeartPulse, Crosshair, Flame } from "lucide-react";
import {
  BuildState,
  PlannerData,
  SUMMARY_STATS,
  activeSets,
  aggregateStats,
  availableBuffs,
  buffMultiplier,
  useSkillDamage,
} from "@/lib/planner";
import { combatDps, computeSheet } from "@/lib/planner-sim";
import { classSkills, useSkills } from "@/lib/skills";

const fmt = (v: number, percent?: boolean) => {
  const n = Number.isInteger(v) ? v : +v.toFixed(2);
  return `${n.toLocaleString()}${percent ? "%" : ""}`;
};

/** Compact big-number formatting for DPS/Toughness (e.g. 1.2M, 845K). */
const big = (v: number) => {
  if (!Number.isFinite(v) || v <= 0) return "0";
  if (v >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
  return String(Math.round(v));
};

const StatSummary = ({
  data,
  build,
  onBuildChange,
}: {
  data: PlannerData;
  build: BuildState;
  onBuildChange?: (b: BuildState) => void;
}) => {
  const { t } = useTranslation();
  const totals = useMemo(() => aggregateStats(data, build), [data, build]);
  const sheet = useMemo(() => computeSheet(data, build), [data, build]);
  const rows = SUMMARY_STATS.filter((s) => (totals[s.key] ?? 0) !== 0);

  const { data: skillDataAll } = useSkills();
  const skillNames = useMemo(() => {
    const m: Record<string, string> = {};
    const cs = classSkills(skillDataAll, build.klass as never);
    cs?.active.forEach((s) => (m[s.slug] = s.name));
    cs?.passive.forEach((s) => (m[s.slug] = s.name));
    return m;
  }, [skillDataAll, build.klass]);

  const sets = useMemo(() => activeSets(data, build), [data, build]);
  // toggleable damage buffs (sets/gems/class/global) that multiply combat DPS
  const buffs = useMemo(() => availableBuffs(data, build, skillNames), [data, build, skillNames]);
  const buffMult = useMemo(() => buffMultiplier(data, build), [data, build]);
  const toggleBuff = (id: string) => {
    if (!onBuildChange) return;
    const on = build.buffs.includes(id);
    onBuildChange({ ...build, buffs: on ? build.buffs.filter((x) => x !== id) : [...build.buffs, id] });
  };

  // canonical per-skill combat DPS (CASC-derived coefficients × active buffs)
  const { data: skillDmg } = useSkillDamage();
  const skillDps = useMemo(() => {
    if (!skillDmg) return [];
    return build.skills.active
      .filter((a) => a?.skill && skillDmg[a.skill])
      .map((a) => ({
        slug: a.skill,
        name: skillNames[a.skill] ?? a.skill,
        dps: combatDps(sheet, skillDmg[a.skill].coeff) * buffMult,
        coeff: skillDmg[a.skill].coeff,
      }));
  }, [skillDmg, skillNames, build.skills.active, sheet, buffMult]);

  // Headline DPS = the strongest equipped skill's combat DPS (× buffs); falls
  // back to the bare sheet DPS when no damaging skill is on the bar.
  const bestSkillDps = skillDps.reduce((mx, s) => Math.max(mx, s.dps), 0);
  const headlineDps = bestSkillDps > 0 ? bestSkillDps : sheet.dps * buffMult;
  const headline = [
    { icon: Swords, label: t("planner.summary.dps"), accent: "30 90% 55%", value: big(headlineDps) },
    { icon: Shield, label: t("planner.summary.toughness"), accent: "210 70% 60%", value: big(sheet.toughness) },
    { icon: HeartPulse, label: t("planner.summary.recovery"), accent: "140 60% 50%", value: big(sheet.recovery) },
  ];

  return (
    <div className="bg-card/60 border border-stone/60 p-4 sticky top-24">
      <div className="flex items-center gap-2 mb-3">
        <ListChecks className="w-4 h-4 text-ember" />
        <h2 className="font-display text-sm uppercase tracking-[0.3em] text-bone/70">
          {t("planner.summary.title")}
        </h2>
      </div>

      {/* headline numbers */}
      <div className="grid grid-cols-3 gap-2 mb-2">
        {headline.map((h) => (
          <div key={h.label} className="border border-stone/50 bg-night/50 p-2 text-center">
            <h.icon className="w-4 h-4 mx-auto mb-1" style={{ color: `hsl(${h.accent})` }} strokeWidth={1.75} />
            <div className="font-mono text-sm text-bone tabular-nums">{h.value}</div>
            <div className="font-mono text-[8px] uppercase tracking-[0.15em] text-bone/40 mt-0.5">{h.label}</div>
          </div>
        ))}
      </div>

      {/* active sets — equipped piece count + which (2)/(4)/(6) tiers are live */}
      {sets.length > 0 && (
        <div className="mb-4 border border-stone/50 bg-night/40 p-2.5">
          <div className="flex items-center gap-1.5 mb-1.5">
            <ListChecks className="w-3 h-3" style={{ color: "hsl(120 60% 55%)" }} />
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-bone/50">
              {t("planner.summary.activeSets")}
            </span>
          </div>
          <ul className="space-y-1">
            {sets.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-2">
                <span className="font-body text-[12px] truncate pr-2" style={{ color: "hsl(120 45% 65%)" }}>
                  {s.name}
                </span>
                <span className="flex items-center gap-1 flex-none">
                  {s.tiers.map((ti) => (
                    <span
                      key={ti.pieces}
                      className="font-mono text-[10px] px-1 rounded-sm tabular-nums"
                      style={
                        ti.active
                          ? { color: "hsl(120 70% 60%)", background: "hsl(120 60% 30% / 0.3)" }
                          : { color: "hsl(var(--bone) / 0.3)" }
                      }
                      title={ti.active ? "active" : `needs ${ti.pieces} pieces`}
                    >
                      {ti.pieces}
                    </span>
                  ))}
                  <span className="font-mono text-[10px] text-bone/40 ml-1">{s.count}pc</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* toggleable damage buffs (gems / global multipliers) */}
      {onBuildChange && buffs.length > 0 && (
        <div className="mb-4 border border-stone/50 bg-night/40 p-2.5">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <Flame className="w-3 h-3 text-ember" />
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-bone/50">
                {t("planner.summary.buffs")}
              </span>
            </div>
            {buffMult > 1 && (
              <span className="font-mono text-[10px] text-ember tabular-nums">×{buffMult.toFixed(2)}</span>
            )}
          </div>
          <ul className="space-y-1">
            {buffs.map((b) => {
              const on = build.buffs.includes(b.id);
              return (
                <li key={b.id}>
                  <button
                    type="button"
                    onClick={() => toggleBuff(b.id)}
                    className={`w-full flex items-center justify-between gap-2 px-2 py-1 border text-left transition-colors ${
                      on ? "border-ember/50 bg-ember/10" : "border-stone/40 hover:border-stone/70"
                    }`}
                  >
                    <span className="min-w-0">
                      <span className={`block font-body text-[12px] truncate ${on ? "text-ember" : "text-bone/70"}`}>
                        {b.label}
                      </span>
                      {b.note && <span className="block font-mono text-[8px] text-bone/35">{b.note}</span>}
                    </span>
                    <span className={`font-mono text-[11px] tabular-nums whitespace-nowrap ${on ? "text-ember" : "text-bone/40"}`}>
                      +{Math.round((b.mult - 1) * 100)}%
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* per-skill combat DPS — canonical coefficients from the CASC × buffs */}
      {skillDps.length > 0 && (
        <div className="mb-4 border border-stone/50 bg-night/40 p-2.5">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Crosshair className="w-3 h-3 text-ember" />
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-bone/50">
              {t("planner.summary.combatDps")}
            </span>
          </div>
          <ul className="space-y-0.5">
            {skillDps.map((s) => (
              <li key={s.slug} className="flex items-center justify-between">
                <span className="font-body text-[12px] text-bone/75 truncate pr-2">{s.name}</span>
                <span className="font-mono text-[12px] text-bone tabular-nums whitespace-nowrap">{big(s.dps)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {skillDps.length === 0 && <div className="mb-4" />}
      {rows.length === 0 ? (
        <p className="font-body text-xs text-bone/40 italic py-2">{t("planner.summary.empty")}</p>
      ) : (
        <ul className="divide-y divide-stone/35">
          {rows.map((s) => (
            <li key={s.key} className="flex items-center justify-between py-1.5">
              <span className="font-body text-[13px] text-bone/70">
                {t(`planner.summary.stats.${s.key}`, s.label)}
              </span>
              <span className="font-mono text-sm text-bone tabular-nums">
                {fmt(totals[s.key], s.percent)}
              </span>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 font-mono text-[10px] text-bone/35 leading-relaxed">
        {t("planner.summary.note")}
      </p>
    </div>
  );
};

export default StatSummary;
