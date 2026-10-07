/**
 * ParagonPanel — the four Paragon categories (Core, Offense, Defense, Utility),
 * matching live D3: Core's Primary Stat & Vitality are uncapped, every other
 * node caps at 50. The "Maximum Resource" node is named per class. Each node
 * shows its game icon (paragon.webp sprite) and the value its points grant.
 */
import { useTranslation } from "react-i18next";
import { Gauge, ChevronUp, ChevronDown } from "lucide-react";
import {
  PARAGON,
  PARAGON_CATS,
  ParagonBonus,
  ParagonCat,
  ParagonState,
  RESOURCE_PARAGON,
} from "@/lib/planner";

const SPRITE = "/planner/paragon.webp";
const ICON_COUNT = 24;

/** One paragon node's icon, sliced from the 576×24 sprite (24 icons of 24px). */
const NodeIcon = ({ index }: { index: number }) => (
  <span
    aria-hidden
    className="inline-block flex-none w-5 h-5"
    style={{
      backgroundImage: `url('${SPRITE}')`,
      backgroundSize: `${ICON_COUNT * 100}% 100%`,
      backgroundPosition: `${(index / (ICON_COUNT - 1)) * 100}% 50%`,
      backgroundRepeat: "no-repeat",
    }}
  />
);

/** A wider numeric field with custom up/down steppers (native spinners hidden).
 *  Wide enough to read 4-digit paragon totals; clamps to [0, max]. */
const NumberStepper = ({
  value,
  max,
  onChange,
}: {
  value: number;
  max: number;
  onChange: (v: number) => void;
}) => {
  const clamp = (v: number) => Math.max(0, Math.min(max, Math.floor(v) || 0));
  return (
    <div className="flex-none flex items-stretch h-7 w-[68px] bg-night border border-stone/60 rounded-sm overflow-hidden focus-within:border-ember/60">
      <input
        type="number"
        inputMode="numeric"
        min={0}
        max={max}
        value={value}
        onChange={(e) => onChange(clamp(Number(e.target.value)))}
        className="no-spinner w-full bg-transparent px-1.5 font-mono text-[13px] text-bone text-right focus:outline-none"
      />
      <div className="flex flex-col border-l border-stone/50">
        <button
          type="button"
          tabIndex={-1}
          onClick={() => onChange(clamp(value + 1))}
          className="flex-1 px-1 flex items-center justify-center text-bone/45 hover:text-ember hover:bg-ember/10 transition-colors"
          aria-label="increment"
        >
          <ChevronUp className="w-3 h-3" strokeWidth={2.5} />
        </button>
        <button
          type="button"
          tabIndex={-1}
          onClick={() => onChange(clamp(value - 1))}
          className="flex-1 px-1 flex items-center justify-center text-bone/45 hover:text-ember hover:bg-ember/10 transition-colors border-t border-stone/50"
          aria-label="decrement"
        >
          <ChevronDown className="w-3 h-3" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
};

const CatColumn = ({
  cat,
  klass,
  alloc,
  onSet,
}: {
  cat: ParagonCat;
  klass: string;
  alloc: Record<string, number>;
  onSet: (key: string, points: number) => void;
}) => {
  const { t } = useTranslation();
  const spent = Object.values(alloc).reduce((a, b) => a + b, 0);
  const res = RESOURCE_PARAGON[klass];

  const nodeLabel = (b: ParagonBonus) => (b.resourceNode && res ? res.name : b.label);
  const nodePer = (b: ParagonBonus) => (b.resourceNode && res ? res.per : b.per);
  const fmtVal = (b: ParagonBonus, points: number) => {
    const v = +(points * nodePer(b)).toFixed(2);
    return `+${v}${b.percent ? "%" : ""}`;
  };

  return (
    <div className="bg-card/60 border border-stone/60 p-3 flex flex-col">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-stone/40">
        <h3 className="font-display text-xs uppercase tracking-[0.3em] text-ember">
          {t(`planner.paragon.${cat}`, cat)}
        </h3>
        <span className="font-mono text-[10px] text-bone/40">{spent} {t("planner.paragon.pts", "pts")}</span>
      </div>
      <div className="flex flex-col gap-2">
        {PARAGON[cat].map((b) => {
          const points = alloc[b.key] ?? 0;
          const max = b.cap || 99999;
          return (
            // fixed-height node card so all four columns line up identically
            <div key={b.key} className="h-[68px] bg-night/40 border border-stone/40 rounded-sm px-2.5 py-2 flex flex-col justify-between">
              <div className="flex items-center gap-2">
                <NodeIcon index={b.icon} />
                <span className="font-body text-[12px] text-bone/75 leading-tight flex-1 min-w-0 line-clamp-2">
                  {nodeLabel(b)}
                </span>
                <NumberStepper
                  value={points}
                  max={max}
                  onChange={(v) => onSet(b.key, v)}
                />
              </div>
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-mono text-[12px] text-ember font-semibold tabular-nums flex-none w-12">
                  {fmtVal(b, points)}
                </span>
                {b.cap > 0 ? (
                  <>
                    <input
                      type="range"
                      min={0}
                      max={b.cap}
                      value={Math.min(points, b.cap)}
                      onChange={(e) => onSet(b.key, Number(e.target.value))}
                      className="flex-1 min-w-0 accent-ember h-1"
                    />
                    <span className="font-mono text-[8px] text-bone/35 tabular-nums flex-none whitespace-nowrap">
                      {Math.min(points, b.cap)}/{b.cap}
                    </span>
                  </>
                ) : (
                  <span className="flex-1 font-mono text-[9px] text-bone/30 uppercase tracking-wider text-right">
                    {t("planner.paragon.uncapped", "uncapped")}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ParagonPanel = ({
  klass,
  paragon,
  onChange,
}: {
  klass: string;
  paragon: ParagonState;
  onChange: (next: ParagonState) => void;
}) => {
  const { t } = useTranslation();
  const setPoints = (cat: ParagonCat, key: string, points: number) =>
    onChange({ ...paragon, [cat]: { ...paragon[cat], [key]: points } });

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Gauge className="w-4 h-4 text-ember" />
          <h2 className="font-display text-sm uppercase tracking-[0.3em] text-bone/70">
            {t("planner.paragon.title")}
          </h2>
        </div>
        <label className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-bone/45">
            {t("planner.paragon.level")}
          </span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={paragon.level}
            onChange={(e) => onChange({ ...paragon, level: Math.max(0, Math.floor(Number(e.target.value) || 0)) })}
            className="no-spinner w-24 bg-night border border-stone/60 rounded-sm px-2 py-1 font-mono text-sm text-bone text-right focus:outline-none focus:border-ember/60"
          />
        </label>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {PARAGON_CATS.map((cat) => (
          <CatColumn key={cat} cat={cat} klass={klass} alloc={paragon[cat]} onSet={(k, p) => setPoints(cat, k, p)} />
        ))}
      </div>
    </section>
  );
};

export default ParagonPanel;
